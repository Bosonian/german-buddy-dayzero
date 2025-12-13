"""Session management endpoints for MentorMatch"""

from datetime import datetime, timedelta
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from ..database import get_db, User, get_current_user
from ..models import Booking, Session as SessionModel
from ..schemas.booking import (
    SessionResponse,
    SessionStartResponse,
    SessionTokenResponse,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


def generate_video_room_id() -> str:
    """Generate a unique video room ID"""
    return f"room_{uuid.uuid4().hex[:16]}"


def generate_video_room_token(room_id: str, user_id: int) -> str:
    """
    Generate a video room token for a user

    In production, this would generate a JWT or use a video service API
    For now, returns a placeholder token
    """
    # TODO: Integrate with actual video service (Twilio, Agora, Daily.co, etc.)
    return f"token_{room_id}_{user_id}_{uuid.uuid4().hex[:8]}"


def get_video_room_url(room_id: str) -> str:
    """Get the video room URL"""
    # TODO: Replace with actual video service URL
    base_url = "https://video.mentormatch.com"
    return f"{base_url}/room/{room_id}"


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Get session details"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get booking to check authorization
    booking = db.query(Booking).filter(Booking.id == session.booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization
    if booking.mentor_id != current_user.id and booking.mentee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")

    return SessionResponse(
        id=session.id,
        booking_id=session.booking_id,
        status=session.status,
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration_minutes=session.duration_minutes,
        video_room_id=session.video_room_id,
        video_room_url=session.video_room_url,
        recording_url=session.recording_url,
        notes=session.notes,
        created_at=session.created_at,
    )


@router.post("/{booking_id}/start", response_model=SessionStartResponse)
async def start_session(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Start a session (creates video room)

    Only the mentor can start a session.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization (only mentor can start)
    if booking.mentor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the mentor can start the session"
        )

    # Check booking is confirmed
    if booking.status != "confirmed":
        raise HTTPException(
            status_code=400, detail="Booking must be confirmed before starting session"
        )

    # Check if session already exists
    existing_session = (
        db.query(SessionModel)
        .filter(SessionModel.booking_id == booking_id)
        .first()
    )

    if existing_session:
        # If session already exists and is in progress, return existing session
        if existing_session.status == "in_progress":
            video_room_token = generate_video_room_token(
                existing_session.video_room_id, current_user.id
            )

            return SessionStartResponse(
                session_id=existing_session.id,
                video_room_id=existing_session.video_room_id,
                video_room_token=video_room_token,
                video_room_url=existing_session.video_room_url,
            )
        else:
            raise HTTPException(status_code=400, detail="Session already completed")

    # Create video room
    video_room_id = generate_video_room_id()
    video_room_url = get_video_room_url(video_room_id)

    # Create session
    session = SessionModel(
        booking_id=booking_id,
        status="in_progress",
        started_at=datetime.utcnow(),
        video_room_id=video_room_id,
        video_room_url=video_room_url,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate token for mentor
    video_room_token = generate_video_room_token(video_room_id, current_user.id)

    return SessionStartResponse(
        session_id=session.id,
        video_room_id=video_room_id,
        video_room_token=video_room_token,
        video_room_url=video_room_url,
    )


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: int,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    End a session

    Either mentor or mentee can end the session.
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get booking to check authorization
    booking = db.query(Booking).filter(Booking.id == session.booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization
    if booking.mentor_id != current_user.id and booking.mentee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to end this session")

    # Check if already ended
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Session already ended")

    if session.status == "cancelled":
        raise HTTPException(status_code=400, detail="Session was cancelled")

    # End session
    session.status = "completed"
    session.ended_at = datetime.utcnow()

    if session.started_at:
        duration = (session.ended_at - session.started_at).total_seconds() / 60
        session.duration_minutes = int(duration)

    if notes:
        session.notes = notes

    # Update booking status
    booking.status = "completed"

    db.commit()
    db.refresh(session)

    return SessionResponse(
        id=session.id,
        booking_id=session.booking_id,
        status=session.status,
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration_minutes=session.duration_minutes,
        video_room_id=session.video_room_id,
        video_room_url=session.video_room_url,
        recording_url=session.recording_url,
        notes=session.notes,
        created_at=session.created_at,
    )


@router.get("/{session_id}/token", response_model=SessionTokenResponse)
async def get_session_token(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Get video room token for joining a session

    Both mentor and mentee can get tokens to join.
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get booking to check authorization
    booking = db.query(Booking).filter(Booking.id == session.booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization
    if booking.mentor_id != current_user.id and booking.mentee_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to join this session"
        )

    # Check if session is in progress
    if session.status != "in_progress":
        raise HTTPException(
            status_code=400, detail="Session is not in progress"
        )

    # Generate token
    video_room_token = generate_video_room_token(session.video_room_id, current_user.id)

    return SessionTokenResponse(
        video_room_token=video_room_token,
        video_room_url=session.video_room_url,
        expires_at=datetime.utcnow() + timedelta(hours=2),
    )
