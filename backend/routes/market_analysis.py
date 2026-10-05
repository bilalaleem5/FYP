"""
Price Comparison & Market Analysis Endpoint.
Provides market insights for a specific vehicle listing.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
import database, models

router = APIRouter()


@router.get("/listings/{vehicle_id}/market-analysis")
def get_market_analysis(vehicle_id: int, db: Session = Depends(database.get_db)):
    """
    Returns market analysis for a specific vehicle:
    - Average market price for same make/model (±2 years)
    - Price position (below/above/at market)
    - Deal rating (Great Deal, Good Deal, Fair Price, Above Market, Overpriced)
    - Similar listings count & price range
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if not vehicle.price or not vehicle.make or not vehicle.model:
        return {
            "available": False,
            "message": "Insufficient data for market analysis (missing price, make, or model).",
            "vehicle_id": vehicle_id,
        }

    model_year = vehicle.model_year or 2020

    # Query similar vehicles (same make + model, ±2 years, non-spam, excluding this vehicle)
    similar_query = db.query(models.Vehicle).filter(
        models.Vehicle.make == vehicle.make,
        models.Vehicle.model == vehicle.model,
        models.Vehicle.model_year >= model_year - 2,
        models.Vehicle.model_year <= model_year + 2,
        models.Vehicle.spam_flagged == False,
        models.Vehicle.id != vehicle_id,
        models.Vehicle.price > 0,
    )

    # Get aggregate stats
    stats = similar_query.with_entities(
        func.avg(models.Vehicle.price).label("avg_price"),
        func.min(models.Vehicle.price).label("min_price"),
        func.max(models.Vehicle.price).label("max_price"),
        func.count(models.Vehicle.id).label("count"),
    ).first()

    similar_count = stats.count or 0

    if similar_count < 2:
        # Not enough data for meaningful analysis — try broader (make only)
        broad_query = db.query(models.Vehicle).filter(
            models.Vehicle.make == vehicle.make,
            models.Vehicle.model_year >= model_year - 3,
            models.Vehicle.model_year <= model_year + 3,
            models.Vehicle.spam_flagged == False,
            models.Vehicle.id != vehicle_id,
            models.Vehicle.price > 0,
        )
        broad_stats = broad_query.with_entities(
            func.avg(models.Vehicle.price).label("avg_price"),
            func.min(models.Vehicle.price).label("min_price"),
            func.max(models.Vehicle.price).label("max_price"),
            func.count(models.Vehicle.id).label("count"),
        ).first()

        if (broad_stats.count or 0) < 2:
            return {
                "available": False,
                "message": f"Not enough listings for {vehicle.make} {vehicle.model} to generate market analysis.",
                "vehicle_id": vehicle_id,
            }

        avg_price = float(broad_stats.avg_price)
        min_price = float(broad_stats.min_price)
        max_price = float(broad_stats.max_price)
        similar_count = broad_stats.count
        comparison_scope = f"{vehicle.make} (all models, ±3 years)"
    else:
        avg_price = float(stats.avg_price)
        min_price = float(stats.min_price)
        max_price = float(stats.max_price)
        comparison_scope = f"{vehicle.make} {vehicle.model} ({model_year - 2}–{model_year + 2})"

    # Calculate deviation
    deviation = ((vehicle.price - avg_price) / avg_price) * 100 if avg_price > 0 else 0
    price_lakh = round(vehicle.price / 100000, 1)
    avg_lakh = round(avg_price / 100000, 1)
    min_lakh = round(min_price / 100000, 1)
    max_lakh = round(max_price / 100000, 1)

    # Determine deal rating
    if deviation <= -15:
        deal_rating = "Great Deal"
        deal_emoji = "🔥"
        deal_color = "green"
        deal_summary = f"Priced {abs(round(deviation))}% below market average — excellent deal!"
    elif deviation <= -5:
        deal_rating = "Good Deal"
        deal_emoji = "👍"
        deal_color = "green"
        deal_summary = f"Priced {abs(round(deviation))}% below market average — competitive price."
    elif deviation <= 5:
        deal_rating = "Fair Price"
        deal_emoji = "✅"
        deal_color = "blue"
        deal_summary = "Priced in line with the current market average."
    elif deviation <= 15:
        deal_rating = "Above Market"
        deal_emoji = "⚠️"
        deal_color = "orange"
        deal_summary = f"Priced {round(deviation)}% above market average — consider negotiating."
    else:
        deal_rating = "Overpriced"
        deal_emoji = "🚩"
        deal_color = "red"
        deal_summary = f"Priced {round(deviation)}% above market average — significantly above market rate."

    # Determine position
    if vehicle.price < avg_price:
        position = "below"
    elif vehicle.price > avg_price:
        position = "above"
    else:
        position = "at"

    # Get a few similar listings for comparison (up to 5, sorted by price)
    similar_vehicles = (
        similar_query.order_by(models.Vehicle.price.asc())
        .limit(5)
        .all()
    )

    similar_list = []
    for sv in similar_vehicles:
        similar_list.append({
            "id": sv.id,
            "title": sv.title,
            "price": sv.price,
            "price_lakh": round(sv.price / 100000, 1),
            "location": sv.location,
            "model_year": sv.model_year,
            "mileage": sv.mileage,
            "image_url": sv.image_url,
        })

    return {
        "available": True,
        "vehicle_id": vehicle_id,
        "vehicle_price": vehicle.price,
        "vehicle_price_lakh": price_lakh,
        "comparison_scope": comparison_scope,
        "market_stats": {
            "avg_price": round(avg_price),
            "avg_price_lakh": avg_lakh,
            "min_price": round(min_price),
            "min_price_lakh": min_lakh,
            "max_price": round(max_price),
            "max_price_lakh": max_lakh,
            "similar_count": similar_count,
        },
        "deal_analysis": {
            "rating": deal_rating,
            "emoji": deal_emoji,
            "color": deal_color,
            "deviation_percent": round(deviation, 1),
            "position": position,
            "summary": deal_summary,
        },
        "similar_listings": similar_list,
    }
