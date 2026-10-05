import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'vehiclewalay.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE vehicles ADD COLUMN user_id INTEGER")
    print("Added user_id column.")
except sqlite3.OperationalError as e:
    print(f"Skipping user_id: {e}")

try:
    cursor.execute("ALTER TABLE vehicles ADD COLUMN is_user_posted BOOLEAN DEFAULT 0")
    print("Added is_user_posted column.")
except sqlite3.OperationalError as e:
    print(f"Skipping is_user_posted: {e}")

conn.commit()
conn.close()
print("Migration completed.")
