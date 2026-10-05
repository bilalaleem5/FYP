from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas
from services.scoring import calculate_fake_score
from utils.auth import get_current_user
import uuid
import os
import shutil

router = APIRouter()

@router.get("/listings", response_model=schemas.PaginatedVehicleResponse)
def read_listings(
    skip: int = 0, 
    limit: int = 50, 
    make: str = None,
    city: str = None,
    min_price: int = None,
    max_price: int = None,
    min_year: int = None,
    max_year: int = None,
    transmission: str = None,
    fuel_type: str = None,
    body_type: str = None,
    q: str = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Vehicle).filter(models.Vehicle.spam_flagged == False)
    
    if make:
        query = query.filter(models.Vehicle.make.ilike(f"%{make}%") | models.Vehicle.title.ilike(f"%{make}%"))
    if city:
        query = query.filter(models.Vehicle.location.ilike(f"%{city}%"))
    if min_price is not None:
        query = query.filter(models.Vehicle.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Vehicle.price <= max_price)
    if min_year is not None:
        query = query.filter(models.Vehicle.model_year >= min_year)
    if max_year is not None:
        query = query.filter(models.Vehicle.model_year <= max_year)
    if transmission:
        query = query.filter(models.Vehicle.transmission.ilike(f"%{transmission}%"))
    if fuel_type:
        query = query.filter(models.Vehicle.fuel_type.ilike(f"%{fuel_type}%"))
    if body_type:
        query = query.filter(models.Vehicle.body_type.ilike(f"%{body_type}%"))
    if q:
        query = query.filter(models.Vehicle.title.ilike(f"%{q}%") | models.Vehicle.description.ilike(f"%{q}%"))

    total = query.count()
    vehicles = query.order_by(models.Vehicle.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "items": vehicles}

@router.get("/listings/{vehicle_id}", response_model=schemas.VehicleResponse)
def read_listing_by_id(vehicle_id: int, db: Session = Depends(database.get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.post("/listings", response_model=schemas.VehicleResponse)
def create_listing(vehicle: schemas.VehicleCreate, db: Session = Depends(database.get_db)):
    vehicle_dict = vehicle.model_dump()
    
    # Run Fake-Score Computation Phase 1
    scoring_result = calculate_fake_score(vehicle_dict, db)
    vehicle_dict['fake_score'] = scoring_result['fake_score']
    vehicle_dict['spam_flagged'] = scoring_result['spam_flagged']

    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.source_url == vehicle.source_url).first()
    if db_vehicle:
        # If it exists, update it instead of crashing. This allows scraper updates.
        for key, value in vehicle_dict.items():
            setattr(db_vehicle, key, value)
        db.commit()
        db.refresh(db_vehicle)
        return db_vehicle
    
    new_vehicle = models.Vehicle(**vehicle_dict)
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@router.post("/listings/upload-image")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join("uploads", unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    image_url = f"/uploads/{unique_filename}"
    return {"image_url": image_url}

@router.post("/listings/user", response_model=schemas.VehicleResponse)
def create_user_listing(
    vehicle: schemas.VehicleCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    vehicle_dict = vehicle.model_dump()
    vehicle_dict['user_id'] = current_user.id
    vehicle_dict['is_user_posted'] = True
    
    # Generate a local pseudo source_url if not provided, just for uniqueness or tracking if needed
    if not vehicle_dict.get('source_url'):
         vehicle_dict['source_url'] = f"vehiclewalay-user-{uuid.uuid4()}"

    # Run Fake-Score Computation Phase 1
    scoring_result = calculate_fake_score(vehicle_dict, db)
    vehicle_dict['fake_score'] = scoring_result['fake_score']
    vehicle_dict['spam_flagged'] = scoring_result['spam_flagged']

    new_vehicle = models.Vehicle(**vehicle_dict)
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@router.get("/listings/user/my-ads", response_model=schemas.PaginatedVehicleResponse)
def get_my_ads(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Vehicle).filter(models.Vehicle.user_id == current_user.id)
    total = query.count()
    vehicles = query.order_by(models.Vehicle.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "items": vehicles}

@router.delete("/listings/user/{vehicle_id}", status_code=204)
def delete_user_listing(
    vehicle_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id, models.Vehicle.user_id == current_user.id).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found or you don't have permission to delete it.")
        
    db.delete(vehicle)
    db.commit()
    return None
