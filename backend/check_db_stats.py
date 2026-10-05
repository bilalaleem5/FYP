import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vehiclewalay.db")
print(f"Connecting to: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

def get_count(table_name, condition=""):
    try:
        with engine.connect() as connection:
            query = f"SELECT COUNT(*) FROM {table_name}"
            if condition:
                query += f" WHERE {condition}"
            result = connection.execute(text(query))
            return result.scalar()
    except Exception as e:
        print(f"Error querying {table_name}: {e}")
        return "Error"

try:
    v_count = get_count("vehicles")
    url_count = get_count("scraped_urls")
    scraped_count = get_count("scraped_urls", "status = 'SCRAPED'")
    pending_count = get_count("scraped_urls", "status = 'PENDING'")
    failed_count = get_count("scraped_urls", "status = 'FAILED'")

    print("-" * 30)
    print(f"Total Vehicles in DB: {v_count}")
    print(f"Total Discovered URLs: {url_count}")
    print(f"Successfully Scraped: {scraped_count}")
    print(f"Pending Scrapes: {pending_count}")
    print(f"Failed Scrapes: {failed_count}")
    print("-" * 30)

except Exception as e:
    print(f"Main execution error: {e}")
