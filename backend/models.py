import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Enum, Boolean
from database import Base
import datetime

class ScrapeStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCRAPED = "SCRAPED"
    FAILED = "FAILED"

class ScrapedURL(Base):
    __tablename__ = "scraped_urls"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    shallow_data = Column(JSON, nullable=True) # Stores generic fields from the search page
    status = Column(Enum(ScrapeStatus), default=ScrapeStatus.PENDING, index=True)
    last_attempt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    price = Column(Float)
    currency = Column(String, default="PKR")
    location = Column(String, index=True)
    model_year = Column(Integer)
    mileage = Column(Integer)
    transmission = Column(String)
    fuel_type = Column(String)
    image_url = Column(String)
    source_url = Column(String, unique=True, index=True, nullable=True)
    
    user_id = Column(Integer, index=True, nullable=True) # References users.id
    is_user_posted = Column(Boolean, default=False)
    
    # Parsed from title
    make = Column(String, nullable=True, index=True)
    model = Column(String, nullable=True, index=True)

    # Deep Scrape Fields
    description = Column(String, nullable=True)
    features = Column(JSON, nullable=True)  # List of strings
    owner_name = Column(String, nullable=True)
    owner_contact = Column(String, nullable=True)
    extra_images = Column(JSON, nullable=True) # List of image URLs

    # Additional Detail Page Fields
    engine_capacity = Column(Integer, nullable=True)  # in cc
    color = Column(String, nullable=True)
    assembly = Column(String, nullable=True)  # Local / Imported
    body_type = Column(String, nullable=True)
    registered_city = Column(String, nullable=True)

    # Fake/Spam Detection Flags
    fake_score = Column(Float, default=0.0)
    spam_flagged = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SavedVehicle(Base):
    __tablename__ = "saved_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    vehicle_id = Column(Integer, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    name = Column(String) # E.g., "Civic in Lahore"
    query = Column(String) # The natural language query or filters
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class UserSearchHistory(Base):
    __tablename__ = "user_search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    query_text = Column(String)  # The raw natural language query
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

