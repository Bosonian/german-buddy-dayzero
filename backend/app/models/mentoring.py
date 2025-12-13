"""
MentorMatch - Mentoring Marketplace Models
SQLAlchemy models for the mentoring system
"""
import datetime as dt
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, DateTime, Float, ForeignKey, Boolean,
    Text, Numeric, Time, Date, JSON, Enum, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
import enum

from ..database import Base


# Enums
class ExpertiseLevelEnum(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    expert = "expert"


class MatchStatusEnum(str, enum.Enum):
    pending = "pending"
    active = "active"
    ended = "ended"


class BookingStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class SessionTypeEnum(str, enum.Enum):
    video = "video"
    audio = "audio"
    chat = "chat"


class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    refunded = "refunded"
    failed = "failed"


class SubscriptionStatusEnum(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"
    expired = "expired"


class SubscriptionTierEnum(str, enum.Enum):
    basic = "basic"
    premium = "premium"


class ReportStatusEnum(str, enum.Enum):
    pending = "pending"
    reviewed = "reviewed"
    resolved = "resolved"


# Models
class Profile(Base):
    """Extended user profile for mentors and mentees"""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)  # Decimal for money
    is_mentor = Column(Boolean, default=False, index=True)
    is_verified = Column(Boolean, default=False, index=True)
    timezone = Column(String(50), nullable=True)
    languages = Column(JSON, nullable=True)  # ["en", "de", "fr"]
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow, nullable=False)

    # Relationships
    mentor_categories = relationship("MentorCategory", back_populates="mentor", foreign_keys="MentorCategory.mentor_id")
    mentor_tags = relationship("MentorTag", back_populates="mentor", foreign_keys="MentorTag.mentor_id")
    availability_slots = relationship("AvailabilitySlot", back_populates="mentor")
    availability_overrides = relationship("AvailabilityOverride", back_populates="mentor")

    # Bookings where this profile is the mentor
    mentor_bookings = relationship("Booking", foreign_keys="Booking.mentor_id", back_populates="mentor")
    # Bookings where this profile is the mentee
    mentee_bookings = relationship("Booking", foreign_keys="Booking.mentee_id", back_populates="mentee")

    # Matches where this profile is the mentor
    mentor_matches = relationship("Match", foreign_keys="Match.mentor_id", back_populates="mentor")
    # Matches where this profile is the mentee
    mentee_matches = relationship("Match", foreign_keys="Match.mentee_id", back_populates="mentee")

    # Subscriptions as mentor
    mentor_subscriptions = relationship("Subscription", foreign_keys="Subscription.mentor_id", back_populates="mentor")
    # Subscriptions as mentee
    mentee_subscriptions = relationship("Subscription", foreign_keys="Subscription.mentee_id", back_populates="mentee")

    __table_args__ = (
        Index('idx_profile_mentor_verified', 'is_mentor', 'is_verified'),
    )

    def __repr__(self):
        return f"<Profile(id={self.id}, user_id={self.user_id}, display_name='{self.display_name}', is_mentor={self.is_mentor})>"


class Category(Base):
    """Mentoring categories with hierarchical support"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, index=True)
    display_order = Column(Integer, default=0)

    # Self-referential relationship
    parent = relationship("Category", remote_side=[id], backref="subcategories")

    # Relationships
    mentor_categories = relationship("MentorCategory", back_populates="category")
    expertise_tags = relationship("ExpertiseTag", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', slug='{self.slug}')>"


class MentorCategory(Base):
    """Many-to-many relationship between mentors and categories with expertise level"""
    __tablename__ = "mentor_categories"

    mentor_id = Column(Integer, ForeignKey("profiles.id"), primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), primary_key=True, index=True)
    expertise_level = Column(Enum(ExpertiseLevelEnum), nullable=False)
    years_experience = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)

    # Relationships
    mentor = relationship("Profile", back_populates="mentor_categories", foreign_keys=[mentor_id])
    category = relationship("Category", back_populates="mentor_categories")

    def __repr__(self):
        return f"<MentorCategory(mentor_id={self.mentor_id}, category_id={self.category_id}, expertise_level={self.expertise_level})>"


class ExpertiseTag(Base):
    """Tags/skills within categories"""
    __tablename__ = "expertise_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)

    # Relationships
    category = relationship("Category", back_populates="expertise_tags")
    mentor_tags = relationship("MentorTag", back_populates="tag")

    __table_args__ = (
        UniqueConstraint('slug', 'category_id', name='uix_tag_slug_category'),
    )

    def __repr__(self):
        return f"<ExpertiseTag(id={self.id}, name='{self.name}', category_id={self.category_id})>"


class MentorTag(Base):
    """Many-to-many relationship between mentors and expertise tags"""
    __tablename__ = "mentor_tags"

    mentor_id = Column(Integer, ForeignKey("profiles.id"), primary_key=True, index=True)
    tag_id = Column(Integer, ForeignKey("expertise_tags.id"), primary_key=True, index=True)

    # Relationships
    mentor = relationship("Profile", back_populates="mentor_tags", foreign_keys=[mentor_id])
    tag = relationship("ExpertiseTag", back_populates="mentor_tags")

    def __repr__(self):
        return f"<MentorTag(mentor_id={self.mentor_id}, tag_id={self.tag_id})>"


class MentorLike(Base):
    """Mentee likes a mentor (one-way interest)"""
    __tablename__ = "mentor_likes"

    mentee_id = Column(Integer, ForeignKey("profiles.id"), primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("profiles.id"), primary_key=True, index=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_mentor_likes_created', 'created_at'),
    )

    def __repr__(self):
        return f"<MentorLike(mentee_id={self.mentee_id}, mentor_id={self.mentor_id})>"


class MentorSave(Base):
    """Mentee saves/bookmarks a mentor for later"""
    __tablename__ = "mentor_saves"

    mentee_id = Column(Integer, ForeignKey("profiles.id"), primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("profiles.id"), primary_key=True, index=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_mentor_saves_created', 'created_at'),
    )

    def __repr__(self):
        return f"<MentorSave(mentee_id={self.mentee_id}, mentor_id={self.mentor_id})>"


class Match(Base):
    """Mutual match between mentor and mentee"""
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    mentee_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    matched_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    status = Column(Enum(MatchStatusEnum), default=MatchStatusEnum.pending, nullable=False, index=True)

    # Relationships
    mentor = relationship("Profile", foreign_keys=[mentor_id], back_populates="mentor_matches")
    mentee = relationship("Profile", foreign_keys=[mentee_id], back_populates="mentee_matches")

    __table_args__ = (
        UniqueConstraint('mentor_id', 'mentee_id', name='uix_match_mentor_mentee'),
        Index('idx_match_status_date', 'status', 'matched_at'),
    )

    def __repr__(self):
        return f"<Match(id={self.id}, mentor_id={self.mentor_id}, mentee_id={self.mentee_id}, status={self.status})>"


class AvailabilitySlot(Base):
    """Recurring weekly availability for mentors"""
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, default=True, index=True)

    # Relationships
    mentor = relationship("Profile", back_populates="availability_slots")

    __table_args__ = (
        Index('idx_availability_mentor_day', 'mentor_id', 'day_of_week', 'is_active'),
    )

    def __repr__(self):
        return f"<AvailabilitySlot(id={self.id}, mentor_id={self.mentor_id}, day={self.day_of_week}, {self.start_time}-{self.end_time})>"


class AvailabilityOverride(Base):
    """Specific date overrides for mentor availability"""
    __tablename__ = "availability_overrides"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    is_available = Column(Boolean, default=False, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)

    # Relationships
    mentor = relationship("Profile", back_populates="availability_overrides")

    __table_args__ = (
        UniqueConstraint('mentor_id', 'date', name='uix_override_mentor_date'),
        Index('idx_override_date_available', 'date', 'is_available'),
    )

    def __repr__(self):
        return f"<AvailabilityOverride(id={self.id}, mentor_id={self.mentor_id}, date={self.date}, available={self.is_available})>"


class Booking(Base):
    """Session bookings between mentors and mentees"""
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    mentee_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.pending, nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    session_type = Column(Enum(SessionTypeEnum), default=SessionTypeEnum.video, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    cancelled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(Text, nullable=True)

    # Relationships
    mentor = relationship("Profile", foreign_keys=[mentor_id], back_populates="mentor_bookings")
    mentee = relationship("Profile", foreign_keys=[mentee_id], back_populates="mentee_bookings")
    session = relationship("Session", back_populates="booking", uselist=False)
    transaction = relationship("Transaction", back_populates="booking", uselist=False)
    reviews = relationship("MentorReview", back_populates="booking")

    __table_args__ = (
        Index('idx_booking_mentor_scheduled', 'mentor_id', 'scheduled_at'),
        Index('idx_booking_mentee_scheduled', 'mentee_id', 'scheduled_at'),
        Index('idx_booking_status_scheduled', 'status', 'scheduled_at'),
    )

    def __repr__(self):
        return f"<Booking(id={self.id}, mentor_id={self.mentor_id}, mentee_id={self.mentee_id}, scheduled_at={self.scheduled_at}, status={self.status})>"


class Session(Base):
    """Actual session records with video/call details"""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    video_room_id = Column(String(200), nullable=True)
    recording_url = Column(String(500), nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="session")

    def __repr__(self):
        return f"<Session(id={self.id}, booking_id={self.booking_id}, started_at={self.started_at})>"


class PaymentAccount(Base):
    """Stripe Connect accounts for mentor payouts"""
    __tablename__ = "payment_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    stripe_account_id = Column(String(100), unique=True, nullable=False, index=True)
    onboarding_complete = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<PaymentAccount(id={self.id}, user_id={self.user_id}, stripe_account_id='{self.stripe_account_id}')>"


class Transaction(Base):
    """Payment records for bookings"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    platform_fee = Column(Numeric(10, 2), nullable=False)
    mentor_payout = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.pending, nullable=False, index=True)
    stripe_payment_id = Column(String(100), unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False, index=True)

    # Relationships
    booking = relationship("Booking", back_populates="transaction")

    __table_args__ = (
        Index('idx_transaction_status_created', 'status', 'created_at'),
    )

    def __repr__(self):
        return f"<Transaction(id={self.id}, booking_id={self.booking_id}, amount={self.amount}, status={self.status})>"


class Subscription(Base):
    """Recurring mentor subscriptions for mentees"""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    mentee_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    mentor_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    tier = Column(Enum(SubscriptionTierEnum), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(SubscriptionStatusEnum), default=SubscriptionStatusEnum.active, nullable=False, index=True)
    stripe_subscription_id = Column(String(100), unique=True, nullable=True, index=True)
    started_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    cancelled_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True, index=True)

    # Relationships
    mentee = relationship("Profile", foreign_keys=[mentee_id], back_populates="mentee_subscriptions")
    mentor = relationship("Profile", foreign_keys=[mentor_id], back_populates="mentor_subscriptions")

    __table_args__ = (
        Index('idx_subscription_mentor_status', 'mentor_id', 'status'),
        Index('idx_subscription_mentee_status', 'mentee_id', 'status'),
        Index('idx_subscription_expires', 'expires_at'),
    )

    def __repr__(self):
        return f"<Subscription(id={self.id}, mentee_id={self.mentee_id}, mentor_id={self.mentor_id}, tier={self.tier}, status={self.status})>"


class Tip(Base):
    """One-time tips from mentees to mentors"""
    __tablename__ = "tips"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index('idx_tip_to_user_created', 'to_user_id', 'created_at'),
    )

    def __repr__(self):
        return f"<Tip(id={self.id}, from_user_id={self.from_user_id}, to_user_id={self.to_user_id}, amount={self.amount})>"


class MentorReview(Base):
    """Session reviews - renamed to avoid conflict with existing Review model"""
    __tablename__ = "mentor_reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    reviewee_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    content = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False, index=True)

    # Relationships
    booking = relationship("Booking", back_populates="reviews")

    __table_args__ = (
        Index('idx_review_reviewee_public', 'reviewee_id', 'is_public', 'created_at'),
        Index('idx_review_rating', 'rating'),
    )

    def __repr__(self):
        return f"<MentorReview(id={self.id}, booking_id={self.booking_id}, rating={self.rating}, is_public={self.is_public})>"


class Report(Base):
    """Safety reports for inappropriate behavior"""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reported_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(String(200), nullable=False)
    details = Column(Text, nullable=True)
    status = Column(Enum(ReportStatusEnum), default=ReportStatusEnum.pending, nullable=False, index=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('idx_report_status_created', 'status', 'created_at'),
        Index('idx_report_reported_status', 'reported_id', 'status'),
    )

    def __repr__(self):
        return f"<Report(id={self.id}, reporter_id={self.reporter_id}, reported_id={self.reported_id}, status={self.status})>"
