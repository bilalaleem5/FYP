"""
Personalized recommendations from user activity (FAISS + embeddings).
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Tuple
import database, models, schemas
from utils.auth import get_current_user
from services.vector_store import search_vehicles
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_user_search_profile(db: Session, user_id: int) -> Tuple[str, int]:
    """Returns (embedding text, number of distinct history rows used)."""
    history = (
        db.query(models.UserSearchHistory)
        .filter(models.UserSearchHistory.user_id == user_id)
        .order_by(models.UserSearchHistory.created_at.desc())
        .limit(8)
        .all()
    )
    if not history:
        return "", 0
    queries = [h.query_text for h in reversed(history) if h.query_text]
    if not queries:
        return "", 0
    latest = queries[-1]
    tail = [latest, latest]
    profile = " | ".join(queries + tail)[:2000]
    return profile, len(history)


def get_saved_vehicle_ids(db: Session, user_id: int) -> set:
    saved = db.query(models.SavedVehicle.vehicle_id).filter(
        models.SavedVehicle.user_id == user_id
    ).all()
    return {s[0] for s in saved}


@router.get("/recommendations")
def get_recommendations(
    limit: int = Query(50, ge=1, le=300, description="Max vehicles to return"),
    faiss_k: int = Query(
        120,
        ge=10,
        le=300,
        description="How many FAISS neighbors to consider before filtering saved",
    ),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    user_id = current_user.id
    profile, signal_count = get_user_search_profile(db, user_id)

    if not profile:
        vehicles = (
            db.query(models.Vehicle)
            .filter(models.Vehicle.spam_flagged == False)
            .order_by(models.Vehicle.created_at.desc())
            .limit(limit)
            .all()
        )
        return {
            "source": "recent",
            "message": "No activity history yet — here are the newest listings to explore.",
            "total": len(vehicles),
            "items": [schemas.VehicleResponse.model_validate(v) for v in vehicles],
        }

    candidate_ids = search_vehicles(profile, top_k=faiss_k)

    if not candidate_ids:
        return {
            "source": "none",
            "message": "The FAISS index is empty. Build it with: python services/vector_store.py",
            "total": 0,
            "items": [],
        }

    saved_ids = get_saved_vehicle_ids(db, user_id)
    filtered_ids = [vid for vid in candidate_ids if vid not in saved_ids]
    take_ids = filtered_ids[:limit]

    if not take_ids:
        return {
            "source": "personalized",
            "message": (
                f"Matched from your last {signal_count} activity signal(s); "
                "no unsaved vehicles left in the top FAISS results (try unsaving or browse search)."
            ),
            "total": 0,
            "items": [],
        }

    vehicles = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle.id.in_(take_ids),
            models.Vehicle.spam_flagged == False,
        )
        .all()
    )

    id_order = {vid: idx for idx, vid in enumerate(take_ids)}
    vehicles.sort(key=lambda v: id_order.get(v.id, 999))

    return {
        "source": "personalized",
        "message": (
            f"Matched from your last {signal_count} activity signal(s) using embeddings + FAISS; "
            "saved cars are excluded."
        ),
        "total": len(vehicles),
        "items": [schemas.VehicleResponse.model_validate(v) for v in vehicles],
    }
