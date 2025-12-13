"""
Category browsing and discovery endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.mentoring import Category, MentorCategory, Profile
from ..schemas.mentoring import (
    CategoryResponse, CategoryWithMentorsResponse, MentorListResponse
)


router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    include_subcategories: bool = Query(True, description="Include subcategories"),
    active_only: bool = Query(True, description="Only active categories"),
    db: Session = Depends(get_db)
):
    """
    List all categories with count of mentors.

    Returns categories sorted by display_order and name.
    """
    query = db.query(Category)

    if active_only:
        query = query.filter(Category.is_active == True)

    # Get all categories first
    if not include_subcategories:
        query = query.filter(Category.parent_id.is_(None))

    categories = query.order_by(Category.display_order, Category.name).all()

    # Count mentors for each category
    responses = []
    for cat in categories:
        # Count mentors in this category
        mentor_count = db.query(func.count(MentorCategory.mentor_id)).filter(
            MentorCategory.category_id == cat.id
        ).join(Profile, Profile.id == MentorCategory.mentor_id).filter(
            Profile.is_mentor == True
        ).scalar()

        responses.append(CategoryResponse(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            icon=cat.icon,
            mentor_count=mentor_count or 0
        ))

    return responses


@router.get("/{slug}", response_model=CategoryResponse)
def get_category(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    Get category details by slug.
    """
    category = db.query(Category).filter(Category.slug == slug).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with slug '{slug}' not found"
        )

    # Count mentors
    mentor_count = db.query(func.count(MentorCategory.mentor_id)).filter(
        MentorCategory.category_id == category.id
    ).join(Profile, Profile.id == MentorCategory.mentor_id).filter(
        Profile.is_mentor == True
    ).scalar()

    return CategoryResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        icon=category.icon,
        mentor_count=mentor_count or 0
    )


@router.get("/{slug}/mentors", response_model=List[MentorListResponse])
def get_category_mentors(
    slug: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("rating", description="Sort by: rating, price, sessions"),
    db: Session = Depends(get_db)
):
    """
    Get mentors in a specific category.

    Returns paginated list of mentors with their profiles.
    """
    # Find category
    category = db.query(Category).filter(Category.slug == slug).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with slug '{slug}' not found"
        )

    # Query mentors in this category
    query = db.query(Profile).join(MentorCategory).filter(
        MentorCategory.category_id == category.id,
        Profile.is_mentor == True
    )

    # Apply sorting
    if sort_by == "rating":
        # For now, we'll sort by created_at since we don't have ratings in Profile model yet
        # In production, you'd calculate average rating
        query = query.order_by(Profile.created_at.desc())
    elif sort_by == "price":
        query = query.order_by(Profile.hourly_rate.asc())
    elif sort_by == "sessions":
        # Would need to count sessions from bookings
        query = query.order_by(Profile.created_at.desc())
    else:
        query = query.order_by(Profile.created_at.desc())

    # Apply pagination
    offset = (page - 1) * limit
    mentors = query.offset(offset).limit(limit).all()

    # Build responses
    responses = []
    for mentor in mentors:
        # Get all categories for this mentor
        mentor_cats = db.query(Category).join(MentorCategory).filter(
            MentorCategory.mentor_id == mentor.id
        ).all()

        # For now, set default values for fields not in Profile model
        responses.append(MentorListResponse(
            id=mentor.id,
            user_id=mentor.user_id,
            headline=mentor.bio[:100] if mentor.bio else None,  # Use first 100 chars of bio as headline
            languages=",".join(mentor.languages) if mentor.languages else None,
            hourly_rate=float(mentor.hourly_rate) if mentor.hourly_rate else None,
            currency="EUR",
            is_available=True,  # Default
            avg_rating=0.0,  # Would need to calculate from reviews
            total_reviews=0,  # Would need to count from reviews
            total_sessions=0,  # Would need to count from bookings
            profile_image_url=mentor.avatar_url,
            is_verified=mentor.is_verified,
            categories=[cat.name for cat in mentor_cats]
        ))

    return responses
