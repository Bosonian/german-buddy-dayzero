
from fsrs import Scheduler, Card, Rating
from datetime import datetime, timezone

def fsrs_schedule(card: Card, rating: Rating) -> Card:
    scheduler = Scheduler()
    card, review_log = scheduler.review_card(card, rating)
    return card
