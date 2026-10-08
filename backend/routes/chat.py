"""
Phase 3: RAG Pipeline - NLU & Chatbot
Natural language queries ko samajhna aur intelligent responses dena.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import database, models, schemas
import json
import os
import logging
from services.vector_store import search_vehicles, format_vehicle_for_embedding

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── Groq LLM Configuration ─────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

def get_groq_client():
    """Lazy-loads the Groq client (prefers AsyncGroq for non-blocking I/O)."""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured in .env")
    try:
        from groq import AsyncGroq
        return AsyncGroq(api_key=GROQ_API_KEY)
    except Exception:
        from groq import Groq
        return Groq(api_key=GROQ_API_KEY)

async def call_groq_completion(client, **kwargs):
    """Executes Groq completions without blocking the Uvicorn event loop."""
    import inspect
    import asyncio
    res = client.chat.completions.create(**kwargs)
    if inspect.isawaitable(res):
        return await res
    return await asyncio.to_thread(lambda: res)

import re

def sanitize_chat_query(query: str) -> str:
    """
    Sanitizes user input to mitigate prompt injection and control character exploits.
    """
    if not query:
        return ""
    # Strip null bytes and non-printable control chars
    clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', str(query))
    # Neutralize prompt injection markers (e.g. System:, [INST], <|im_start|>)
    injection_patterns = [
        r"(?i)\bignore\s+(all\s+)?(previous|prior)\s+instructions\b",
        r"(?i)\bsystem\s*:",
        r"(?i)\bdeveloper\s*mode\b",
        r"(?i)<\|im_start\|>",
        r"(?i)<\|im_end\|>",
        r"(?i)\[INST\]",
        r"(?i)\[/INST\]"
    ]
    for pattern in injection_patterns:
        clean = re.sub(pattern, "[filtered]", clean)
    return clean[:500].strip()


# ─── Step 1: NLU — Extract structured intent from natural language ───
async def extract_intent(client, user_query: str, conversation_history: list = None) -> dict:
    """
    Uses Groq LLM to parse a natural language query into structured JSON filters.
    Supports multi-turn conversation by accepting prior messages for context.
    Example: "mujhe 20 lakh mein Lahore ki Honda chahiye" ->
             {"make": "Honda", "city": "Lahore", "max_price": 2000000, "search_text": "Honda car in Lahore"}
    """
    sanitized_query = sanitize_chat_query(user_query)
    system_prompt = """You are an expert AI assistant for a Pakistani used car marketplace called VehicleWalay.
Your job is to extract structured search filters from the user's natural language query.

IMPORTANT — MULTI-TURN CONTEXT:
- You will receive the full conversation history. Use it to understand follow-up queries.
- If user says "is se sasti" or "cheaper than this", look at the previous context to understand what car/price they are referring to and adjust filters.
- If user says "aur dikhao" or "more like this", keep the same filters from the last turn.
- If user says "ye wali nahi, koi aur", keep similar filters but note the exclusion in search_text.
- Always produce a COMPLETE set of filters — merge new info with previous context.

IMPORTANT RULES:
- Prices in Pakistan are often stated in "lakh" (100,000) or "crore" (10,000,000). Convert accordingly.
  - "20 lakh" = 2000000, "1 crore" = 10000000, "50 lakh" = 5000000
- Common car makes in Pakistan: Toyota, Honda, Suzuki, KIA, Hyundai, Changan, MG, BMW, Mercedes, Audi, Daihatsu, Nissan, Mitsubishi, Haval
- "Prado" / "parado" usually means **Toyota Land Cruiser Prado**: set make "Toyota", model "Land Cruiser Prado" or "Prado", and search_text mentioning Toyota SUV Prado Pakistan.
- Common cities: Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Sialkot, Gujranwala
- The user may write in English, Urdu (Roman), or a mix. Understand both.
- "gari" = car, "sasti" = cheap/affordable, "mehngi" = expensive, "nai" = new, "purani" = old
- "automatic" = Automatic transmission, "manual" = Manual transmission
- If user asks about "fuel efficient" or "kam petrol", prefer smaller engine cars.

Return a JSON object with these optional fields (only include fields the user mentioned):
{
  "make": "string or null",
  "model": "string or null", 
  "city": "string or null",
  "min_price": "number or null",
  "max_price": "number or null",
  "min_year": "number or null",
  "max_year": "number or null",
  "transmission": "Automatic or Manual or null",
  "fuel_type": "Petrol or Diesel or Hybrid or Electric or null",
  "body_type": "Sedan or SUV or Hatchback or Crossover or MPV or null",
  "color": "string or null",
  "search_text": "A short English description for semantic search"
}

ONLY return valid JSON. No explanations, no markdown."""

    # Build messages list with conversation history for multi-turn context
    messages = [{"role": "system", "content": system_prompt}]
    if conversation_history:
        # Include up to last 6 turns for context (to stay within token limits)
        for turn in conversation_history[-6:]:
            role = turn.get("role", "user")
            content = sanitize_chat_query(turn.get("content", ""))
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": sanitized_query})

    try:
        response = await call_groq_completion(
            client,
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.1,
            max_tokens=300,
        )
        raw = response.choices[0].message.content.strip()
        # Clean up potential markdown wrapping
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse LLM response as JSON: {raw}")
        return {"search_text": sanitized_query}
    except Exception as e:
        logger.error(f"Groq NLU error: {e}")
        return {"search_text": sanitized_query}


# ─── Step 2: Hybrid Search — Combine FAISS + SQL filters ─────────
def hybrid_search(db: Session, intent: dict, top_k: int = 20) -> list:
    """
    Combines FAISS semantic search with SQL filtering for accurate results.
    """
    search_text = intent.get("search_text", "")
    
    # Build a rich search query for FAISS
    parts = []
    if intent.get("make"): parts.append(intent["make"])
    if intent.get("model"): parts.append(intent["model"])
    if intent.get("city"): parts.append(f"in {intent['city']}")
    if intent.get("body_type"): parts.append(intent["body_type"])
    if intent.get("color"): parts.append(intent["color"])
    if intent.get("transmission"): parts.append(intent["transmission"])
    if intent.get("fuel_type"): parts.append(intent["fuel_type"])
    if intent.get("min_year") or intent.get("max_year"):
        year_part = f"year {intent.get('min_year', '')}-{intent.get('max_year', '')}"
        parts.append(year_part)
    if search_text:
        parts.append(search_text)
    
    faiss_query = " ".join(parts) if parts else search_text
    
    # Get FAISS candidates (fetch more than needed, then filter)
    faiss_ids = search_vehicles(faiss_query, top_k=top_k * 3) if faiss_query else []
    
    # Build SQL query
    query = db.query(models.Vehicle).filter(models.Vehicle.spam_flagged == False)
    
    # If FAISS returned results, prefer those IDs
    if faiss_ids:
        query = query.filter(models.Vehicle.id.in_(faiss_ids))
    
    # Apply hard filters from intent
    if intent.get("make"):
        query = query.filter(
            models.Vehicle.make.ilike(f"%{intent['make']}%") | 
            models.Vehicle.title.ilike(f"%{intent['make']}%")
        )
    if intent.get("model"):
        query = query.filter(
            models.Vehicle.model.ilike(f"%{intent['model']}%") |
            models.Vehicle.title.ilike(f"%{intent['model']}%")
        )
    if intent.get("city"):
        query = query.filter(models.Vehicle.location.ilike(f"%{intent['city']}%"))
    if intent.get("min_price"):
        query = query.filter(models.Vehicle.price >= intent["min_price"])
    if intent.get("max_price"):
        query = query.filter(models.Vehicle.price <= intent["max_price"])
    if intent.get("min_year"):
        query = query.filter(models.Vehicle.model_year >= intent["min_year"])
    if intent.get("max_year"):
        query = query.filter(models.Vehicle.model_year <= intent["max_year"])
    if intent.get("transmission"):
        query = query.filter(models.Vehicle.transmission.ilike(f"%{intent['transmission']}%"))
    if intent.get("fuel_type"):
        query = query.filter(models.Vehicle.fuel_type.ilike(f"%{intent['fuel_type']}%"))
    if intent.get("body_type"):
        query = query.filter(models.Vehicle.body_type.ilike(f"%{intent['body_type']}%"))
    if intent.get("color"):
        query = query.filter(models.Vehicle.color.ilike(f"%{intent['color']}%"))
    
    vehicles = query.limit(top_k).all()
    
    # If FAISS gave us IDs, sort results by FAISS ranking order
    if faiss_ids and vehicles:
        id_order = {vid: idx for idx, vid in enumerate(faiss_ids)}
        vehicles.sort(key=lambda v: id_order.get(v.id, 999))
    
    return vehicles


# ─── Step 3: Response Synthesis — Generate conversational reply ──
# ─── Step 3: Response Synthesis — Generate conversational reply ──
async def synthesize_response(client, user_query: str, vehicles: list, intent: dict, conversation_history: list = None) -> str:
    """
    Takes the top vehicle results and generates a helpful, conversational response.
    Supports multi-turn conversation by including prior messages for context.
    """
    if not vehicles:
        return f"Sorry, no vehicles found matching \"{user_query}\". Please try adjusting your search terms or budget!"
    
    sanitized_query = sanitize_chat_query(user_query)

    # Build a summary of top 5 vehicles for the LLM
    vehicle_summaries = []
    for i, v in enumerate(vehicles[:5], 1):
        price_lakh = round(v.price / 100000, 1) if v.price else 0
        summary = (
            f"{i}. {v.title} — PKR {price_lakh} Lakh | "
            f"{v.location or 'Unknown'} | {v.model_year or 'N/A'} | "
            f"{v.mileage or 0} km | {v.transmission or 'N/A'} | "
            f"{v.color or 'N/A'} | Engine: {v.engine_capacity or 'N/A'}cc"
        )
        vehicle_summaries.append(summary)
    
    vehicle_text = "\n".join(vehicle_summaries)
    
    system_prompt = """You are a helpful and professional AI car advisor for VehicleWalay, a Pakistani used car marketplace.
The user searched for cars and here are the top results. Write a short, helpful, and natural response in English.

IMPORTANT — MULTI-TURN CONTEXT:
- You may receive conversation history. Use it to give contextual replies.
- If user asks follow-up like "cheaper than this" or "is se sasti?", refer to previous results and highlight the new lower-priced options.
- If user says "show more" or "aur dikhao", acknowledge you are showing more similar options.
- Be natural, professional, and conversational, remembering what was discussed earlier.

Rules:
- Keep it concise (3-5 sentences max)
- Mention 2-3 best options briefly  
- If prices are good deals, highlight that
- Be enthusiastic, professional, and polite
- Always respond in English
- Use "lakh" or "PKR" for prices (e.g. "30 lakh")
- Do NOT use markdown formatting, just plain text
- End with a helpful suggestion"""

    # Build messages with conversation history for multi-turn context
    messages = [{"role": "system", "content": system_prompt}]
    if conversation_history:
        for turn in conversation_history[-6:]:
            role = turn.get("role", "user")
            content = sanitize_chat_query(turn.get("content", ""))
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": f"User query: {sanitized_query}\n\nTop results:\n{vehicle_text}\n\nTotal matches found: {len(vehicles)}"})

    try:
        response = await call_groq_completion(
            client,
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Groq synthesis error: {e}")
        return f"Found {len(vehicles)} vehicles matching your search. Browse the results below!"


# ─── Save Search History (for Phase 4 Recommendations) ──────────
def save_search_history(db: Session, user_id: Optional[int], query: str):
    """Saves the user's search query for future recommendations."""
    if user_id:
        history = models.UserSearchHistory(user_id=user_id, query_text=query)
        db.add(history)
        db.commit()


def build_recommendation_history_line(user_query: str, intent: dict) -> str:
    """
    Richer text for FAISS user profile than raw chat alone — merges NLU fields + common synonyms
    so recommendations track what the user actually wanted (e.g. Prado → Land Cruiser Prado).
    """
    chunks: list[str] = [user_query.strip()]
    nlu_bits: list[str] = []
    for key in ("make", "model", "search_text", "body_type", "city"):
        v = intent.get(key)
        if v and str(v).strip():
            nlu_bits.append(str(v).strip())
    extra = " ".join(nlu_bits)
    ulow = user_query.lower()
    if extra and extra.lower() not in ulow:
        chunks.append(extra)

    synonyms: list[str] = []
    if "prado" in ulow or (intent.get("model") and "prado" in str(intent.get("model")).lower()):
        synonyms.extend(["Toyota Land Cruiser Prado", "Toyota Prado", "Toyota SUV Prado"])
    if "vigo" in ulow:
        synonyms.append("Toyota Hilux Vigo")
    if "revo" in ulow:
        synonyms.append("Toyota Hilux Revo")
    if "civic" in ulow and "honda" not in ulow:
        synonyms.append("Honda Civic")
    if "corolla" in ulow and "toyota" not in ulow:
        synonyms.append("Toyota Corolla")

    for s in synonyms:
        if s and s.lower() not in ulow:
            chunks.append(s)

    out: list[str] = []
    seen: set[str] = set()
    for c in chunks:
        c = c.strip()
        if not c or c.lower() in seen:
            continue
        seen.add(c.lower())
        out.append(c)
    return " | ".join(out)[:500]


# ─── Main Chat Endpoint ─────────────────────────────────────────
@router.post("/chat")
async def ai_chat(
    payload: dict,
    db: Session = Depends(database.get_db),
):
    """
    AI-powered chat endpoint for natural language vehicle search.
    Supports multi-turn conversations via conversation_history.
    
    Request body: {
        "query": "mujhe 20 lakh mein Lahore ki Honda chahiye",
        "user_id": 1,
        "conversation_history": [
            {"role": "user", "content": "Honda Civic in Lahore"},
            {"role": "assistant", "content": "Found 15 Honda Civics..."}
        ]
    }
    """
    user_query = payload.get("query", "").strip()
    user_id = payload.get("user_id")  # Optional, for search history
    conversation_history = payload.get("conversation_history", [])  # Multi-turn memory
    
    if not user_query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    if len(user_query) > 500:
        raise HTTPException(status_code=400, detail="Query too long (max 500 chars)")
    
    # Validate conversation_history format
    if not isinstance(conversation_history, list):
        conversation_history = []
    
    # Get Groq client
    client = get_groq_client()
    
    # Step 1: NLU — Extract intent (with conversation context)
    logger.info(f"🧠 NLU Processing: '{user_query}' (history: {len(conversation_history)} turns)")
    intent = await extract_intent(client, user_query, conversation_history)
    logger.info(f"📋 Extracted Intent: {intent}")
    
    # Step 2: Hybrid Search — FAISS + SQL
    vehicles = hybrid_search(db, intent, top_k=20)
    logger.info(f"🔍 Found {len(vehicles)} matching vehicles")
    
    # Step 3: Response Synthesis (with conversation context)
    ai_response = await synthesize_response(client, user_query, vehicles, intent, conversation_history)
    
    # Save rich history line so /recommendations FAISS profile matches chat intent (e.g. Prado)
    history_line = build_recommendation_history_line(user_query, intent)
    save_search_history(db, user_id, history_line)
    
    # Build response
    vehicle_list = []
    for v in vehicles:
        vehicle_list.append({
            "id": v.id,
            "title": v.title,
            "price": v.price,
            "currency": v.currency,
            "location": v.location,
            "model_year": v.model_year,
            "mileage": v.mileage,
            "transmission": v.transmission,
            "fuel_type": v.fuel_type,
            "image_url": v.image_url,
            "source_url": v.source_url,
            "make": v.make,
            "model": v.model,
            "color": v.color,
            "body_type": v.body_type,
            "engine_capacity": v.engine_capacity,
            "assembly": v.assembly,
            "registered_city": v.registered_city,
            "features": v.features,
            "description": v.description,
            "fake_score": v.fake_score,
        })
    
    return {
        "ai_response": ai_response,
        "intent": intent,
        "total": len(vehicles),
        "vehicles": vehicle_list,
    }


# ─── Quick semantic search (no LLM, just FAISS) ─────────────────
@router.get("/ai-search")
def ai_search(
    q: str = Query(..., description="Natural language search query"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(database.get_db),
):
    """
    Fast semantic search endpoint using only FAISS (no Groq LLM).
    Good for autocomplete and quick searches.
    """
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query is required")
    
    vehicle_ids = search_vehicles(q.strip(), top_k=limit)
    
    if not vehicle_ids:
        return {"total": 0, "items": []}
    
    vehicles = db.query(models.Vehicle).filter(
        models.Vehicle.id.in_(vehicle_ids),
        models.Vehicle.spam_flagged == False
    ).all()
    
    # Sort by FAISS ranking
    id_order = {vid: idx for idx, vid in enumerate(vehicle_ids)}
    vehicles.sort(key=lambda v: id_order.get(v.id, 999))
    
    return {
        "total": len(vehicles),
        "items": [schemas.VehicleResponse.model_validate(v) for v in vehicles]
    }
