import os
import faiss
import numpy as np
import time
from sqlalchemy.orm import Session
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
INDEX_FILE = os.path.join(os.path.dirname(__file__), "..", "vehicle_index.faiss")
MAPPING_FILE = os.path.join(os.path.dirname(__file__), "..", "vehicle_mapping.npy")
MODEL_NAME = 'all-MiniLM-L6-v2'
VECTOR_DIMENSION = 384

# Initialize Model (Lazy loading so it doesn't slow down the FastAPI boot unless used)
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            logger.info(f"Loading embedding model: {MODEL_NAME}...")
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(MODEL_NAME)
        except Exception as e:
            logger.error(f"⚠️ Could not load SentenceTransformer: {e}")
            logger.error("💡 Vector semantic search will be disabled until Visual C++ Redistributable is installed.")
            return None
    return _model

def format_vehicle_for_embedding(vehicle) -> str:
    """
    Combines all relevant vehicle data into a single rich text string that the AI can understand.
    """
    text = (
        f"Make: {vehicle.make or 'Unknown'}. "
        f"Model: {vehicle.model or 'Unknown'}. "
        f"Year: {vehicle.model_year or 'Unknown'}. "
        f"Price: {vehicle.price} {vehicle.currency}. "
        f"City: {vehicle.location or 'Unknown'}. "
        f"Transmission: {vehicle.transmission or 'Unknown'}. "
        f"Fuel: {vehicle.fuel_type or 'Unknown'}. "
        f"Mileage: {vehicle.mileage} km. "
        f"Color: {vehicle.color or 'Unknown'}. "
        f"Engine: {vehicle.engine_capacity or 'Unknown'} cc. "
        f"Description: {vehicle.description or ''}"
    )
    # Remove excessive whitespace/newlines
    return " ".join(text.split())

def init_index():
    """Initializes a new FAISS index with ID mapping."""
    # IndexFlatL2 is good for exact search. We wrap it in IndexIDMap to store our DB IDs.
    index = faiss.IndexIDMap(faiss.IndexFlatL2(VECTOR_DIMENSION))
    return index

def build_index_from_db(db: Session):
    """
    Fetches ALL vehicles from the DB and builds the initial FAISS index.
    Should be run as a background script or one-time setup.
    """
    from models import Vehicle
    logger.info("Fetching vehicles from database...")
    
    # We only want non-spam vehicles
    vehicles = db.query(Vehicle).filter(Vehicle.spam_flagged == False).all()
    
    if not vehicles:
        logger.warning("No vehicles found in the database to embed.")
        return
        
    logger.info(f"Formatting {len(vehicles)} vehicles for embeddings...")
    texts = []
    ids = []
    
    for v in vehicles:
        texts.append(format_vehicle_for_embedding(v))
        ids.append(v.id)
        
    model = get_model()
    if model is None:
        logger.warning("Embedding model not available, skipping index build.")
        return
    
    logger.info("Generating embeddings (This might take a few minutes)...")
    start_time = time.time()
    
    # Encode all texts into a numpy array of vectors
    embeddings = model.encode(texts, show_progress_bar=True)
    # Normalize embeddings for cosine similarity if using L2 (or just better ranking)
    faiss.normalize_L2(embeddings)
    
    id_array = np.array(ids).astype('int64')
    
    logger.info(f"Embeddings generated in {time.time() - start_time:.2f} seconds.")
    
    # Build FAISS index
    index = init_index()
    index.add_with_ids(embeddings, id_array)
    
    # Save to disk
    faiss.write_index(index, INDEX_FILE)
    logger.info(f"FAISS index successfully saved to {INDEX_FILE} with {index.ntotal} vectors.")

def load_index():
    """Loads the FAISS index from disk."""
    if os.path.exists(INDEX_FILE):
        return faiss.read_index(INDEX_FILE)
    return None

def update_vehicle_in_index(vehicle, index=None):
    """
    Updates or inserts a single vehicle into the FAISS index.
    Useful for when the scraper fetches a new vehicle, so we don't have to rebuild the whole index.
    """
    if vehicle.spam_flagged:
        return # Do not index spam
        
    if index is None:
        index = load_index()
        if index is None:
            index = init_index()
            
    # FAISS IndexIDMap doesn't easily support "update", we have to remove and add
    try:
        index.remove_ids(np.array([vehicle.id]).astype('int64'))
    except Exception:
        pass # It wasn't in the index yet
        
    text = format_vehicle_for_embedding(vehicle)
    model = get_model()
    if model is None:
        return
    
    embedding = model.encode([text])
    embedding = np.array(embedding).astype('float32')
    faiss.normalize_L2(embedding)
    
    index.add_with_ids(embedding, np.array([vehicle.id]).astype('int64'))
    faiss.write_index(index, INDEX_FILE)

def search_vehicles(query: str, top_k: int = 10):
    """
    Searches the FAISS index using natural language query.
    Returns a list of vehicle IDs.
    """
    index = load_index()
    if index is None or index.ntotal == 0:
        logger.warning("FAISS index not found or empty.")
        return []
        
    model = get_model()
    if model is None:
        logger.warning("Embedding model not available for search.")
        return []

    query_vector = model.encode([query])
    query_vector = np.array(query_vector).astype('float32')
    faiss.normalize_L2(query_vector)
    
    # Perform search
    distances, indices = index.search(query_vector, top_k)
    
    # Convert numpy array to standard python list and filter out -1 (not found)
    results = [int(idx) for idx in indices[0] if idx != -1]
    return results

if __name__ == "__main__":
    # If run directly, rebuild the entire index
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from database import SessionLocal
    db = SessionLocal()
    build_index_from_db(db)
    db.close()

