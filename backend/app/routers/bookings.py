"""Booking management endpoints for MentorMatch"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from ..database import get_db, User, get_current_user
from ..models import Booking, MentorProfile, AvailabilitySlot, Session as SessionModel
from ..schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    BookingDetailResponse,
    BookingStatus,
)

router = APIRouter(prefix="/bookings", tags=["bookings"])


def check_slot_available(
    db: Session, mentor_id: int, scheduled_at: datetime, duration_minutes: int
) -> bool:
    """Check if a time slot is available for booking"""
    end_time = scheduled_at + timedelta(minutes=duration_minutes)

    # Check for overlapping bookings
    overlapping = (
        db.query(Booking)
        .filter(
            Booking.mentor_id == mentor_id,
            Booking.status.in_(["pending", "confirmed"]),
            or_(
                # New booking starts during existing booking
                and_(
                    Booking.scheduled_at <= scheduled_at,
                    Booking.scheduled_at
                    + timedelta(minutes=Booking.duration_minutes)
                    > scheduled_at,
                ),
                # New booking ends during existing booking
                and_(
                    Booking.scheduled_at < end_time,
                    Booking.scheduled_at
                    + timedelta(minutes=Booking.duration_minutes)
                    >= end_time,
                ),
                # New booking completely contains existing booking
                and_(
                    Booking.scheduled_at >= scheduled_at,
                    Booking.scheduled_at
                    + timedelta(minutes=Booking.duration_minutes)
                    <= end_time,
                ),
            ),
        )
        .first()
    )

    return overlapping is None


def get_booking_price(
    db: Session, mentor_id: int, session_type: str, duration_minutes: int
) -> int:
    """Calculate booking price based on mentor rates"""
    profile = db.query(MentorProfile).filter(MentorProfile.user_id == mentor_id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found")

    if session_type == "trial":
        return profile.trial_rate_cents

    # Calculate hourly rate
    hourly_rate = profile.hourly_rate_cents
    price = int((hourly_rate / 60) * duration_minutes)

    return price


def can_cancel_booking(booking: Booking) -> bool:
    """Check if a booking can be cancelled (24hr notice)"""
    time_until_booking = booking.scheduled_at - datetime.utcnow()
    return time_until_booking.total_seconds() > 24 * 3600


def can_reschedule_booking(booking: Booking) -> bool:
    """Check if a booking can be rescheduled"""
    return booking.status in ["pending", "confirmed"] and booking.scheduled_at > datetime.utcnow()


@router.post("", response_model=BookingResponse, status_code=201)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new booking

    Validates:
    - Time slot is available
    - Mentor is active
    - Scheduled time is in the future
    - No double booking
    """
    # Check if mentor exists and is active
    mentor_profile = (
        db.query(MentorProfile)
        .filter(MentorProfile.user_id == booking_data.mentor_id)
        .first()
    )

    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Mentor not found")

    if not mentor_profile.is_active:
        raise HTTPException(status_code=400, detail="Mentor is not accepting bookings")

    # Can't book yourself
    if booking_data.mentor_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot book yourself as a mentor")

    # Check if time is in the future
    if booking_data.scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

    # Check slot availability
    if not check_slot_available(
        db,
        booking_data.mentor_id,
        booking_data.scheduled_at,
        booking_data.duration_minutes,
    ):
        raise HTTPException(status_code=400, detail="Time slot is not available")

    # Calculate price
    price_cents = get_booking_price(
        db,
        booking_data.mentor_id,
        booking_data.session_type.value,
        booking_data.duration_minutes,
    )

    # Create booking
    booking = Booking(
        mentor_id=booking_data.mentor_id,
        mentee_id=current_user.id,
        scheduled_at=booking_data.scheduled_at,
        duration_minutes=booking_data.duration_minutes,
        session_type=booking_data.session_type.value,
        status="pending",
        price_cents=price_cents,
        currency=mentor_profile.currency,
        notes=booking_data.notes,
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Determine if payment is required
    payment_required = price_cents > 0

    return BookingResponse(
        id=booking.id,
        mentor_id=booking.mentor_id,
        mentee_id=booking.mentee_id,
        scheduled_at=booking.scheduled_at,
        duration_minutes=booking.duration_minutes,
        session_type=booking.session_type,
        status=booking.status,
        price_cents=booking.price_cents,
        payment_required=payment_required,
        notes=booking.notes,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


@router.get("", response_model=List[BookingResponse])
async def list_bookings(
    status: Optional[str] = Query(None, description="Filter by status"),
    upcoming_only: bool = Query(False, description="Show only upcoming bookings"),
    role: Optional[str] = Query(None, description="Filter by role: 'mentor' or 'mentee'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List user's bookings (as mentor and mentee)

    Query params:
    - status: Filter by booking status
    - upcoming_only: Show only future bookings
    - role: Filter by 'mentor' or 'mentee'
    """
    query = db.query(Booking)

    # Filter by role
    if role == "mentor":
        query = query.filter(Booking.mentor_id == current_user.id)
    elif role == "mentee":
        query = query.filter(Booking.mentee_id == current_user.id)
    else:
        # Show both
        query = query.filter(
            or_(
                Booking.mentor_id == current_user.id,
                Booking.mentee_id == current_user.id,
            )
        )

    # Filter by status
    if status:
        query = query.filter(Booking.status == status)

    # Filter upcoming only
    if upcoming_only:
        query = query.filter(Booking.scheduled_at > datetime.utcnow())

    bookings = query.order_by(Booking.scheduled_at.desc()).all()

    return [
        BookingResponse(
            id=b.id,
            mentor_id=b.mentor_id,
            mentee_id=b.mentee_id,
            scheduled_at=b.scheduled_at,
            duration_minutes=b.duration_minutes,
            session_type=b.session_type,
            status=b.status,
            price_cents=b.price_cents,
            payment_required=b.price_cents > 0,
            notes=b.notes,
            created_at=b.created_at,
            updated_at=b.updated_at,
        )
        for b in bookings
    ]


@router.get("/{booking_id}", response_model=BookingDetailResponse)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get detailed booking information"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization
    if booking.mentor_id != current_user.id and booking.mentee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")

    # Get mentor and mentee names
    mentor = db.query(User).filter(User.id == booking.mentor_id).first()
    mentee = db.query(User).filter(User.id == booking.mentee_id).first()

    # Get session if exists
    session = (
        db.query(SessionModel)
        .filter(SessionModel.booking_id == booking.id)
        .first()
    )

    return BookingDetailResponse(
        id=booking.id,
        mentor_id=booking.mentor_id,
        mentee_id=booking.mentee_id,
        scheduled_at=booking.scheduled_at,
        duration_minutes=booking.duration_minutes,
        session_type=booking.session_type,
        status=booking.status,
        price_cents=booking.price_cents,
        payment_required=booking.price_cents > 0,
        notes=booking.notes,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
        mentor_name=mentor.email if mentor else None,
        mentee_name=mentee.email if mentee else None,
        session_id=session.id if session else None,
        video_room_url=session.video_room_url if session else None,
        cancellation_reason=booking.cancellation_reason,
        cancelled_at=booking.cancelled_at,
        can_cancel=can_cancel_booking(booking),
        can_reschedule=can_reschedule_booking(booking),
    )


@router.put("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cancel a booking

    Cancellation policy:
    - 24+ hours notice: Full refund
    - Less than 24 hours: No refund
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization (mentor or mentee can cancel)
    if booking.mentor_id != current_user.id and booking.mentee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    # Check if already cancelled
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    # Check if already completed
    if booking.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel completed booking")

    # Update booking
    booking.status = "cancelled"
    booking.cancellation_reason = reason
    booking.cancelled_at = datetime.utcnow()
    booking.cancelled_by = current_user.id

    db.commit()
    db.refresh(booking)

    # TODO: Process refund if applicable and payment was made
    # This would integrate with the payment service

    return BookingResponse(
        id=booking.id,
        mentor_id=booking.mentor_id,
        mentee_id=booking.mentee_id,
        scheduled_at=booking.scheduled_at,
        duration_minutes=booking.duration_minutes,
        session_type=booking.session_type,
        status=booking.status,
        price_cents=booking.price_cents,
        payment_required=False,  # Already paid/refunded
        notes=booking.notes,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


@router.put("/{booking_id}/reschedule", response_model=BookingResponse)
async def reschedule_booking(
    booking_id: int,
    reschedule_data: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reschedule a booking to a new time"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization (only mentee can reschedule)
    if booking.mentee_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the mentee can reschedule the booking"
        )

    # Check if can be rescheduled
    if not can_reschedule_booking(booking):
        raise HTTPException(status_code=400, detail="Booking cannot be rescheduled")

    # Update scheduled time if provided
    if reschedule_data.scheduled_at:
        # Check new slot availability
        duration = reschedule_data.duration_minutes or booking.duration_minutes

        if not check_slot_available(
            db, booking.mentor_id, reschedule_data.scheduled_at, duration
        ):
            raise HTTPException(status_code=400, detail="New time slot is not available")

        booking.scheduled_at = reschedule_data.scheduled_at

    # Update duration if provided
    if reschedule_data.duration_minutes:
        # Recalculate price
        new_price = get_booking_price(
            db,
            booking.mentor_id,
            booking.session_type,
            reschedule_data.duration_minutes,
        )
        booking.duration_minutes = reschedule_data.duration_minutes
        booking.price_cents = new_price

    # Update notes if provided
    if reschedule_data.notes is not None:
        booking.notes = reschedule_data.notes

    # Reset status to pending for mentor confirmation
    booking.status = "pending"

    db.commit()
    db.refresh(booking)

    return BookingResponse(
        id=booking.id,
        mentor_id=booking.mentor_id,
        mentee_id=booking.mentee_id,
        scheduled_at=booking.scheduled_at,
        duration_minutes=booking.duration_minutes,
        session_type=booking.session_type,
        status=booking.status,
        price_cents=booking.price_cents,
        payment_required=booking.price_cents > 0,
        notes=booking.notes,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


@router.put("/{booking_id}/confirm", response_model=BookingResponse)
async def confirm_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mentor confirms a pending booking"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization (only mentor can confirm)
    if booking.mentor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the mentor can confirm the booking"
        )

    # Check if pending
    if booking.status != "pending":
        raise HTTPException(status_code=400, detail="Booking is not pending")

    # Confirm booking
    booking.status = "confirmed"

    db.commit()
    db.refresh(booking)

    return BookingResponse(
        id=booking.id,
        mentor_id=booking.mentor_id,
        mentee_id=booking.mentee_id,
        scheduled_at=booking.scheduled_at,
        duration_minutes=booking.duration_minutes,
        session_type=booking.session_type,
        status=booking.status,
        price_cents=booking.price_cents,
        payment_required=False,  # Already confirmed
        notes=booking.notes,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )
