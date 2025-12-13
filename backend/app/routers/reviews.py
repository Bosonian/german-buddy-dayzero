"""Review management endpoints for MentorMatch"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel, Field

from ..database import get_db, User, get_current_user
from ..models import Review, Session as SessionModel, Booking, MentorProfile

router = APIRouter(prefix="/reviews", tags=["reviews"])


# Schemas
class ReviewCreate(BaseModel):
    """Create a review"""
    session_id: int = Field(..., description="ID of the completed session")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5 stars")
    comment: Optional[str] = Field(None, max_length=2000, description="Review comment")
    is_public: bool = Field(default=True, description="Whether review is publicly visible")


class ReviewResponse(BaseModel):
    """Review response"""
    id: int
    session_id: int
    mentor_id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    rating: int
    comment: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MentorReviewsResponse(BaseModel):
    """Mentor reviews with aggregated stats"""
    mentor_id: int
    average_rating: float
    total_reviews: int
    rating_distribution: dict  # {1: count, 2: count, ...}
    reviews: List[ReviewResponse]


@router.post("", response_model=ReviewResponse, status_code=201)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Create a review for a completed session

    Validates:
    - User was part of the session (as mentee)
    - Session is completed
    - User hasn't already reviewed this session
    """
    # Get session
    session = (
        db.query(SessionModel)
        .filter(SessionModel.id == review_data.session_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get booking
    booking = (
        db.query(Booking)
        .filter(Booking.id == session.booking_id)
        .first()
    )

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check if user was the mentee
    if booking.mentee_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the mentee can review the session"
        )

    # Check if session is completed
    if session.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="Can only review completed sessions"
        )

    # Check if user already reviewed this session
    existing_review = (
        db.query(Review)
        .filter(
            Review.session_id == review_data.session_id,
            Review.reviewer_id == current_user.id,
        )
        .first()
    )

    if existing_review:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this session"
        )

    # Create review
    review = Review(
        session_id=review_data.session_id,
        mentor_id=booking.mentor_id,
        reviewer_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment,
        is_public=review_data.is_public,
    )

    db.add(review)

    # Update mentor profile stats
    mentor_profile = (
        db.query(MentorProfile)
        .filter(MentorProfile.user_id == booking.mentor_id)
        .first()
    )

    if mentor_profile:
        # Recalculate average rating
        all_reviews = (
            db.query(Review)
            .filter(Review.mentor_id == booking.mentor_id)
            .all()
        )

        total_rating = sum(r.rating for r in all_reviews) + review_data.rating
        total_count = len(all_reviews) + 1

        mentor_profile.average_rating = total_rating / total_count
        mentor_profile.total_reviews = total_count

    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        session_id=review.session_id,
        mentor_id=review.mentor_id,
        reviewer_id=review.reviewer_id,
        reviewer_name=current_user.email,
        rating=review.rating,
        comment=review.comment,
        is_public=review.is_public,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.get("/mentor/{mentor_id}", response_model=MentorReviewsResponse)
async def get_mentor_reviews(
    mentor_id: int,
    include_private: bool = Query(False, description="Include private reviews (mentor only)"),
    limit: int = Query(10, ge=1, le=100, description="Number of reviews to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: Optional[User] = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Get public reviews for a mentor

    Returns aggregated stats and list of reviews.
    """
    # Check if mentor exists
    mentor_profile = (
        db.query(MentorProfile)
        .filter(MentorProfile.user_id == mentor_id)
        .first()
    )

    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Mentor not found")

    # Build query
    query = db.query(Review).filter(Review.mentor_id == mentor_id)

    # Only show public reviews unless user is the mentor
    if not include_private or (current_user and current_user.id != mentor_id):
        query = query.filter(Review.is_public == True)

    # Get all reviews for stats
    all_reviews = query.all()

    # Calculate rating distribution
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for review in all_reviews:
        rating_distribution[review.rating] += 1

    # Get paginated reviews
    reviews = query.order_by(Review.created_at.desc()).offset(offset).limit(limit).all()

    # Get reviewer names
    review_responses = []
    for review in reviews:
        reviewer = db.query(User).filter(User.id == review.reviewer_id).first()

        review_responses.append(
            ReviewResponse(
                id=review.id,
                session_id=review.session_id,
                mentor_id=review.mentor_id,
                reviewer_id=review.reviewer_id,
                reviewer_name=reviewer.email if reviewer else "Anonymous",
                rating=review.rating,
                comment=review.comment,
                is_public=review.is_public,
                created_at=review.created_at,
                updated_at=review.updated_at,
            )
        )

    return MentorReviewsResponse(
        mentor_id=mentor_id,
        average_rating=mentor_profile.average_rating,
        total_reviews=mentor_profile.total_reviews,
        rating_distribution=rating_distribution,
        reviews=review_responses,
    )


@router.get("/session/{session_id}", response_model=ReviewResponse)
async def get_session_review(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Get review for a specific session"""
    # Get session
    session = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get booking
    booking = (
        db.query(Booking)
        .filter(Booking.id == session.booking_id)
        .first()
    )

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization
    if (
        booking.mentor_id != current_user.id
        and booking.mentee_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this review"
        )

    # Get review
    review = (
        db.query(Review)
        .filter(Review.session_id == session_id)
        .first()
    )

    if not review:
        raise HTTPException(status_code=404, detail="No review found for this session")

    # Get reviewer name
    reviewer = db.query(User).filter(User.id == review.reviewer_id).first()

    return ReviewResponse(
        id=review.id,
        session_id=review.session_id,
        mentor_id=review.mentor_id,
        reviewer_id=review.reviewer_id,
        reviewer_name=reviewer.email if reviewer else "Anonymous",
        rating=review.rating,
        comment=review.comment,
        is_public=review.is_public,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Delete a review (only by the reviewer)"""
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Check authorization
    if review.reviewer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the reviewer can delete this review"
        )

    # Update mentor profile stats
    mentor_profile = (
        db.query(MentorProfile)
        .filter(MentorProfile.user_id == review.mentor_id)
        .first()
    )

    if mentor_profile and mentor_profile.total_reviews > 0:
        # Recalculate average rating
        all_reviews = (
            db.query(Review)
            .filter(
                Review.mentor_id == review.mentor_id,
                Review.id != review_id,
            )
            .all()
        )

        if all_reviews:
            total_rating = sum(r.rating for r in all_reviews)
            mentor_profile.average_rating = total_rating / len(all_reviews)
            mentor_profile.total_reviews = len(all_reviews)
        else:
            mentor_profile.average_rating = 0.0
            mentor_profile.total_reviews = 0

    db.delete(review)
    db.commit()

    return {"status": "success", "message": "Review deleted"}
