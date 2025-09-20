
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Add the backend directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import Item, SessionLocal, init_db

DAILY_PHRASES = [
    {
        "id": 1,
        "german": "Guten Morgen",
        "english": "Good morning",
        "example": "Guten Morgen! Wie geht es dir?",
        "clip": "https://www.playphrase.me/search/guten_morgen/",
        "difficulty": "easy"
    },
    {
        "id": 2,
        "german": "Ich möchte",
        "english": "I would like",
        "example": "Ich möchte einen Kaffee, bitte.",
        "clip": "https://www.playphrase.me/search/ich_möchte/",
        "difficulty": "easy"
    },
    {
        "id": 3,
        "german": "Danke schön",
        "english": "Thank you",
        "example": "Danke schön für deine Hilfe!",
        "clip": "https://www.playphrase.me/search/danke_schön/",
        "difficulty": "easy"
    },
    {
        "id": 4,
        "german": "Entschuldigung",
        "english": "Excuse me",
        "example": "Entschuldigung, wo ist der Bahnhof?",
        "clip": "https://www.playphrase.me/search/entschuldigung/",
        "difficulty": "medium"
    },
    {
        "id": 5,
        "german": "Wie geht's",
        "english": "How are you",
        "example": "Hey, wie geht's dir denn?",
        "clip": "https://www.playphrase.me/search/wie_geht_s/",
        "difficulty": "easy"
    },
    {
        "id": 6,
        "german": "Was ist los",
        "english": "What's up",
        "example": "Was ist los mit dir?",
        "clip": "https://www.playphrase.me/search/was_ist_los/",
        "difficulty": "medium"
    },
    {
        "id": 7,
        "german": "Alles klar",
        "english": "Got it",
        "example": "Alles klar, ich verstehe.",
        "clip": "https://www.playphrase.me/search/alles_klar/",
        "difficulty": "medium"
    },
    {
        "id": 8,
        "german": "Keine Ahnung",
        "english": "No idea",
        "example": "Keine Ahnung, wie das geht.",
        "clip": "https://www.playphrase.me/search/keine_ahnung/",
        "difficulty": "hard"
    },
    {
        "id": 9,
        "german": "Es tut mir leid",
        "english": "I'm sorry",
        "example": "Es tut mir wirklich leid!",
        "clip": "https://www.playphrase.me/search/es_tut_mir_leid/",
        "difficulty": "medium"
    },
    {
        "id": 10,
        "german": "Ich verstehe nicht",
        "english": "I don't understand",
        "example": "Ich verstehe nicht, was du meinst.",
        "clip": "https://www.playphrase.me/search/ich_verstehe_nicht/",
        "difficulty": "hard"
    }
]

def main():
    init_db()
    db = SessionLocal()
    for phrase in DAILY_PHRASES:
        item = Item(
            german=phrase["german"],
            english=phrase["english"],
            level=phrase["difficulty"],
            frequency=0
        )
        db.add(item)
    db.commit()
    db.close()

if __name__ == "__main__":
    main()
