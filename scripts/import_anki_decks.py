
import os
import sys
import ankipandas
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Add the backend directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import Item, SessionLocal, init_db

ANKI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'germandb'))

def main():
    init_db()
    db = SessionLocal()

    for file in os.listdir(ANKI_DIR):
        if file.endswith(".apkg"):
            try:
                col = ankipandas.Collection(os.path.join(ANKI_DIR, file))
                print(col.notes)
            except Exception as e:
                print(f"Error processing {file}: {e}")

    db.close()

if __name__ == "__main__":
    main()
