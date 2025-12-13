"""Payment and transaction endpoints for MentorMatch"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session as DBSession

from ..database import get_db, User, get_current_user
from ..models import (
    PaymentAccount,
    Transaction,
    Booking,
    Subscription,
    Tip,
    Payout,
    MentorProfile,
)
from ..schemas.payment import (
    PaymentAccountResponse,
    ConnectOnboardingResponse,
    ConnectStatusResponse,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    TransactionResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    TipCreate,
    TipResponse,
    PayoutResponse,
)
from ..services.stripe_service import stripe_service

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/connect/onboard", response_model=ConnectOnboardingResponse)
async def start_connect_onboarding(
    refresh_url: str,
    return_url: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Start Stripe Connect onboarding for a mentor

    Creates a Stripe Connect account if one doesn't exist,
    then returns an onboarding URL.
    """
    # Check if user has a mentor profile
    mentor_profile = (
        db.query(MentorProfile)
        .filter(MentorProfile.user_id == current_user.id)
        .first()
    )

    if not mentor_profile:
        raise HTTPException(
            status_code=400, detail="Must create mentor profile before onboarding"
        )

    # Check if payment account already exists
    payment_account = (
        db.query(PaymentAccount)
        .filter(PaymentAccount.user_id == current_user.id)
        .first()
    )

    if payment_account:
        # Account exists, create new onboarding link
        try:
            result = stripe_service.create_connect_onboarding_link(
                account_id=payment_account.stripe_account_id,
                refresh_url=refresh_url,
                return_url=return_url,
            )

            return ConnectOnboardingResponse(
                onboarding_url=result["onboarding_url"],
                account_id=result["account_id"],
                expires_at=result["expires_at"],
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Create new Stripe Connect account
    try:
        account = stripe_service.create_connect_account(
            email=current_user.email, country="US"
        )

        # Save to database
        payment_account = PaymentAccount(
            user_id=current_user.id,
            stripe_account_id=account["account_id"],
            is_active=account["charges_enabled"] and account["payouts_enabled"],
            payouts_enabled=account["payouts_enabled"],
            charges_enabled=account["charges_enabled"],
            details_submitted=account["details_submitted"],
            default_currency="USD",
        )

        db.add(payment_account)
        db.commit()

        # Create onboarding link
        result = stripe_service.create_connect_onboarding_link(
            account_id=account["account_id"],
            refresh_url=refresh_url,
            return_url=return_url,
        )

        return ConnectOnboardingResponse(
            onboarding_url=result["onboarding_url"],
            account_id=result["account_id"],
            expires_at=result["expires_at"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connect/status", response_model=ConnectStatusResponse)
async def get_connect_status(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Check Stripe Connect account status"""
    payment_account = (
        db.query(PaymentAccount)
        .filter(PaymentAccount.user_id == current_user.id)
        .first()
    )

    if not payment_account:
        raise HTTPException(status_code=404, detail="No payment account found")

    try:
        status = stripe_service.get_account_status(payment_account.stripe_account_id)

        # Update local database
        payment_account.is_active = status["is_active"]
        payment_account.payouts_enabled = status["payouts_enabled"]
        payment_account.charges_enabled = status["charges_enabled"]
        payment_account.details_submitted = status["details_submitted"]
        db.commit()

        return ConnectStatusResponse(
            account_id=status["account_id"],
            is_active=status["is_active"],
            payouts_enabled=status["payouts_enabled"],
            charges_enabled=status["charges_enabled"],
            details_submitted=status["details_submitted"],
            requirements_pending=status["requirements_pending"],
            requirements_errors=status["requirements_errors"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    checkout_data: CheckoutSessionCreate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Create a Stripe checkout session for a booking

    Returns a checkout URL that the user can be redirected to.
    """
    # Get booking
    booking = (
        db.query(Booking).filter(Booking.id == checkout_data.booking_id).first()
    )

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check authorization
    if booking.mentee_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to pay for this booking"
        )

    # Check if already paid
    existing_transaction = (
        db.query(Transaction)
        .filter(
            Transaction.booking_id == booking.id,
            Transaction.status == "succeeded",
        )
        .first()
    )

    if existing_transaction:
        raise HTTPException(status_code=400, detail="Booking already paid")

    # Get mentor's payment account
    payment_account = (
        db.query(PaymentAccount)
        .filter(PaymentAccount.user_id == booking.mentor_id)
        .first()
    )

    if not payment_account or not payment_account.charges_enabled:
        raise HTTPException(
            status_code=400, detail="Mentor cannot accept payments at this time"
        )

    # Calculate platform fee (e.g., 10%)
    platform_fee_cents = int(booking.price_cents * 0.10)

    try:
        # Create checkout session
        result = stripe_service.create_checkout_session(
            amount_cents=booking.price_cents,
            currency=booking.currency.lower(),
            success_url=checkout_data.success_url,
            cancel_url=checkout_data.cancel_url,
            metadata={
                "booking_id": str(booking.id),
                "user_id": str(current_user.id),
                "mentor_id": str(booking.mentor_id),
            },
            connected_account_id=payment_account.stripe_account_id,
            application_fee_cents=platform_fee_cents,
        )

        # Create pending transaction
        transaction = Transaction(
            user_id=current_user.id,
            type="booking",
            status="pending",
            amount_cents=booking.price_cents,
            currency=booking.currency,
            booking_id=booking.id,
            description=f"Booking #{booking.id}",
            metadata={"checkout_session_id": result["checkout_session_id"]},
        )

        db.add(transaction)
        db.commit()

        return CheckoutSessionResponse(
            checkout_session_id=result["checkout_session_id"],
            checkout_url=result["checkout_url"],
            expires_at=result["expires_at"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: DBSession = Depends(get_db),
):
    """
    Handle Stripe webhooks

    Processes events like:
    - payment_intent.succeeded
    - payment_intent.failed
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    """
    # Get raw body
    payload = await request.body()

    try:
        event = stripe_service.handle_webhook(payload, stripe_signature)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    event_type = event["event_type"]
    event_data = event["data"]

    # Handle different event types
    if event_type == "checkout.session.completed":
        # Update transaction status
        checkout_session_id = event_data["id"]

        transaction = (
            db.query(Transaction)
            .filter(Transaction.metadata["checkout_session_id"].astext == checkout_session_id)
            .first()
        )

        if transaction:
            transaction.status = "succeeded"
            transaction.stripe_payment_intent_id = event_data.get("payment_intent")

            # Update booking status
            if transaction.booking_id:
                booking = (
                    db.query(Booking)
                    .filter(Booking.id == transaction.booking_id)
                    .first()
                )
                if booking:
                    booking.status = "confirmed"

            db.commit()

    elif event_type == "payment_intent.succeeded":
        payment_intent_id = event_data["id"]

        transaction = (
            db.query(Transaction)
            .filter(Transaction.stripe_payment_intent_id == payment_intent_id)
            .first()
        )

        if transaction:
            transaction.status = "succeeded"
            transaction.stripe_charge_id = event_data.get("latest_charge")
            db.commit()

    elif event_type == "payment_intent.payment_failed":
        payment_intent_id = event_data["id"]

        transaction = (
            db.query(Transaction)
            .filter(Transaction.stripe_payment_intent_id == payment_intent_id)
            .first()
        )

        if transaction:
            transaction.status = "failed"
            db.commit()

    elif event_type == "customer.subscription.created":
        # Handle subscription creation
        stripe_subscription_id = event_data["id"]

        subscription = (
            db.query(Subscription)
            .filter(Subscription.stripe_subscription_id == stripe_subscription_id)
            .first()
        )

        if subscription:
            subscription.status = event_data["status"]
            db.commit()

    elif event_type == "customer.subscription.updated":
        # Handle subscription updates
        stripe_subscription_id = event_data["id"]

        subscription = (
            db.query(Subscription)
            .filter(Subscription.stripe_subscription_id == stripe_subscription_id)
            .first()
        )

        if subscription:
            subscription.status = event_data["status"]
            subscription.current_period_start = datetime.utcfromtimestamp(
                event_data["current_period_start"]
            )
            subscription.current_period_end = datetime.utcfromtimestamp(
                event_data["current_period_end"]
            )
            db.commit()

    elif event_type == "customer.subscription.deleted":
        # Handle subscription cancellation
        stripe_subscription_id = event_data["id"]

        subscription = (
            db.query(Subscription)
            .filter(Subscription.stripe_subscription_id == stripe_subscription_id)
            .first()
        )

        if subscription:
            subscription.status = "cancelled"
            db.commit()

    return {"status": "success"}


@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Get user's transaction history"""
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )

    return [
        TransactionResponse(
            id=t.id,
            user_id=t.user_id,
            type=t.type,
            status=t.status,
            amount_cents=t.amount_cents,
            currency=t.currency,
            stripe_payment_intent_id=t.stripe_payment_intent_id,
            stripe_charge_id=t.stripe_charge_id,
            booking_id=t.booking_id,
            subscription_id=t.subscription_id,
            description=t.description,
            metadata=t.metadata,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )
        for t in transactions
    ]


@router.get("/payouts", response_model=List[PayoutResponse])
async def get_payouts(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Get mentor's payout history"""
    # Check if user is a mentor
    payment_account = (
        db.query(PaymentAccount)
        .filter(PaymentAccount.user_id == current_user.id)
        .first()
    )

    if not payment_account:
        raise HTTPException(status_code=404, detail="No payment account found")

    payouts = (
        db.query(Payout)
        .filter(Payout.mentor_id == current_user.id)
        .order_by(Payout.created_at.desc())
        .all()
    )

    return [
        PayoutResponse(
            id=p.id,
            mentor_id=p.mentor_id,
            amount_cents=p.amount_cents,
            currency=p.currency,
            stripe_payout_id=p.stripe_payout_id,
            status=p.status,
            arrival_date=p.arrival_date,
            description=p.description,
            created_at=p.created_at,
        )
        for p in payouts
    ]


@router.post("/tip", response_model=TipResponse)
async def send_tip(
    tip_data: TipCreate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Send a tip to a mentor"""
    # Check if mentor exists
    mentor_profile = (
        db.query(MentorProfile)
        .filter(MentorProfile.user_id == tip_data.mentor_id)
        .first()
    )

    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Mentor not found")

    # Get mentor's payment account
    payment_account = (
        db.query(PaymentAccount)
        .filter(PaymentAccount.user_id == tip_data.mentor_id)
        .first()
    )

    if not payment_account or not payment_account.charges_enabled:
        raise HTTPException(
            status_code=400, detail="Mentor cannot accept payments at this time"
        )

    try:
        # Create payment intent
        result = stripe_service.create_payment_intent(
            amount_cents=tip_data.amount_cents,
            currency="usd",
            metadata={
                "type": "tip",
                "from_user_id": str(current_user.id),
                "to_mentor_id": str(tip_data.mentor_id),
                "session_id": str(tip_data.session_id) if tip_data.session_id else None,
            },
            connected_account_id=payment_account.stripe_account_id,
            application_fee_cents=0,  # No platform fee on tips
        )

        # Create tip record
        tip = Tip(
            from_user_id=current_user.id,
            to_mentor_id=tip_data.mentor_id,
            amount_cents=tip_data.amount_cents,
            currency="USD",
            message=tip_data.message,
            session_id=tip_data.session_id,
            stripe_payment_intent_id=result["payment_intent_id"],
            status="pending",
        )

        db.add(tip)
        db.commit()
        db.refresh(tip)

        return TipResponse(
            id=tip.id,
            from_user_id=tip.from_user_id,
            to_mentor_id=tip.to_mentor_id,
            amount_cents=tip.amount_cents,
            currency=tip.currency,
            message=tip.message,
            session_id=tip.session_id,
            stripe_payment_intent_id=tip.stripe_payment_intent_id,
            status=tip.status,
            created_at=tip.created_at,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
