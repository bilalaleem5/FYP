from sqlalchemy.orm import Session
from sqlalchemy.sql import func
import models

import datetime

def calculate_fake_score(vehicle_data: dict, db: Session) -> dict:
    """
    Advanced Heuristic AI Scoring System.
    Max Score is 1.0 (100%).
    Threshold for Spam is 0.65.
    """
    score = 0.0
    
    # 1. Price Anomaly (0.0 to 0.50 points)
    price = vehicle_data.get('price')
    make = vehicle_data.get('make')
    model = vehicle_data.get('model')
    model_year = vehicle_data.get('model_year')

    if price and make and model and model_year:
        # Get market average for similar cars (+/- 2 years)
        avg_price_result = db.query(func.avg(models.Vehicle.price)).filter(
            models.Vehicle.make == make,
            models.Vehicle.model == model,
            models.Vehicle.model_year >= model_year - 2,
            models.Vehicle.model_year <= model_year + 2,
            models.Vehicle.spam_flagged == False
        ).scalar()

        if avg_price_result:
            avg_price = float(avg_price_result)
            if avg_price > 0:
                deviation = (avg_price - price) / avg_price
                
                # Check for justification
                desc = str(vehicle_data.get('description') or "").lower()
                justifications = ['accidental', 'needs repair', 'engine issue', 'ncp', 'non custom paid', 'auction']
                is_justified = any(j in desc for j in justifications)

                if not is_justified:
                    if deviation > 0.20:
                        score += 0.70  # Huge red flag (>20% drop, e.g., 16 Lakhs off an 80 Lakh car)
                    elif deviation > 0.10:
                        score += 0.50  # Very Suspicious (>10% drop, e.g., 8 Lakhs off)
                    elif deviation > 0.05:
                        score += 0.25  # Slightly suspicious (>5% drop)
                    # 0 to 5% deviation is considered normal market negotiation (e.g., 1-4 Lakhs off an 80 Lakh car)

    # 2. Description Quality (0.0 to 0.25 points)
    desc = str(vehicle_data.get('description') or "")
    if not desc:
        score += 0.15
    elif len(desc.split()) < 5:
        score += 0.10
    
    spam_keywords = ['urgent money', 'send advance', 'whatsapp only', 'shipping', 'western union']
    if any(k in desc.lower() for k in spam_keywords):
        score += 0.25  # Immediate high penalty

    # 3. Image Count (0.0 to 0.20 points)
    images = []
    if vehicle_data.get('image_url'):
        images.append(vehicle_data.get('image_url'))
    extra_images = vehicle_data.get('extra_images') or []
    images.extend(extra_images)

    if len(images) == 0:
        score += 0.20
    elif len(images) == 1:
        score += 0.10

    # 4. Mileage Anomaly (0.0 to 0.15 points)
    mileage = vehicle_data.get('mileage')
    if mileage is not None and model_year:
        current_year = datetime.datetime.now().year
        age = current_year - model_year
        if age > 0:
            # If a 10 year old car only has 1000 km, that's highly suspicious (meter reversed or fake)
            if age >= 5 and mileage < 5000:
                score += 0.15
            elif age >= 2 and mileage < 1000:
                score += 0.10

    # 5. Missing Critical Data (0.0 to 0.10 points)
    missing_fields = 0
    fields_to_check = ['color', 'engine_capacity', 'registered_city']
    for f in fields_to_check:
        if not vehicle_data.get(f):
            missing_fields += 1
    
    score += (missing_fields / len(fields_to_check)) * 0.10

    # Cap at 1.0
    final_score = min(score, 1.0)
    
    # We lowered the threshold to 0.65 to be slightly more aggressive based on AI confidence.
    return {
        "fake_score": round(final_score, 3),
        "spam_flagged": final_score >= 0.65
    }
