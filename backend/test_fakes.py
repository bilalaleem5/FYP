from database import SessionLocal
import models
from services.scoring import calculate_fake_score

db = SessionLocal()

# Delete previous tests
db.query(models.Vehicle).filter(models.Vehicle.source_url.like('test_fake_%')).delete()
db.query(models.Vehicle).filter(models.Vehicle.source_url.like('baseline_%')).delete()
db.commit()

# --- ESTABLISH MARKET BASELINE ---
# (To simulate a populated database so AI can calculate price averages)
baselines = [
    {"title": "Honda Civic 2022", "price": 8000000.0, "make": "Honda", "model": "Civic", "model_year": 2022, "source_url": "baseline_1", "spam_flagged": False},
    {"title": "Honda Civic 2022", "price": 8200000.0, "make": "Honda", "model": "Civic", "model_year": 2022, "source_url": "baseline_2", "spam_flagged": False},
    {"title": "Toyota Corolla 2010", "price": 2000000.0, "make": "Toyota", "model": "Corolla", "model_year": 2010, "source_url": "baseline_3", "spam_flagged": False},
    {"title": "Suzuki Alto 2023", "price": 2800000.0, "make": "Suzuki", "model": "Alto", "model_year": 2023, "source_url": "baseline_4", "spam_flagged": False},
]
for b in baselines:
    db.add(models.Vehicle(**b))
db.commit()

test_cases = [
    {
        "title": "HONDA CIVIC 2022 URGENT SALE",
        "price": 7000000.0, # Normal/slightly discounted price (70 Lakhs)
        "make": "Honda",
        "model": "Civic",
        "model_year": 2022,
        "mileage": 10000,
        "description": "urgent money send advance right now",
        "image_url": None,
        "source_url": "test_fake_1",
        "expected": "FLAGGED (Classic Scam: Low Price + Spam Text + No Images)"
    },
    {
        "title": "Honda Civic 2022 Accidental",
        "price": 2000000.0, # Unrealistically low
        "make": "Honda",
        "model": "Civic",
        "model_year": 2022,
        "mileage": 15000,
        "description": "Car is fully accidental. Needs repair and new engine. That is why price is low.",
        "image_url": "http://example.com/image.jpg",
        "extra_images": ["http://example.com/image2.jpg"],
        "color": "White",
        "engine_capacity": 1800,
        "registered_city": "Lahore",
        "source_url": "test_fake_2",
        "expected": "SAFE (Accidental Keyword Bypasses Price Anomaly)"
    },
    {
        "title": "Toyota Corolla 2010 Mint Condition",
        "price": 3000000.0, # Normal price
        "make": "Toyota",
        "model": "Corolla",
        "model_year": 2010, # 14+ years old
        "mileage": 500, # Impossible mileage for a 14 yr old car
        "description": "Used rarely. Like new.",
        "image_url": "http://example.com/single_pic.jpg",
        "source_url": "test_fake_3",
        "expected": "HIGH SCORE (Mileage Anomaly + 1 Image)"
    },
    {
        "title": "Suzuki Alto 2023",
        "price": 2500000.0, # Normal price
        "make": "Suzuki",
        "model": "Alto",
        "model_year": 2023,
        "mileage": 5000,
        "description": "send advance western union whatsapp only shipping available",
        "image_url": None,
        "source_url": "test_fake_4",
        "expected": "FLAGGED (Spam Keywords + No Image)"
    }
]

print("--- RUNNING AI EDGE CASE TESTS ---")
for case in test_cases:
    expected = case.pop("expected")
    
    # Calculate score
    score_result = calculate_fake_score(case, db)
    case['fake_score'] = score_result['fake_score']
    case['spam_flagged'] = score_result['spam_flagged']
    
    # Save to DB
    new_v = models.Vehicle(**case)
    db.add(new_v)
    db.commit()
    
    print(f"\nTEST: {expected}")
    print(f"Title: {case['title']}")
    print(f"Score: {case['fake_score']} | Flagged: {case['spam_flagged']}")

db.close()
