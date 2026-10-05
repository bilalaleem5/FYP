import requests
from bs4 import BeautifulSoup
import sys
import os
import re
import time
import random

# Add parent directory to path to import database and models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal, engine
import models

# ─── Known PakWheels Makes (for parsing titles) ───
KNOWN_MAKES = [
    "Toyota", "Suzuki", "Honda", "Kia", "Hyundai", "Nissan", "Daihatsu",
    "MG", "Changan", "Proton", "Mitsubishi", "Chevrolet", "BMW", "Mercedes",
    "Audi", "FAW", "Prince", "United", "Chery", "DFSK", "Haval", "Daewoo",
    "Mazda", "Subaru", "Isuzu", "Peugeot", "Lexus", "Jeep", "Land Rover",
]

# ─── Utility Functions ─────────────────────────────────────────────

def clean_price(price_str):
    """Convert price string like 'PKR 65.5 lacs' to numeric value"""
    price_str = price_str.lower().replace('pkr', '').strip()
    try:
        if 'crore' in price_str:
            num = float(re.findall(r"[-+]?\d*\.?\d+", price_str)[0])
            return int(num * 10000000)
        elif 'lacs' in price_str or 'lac' in price_str:
            num = float(re.findall(r"[-+]?\d*\.?\d+", price_str)[0])
            return int(num * 100000)
        else:
            return int(re.sub(r'[^0-9]', '', price_str) or '0')
    except (IndexError, ValueError):
        return 0

def clean_mileage(mileage_str):
    """Convert mileage '45,000 km' to int"""
    try:
        return int(re.sub(r'[^0-9]', '', mileage_str) or '0')
    except (TypeError, ValueError):
        return 0

def clean_engine_cc(cc_str):
    """Convert '1300 cc' to int"""
    try:
        return int(re.sub(r'[^0-9]', '', cc_str) or '0')
    except (TypeError, ValueError):
        return 0

def parse_make_model(title):
    """Extract make and model from a title like 'Toyota Corolla GLi 1.3 VVTi 2019'"""
    title_lower = title.lower()
    detected_make = None
    detected_model = None

    for make in KNOWN_MAKES:
        if make.lower() in title_lower:
            detected_make = make
            # Remove the make and year from title to get roughly the model
            remainder = title
            remainder = re.sub(re.escape(make), '', remainder, flags=re.IGNORECASE).strip()
            # Remove year (4-digit number)
            remainder = re.sub(r'\b(19|20)\d{2}\b', '', remainder).strip()
            # The first 1-3 words are likely the model name
            words = remainder.split()
            if words:
                detected_model = ' '.join(words[:3]).strip(' -,')
            break

    return detected_make, detected_model

# ─── HTML Fetching ──────────────────────────────────────────────────

def fetch_html(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.pakwheels.com/',
    }
    for attempt in range(3):
        try:
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code == 200:
                return response.text
            elif response.status_code in [403, 429]:
                print(f"  ⚠ Rate limited (HTTP {response.status_code}) on {url}. Waiting {5*(attempt+1)}s...")
                time.sleep(5 * (attempt + 1))
            elif response.status_code == 404:
                print(f"  ✗ 404 Not Found: {url}")
                return None
            else:
                print(f"  ✗ HTTP {response.status_code}: {url}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Attempt {attempt+1} error: {e}")
            time.sleep(2)
    return None

# ─── Detail Page Scraping ───────────────────────────────────────────

def scrape_listing_details(url):
    """Deep scrape a specific listing page for all available data."""
    html = fetch_html(url)
    if not html:
        return {}

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
    desc_elem = soup.select_one('#scroll_car_detail .car-feature-desc, #scroll_car_detail, .ad-detail-content')
    if desc_elem:
        details['description'] = desc_elem.get_text(separator='\n', strip=True)

    # 2. Features (inside accordion panels)
    feature_elems = soup.select('.car-feature-list li')
    details['features'] = [f.get_text(strip=True) for f in feature_elems if f.get_text(strip=True)]

    # 3. Seller / Owner Details
    owner_elem = soup.select_one('.dealer-name a, .seller-name, .owner-detail .name')
    if owner_elem:
        details['owner_name'] = owner_elem.get_text(strip=True)

    # 4. Phone number (often behind a button, get the button text)
    phone_elem = soup.select_one('.phone_number, .show-number, .btn-phone')
    if phone_elem:
        phone_text = phone_elem.get_text(strip=True)
        # Only keep if it looks like a phone number
        if re.search(r'\d{4,}', phone_text):
            details['owner_contact'] = phone_text

    # 5. Gallery Images
    gallery_elems = soup.select('ul#gallery-slider li img, ul.gallery li img, .lSPager li img')
    for img in gallery_elems:
        img_url = img.get('data-original') or img.get('src')
        if img_url and 'lazyload' not in img_url and 'gif' not in img_url.lower() and 'placeholder' not in img_url.lower():
            details['extra_images'].append(img_url.strip())

    # Fallback: main carousel image
    if not details['extra_images']:
        main_img = soup.select_one('#myCarousel .item img, .main-image img')
        if main_img:
            found_url = main_img.get('data-original') or main_img.get('src')
            if found_url and 'lazyload' not in found_url:
                details['extra_images'].append(found_url.strip())

    details['extra_images'] = list(set([i for i in details['extra_images'] if i]))

    # 6. Specs Table — Registered In, Color, Assembly, Engine Capacity, Body Type
    # PakWheels HTML structure:
    # <ul id="scroll_car_detail" class="list-unstyled ul-featured clearfix">
    #   <li class="ad-data">Label</li>  <-- label
    #   <li>Value</li>                  <-- value (next sibling)
    # Labels and values alternate as sibling <li> elements
    label_items = soup.select('li.ad-data')
    for label_li in label_items:
        label = label_li.get_text(strip=True).lower().rstrip(':')
        # The value is the next sibling <li> element
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


    return details

# ─── Search Page Scraping ───────────────────────────────────────────

def scrape_pakwheels(target_count=100):
    """Scrape multiple pages of PakWheels to reach target count"""
    base_url = "https://www.pakwheels.com/used-cars/search/-/?page="
    vehicles_data = []
    page = 1

    print(f"🚗 Starting PakWheels scraper — target: {target_count} cars")

    while len(vehicles_data) < target_count:
        url = f"{base_url}{page}"
        print(f"\n📄 Page {page} | Scraped so far: {len(vehicles_data)}/{target_count}")

        html = fetch_html(url)
        if not html:
            print("  ✗ Could not fetch page. Stopping.")
            break

        soup = BeautifulSoup(html, 'html.parser')
        listings = soup.select('li.classified-listing, .classified-listing')

        if not listings:
            print("  ✗ No listings found. End of results.")
            break

        print(f"  ✓ Found {len(listings)} listings")

        for item in listings:
            if len(vehicles_data) >= target_count:
                break

            try:
                # Title + URL
                title_elem = item.select_one('a.car-name')
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                href = title_elem.get('href', '')
                source_url = "https://www.pakwheels.com" + href if href.startswith("/") else href

                # Parse make/model from title
                make, model_name = parse_make_model(title)

                # Price
                price_elem = item.select_one('.price-details')
                price = clean_price(price_elem.get_text(strip=True) if price_elem else "0")

                # Specs: Year, Mileage, Fuel Type, Engine CC, Transmission
                specs = item.select('ul.search-vehicle-info-2 li')
                model_year = None
                mileage = 0
                fuel_type = "Unknown"
                transmission = "Unknown"
                engine_capacity = None

                if len(specs) > 0:
                    try:
                        model_year = int(re.sub(r'[^0-9]', '', specs[0].get_text(strip=True)) or '0')
                        if model_year < 1900 or model_year > 2030:
                            model_year = None
                    except ValueError:
                        model_year = None

                if len(specs) > 1:
                    mileage = clean_mileage(specs[1].get_text(strip=True))
                if len(specs) > 2:
                    fuel_type = specs[2].get_text(strip=True) or "Unknown"
                if len(specs) > 3:
                    engine_capacity = clean_engine_cc(specs[3].get_text(strip=True))
                if len(specs) > 4:
                    transmission = specs[4].get_text(strip=True) or "Unknown"

                # If transmission not from specs, try to infer from title
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

                # ── DEEP FETCH ──
                print(f"  [{len(vehicles_data)+1}/{target_count}] 🔍 Deep: {title}")
                deep_details = scrape_listing_details(source_url)

                # Polite delay
                time.sleep(random.uniform(0.5, 1.5))

                # Use gallery image as fallback for main image
                if not image_url and deep_details.get("extra_images"):
                    image_url = deep_details["extra_images"][0]

                # Use deep engine_capacity if shallow didn't get it
                if not engine_capacity and deep_details.get("engine_capacity"):
                    engine_capacity = deep_details["engine_capacity"]

                v_data = {
                    "title": title,
                    "price": price,
                    "currency": "PKR",
                    "location": location,
                    "model_year": model_year,
                    "mileage": mileage,
                    "transmission": transmission,
                    "fuel_type": fuel_type,
                    "image_url": image_url,
                    "source_url": source_url,
                    "make": make,
                    "model": model_name,
                    "description": deep_details.get("description"),
                    "features": deep_details.get("features"),
                    "owner_name": deep_details.get("owner_name"),
                    "owner_contact": deep_details.get("owner_contact"),
                    "extra_images": deep_details.get("extra_images"),
                    "engine_capacity": engine_capacity,
                    "color": deep_details.get("color"),
                    "assembly": deep_details.get("assembly"),
                    "body_type": deep_details.get("body_type"),
                    "registered_city": deep_details.get("registered_city"),
                }
                vehicles_data.append(v_data)

            except Exception as e:
                print(f"  ✗ Error parsing listing: {e}")

        page += 1
        # Random sleep between pages
        time.sleep(random.uniform(1.0, 3.0))

    print(f"\n✅ Scraping complete. Total vehicles: {len(vehicles_data)}")
    return vehicles_data

# ─── Database Save ──────────────────────────────────────────────────

def save_to_db(vehicles_data):
    if not vehicles_data:
        print("No data to save.")
        return

    added_count = 0
    updated_count = 0

    try:
        models.Base.metadata.create_all(bind=engine)

        for v_data in vehicles_data:
            db = SessionLocal()
            try:
                existing = db.query(models.Vehicle).filter(models.Vehicle.source_url == v_data["source_url"]).first()
                if existing:
                    for key, value in v_data.items():
                        setattr(existing, key, value)
                    updated_count += 1
                else:
                    new_v = models.Vehicle(**v_data)
                    db.add(new_v)
                    added_count += 1
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"  ✗ Error saving {v_data.get('source_url', '???')}: {e}")
            finally:
                db.close()

        print(f"\n📊 Database: {added_count} added, {updated_count} updated")
    except Exception as e:
        print(f"  ✗ Database setup error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("🚗 PakWheels Vehicle Scraper — Synchronous Mode")
    print("=" * 60)
    scraped_data = scrape_pakwheels(target_count=100)
    save_to_db(scraped_data)
    print("✅ Done!")
