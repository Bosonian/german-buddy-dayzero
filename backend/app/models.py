"""Database models for MentorMatch"""

import datetime as dt
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean, Text, Enum
from sqlalchemy.dialects.postgresql import JSON
from .database import Base
import enum


# Enums
class SessionTypeEnum(str, enum.Enum):
    ONE_ON_ONE = "one_on_one"
    GROUP = "group"
    TRIAL = "trial"


class BookingStatusEnum(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class SessionStatusEnum(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentStatusEnum(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class TransactionTypeEnum(str, enum.Enum):
    BOOKING = "booking"
    SUBSCRIPTION = "subscription"
    TIP = "tip"
    REFUND = "refund"
    PAYOUT = "payout"


class SubscriptionStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    INCOMPLETE = "incomplete"
    TRIALING = "trialing"


class SubscriptionPlanEnum(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


# Models
class MentorProfile(Base):
    """Mentor profile with rates and availability"""
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    bio = Column(Text)
    hourly_rate_cents = Column(Integer, default=5000)  # $50 default
    trial_rate_cents = Column(Integer, default=0)  # Free trial default
    currency = Column(String, default="USD")
    is_active = Column(Boolean, default=True)
    languages = Column(JSON, default=list)  # e.g., ["German", "English"]
    specialties = Column(JSON, default=list)  # e.g., ["Grammar", "Conversation"]
    average_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)


class AvailabilitySlot(Base):
    """Mentor availability slots"""
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    day_of_week = Column(Integer)  # 0=Monday, 6=Sunday
    start_time = Column(String)  # HH:MM format
    end_time = Column(String)  # HH:MM format
    is_recurring = Column(Boolean, default=True)
    specific_date = Column(DateTime, nullable=True)  # For one-time slots
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)


class Booking(Base):
    """Booking/appointment for a mentoring session"""
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=60)
    session_type = Column(String, default="one_on_one")
    status = Column(String, default="pending", index=True)
    price_cents = Column(Integer, nullable=False)
    currency = Column(String, default="USD")
    notes = Column(Text)
    cancellation_reason = Column(Text)
    cancelled_at = Column(DateTime)
    cancelled_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=dt.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)


class Session(Base):
    """Active or completed mentoring session"""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    status = Column(String, default="scheduled")
    started_at = Column(DateTime)
    ended_at = Column(DateTime)
    duration_minutes = Column(Integer)
    video_room_id = Column(String, unique=True)
    video_room_url = Column(String)
    recording_url = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)


class Review(Base):
    """Review for a completed session"""
    __tablename__ = "session_reviews"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)


class PaymentAccount(Base):
    """Stripe Connect account for mentors"""
    __tablename__ = "payment_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    stripe_account_id = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=False)
    payouts_enabled = Column(Boolean, default=False)
    charges_enabled = Column(Boolean, default=False)
    details_submitted = Column(Boolean, default=False)
    default_currency = Column(String, default="USD")
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)


class Transaction(Base):
    """Payment transactions"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True)
    status = Column(String, default="pending", index=True)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String, default="USD")
    stripe_payment_intent_id = Column(String, unique=True)
    stripe_charge_id = Column(String)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"))
    description = Column(Text)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=dt.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)


class Subscription(Base):
    """User subscriptions to mentors"""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    plan = Column(String, nullable=False)
    status = Column(String, default="active", index=True)
    stripe_subscription_id = Column(String, unique=True)
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    cancel_at_period_end = Column(Boolean, default=False)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String, default="USD")
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)


class Tip(Base):
    """Tips sent to mentors"""
    __tablename__ = "tips"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    to_mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String, default="USD")
    message = Column(Text)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    stripe_payment_intent_id = Column(String, unique=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=dt.datetime.utcnow, index=True)


class Payout(Base):
    """Payouts to mentors"""
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String, default="USD")
    stripe_payout_id = Column(String, unique=True)
    status = Column(String, default="pending")
    arrival_date = Column(DateTime)
    description = Column(Text)
    created_at = Column(DateTime, default=dt.datetime.utcnow, index=True)
