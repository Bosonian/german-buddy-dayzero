"""Payment and transaction schemas for MentorMatch"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


class PaymentStatus(str, Enum):
    """Payment status"""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class TransactionType(str, Enum):
    """Type of transaction"""
    BOOKING = "booking"
    SUBSCRIPTION = "subscription"
    TIP = "tip"
    REFUND = "refund"
    PAYOUT = "payout"


class SubscriptionStatus(str, Enum):
    """Subscription status"""
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    INCOMPLETE = "incomplete"
    TRIALING = "trialing"


class SubscriptionPlan(str, Enum):
    """Subscription plans"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


# Payment Account Schemas
class PaymentAccountResponse(BaseModel):
    """Mentor's Stripe Connect account status"""
    id: int
    user_id: int
    stripe_account_id: str
    is_active: bool
    payouts_enabled: bool
    charges_enabled: bool
    details_submitted: bool
    default_currency: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConnectOnboardingResponse(BaseModel):
    """Response for Stripe Connect onboarding"""
    onboarding_url: str
    account_id: str
    expires_at: datetime


class ConnectStatusResponse(BaseModel):
    """Stripe Connect account status"""
    account_id: str
    is_active: bool
    payouts_enabled: bool
    charges_enabled: bool
    details_submitted: bool
    requirements_pending: list[str] = []
    requirements_errors: list[str] = []


# Checkout Schemas
class CheckoutSessionCreate(BaseModel):
    """Create a checkout session"""
    booking_id: int = Field(..., description="ID of the booking to pay for")
    success_url: str = Field(..., description="URL to redirect on success")
    cancel_url: str = Field(..., description="URL to redirect on cancel")


class CheckoutSessionResponse(BaseModel):
    """Checkout session response"""
    checkout_session_id: str
    checkout_url: str
    expires_at: datetime


# Transaction Schemas
class TransactionResponse(BaseModel):
    """Transaction response"""
    id: int
    user_id: int
    type: TransactionType
    status: PaymentStatus
    amount_cents: int
    currency: str
    stripe_payment_intent_id: Optional[str]
    stripe_charge_id: Optional[str]
    booking_id: Optional[int]
    subscription_id: Optional[int]
    description: Optional[str]
    metadata: Optional[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Subscription Schemas
class SubscriptionCreate(BaseModel):
    """Create a subscription"""
    mentor_id: int = Field(..., description="ID of the mentor to subscribe to")
    plan: SubscriptionPlan = Field(..., description="Subscription plan")
    payment_method_id: Optional[str] = Field(None, description="Stripe payment method ID")


class SubscriptionResponse(BaseModel):
    """Subscription response"""
    id: int
    user_id: int
    mentor_id: int
    plan: SubscriptionPlan
    status: SubscriptionStatus
    stripe_subscription_id: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    amount_cents: int
    currency: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Tip Schemas
class TipCreate(BaseModel):
    """Create a tip"""
    mentor_id: int = Field(..., description="ID of the mentor to tip")
    amount_cents: int = Field(..., ge=100, description="Amount in cents (minimum $1)")
    message: Optional[str] = Field(None, max_length=500, description="Optional message")
    session_id: Optional[int] = Field(None, description="Related session ID")


class TipResponse(BaseModel):
    """Tip response"""
    id: int
    from_user_id: int
    to_mentor_id: int
    amount_cents: int
    currency: str
    message: Optional[str]
    session_id: Optional[int]
    stripe_payment_intent_id: str
    status: PaymentStatus
    created_at: datetime

    class Config:
        from_attributes = True


# Payout Schemas
class PayoutResponse(BaseModel):
    """Payout response"""
    id: int
    mentor_id: int
    amount_cents: int
    currency: str
    stripe_payout_id: str
    status: str
    arrival_date: Optional[datetime]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
