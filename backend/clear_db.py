"""Clears all rows from vehicles and scraped_urls tables for a fresh scrape."""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vehiclewalay.db")
print(f"Connecting to: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("DELETE FROM vehicles"))
    conn.execute(text("DELETE FROM scraped_urls"))
    conn.commit()
    
    v = conn.execute(text("SELECT COUNT(*) FROM vehicles")).scalar()
    u = conn.execute(text("SELECT COUNT(*) FROM scraped_urls")).scalar()
    print(f"Done! Vehicles: {v}, ScrapedURLs: {u}")
