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

import html
import re

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

def validate_image_magic_bytes(header: bytes) -> bool:
    """Verifies that the uploaded file content matches genuine image magic bytes."""
    if len(header) < 12:
        return False
    # JPEG
    if header.startswith(b"\xff\xd8\xff"):
        return True
    # PNG
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    # GIF
    if header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):
        return True
    # WebP (RIFF....WEBP)
    if header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return True
    return False

def sanitize_text(value: str) -> str:
    """Strips HTML tags and escapes special characters to prevent XSS injection."""
    if not value:
        return value
    # Strip HTML tags
    clean = re.sub(r'<[^>]*>', '', str(value))
    return html.escape(clean.strip())

import base64
import json
import logging

logger = logging.getLogger(__name__)

def inspect_image_pixels(image_bytes: bytes, filename: str = "") -> dict:
    """
    Local Computer Vision inspection using Pillow and NumPy:
    Detects digital logos, clip-art, graphics, banners, and non-photographic images.
    """
    name_lower = (filename or "").lower()
    non_car_terms = [
        "cat", "dog", "animal", "flower", "food", "house", "room", "laptop", 
        "phone", "nature", "logo", "icon", "graphic", "art", "banner", 
        "vector", "drawing", "illustration", "aixen", "symbol", "badge", 
        "wallpaper", "screenshot", "meme", "poster"
    ]
    face_terms = ["selfie", "face", "portrait", "person", "human", "avatar", "profile", "man", "woman", "guy", "girl"]
    
    heuristic_face = any(k in name_lower for k in face_terms)
    heuristic_non_car = any(k in name_lower for k in non_car_terms)
    
    if heuristic_non_car:
        return {
            "face_detected": heuristic_face,
            "is_vehicle": False,
            "privacy_warning": "Human face detected." if heuristic_face else None,
            "reason": "Non-vehicle image detected (digital graphic / logo / non-car filename).",
            "analyzed": True
        }
        
    try:
        from PIL import Image
        import numpy as np
        import io
        
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size
        rgb = img.convert("RGB")
        arr = np.array(rgb)
        flat = arr.reshape(-1, 3)
        
        # 1. Abnormal aspect ratio (ribbons/banners/skyscrapers)
        aspect = max(w / h, h / w)
        if aspect > 2.8:
            return {
                "face_detected": heuristic_face,
                "is_vehicle": False,
                "privacy_warning": None,
                "reason": f"Abnormal aspect ratio ({w}x{h}) typical of banners/graphics.",
                "analyzed": True
            }
            
        # 2. Check for solid background (hallmark of digital logos, icons, clip-art)
        dark_ratio = float(np.mean(np.all(flat < 38, axis=1)))
        white_ratio = float(np.mean(np.all(flat > 220, axis=1)))
        
        if dark_ratio > 0.55:
            return {
                "face_detected": False,
                "is_vehicle": False,
                "privacy_warning": None,
                "reason": f"Solid dark background ({dark_ratio*100:.0f}%) characteristic of digital logos/icons.",
                "analyzed": True
            }
            
        if white_ratio > 0.55:
            return {
                "face_detected": False,
                "is_vehicle": False,
                "privacy_warning": None,
                "reason": f"Solid white background ({white_ratio*100:.0f}%) characteristic of digital clip-art/graphics.",
                "analyzed": True
            }
            
        # 3. Low color diversity (flat vector illustration vs real-world photograph)
        unique_colors = len(np.unique(flat, axis=0))
        if unique_colors < 1500 and (w * h > 40000):
            return {
                "face_detected": False,
                "is_vehicle": False,
                "privacy_warning": None,
                "reason": f"Low color palette ({unique_colors} colors) typical of vector art/logos.",
                "analyzed": True
            }
            
        # 4. Skin tone heuristic for face/selfie detection
        ycbcr = img.convert("YCbCr")
        ycbcr_arr = np.array(ycbcr)
        y, cb, cr = ycbcr_arr[:, :, 0], ycbcr_arr[:, :, 1], ycbcr_arr[:, :, 2]
        skin_mask = (y > 70) & (cb >= 80) & (cb <= 135) & (cr >= 135) & (cr <= 180)
        skin_ratio = float(np.mean(skin_mask))
        if skin_ratio > 0.22 or heuristic_face:
            return {
                "face_detected": True,
                "is_vehicle": True,
                "privacy_warning": "Human face or personal portrait detected. Please protect seller privacy.",
                "reason": f"High skin-tone density ({skin_ratio*100:.1f}%) detected in photo.",
                "analyzed": True
            }
    except Exception as e:
        logger.warning(f"Local pixel inspection note: {e}")
        
    return {
        "face_detected": heuristic_face,
        "is_vehicle": None,  # Not verified yet
        "privacy_warning": "Human face detected." if heuristic_face else None,
        "reason": "Image passed local pixel inspection.",
        "analyzed": False
    }

async def analyze_image_with_vision_ai(image_bytes: bytes, file_extension: str, filename: str = "") -> dict:
    """
    AI Vision Analysis:
    1. Local pixel inspection (Pillow + NumPy) catches logos, vector graphics, solid backgrounds, and skin-tone faces.
    2. Groq Vision AI (Llama 3.2 Vision) executes deep multimodal inspection if GROQ_API_KEY is configured.
    """
    local_check = inspect_image_pixels(image_bytes, filename)
    
    # If local check explicitly found non-vehicle graphic or face, respect it
    if local_check.get("is_vehicle") is False or local_check.get("face_detected"):
        return local_check

    groq_api_key = os.getenv("GROQ_API_KEY", "")
    if not groq_api_key:
        # Vision AI offline / unconfigured: DO NOT blindly claim it is a verified vehicle!
        return {
            "face_detected": local_check.get("face_detected", False),
            "is_vehicle": None,  # Unverified
            "privacy_warning": local_check.get("privacy_warning"),
            "reason": "Vision AI offline: Configure GROQ_API_KEY in backend/.env for real-time photo verification.",
            "analyzed": False
        }
    
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=groq_api_key)
        
        # Base64 encode for vision API
        mime = "image/jpeg" if file_extension in ["jpg", "jpeg"] else f"image/{file_extension}"
        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime};base64,{b64_img}"
        
        prompt = """Analyze this vehicle marketplace photo carefully.
1. Is there a visible human face or selfie/portrait in the photo? (true or false)
2. Is a vehicle/car/motorcycle clearly visible in the photo? (true or false - if it is a logo, artwork, icon, or random object, return false)
Return ONLY a valid JSON object with exact keys:
{
  "face_detected": true or false,
  "is_vehicle": true or false,
  "privacy_warning": "Warning message if human face detected or null",
  "reason": "Brief 1-sentence note"
}"""
        
        models_to_try = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
        last_error = None
        
        for model_name in models_to_try:
            try:
                response = await client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": data_url}}
                            ]
                        }
                    ],
                    temperature=0.1,
                    max_tokens=150,
                )
                
                content = response.choices[0].message.content.strip()
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                data = json.loads(content)
                data["analyzed"] = True
                return data
            except Exception as m_err:
                last_error = m_err
                continue
                
        raise last_error or Exception("Failed to query vision models")
    except Exception as e:
        logger.warning(f"Vision AI analysis fallback: {e}")
        return {
            "face_detected": local_check.get("face_detected", False),
            "is_vehicle": local_check.get("is_vehicle"),
            "privacy_warning": local_check.get("privacy_warning"),
            "reason": f"AI fallback: {e}",
            "analyzed": False
        }

@router.post("/listings/upload-image")
async def upload_image(file: UploadFile = File(...)):
    # 1. Content-type header check
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # 2. Extension check
    file_extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read entire file bytes for signature and Vision AI analysis
    image_bytes = await file.read()
    if not validate_image_magic_bytes(image_bytes[:16]):
        raise HTTPException(
            status_code=400, 
            detail="File signature verification failed: Corrupt or spoofed image file."
        )
    
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join("uploads", unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(image_bytes)
        
    image_url = f"/uploads/{unique_filename}"
    
    # 3. Vision AI Face Detection & Vehicle Verification
    ai_vision = await analyze_image_with_vision_ai(image_bytes, file_extension, filename=file.filename)
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    
    return {
        "image_url": image_url,
        "face_detected": ai_vision.get("face_detected", False),
        "is_vehicle": ai_vision.get("is_vehicle"),
        "privacy_warning": ai_vision.get("privacy_warning"),
        "ai_feedback": ai_vision.get("reason"),
        "analyzed": ai_vision.get("analyzed", False),
        "ai_configured": bool(groq_api_key),
    }

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

    # HTML Sanitization against XSS
    if vehicle_dict.get('title'):
        vehicle_dict['title'] = sanitize_text(vehicle_dict['title'])
    if vehicle_dict.get('description'):
        vehicle_dict['description'] = sanitize_text(vehicle_dict['description'])
    if vehicle_dict.get('color'):
        vehicle_dict['color'] = sanitize_text(vehicle_dict['color'])
    if vehicle_dict.get('location'):
        vehicle_dict['location'] = sanitize_text(vehicle_dict['location'])
    if vehicle_dict.get('owner_contact'):
        vehicle_dict['owner_contact'] = sanitize_text(vehicle_dict['owner_contact'])

    # 1. Unusual Pricing Anomaly Validation
    price = vehicle_dict.get('price')
    if price is not None:
        if price < 50000:
            raise HTTPException(
                status_code=400,
                detail=f"Unusually low price: PKR {price:,.0f} is unrealistic. Minimum vehicle listing price is PKR 50,000."
            )
        if price > 1000000000:
            raise HTTPException(
                status_code=400,
                detail="Unusually high price: Vehicle price cannot exceed PKR 100 Crore."
            )
        p_str = str(int(price)) if isinstance(price, (int, float)) else str(price).strip()
        if p_str in ['123', '1234', '12345', '123456', '1234567', '111111', '999999', '9999999']:
            raise HTTPException(
                status_code=400,
                detail=f"Suspicious dummy price sequence detected ('{p_str}'). Please enter genuine asking price."
            )

    # 2. Deceptive / Scam Description Validation
    desc = str(vehicle_dict.get('description') or "").strip()
    if not desc or len(desc) < 15:
        raise HTTPException(
            status_code=400,
            detail="Description is too brief. Please describe vehicle condition and features (minimum 15 characters)."
        )
    
    scam_keywords = [
        'urgent money', 'send advance', 'advance payment', 'bayana', 
        'western union', 'easypaisa advance', 'jazzcash advance', 
        'whatsapp only', 'shipping available', 'transfer before delivery'
    ]
    if any(k in desc.lower() for k in scam_keywords):
        raise HTTPException(
            status_code=400,
            detail="Deceptive content detected: Demanding advance payments or wire transfers violates marketplace safety rules."
        )

    # 3. Anti-fake mileage and dummy checks
    mileage = vehicle_dict.get('mileage')
    model_year = vehicle_dict.get('model_year')
    if mileage is not None:
        m_str = str(int(mileage)) if isinstance(mileage, (int, float)) else str(mileage).strip()
        dummy_patterns = ['123', '1234', '12345', '123456', '321', '4321', '111', '222', '333', '999', '1111', '9999', '0000']
        if m_str in dummy_patterns or (len(m_str) >= 3 and len(set(m_str)) == 1):
            raise HTTPException(
                status_code=400,
                detail=f"Suspicious dummy mileage detected ('{m_str}'). Fake listings are prevented. Please enter genuine vehicle odometer reading."
            )
        if model_year and model_year < 2026:
            age = max(0, 2026 - model_year)
            if age >= 8 and mileage < 2000:
                raise HTTPException(
                    status_code=400,
                    detail=f"Odometer anomaly: An {age}-year-old vehicle ({model_year}) cannot realistically have only {mileage} km."
                )

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
