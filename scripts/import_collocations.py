
import os
import sys
import csv
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Add the backend directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import Item, SessionLocal, init_db, Base

CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'germandb', 'output', 'collocations_extracted.csv'))

def main():
    engine = SessionLocal().get_bind()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    with open(CSV_PATH, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            item = Item(
                german=row['german'],
                english=row['translation'],
                frequency=int(row['frequency']),
                pattern=row['pattern'],
                source=row['sources']
            )
            db.add(item)

    db.commit()
    db.close()

if __name__ == "__main__":
    main()
