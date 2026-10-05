from database import SessionLocal
import models
from services.scoring import calculate_fake_score

db = SessionLocal()

vehicles = db.query(models.Vehicle).all()
updated_count = 0
spam_count = 0

print(f"Recalculating scores for {len(vehicles)} existing vehicles...")

for v in vehicles:
    vehicle_dict = {
        'price': v.price,
        'make': v.make,
        'model': v.model,
        'model_year': v.model_year,
        'description': v.description,
        'image_url': v.image_url,
        'extra_images': v.extra_images,
        'mileage': v.mileage,
        'engine_capacity': v.engine_capacity,
        'color': v.color,
        'assembly': v.assembly,
        'registered_city': v.registered_city
    }
    
    scoring_result = calculate_fake_score(vehicle_dict, db)
    
    v.fake_score = scoring_result['fake_score']
    v.spam_flagged = scoring_result['spam_flagged']
    
    if scoring_result['fake_score'] > 0:
        updated_count += 1
    if scoring_result['spam_flagged']:
        spam_count += 1

db.commit()
db.close()

print(f"Done! Updated {updated_count} vehicles with scores > 0.")
print(f"Caught {spam_count} fake/spam listings.")
