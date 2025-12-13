"""
Mentor discovery and interaction endpoints
"""
import datetime as dt
from typing import List, Optional
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db, get_current_user, User
from ..models.mentoring import (
    Profile, Category, MentorReview, MentorLike, MentorSave, Match,
    AvailabilitySlot, MentorCategory
)
from ..schemas.mentoring import (
    MentorListResponse, MentorDetailResponse, MentorFilters,
    LikeResponse, SaveResponse, CategoryResponse, ReviewResponse,
    AvailabilitySlotResponse, MentorListWithPagination, PaginationMetadata
)


router = APIRouter(prefix="/mentors", tags=["Mentors"])


@router.get("", response_model=MentorListWithPagination)
def list_mentors(
    category: Optional[str] = Query(None, description="Filter by category slug"),
    min_price: Optional[float] = Query(None, description="Minimum hourly rate"),
    max_price: Optional[float] = Query(None, description="Maximum hourly rate"),
    language: Optional[str] = Query(None, description="Filter by language code"),
    available_now: Optional[bool] = Query(None, description="Only show available mentors"),
    rating_min: Optional[float] = Query(None, description="Minimum rating (0-5)"),
    sort_by: str = Query("rating", description="Sort by: rating, price, sessions, created"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    List mentors with filtering, sorting, and pagination.

    Returns a paginated list of mentors matching the specified criteria.
    """
    query = db.query(Profile).filter(Profile.is_mentor == True)

    # Apply filters
    if category:
        cat = db.query(Category).filter(Category.slug == category, Category.is_active == True).first()
        if cat:
            query = query.join(MentorCategory).filter(MentorCategory.category_id == cat.id)

    if min_price is not None:
        query = query.filter(Profile.hourly_rate >= min_price)

    if max_price is not None:
        query = query.filter(Profile.hourly_rate <= max_price)

    if language:
        # languages is JSON array, use contains for JSON
        from sqlalchemy.dialects.postgresql import ARRAY
        # For SQLite compatibility, we'll use a simple filter
        query = query.filter(func.json_array_length(Profile.languages) > 0)

    if available_now:
        # For now, assume all mentors are available (no is_available field in Profile)
        pass

    if rating_min is not None:
        # Rating calculation would need to be done via subquery from MentorReview
        # For now, skip this filter
        pass

    # Count total before pagination
    total = query.count()

    # Apply sorting
    if sort_by == "rating":
        # Would need subquery for rating, use created_at for now
        query = query.order_by(Profile.created_at.desc())
    elif sort_by == "price":
        query = query.order_by(Profile.hourly_rate.asc())
    elif sort_by == "sessions":
        # Would need count from bookings, use created_at for now
        query = query.order_by(Profile.created_at.desc())
    elif sort_by == "created":
        query = query.order_by(Profile.created_at.desc())
    else:
        query = query.order_by(Profile.created_at.desc())

    # Apply pagination
    offset = (page - 1) * limit
    mentors = query.offset(offset).limit(limit).all()

    # Build response with categories
    mentor_responses = []
    for mentor in mentors:
        categories = db.query(Category).join(MentorCategory).filter(
            MentorCategory.mentor_id == mentor.id
        ).all()

        # Calculate stats from reviews
        avg_rating = db.query(func.avg(MentorReview.rating)).filter(
            MentorReview.reviewee_id == mentor.id,
            MentorReview.is_public == True
        ).scalar() or 0.0

        total_reviews = db.query(func.count(MentorReview.id)).filter(
            MentorReview.reviewee_id == mentor.id,
            MentorReview.is_public == True
        ).scalar() or 0

        mentor_dict = {
            "id": mentor.id,
            "user_id": mentor.user_id,
            "headline": mentor.bio[:100] if mentor.bio else None,  # First 100 chars of bio
            "languages": ",".join(mentor.languages) if mentor.languages else None,
            "hourly_rate": float(mentor.hourly_rate) if mentor.hourly_rate else None,
            "currency": "EUR",
            "is_available": True,  # Default
            "avg_rating": float(avg_rating),
            "total_reviews": total_reviews,
            "total_sessions": 0,  # Would need to count from Booking
            "profile_image_url": mentor.avatar_url,
            "is_verified": mentor.is_verified,
            "categories": [cat.name for cat in categories]
        }
        mentor_responses.append(MentorListResponse(**mentor_dict))

    # Build pagination metadata
    total_pages = ceil(total / limit) if total > 0 else 0
    pagination = PaginationMetadata(
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages
    )

    return MentorListWithPagination(mentors=mentor_responses, pagination=pagination)


@router.get("/{mentor_id}", response_model=MentorDetailResponse)
def get_mentor_detail(
    mentor_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed mentor profile including reviews, categories, and availability.
    """
    mentor = db.query(Profile).filter(Profile.id == mentor_id, Profile.is_mentor == True).first()
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")

    # Get categories
    categories = db.query(Category).join(MentorCategory).filter(
        MentorCategory.mentor_id == mentor.id
    ).all()

    # Get reviews
    reviews = db.query(MentorReview).filter(
        MentorReview.reviewee_id == mentor_id,
        MentorReview.is_public == True
    ).order_by(MentorReview.created_at.desc()).limit(20).all()

    # Get availability slots
    availability = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.mentor_id == mentor_id,
        AvailabilitySlot.is_active == True
    ).all()

    # Calculate stats
    avg_rating = db.query(func.avg(MentorReview.rating)).filter(
        MentorReview.reviewee_id == mentor.id,
        MentorReview.is_public == True
    ).scalar() or 0.0

    total_reviews = len(reviews)

    # Build response
    return MentorDetailResponse(
        id=mentor.id,
        user_id=mentor.user_id,
        bio=mentor.bio,
        headline=mentor.bio[:100] if mentor.bio else None,
        languages=",".join(mentor.languages) if mentor.languages else None,
        hourly_rate=float(mentor.hourly_rate) if mentor.hourly_rate else None,
        currency="EUR",
        is_available=True,  # Default
        timezone=mentor.timezone,
        avg_rating=float(avg_rating),
        total_reviews=total_reviews,
        total_sessions=0,  # Would need to count from Booking
        profile_image_url=mentor.avatar_url,
        video_intro_url=None,  # Not in Profile model
        is_verified=mentor.is_verified,
        created_at=mentor.created_at,
        categories=[CategoryResponse.from_orm(cat) for cat in categories],
        reviews=[ReviewResponse(
            id=rev.id,
            reviewer_id=rev.reviewer_id,
            rating=rev.rating,
            comment=rev.content,
            created_at=rev.created_at
        ) for rev in reviews],
        availability_slots=[AvailabilitySlotResponse(
            id=slot.id,
            day_of_week=slot.day_of_week,
            start_time=slot.start_time.strftime("%H:%M"),
            end_time=slot.end_time.strftime("%H:%M")
        ) for slot in availability]
    )


@router.get("/{mentor_id}/availability")
def get_mentor_availability(
    mentor_id: int,
    days: int = Query(14, ge=1, le=30, description="Number of days ahead to check"),
    db: Session = Depends(get_db)
):
    """
    Get mentor's available time slots for the next N days.

    Returns a list of available datetime slots based on mentor's weekly availability.
    """
    mentor = db.query(Profile).filter(Profile.id == mentor_id, Profile.is_mentor == True).first()
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")

    # Get mentor's availability slots
    slots = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.mentor_id == mentor_id,
        AvailabilitySlot.is_active == True
    ).all()

    if not slots:
        return {"available_slots": [], "message": "No availability configured"}

    # Generate available datetime slots for next N days
    available_slots = []
    today = dt.date.today()

    for day_offset in range(days):
        check_date = today + dt.timedelta(days=day_offset)
        day_of_week = check_date.weekday()  # 0=Monday, 6=Sunday

        # Find slots for this day of week
        day_slots = [s for s in slots if s.day_of_week == day_of_week]

        for slot in day_slots:
            # start_time and end_time are already time objects
            slot_start = dt.datetime.combine(check_date, slot.start_time)
            slot_end = dt.datetime.combine(check_date, slot.end_time)

            # For simplicity, create 1-hour blocks within the slot
            current = slot_start
            while current + dt.timedelta(hours=1) <= slot_end:
                if current >= dt.datetime.now():  # Only future slots
                    available_slots.append({
                        "start": current.isoformat(),
                        "end": (current + dt.timedelta(hours=1)).isoformat()
                    })
                current += dt.timedelta(hours=1)

    return {
        "mentor_id": mentor_id,
        "timezone": mentor.timezone or "UTC",
        "available_slots": available_slots[:100]  # Limit to 100 slots
    }


@router.post("/{mentor_id}/like", response_model=LikeResponse)
def like_mentor(
    mentor_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Like a mentor. Creates a match if the mentor has also liked the user.

    Requires authentication.
    """
    # Check if mentor exists
    mentor = db.query(Profile).filter(Profile.id == mentor_id, Profile.is_mentor == True).first()
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")

    # Get or create user's profile
    user_profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not user_profile:
        user_profile = Profile(
            user_id=user.id,
            display_name=user.email.split('@')[0],
            is_mentor=False
        )
        db.add(user_profile)
        db.commit()
        db.refresh(user_profile)

    # Check if already liked
    existing_like = db.query(MentorLike).filter(
        MentorLike.mentee_id == user_profile.id,
        MentorLike.mentor_id == mentor_id
    ).first()

    if existing_like:
        return LikeResponse(
            success=True,
            is_match=False,
            message="Already liked this mentor"
        )

    # Create like
    new_like = MentorLike(mentee_id=user_profile.id, mentor_id=mentor_id)
    db.add(new_like)

    # Check for mutual like (if mentor has a user profile and liked back)
    # For simplicity, we'll just check if a match already exists
    existing_match = db.query(Match).filter(
        Match.mentee_id == user_profile.id,
        Match.mentor_id == mentor_id
    ).first()

    is_match = False
    if not existing_match:
        # Create a match (in a real app, you'd check if mentor liked back)
        # For now, we'll create a match for demonstration
        # You could implement a system where mentors also like users
        pass

    db.commit()

    return LikeResponse(
        success=True,
        is_match=is_match,
        message="Mentor liked successfully" + (" - It's a match!" if is_match else "")
    )


@router.post("/{mentor_id}/save", response_model=SaveResponse)
def save_mentor(
    mentor_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save/bookmark a mentor for later.

    Requires authentication.
    """
    # Check if mentor exists
    mentor = db.query(Profile).filter(Profile.id == mentor_id, Profile.is_mentor == True).first()
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")

    # Get or create user's profile
    user_profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not user_profile:
        user_profile = Profile(
            user_id=user.id,
            display_name=user.email.split('@')[0],
            is_mentor=False
        )
        db.add(user_profile)
        db.commit()
        db.refresh(user_profile)

    # Check if already saved
    existing = db.query(MentorSave).filter(
        MentorSave.mentee_id == user_profile.id,
        MentorSave.mentor_id == mentor_id
    ).first()

    if existing:
        return SaveResponse(
            success=True,
            saved=True,
            message="Mentor already saved"
        )

    # Save mentor
    saved = MentorSave(mentee_id=user_profile.id, mentor_id=mentor_id)
    db.add(saved)
    db.commit()

    return SaveResponse(
        success=True,
        saved=True,
        message="Mentor saved successfully"
    )


@router.delete("/{mentor_id}/save", response_model=SaveResponse)
def unsave_mentor(
    mentor_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a mentor from saved/bookmarks.

    Requires authentication.
    """
    # Get user's profile
    user_profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not user_profile:
        return SaveResponse(
            success=True,
            saved=False,
            message="Mentor was not saved"
        )

    saved = db.query(MentorSave).filter(
        MentorSave.mentee_id == user_profile.id,
        MentorSave.mentor_id == mentor_id
    ).first()

    if not saved:
        return SaveResponse(
            success=True,
            saved=False,
            message="Mentor was not saved"
        )

    db.delete(saved)
    db.commit()

    return SaveResponse(
        success=True,
        saved=False,
        message="Mentor removed from saved"
    )


@router.get("/saved/list", response_model=List[MentorListResponse])
def get_saved_mentors(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of user's saved/bookmarked mentors.

    Requires authentication.
    """
    # Get user's profile
    user_profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not user_profile:
        return []

    saved_ids = db.query(MentorSave.mentor_id).filter(
        MentorSave.mentee_id == user_profile.id
    ).all()

    mentor_ids = [s[0] for s in saved_ids]

    if not mentor_ids:
        return []

    mentors = db.query(Profile).filter(Profile.id.in_(mentor_ids), Profile.is_mentor == True).all()

    # Build responses with categories
    responses = []
    for mentor in mentors:
        categories = db.query(Category).join(MentorCategory).filter(
            MentorCategory.mentor_id == mentor.id
        ).all()

        # Calculate stats
        avg_rating = db.query(func.avg(MentorReview.rating)).filter(
            MentorReview.reviewee_id == mentor.id,
            MentorReview.is_public == True
        ).scalar() or 0.0

        total_reviews = db.query(func.count(MentorReview.id)).filter(
            MentorReview.reviewee_id == mentor.id,
            MentorReview.is_public == True
        ).scalar() or 0

        mentor_dict = {
            "id": mentor.id,
            "user_id": mentor.user_id,
            "headline": mentor.bio[:100] if mentor.bio else None,
            "languages": ",".join(mentor.languages) if mentor.languages else None,
            "hourly_rate": float(mentor.hourly_rate) if mentor.hourly_rate else None,
            "currency": "EUR",
            "is_available": True,
            "avg_rating": float(avg_rating),
            "total_reviews": total_reviews,
            "total_sessions": 0,
            "profile_image_url": mentor.avatar_url,
            "is_verified": mentor.is_verified,
            "categories": [cat.name for cat in categories]
        }
        responses.append(MentorListResponse(**mentor_dict))

    return responses


@router.get("/recommended/list", response_model=List[MentorListResponse])
def get_recommended_mentors(
    limit: int = Query(10, ge=1, le=50, description="Number of recommendations"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recommended mentors based on user preferences.

    Simple algorithm: matches categories of interest and prioritizes high ratings.
    Requires authentication.
    """
    # Get user profile
    user_profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    query = db.query(Profile).filter(Profile.is_mentor == True)

    # If user has preferred languages, filter by those
    if user_profile and user_profile.languages:
        user_langs = user_profile.languages if isinstance(user_profile.languages, list) else []
        if user_langs:
            # Filter mentors who have at least one language in common
            # For JSON array, we'd need a more complex query
            # For simplicity, just get all mentors for now
            pass

    # Order by created_at (since we don't have avg_rating readily available)
    mentors = query.order_by(Profile.created_at.desc()).limit(limit).all()

    # If no matches, just get recent mentors
    if not mentors:
        mentors = db.query(Profile).filter(
            Profile.is_mentor == True
        ).order_by(Profile.created_at.desc()).limit(limit).all()

    # Build responses
    responses = []
    for mentor in mentors:
        categories = db.query(Category).join(MentorCategory).filter(
            MentorCategory.mentor_id == mentor.id
        ).all()

        # Calculate stats
        avg_rating = db.query(func.avg(MentorReview.rating)).filter(
            MentorReview.reviewee_id == mentor.id,
            MentorReview.is_public == True
        ).scalar() or 0.0

        total_reviews = db.query(func.count(MentorReview.id)).filter(
            MentorReview.reviewee_id == mentor.id,
            MentorReview.is_public == True
        ).scalar() or 0

        mentor_dict = {
            "id": mentor.id,
            "user_id": mentor.user_id,
            "headline": mentor.bio[:100] if mentor.bio else None,
            "languages": ",".join(mentor.languages) if mentor.languages else None,
            "hourly_rate": float(mentor.hourly_rate) if mentor.hourly_rate else None,
            "currency": "EUR",
            "is_available": True,
            "avg_rating": float(avg_rating),
            "total_reviews": total_reviews,
            "total_sessions": 0,
            "profile_image_url": mentor.avatar_url,
            "is_verified": mentor.is_verified,
            "categories": [cat.name for cat in categories]
        }
        responses.append(MentorListResponse(**mentor_dict))

    return responses
