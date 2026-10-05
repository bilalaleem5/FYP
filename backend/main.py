from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine, SessionLocal
from routes import listings, users, saved, chat, recommendations, history, market_analysis
import logging
import threading
import time

logger = logging.getLogger(__name__)

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)


# ─── FAISS Background Sync ──────────────────────────────────────
def _rebuild_faiss_index():
    """Rebuild FAISS index from DB in a background thread."""
    try:
        from services.vector_store import build_index_from_db, load_index
        
        # Check if index already exists and has data
        existing = load_index()
        if existing and existing.ntotal > 0:
            logger.info(f"✅ FAISS index already loaded with {existing.ntotal} vectors.")
            return
        
        logger.info("🔄 Building FAISS index from database (background)...")
        db = SessionLocal()
        try:
            build_index_from_db(db)
            logger.info("✅ FAISS index rebuilt successfully.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"❌ FAISS rebuild error: {e}")


def _periodic_faiss_sync(interval_minutes: int = 30):
    """Periodically rebuild FAISS index to pick up new listings."""
    while True:
        time.sleep(interval_minutes * 60)
        try:
            from services.vector_store import build_index_from_db
            logger.info("🔄 Periodic FAISS sync starting...")
            db = SessionLocal()
            try:
                build_index_from_db(db)
                logger.info("✅ Periodic FAISS sync complete.")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"❌ Periodic FAISS sync error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: rebuild FAISS index + start periodic sync. Shutdown: cleanup."""
    # Start FAISS rebuild in background thread (non-blocking)
    t = threading.Thread(target=_rebuild_faiss_index, daemon=True)
    t.start()
    
    # Start periodic sync (every 30 min) in background
    sync_thread = threading.Thread(target=_periodic_faiss_sync, args=(30,), daemon=True)
    sync_thread.start()
    
    logger.info("🚀 VehicleWalay API started with FAISS auto-sync enabled.")
    yield
    logger.info("👋 VehicleWalay API shutting down.")


app = FastAPI(
    title="VehicleWalay API",
    description="AI-Powered Vehicle Discovery Platform API",
    lifespan=lifespan,
)

import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Setup CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(listings.router, prefix="/api", tags=["Listings"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(saved.router, prefix="/api", tags=["Saved"])
app.include_router(chat.router, prefix="/api", tags=["AI Chat"])
app.include_router(recommendations.router, prefix="/api", tags=["Recommendations"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(market_analysis.router, prefix="/api", tags=["Market Analysis"])

@app.get("/")
def read_root():
    return {"message": "Welcome to VehicleWalay API (FastAPI)"}

