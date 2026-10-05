import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'vehiclewalay.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE vehicles ADD COLUMN fake_score FLOAT DEFAULT 0.0")
    print("Added fake_score column.")
except sqlite3.OperationalError as e:
    print(f"Skipping fake_score: {e}")

try:
    cursor.execute("ALTER TABLE vehicles ADD COLUMN spam_flagged BOOLEAN DEFAULT 0")
    print("Added spam_flagged column.")
except sqlite3.OperationalError as e:
    print(f"Skipping spam_flagged: {e}")

conn.commit()
conn.close()
print("Migration completed.")
