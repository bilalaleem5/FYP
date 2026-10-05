from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VehicleBase(BaseModel):
    title: str
    price: float
    currency: Optional[str] = "PKR"
    location: Optional[str] = None
    model_year: Optional[int] = None
    mileage: Optional[int] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None
    
    user_id: Optional[int] = None
    is_user_posted: Optional[bool] = False

    # Parsed from title
    make: Optional[str] = None
    model: Optional[str] = None

    # Deep Scrape Fields
    description: Optional[str] = None
    features: Optional[List[str]] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    extra_images: Optional[List[str]] = None

    # Additional Detail Page Fields
    engine_capacity: Optional[int] = None
    color: Optional[str] = None
    assembly: Optional[str] = None
    body_type: Optional[str] = None
    registered_city: Optional[str] = None

    # Fake/Spam Detection Flags
    fake_score: float = 0.0
    spam_flagged: bool = False

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedVehicleResponse(BaseModel):
    total: int
    items: List[VehicleResponse]

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SavedVehicleBase(BaseModel):
    user_id: int
    vehicle_id: int

class SavedVehicleCreate(SavedVehicleBase):
    pass

class SavedVehicleResponse(SavedVehicleBase):
    id: int
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None # Will be populated in routes

    class Config:
        from_attributes = True

class SavedSearchBase(BaseModel):
    user_id: int
    name: str
    query: str

class SavedSearchCreate(SavedSearchBase):
    pass

class SavedSearchResponse(SavedSearchBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

