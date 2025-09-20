
import os
import sys
import sqlite3
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Add the backend directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import Item, SessionLocal, init_db

EXTRACT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'germandb', 'extracted'))

def main():
    init_db()
    db = SessionLocal()

    for dir in os.listdir(EXTRACT_DIR):
        db_path = os.path.join(EXTRACT_DIR, dir, 'collection.anki2')
        if os.path.exists(db_path):
            try:
                con = sqlite3.connect(db_path)
                cur = con.cursor()
                res = cur.execute("SELECT flds FROM notes")
                for row in res.fetchall():
                    fields = row[0].split('\x1f')
                    # This is still a guess, but it's a more educated one.
                    german = fields[0]
                    english = fields[1]

                    item = Item(
                        german=german,
                        english=english,
                        level="unknown",
                        frequency=0
                    )
                    db.add(item)
                con.close()
            except Exception as e:
                print(f"Error processing {dir}: {e}")

    db.commit()
    db.close()

if __name__ == "__main__":
    main()
