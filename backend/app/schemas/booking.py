"""Booking and availability schemas for MentorMatch"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum


class SessionType(str, Enum):
    """Types of mentoring sessions"""
    ONE_ON_ONE = "one_on_one"
    GROUP = "group"
    TRIAL = "trial"


class BookingStatus(str, Enum):
    """Status of a booking"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class SessionStatus(str, Enum):
    """Status of a session"""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Availability Slot Schemas
class AvailabilitySlotCreate(BaseModel):
    """Create availability slot"""
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(..., description="End time in HH:MM format")
    is_recurring: bool = Field(default=True, description="Whether this slot repeats weekly")
    specific_date: Optional[datetime] = Field(None, description="For one-time slots")

    @validator('start_time', 'end_time')
    def validate_time_format(cls, v):
        """Validate time is in HH:MM format"""
        try:
            hours, minutes = map(int, v.split(':'))
            if not (0 <= hours <= 23 and 0 <= minutes <= 59):
                raise ValueError
        except:
            raise ValueError('Time must be in HH:MM format')
        return v


class AvailabilitySlotResponse(BaseModel):
    """Availability slot response"""
    id: int
    mentor_id: int
    day_of_week: int
    start_time: str
    end_time: str
    is_recurring: bool
    specific_date: Optional[datetime]
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Booking Schemas
class BookingCreate(BaseModel):
    """Create a new booking"""
    mentor_id: int = Field(..., description="ID of the mentor to book")
    scheduled_at: datetime = Field(..., description="Scheduled start time")
    duration_minutes: int = Field(default=60, ge=15, le=180, description="Session duration in minutes")
    session_type: SessionType = Field(default=SessionType.ONE_ON_ONE)
    notes: Optional[str] = Field(None, max_length=1000, description="Optional notes for the mentor")

    @validator('scheduled_at')
    def validate_future_date(cls, v):
        """Ensure booking is in the future"""
        if v <= datetime.utcnow():
            raise ValueError('Scheduled time must be in the future')
        return v


class BookingUpdate(BaseModel):
    """Update a booking (for rescheduling)"""
    scheduled_at: Optional[datetime] = Field(None, description="New scheduled time")
    duration_minutes: Optional[int] = Field(None, ge=15, le=180)
    notes: Optional[str] = Field(None, max_length=1000)

    @validator('scheduled_at')
    def validate_future_date(cls, v):
        """Ensure booking is in the future"""
        if v and v <= datetime.utcnow():
            raise ValueError('Scheduled time must be in the future')
        return v


class BookingResponse(BaseModel):
    """Basic booking response"""
    id: int
    mentor_id: int
    mentee_id: int
    scheduled_at: datetime
    duration_minutes: int
    session_type: SessionType
    status: BookingStatus
    price_cents: int
    payment_required: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookingDetailResponse(BookingResponse):
    """Detailed booking response with related data"""
    mentor_name: Optional[str] = None
    mentee_name: Optional[str] = None
    session_id: Optional[int] = None
    video_room_url: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    can_cancel: bool = False
    can_reschedule: bool = False


# Session Schemas
class SessionResponse(BaseModel):
    """Session response"""
    id: int
    booking_id: int
    status: SessionStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    duration_minutes: Optional[int]
    video_room_id: Optional[str]
    video_room_url: Optional[str]
    recording_url: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SessionStartResponse(BaseModel):
    """Response when starting a session"""
    session_id: int
    video_room_id: str
    video_room_token: str
    video_room_url: str


class SessionTokenResponse(BaseModel):
    """Response for video room token"""
    video_room_token: str
    video_room_url: str
    expires_at: datetime
