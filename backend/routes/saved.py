from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas
from utils import auth

router = APIRouter()

# --- Saved Vehicles ---

@router.post("/saved-vehicles", response_model=schemas.SavedVehicleResponse)
def save_vehicle(saved_vehicle: schemas.SavedVehicleCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Override user_id from the schema with the actual authenticated user's ID
    user_id = current_user.id
        
    # Check if vehicle exists
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == saved_vehicle.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Check if already saved
    existing = db.query(models.SavedVehicle).filter(
        models.SavedVehicle.user_id == user_id,
        models.SavedVehicle.vehicle_id == saved_vehicle.vehicle_id
    ).first()
    if existing:
        return existing

    new_saved_data = saved_vehicle.model_dump()
    new_saved_data['user_id'] = user_id # Ensure it belongs to the logged in user
    new_saved = models.SavedVehicle(**new_saved_data)
    db.add(new_saved)
    db.commit()
    db.refresh(new_saved)
    new_saved.vehicle = vehicle # Attach vehicle for response
    return new_saved

@router.get("/saved-vehicles/me", response_model=List[schemas.SavedVehicleResponse])
def get_saved_vehicles(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    saved_records = db.query(models.SavedVehicle).filter(models.SavedVehicle.user_id == current_user.id).order_by(models.SavedVehicle.created_at.desc()).all()
    
    # Populate the vehicle details for each record
    for record in saved_records:
        record.vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == record.vehicle_id).first()
        
    return saved_records

@router.delete("/saved-vehicles/{saved_id}")
def delete_saved_vehicle(saved_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    record = db.query(models.SavedVehicle).filter(models.SavedVehicle.id == saved_id, models.SavedVehicle.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Saved vehicle not found or unauthorized")
        
    db.delete(record)
    db.commit()
    return {"message": "Saved vehicle removed successfully"}


# --- Saved Searches (Alerts) ---

@router.post("/saved-searches", response_model=schemas.SavedSearchResponse)
def save_search(
    saved_search: schemas.SavedSearchCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Enforce current user ID from verified JWT
    search_data = saved_search.model_dump()
    search_data['user_id'] = current_user.id
    
    new_search = models.SavedSearch(**search_data)
    db.add(new_search)
    db.commit()
    db.refresh(new_search)
    return new_search

@router.get("/saved-searches", response_model=List[schemas.SavedSearchResponse])
def get_my_saved_searches(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.SavedSearch).filter(
        models.SavedSearch.user_id == current_user.id
    ).order_by(models.SavedSearch.created_at.desc()).all()

@router.get("/saved-searches/{user_id}", response_model=List[schemas.SavedSearchResponse])
def get_saved_searches(
    user_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access saved searches for another user")
    return db.query(models.SavedSearch).filter(
        models.SavedSearch.user_id == current_user.id
    ).order_by(models.SavedSearch.created_at.desc()).all()

@router.delete("/saved-searches/{search_id}")
def delete_saved_search(
    search_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    record = db.query(models.SavedSearch).filter(
        models.SavedSearch.id == search_id,
        models.SavedSearch.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Saved search not found or unauthorized")
        
    db.delete(record)
    db.commit()
    return {"message": "Saved search removed successfully"}
