"""Database initialization for MentorMatch tables"""

from .database import Base, engine
from .models import (
    MentorProfile,
    AvailabilitySlot,
    Booking,
    Session,
    Review,
    PaymentAccount,
    Transaction,
    Subscription,
    Tip,
    Payout,
)


def init_mentormatch_db():
    """Initialize all MentorMatch database tables"""
    Base.metadata.create_all(bind=engine)
