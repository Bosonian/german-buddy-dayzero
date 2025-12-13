"""
User profile management endpoints
"""
from typing import List, Optional
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db, get_current_user, User
from ..models.mentoring import (
    Profile, MentorCategory, AvailabilitySlot, Category,
    ExpertiseLevelEnum
)
from ..schemas.mentoring import (
    ProfileResponse, ProfileUpdate, BecomeMentorRequest,
    MentorProfileUpdate, AvailabilityUpdate, AvailabilitySlot as AvailabilitySlotSchema
)


router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's profile.

    Creates a basic profile if one doesn't exist.
    Requires authentication.
    """
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    if not profile:
        # Create a basic profile
        profile = Profile(
            user_id=user.id,
            display_name=user.email.split('@')[0],  # Use email prefix as default
            is_mentor=False
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Map to response schema
    # Note: ProfileResponse expects different fields, so we'll adapt
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "is_mentor": profile.is_mentor,
        "first_name": profile.display_name,  # Map display_name to first_name
        "last_name": None,
        "bio": profile.bio,
        "interests": None,
        "learning_goals": None,
        "preferred_languages": ",".join(profile.languages) if profile.languages else None,
        "profile_image_url": profile.avatar_url,
        "timezone": profile.timezone,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    profile_data: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.

    Requires authentication.
    """
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create one first."
        )

    # Update fields
    if profile_data.first_name is not None:
        profile.display_name = profile_data.first_name

    if profile_data.bio is not None:
        profile.bio = profile_data.bio

    if profile_data.profile_image_url is not None:
        profile.avatar_url = profile_data.profile_image_url

    if profile_data.timezone is not None:
        profile.timezone = profile_data.timezone

    if profile_data.preferred_languages is not None:
        # Convert comma-separated string to JSON array
        langs = [lang.strip() for lang in profile_data.preferred_languages.split(',')]
        profile.languages = langs

    profile.updated_at = dt.datetime.utcnow()
    db.commit()
    db.refresh(profile)

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "is_mentor": profile.is_mentor,
        "first_name": profile.display_name,
        "last_name": None,
        "bio": profile.bio,
        "interests": None,
        "learning_goals": None,
        "preferred_languages": ",".join(profile.languages) if profile.languages else None,
        "profile_image_url": profile.avatar_url,
        "timezone": profile.timezone,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }


@router.post("/me/become-mentor", response_model=ProfileResponse)
def become_mentor(
    mentor_data: BecomeMentorRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Convert user account to mentor.

    Sets is_mentor=True and adds initial mentor profile data.
    Requires authentication.
    """
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    if not profile:
        # Create profile with mentor status
        profile = Profile(
            user_id=user.id,
            display_name=user.email.split('@')[0],
            is_mentor=True
        )
        db.add(profile)
    else:
        # Update existing profile
        profile.is_mentor = True

    # Update mentor-specific fields
    if mentor_data.bio:
        profile.bio = mentor_data.bio

    if mentor_data.hourly_rate is not None:
        profile.hourly_rate = mentor_data.hourly_rate

    if mentor_data.timezone:
        profile.timezone = mentor_data.timezone

    if mentor_data.languages:
        # Convert comma-separated string to JSON array
        langs = [lang.strip() for lang in mentor_data.languages.split(',')]
        profile.languages = langs

    profile.updated_at = dt.datetime.utcnow()
    db.commit()
    db.refresh(profile)

    # Add categories if provided
    if mentor_data.category_ids:
        for cat_id in mentor_data.category_ids:
            # Check if category exists
            category = db.query(Category).filter(Category.id == cat_id).first()
            if category:
                # Check if already exists
                existing = db.query(MentorCategory).filter(
                    MentorCategory.mentor_id == profile.id,
                    MentorCategory.category_id == cat_id
                ).first()

                if not existing:
                    mentor_cat = MentorCategory(
                        mentor_id=profile.id,
                        category_id=cat_id,
                        expertise_level=ExpertiseLevelEnum.intermediate  # Default
                    )
                    db.add(mentor_cat)

        db.commit()

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "is_mentor": profile.is_mentor,
        "first_name": profile.display_name,
        "last_name": None,
        "bio": profile.bio,
        "interests": None,
        "learning_goals": None,
        "preferred_languages": ",".join(profile.languages) if profile.languages else None,
        "profile_image_url": profile.avatar_url,
        "timezone": profile.timezone,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }


@router.put("/me/availability")
def update_availability(
    availability_data: AvailabilityUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update mentor's weekly availability slots.

    Replaces all existing availability with the new slots.
    Requires authentication and mentor status.
    """
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    if not profile.is_mentor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentors can set availability"
        )

    # Delete existing availability
    db.query(AvailabilitySlot).filter(
        AvailabilitySlot.mentor_id == profile.id
    ).delete()

    # Add new availability slots
    for slot_data in availability_data.slots:
        # Parse time strings to time objects
        start_hour, start_min = map(int, slot_data.start_time.split(':'))
        end_hour, end_min = map(int, slot_data.end_time.split(':'))

        slot = AvailabilitySlot(
            mentor_id=profile.id,
            day_of_week=slot_data.day_of_week,
            start_time=dt.time(start_hour, start_min),
            end_time=dt.time(end_hour, end_min),
            is_active=True
        )
        db.add(slot)

    db.commit()

    # Return updated availability
    updated_slots = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.mentor_id == profile.id,
        AvailabilitySlot.is_active == True
    ).all()

    return {
        "success": True,
        "message": "Availability updated successfully",
        "slots": [
            {
                "id": slot.id,
                "day_of_week": slot.day_of_week,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M")
            }
            for slot in updated_slots
        ]
    }


@router.get("/me/availability")
def get_my_availability(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current mentor's availability slots.

    Requires authentication and mentor status.
    """
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    if not profile.is_mentor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentors have availability"
        )

    slots = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.mentor_id == profile.id,
        AvailabilitySlot.is_active == True
    ).all()

    return {
        "mentor_id": profile.id,
        "timezone": profile.timezone or "UTC",
        "slots": [
            {
                "id": slot.id,
                "day_of_week": slot.day_of_week,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M")
            }
            for slot in slots
        ]
    }
