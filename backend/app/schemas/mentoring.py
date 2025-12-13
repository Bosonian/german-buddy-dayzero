"""
Pydantic schemas for mentoring API
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# Category schemas
class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    mentor_count: Optional[int] = 0

    class Config:
        from_attributes = True


class CategoryWithMentorsResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    mentors: List["MentorListResponse"] = []

    class Config:
        from_attributes = True


# Mentor schemas
class MentorListResponse(BaseModel):
    """Lightweight mentor response for list views"""
    id: int
    user_id: int
    headline: Optional[str] = None
    languages: Optional[str] = None
    hourly_rate: Optional[float] = None
    currency: str = "EUR"
    is_available: bool = True
    avg_rating: float = 0.0
    total_reviews: int = 0
    total_sessions: int = 0
    profile_image_url: Optional[str] = None
    is_verified: bool = False
    categories: List[str] = []  # List of category names

    class Config:
        from_attributes = True


class ReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AvailabilitySlotResponse(BaseModel):
    id: int
    day_of_week: int
    start_time: str
    end_time: str

    class Config:
        from_attributes = True


class MentorDetailResponse(BaseModel):
    """Full mentor profile for detail view"""
    id: int
    user_id: int
    bio: Optional[str] = None
    headline: Optional[str] = None
    languages: Optional[str] = None
    hourly_rate: Optional[float] = None
    currency: str = "EUR"
    is_available: bool = True
    timezone: Optional[str] = None
    avg_rating: float = 0.0
    total_reviews: int = 0
    total_sessions: int = 0
    profile_image_url: Optional[str] = None
    video_intro_url: Optional[str] = None
    is_verified: bool = False
    created_at: datetime

    # Related data
    categories: List[CategoryResponse] = []
    reviews: List[ReviewResponse] = []
    availability_slots: List[AvailabilitySlotResponse] = []

    class Config:
        from_attributes = True


# Filter schemas
class MentorFilters(BaseModel):
    """Query parameters for filtering mentors"""
    category: Optional[str] = Field(None, description="Filter by category slug")
    min_price: Optional[float] = Field(None, description="Minimum hourly rate")
    max_price: Optional[float] = Field(None, description="Maximum hourly rate")
    language: Optional[str] = Field(None, description="Filter by language code")
    available_now: Optional[bool] = Field(None, description="Only show available mentors")
    rating_min: Optional[float] = Field(None, description="Minimum rating (0-5)")
    sort_by: Optional[str] = Field("rating", description="Sort by: rating, price, sessions")
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(10, ge=1, le=100, description="Items per page")


# Profile schemas
class ProfileCreate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    interests: Optional[str] = None
    learning_goals: Optional[str] = None
    preferred_languages: Optional[str] = None
    timezone: Optional[str] = None


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    interests: Optional[str] = None
    learning_goals: Optional[str] = None
    preferred_languages: Optional[str] = None
    profile_image_url: Optional[str] = None
    timezone: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    is_mentor: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    interests: Optional[str] = None
    learning_goals: Optional[str] = None
    preferred_languages: Optional[str] = None
    profile_image_url: Optional[str] = None
    timezone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BecomeMentorRequest(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    languages: Optional[str] = None
    hourly_rate: Optional[float] = None
    currency: str = "EUR"
    timezone: Optional[str] = None
    category_ids: List[int] = []


class MentorProfileUpdate(BaseModel):
    bio: Optional[str] = None
    headline: Optional[str] = None
    languages: Optional[str] = None
    hourly_rate: Optional[float] = None
    currency: Optional[str] = None
    is_available: Optional[bool] = None
    timezone: Optional[str] = None
    profile_image_url: Optional[str] = None
    video_intro_url: Optional[str] = None


class AvailabilitySlot(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str = Field(..., description="Time in HH:MM format (24h)")
    end_time: str = Field(..., description="Time in HH:MM format (24h)")


class AvailabilityUpdate(BaseModel):
    slots: List[AvailabilitySlot] = []


# Action responses
class LikeResponse(BaseModel):
    success: bool
    is_match: bool = False
    message: str


class SaveResponse(BaseModel):
    success: bool
    saved: bool
    message: str


class MatchResponse(BaseModel):
    id: int
    user_id: int
    mentor_profile_id: int
    matched_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# Pagination
class PaginationMetadata(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class MentorListWithPagination(BaseModel):
    mentors: List[MentorListResponse]
    pagination: PaginationMetadata


# Update forward references
CategoryWithMentorsResponse.model_rebuild()
