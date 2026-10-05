import asyncio
import aiohttp
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
import logging
from datetime import datetime
import json
import re

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Vehicle, ScrapedURL, ScrapeStatus

from scraper.scraper_service import clean_price, clean_mileage, clean_engine_cc, parse_make_model

# Logging config
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Core Crawler Configuration ────────────────────────────────────
CONCURRENT_REQUESTS = 5
BASE_URL = "https://www.pakwheels.com"

# The Filter Matrix avoids the 100-page limit by breaking search down
CITIES = [
    # Punjab
    "lahore", "rawalpindi", "faisalabad", "multan", "gujranwala", "sialkot",
    "bahawalpur", "sargodha", "gujrat", "sheikhupura", "jhang", "rahim-yar-khan",
    "kasur", "muzaffargarh", "okara", "dera-ghazi-khan", "sahiwal", "nawabshah",
    "chiniot", "kamoke", "hafizabad", "sadiqabad", "burewala", "vehari", "muridke",
    "gojra", "mandi-bahauddin", "daska", "pakpattan", "bahawalnagar", "chishtian",
    "shikarpur", "khuzdar", "jhelum", "attock", "wazirabad", "chakwal", "mianwali",
    "khalabat", "taxila", "khushab", "bhakkar", "charsadda", "swabi", "arifwala",
    "chichawatni", "lodhran", "jalalpur", "hasilpur", "narowal", "shakargarh",
    # Sindh
    "karachi", "hyderabad", "sukkur", "larkana", "nawabshah", "mirpur-khas",
    "dadu", "jacobabad", "shikarpur", "tando-adam", "tando-allahyar", "khairpur",
    "badin", "shahdadkot", "hala", "umerkot", "thatta",
    # KPK
    "peshawar", "mardan", "mingora", "kohat", "abbottabad", "dera-ismail-khan",
    "nowshera", "charsadda", "swabi", "timargara", "parachinar", "mansehra",
    "khalabat", "bannu", "haripur", "swat", "chitral", "dir", "malakand",
    # Balochistan
    "quetta", "khuzdar", "chaman", "hub", "sibi", "zhob", "gwadar", "turbat",
    "loralai", "dera-bugti", "pishin",
    # Islamabad & Territories
    "islamabad", "gilgit", "skardu", "muzaffarabad", "mirpur", "kotli", "bhimber",
    "rawalakot", "bagh"
]

POPULAR_MAKES = [
    "toyota", "suzuki", "honda", "kia", "hyundai", "nissan", "daihatsu",
    "mg", "changan", "proton", "mitsubishi", "chevrolet", "bmw", "mercedes-benz",
    "audi", "faw", "prince", "united", "chery", "dfsk", "haval", "daewoo",
    "mazda", "subaru", "isuzu", "peugeot", "lexus", "porcshe", "land-rover",
    "jeep", "jaguar", "volkswagen", "volvo", "renault", "fiat", "ford", "jinbei",
    "jac", "jw-forland", "baic", "dongfeng", "datsun", "ssangyong", "zotye", "adam",
    "chrysler", "dodge", "ferrari", "hummer", "mini", "tesla", "geely", "gmc", "lincoln",
    "smart", "aston-martin", "bentley", "cadillac", "maserati", "mclaren", "rolls-royce",
    "rover", "saab", "seat", "skoda"
]

# ─── Async HTML Fetcher ────────────────────────────────────────────

async def fetch_page(session: aiohttp.ClientSession, url: str) -> str:
    """Fetch HTML content asynchronously with retries and headers."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.pakwheels.com/",
    }

    for attempt in range(3):
        try:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=20)) as response:
                if response.status == 200:
                    return await response.text()
                elif response.status in [403, 429]:
                    logger.warning(f"Rate limited (HTTP {response.status}) on {url}. Waiting {5*(attempt+1)}s...")
                    await asyncio.sleep(5 * (attempt + 1))
                elif response.status == 404:
                    logger.info(f"404 at {url} — pagination likely over.")
                    return None
                else:
                    logger.error(f"HTTP {response.status}: {url}")
                    return None
        except Exception as e:
            logger.error(f"Attempt {attempt + 1} error fetching {url}: {e}")
            await asyncio.sleep(2)

    return None

def generate_matrix_urls():
    """Generates matrix of search base URLs to bypass the 100-page hard limit."""
    return [f"{BASE_URL}/used-cars/search/-/"]

# ─── Discovery Phase (Search Pages) ────────────────────────────────

def save_discovered_urls(urls_data_list):
    db = SessionLocal()
    added = 0
    try:
        for item in urls_data_list:
            u = item['url']
            shallow = item['shallow']
            exists = db.query(ScrapedURL).filter(ScrapedURL.url == u).first()
            if not exists:
                db.add(ScrapedURL(url=u, shallow_data=shallow, status=ScrapeStatus.PENDING))
                added += 1
        db.commit()
        return added
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving URLs: {e}")
        return 0
    finally:
        db.close()

async def discover_listing_urls(session: aiohttp.ClientSession, semaphore: asyncio.Semaphore, search_base_url: str):
    """Iterates through all pages of a matrix endpoint to extract raw listing URLs."""
    async with semaphore:
        page = 1
        total_discovered = 0
        while page <= 1000:  # Increase limit to scrape globally
            url = f"{search_base_url}?page={page}" if '?' not in search_base_url else f"{search_base_url}&page={page}"
            logger.info(f"📄 Discovering: {url}")

            html = await fetch_page(session, url)
            if not html:
                break

            soup = BeautifulSoup(html, 'html.parser')
            listings = soup.select('li.classified-listing, .classified-listing')

            if not listings:
                logger.info(f"No more listings at {search_base_url} page {page}.")
                break

            found_data = []
            for item in listings:
                title_elem = item.select_one('a.car-name')
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                href = title_elem.get('href', '')
                full_url = BASE_URL + href if href.startswith("/") else href

                # Parse make/model from title
                make, model_name = parse_make_model(title)

                # Price
                price_elem = item.select_one('.price-details')
                price_val = clean_price(price_elem.get_text(strip=True) if price_elem else "0")

                # Specs: Year, Mileage, Fuel, CC, Transmission
                specs = item.select('ul.search-vehicle-info-2 li')
                model_year = None
                mileage_val = 0
                fuel_type = "Unknown"
                transmission = "Unknown"
                engine_capacity = None

                if len(specs) > 0:
                    try:
                        yr = int(re.sub(r'[^0-9]', '', specs[0].get_text(strip=True)) or '0')
                        model_year = yr if 1900 < yr < 2030 else None
                    except ValueError:
                        pass
                if len(specs) > 1:
                    mileage_val = clean_mileage(specs[1].get_text(strip=True))
                if len(specs) > 2:
                    fuel_type = specs[2].get_text(strip=True) or "Unknown"
                if len(specs) > 3:
                    engine_capacity = clean_engine_cc(specs[3].get_text(strip=True))
                if len(specs) > 4:
                    transmission = specs[4].get_text(strip=True) or "Unknown"

                if transmission == "Unknown":
                    if any(kw in title.lower() for kw in ['automatic', 'auto', 'cvt']):
                        transmission = "Automatic"
                    else:
                        transmission = "Manual"

                # Location
                location_elem = item.select_one('ul.search-vehicle-info li')
                location = location_elem.get_text(strip=True) if location_elem else "Unknown"

                # Main Image
                img_elem = item.select_one('img')
                image_url = ""
                if img_elem:
                    image_url = img_elem.get('data-original') or img_elem.get('src') or ""

                shallow_info = {
                    "title": title,
                    "price": price_val,
                    "currency": "PKR",
                    "location": location,
                    "model_year": model_year,
                    "mileage": mileage_val,
                    "transmission": transmission,
                    "fuel_type": fuel_type,
                    "image_url": image_url,
                    "make": make,
                    "model": model_name,
                    "engine_capacity": engine_capacity,
                }

                found_data.append({"url": full_url, "shallow": shallow_info})

            if found_data:
                added = await asyncio.to_thread(save_discovered_urls, found_data)
                total_discovered += added
                logger.info(f"  ✓ Saved {added} new URLs from {url}")

            page += 1
            # asyncio.sleep removed to increase speed; backoff handled in fetch_page

        logger.info(f"✅ Discovery done for {search_base_url}: {total_discovered} new URLs")

async def run_discovery_phase():
    logger.info("=" * 60)
    logger.info("🔍 PHASE 1: DISCOVERY — Finding all listing URLs")
    logger.info("=" * 60)
    
    MAX_DISCOVER_LIMIT = 25000
    db = SessionLocal()
    pending_count = db.query(ScrapedURL).filter(ScrapedURL.status == ScrapeStatus.PENDING).count()
    db.close()
    
    if pending_count >= MAX_DISCOVER_LIMIT:
        logger.info(f"🏁 Already have {pending_count} pending URLs. Skipping Discovery Phase.")
        return

    matrix_urls = generate_matrix_urls()
    logger.info(f"Generated {len(matrix_urls)} matrix endpoints.")

    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

    async with aiohttp.ClientSession() as session:
        tasks = [discover_listing_urls(session, semaphore, base_url) for base_url in matrix_urls]
        await asyncio.gather(*tasks)

    logger.info("🏁 Discovery Phase Complete.")

# ─── Extraction Phase (Detail Pages) ───────────────────────────────

def get_pending_urls():
    db = SessionLocal()
    try:
        records = db.query(ScrapedURL).filter(ScrapedURL.status == ScrapeStatus.PENDING).limit(1000).all()
        return [(r.id, r.url, r.shallow_data) for r in records]
    finally:
        db.close()

def save_vehicle_and_mark_done(tracker_id, url, shallow, deep):
    db = SessionLocal()
    try:
        # Merge shallow and deep
        v_data = {}
        if isinstance(shallow, dict):
            v_data.update(shallow)
        if isinstance(deep, dict):
            v_data.update(deep)
        v_data['source_url'] = url

        # Remove any keys that are not Vehicle columns
        valid_columns = {c.name for c in Vehicle.__table__.columns}
        v_data = {k: v for k, v in v_data.items() if k in valid_columns}

        # Upsert vehicle
        existing = db.query(Vehicle).filter(Vehicle.source_url == url).first()
        if existing:
            for k, v in v_data.items():
                if k != 'id' and k != 'created_at':
                    setattr(existing, k, v)
        else:
            db.add(Vehicle(**v_data))

        # Update tracker
        tracker = db.query(ScrapedURL).filter(ScrapedURL.id == tracker_id).first()
        if tracker:
            tracker.status = ScrapeStatus.SCRAPED
            tracker.last_attempt = datetime.utcnow()

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving vehicle {url}: {e}")
        try:
            tracker = db.query(ScrapedURL).filter(ScrapedURL.id == tracker_id).first()
            if tracker:
                tracker.status = ScrapeStatus.FAILED
                tracker.last_attempt = datetime.utcnow()
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()

async def scrape_vehicle_details(session: aiohttp.ClientSession, semaphore: asyncio.Semaphore, tracker_id: int, url: str, shallow_data: dict):
    """Visits a specific listing and extracts all deep data."""
    async with semaphore:
        html = await fetch_page(session, url)
        if not html:
            db = SessionLocal()
            try:
                tracker = db.query(ScrapedURL).filter(ScrapedURL.id == tracker_id).first()
                if tracker:
                    tracker.status = ScrapeStatus.FAILED
                    tracker.last_attempt = datetime.utcnow()
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Error marking {url} as FAILED: {e}")
            finally:
                db.close()
            logger.warning(f"Failed to fetch HTML for {url}. Marked as FAILED.")
            return

        soup = BeautifulSoup(html, 'html.parser')
        details = {
            "description": "",
            "features": [],
            "owner_name": "",
            "owner_contact": "",
            "extra_images": [],
            "engine_capacity": None,
            "color": None,
            "assembly": None,
            "body_type": None,
            "registered_city": None,
        }

        # 1. Description
        desc_elem = soup.find(lambda tag: tag.name in ['h2', 'h3'] and tag.text and "Seller's Comments" in tag.text)
        if desc_elem:
            sibling_div = desc_elem.find_next_sibling('div')
            if sibling_div:
                raw_desc = sibling_div.get_text(separator='\n', strip=True)
                details['description'] = raw_desc.replace('Mention PakWheels.com when calling Seller to get a good deal', '').strip()

        # 2. Features
        feature_elems = soup.select('.car-feature-list li')
        details['features'] = [f.get_text(strip=True) for f in feature_elems if f.get_text(strip=True)]

        # 3. Seller name
        owner_elem = soup.select_one('.dealer-name a, .seller-name, .owner-detail .name')
        if owner_elem:
            details['owner_name'] = owner_elem.get_text(strip=True)

        # 4. Phone
        phone_elem = soup.select_one('.phone_number, .show-number, .btn-phone')
        if phone_elem:
            phone_text = phone_elem.get_text(strip=True)
            if re.search(r'\d{4,}', phone_text):
                details['owner_contact'] = phone_text

        # 5. Gallery Images
        gallery_elems = soup.select('ul#gallery-slider li img, ul.gallery li img, .lSPager li img')
        for img in gallery_elems:
            img_url = img.get('data-original') or img.get('src')
            if img_url and 'lazyload' not in img_url and 'gif' not in img_url.lower() and 'placeholder' not in img_url.lower():
                details['extra_images'].append(img_url.strip())

        if not details['extra_images']:
            main_img = soup.select_one('#myCarousel .item img, .main-image img')
            if main_img:
                found_url = main_img.get('data-original') or main_img.get('src')
                if found_url and 'lazyload' not in found_url:
                    details['extra_images'].append(found_url.strip())

        details['extra_images'] = list(set([i for i in details['extra_images'] if i]))

        # 6. Specs Table — Registered In, Color, Assembly, Engine Capacity, Body Type
        # PakWheels uses alternating: <li class="ad-data">Label</li> <li>Value</li>
        label_items = soup.select('li.ad-data')
        for label_li in label_items:
            label = label_li.get_text(strip=True).lower().rstrip(':')
            value_li = label_li.find_next_sibling('li')
            if not value_li or 'ad-data' in (value_li.get('class') or []):
                continue
            value = value_li.get_text(strip=True)
            if not value:
                continue

            if 'registered' in label:
                details['registered_city'] = value
            elif 'color' in label or 'colour' in label:
                details['color'] = value
            elif 'assembly' in label:
                details['assembly'] = value
            elif 'engine' in label:
                details['engine_capacity'] = clean_engine_cc(value)
            elif 'body' in label:
                details['body_type'] = value

        # Use deep image as fallback for shallow
        if shallow_data and not shallow_data.get('image_url') and details.get('extra_images'):
            shallow_data['image_url'] = details['extra_images'][0]

        # Use deep engine_capacity if shallow didn't get one
        if shallow_data and not shallow_data.get('engine_capacity') and details.get('engine_capacity'):
            shallow_data['engine_capacity'] = details['engine_capacity']

        # Save payload
        await asyncio.to_thread(save_vehicle_and_mark_done, tracker_id, url, shallow_data or {}, details)
        logger.info(f"  ✓ Saved: {url}")

async def run_extraction_phase():
    logger.info("=" * 60)
    logger.info("🔍 PHASE 2: EXTRACTION — Deep scraping detail pages")
    logger.info("=" * 60)
    
    MAX_SCRAPED_LIMIT = 20000

    while True:
        db = SessionLocal()
        scraped_count = db.query(Vehicle).count()
        db.close()

        if scraped_count >= MAX_SCRAPED_LIMIT:
            logger.info(f"✅ Reached target of {scraped_count} scraped vehicles! Stopping extraction.")
            break

        pending_records = await asyncio.to_thread(get_pending_urls)
        if not pending_records:
            logger.info("✅ No PENDING URLs left! Extraction complete.")
            break

        logger.info(f"📋 Loaded {len(pending_records)} pending URLs. Fetching details...")
        semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

        async with aiohttp.ClientSession() as session:
            tasks = [
                scrape_vehicle_details(session, semaphore, tid, url, shallow)
                for tid, url, shallow in pending_records
            ]
            await asyncio.gather(*tasks)

# ─── Main Entry Point ──────────────────────────────────────────────

async def main():
    # Phase 1: Discover URLs (Generates the Queue)
    await run_discovery_phase()

    # Phase 2: Extract Deep Details (Drains the Queue)
    await run_extraction_phase()

if __name__ == "__main__":
    asyncio.run(main())
