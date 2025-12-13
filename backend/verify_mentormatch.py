#!/usr/bin/env python3
"""
Verification script for MentorMatch API implementation
Tests that all imports work correctly
"""

import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test all MentorMatch imports"""
    errors = []

    print("Testing MentorMatch API imports...")
    print("-" * 50)

    # Test schemas
    try:
        from app.schemas.booking import (
            BookingCreate, BookingUpdate, BookingResponse,
            BookingDetailResponse, SessionResponse, SessionStartResponse,
            AvailabilitySlotCreate, AvailabilitySlotResponse
        )
        print("✓ Booking schemas imported successfully")
    except Exception as e:
        errors.append(f"Booking schemas: {e}")
        print(f"✗ Booking schemas failed: {e}")

    try:
        from app.schemas.payment import (
            PaymentAccountResponse, ConnectOnboardingResponse,
            CheckoutSessionCreate, CheckoutSessionResponse,
            TransactionResponse, SubscriptionCreate, SubscriptionResponse,
            TipCreate, TipResponse, PayoutResponse
        )
        print("✓ Payment schemas imported successfully")
    except Exception as e:
        errors.append(f"Payment schemas: {e}")
        print(f"✗ Payment schemas failed: {e}")

    # Test models
    try:
        from app.models import (
            MentorProfile, AvailabilitySlot, Booking, Session,
            Review, PaymentAccount, Transaction, Subscription, Tip, Payout
        )
        print("✓ Models imported successfully")
    except Exception as e:
        errors.append(f"Models: {e}")
        print(f"✗ Models failed: {e}")

    # Test routers
    try:
        from app.routers.bookings import router as bookings_router
        print("✓ Bookings router imported successfully")
    except Exception as e:
        errors.append(f"Bookings router: {e}")
        print(f"✗ Bookings router failed: {e}")

    try:
        from app.routers.sessions import router as sessions_router
        print("✓ Sessions router imported successfully")
    except Exception as e:
        errors.append(f"Sessions router: {e}")
        print(f"✗ Sessions router failed: {e}")

    try:
        from app.routers.payments import router as payments_router
        print("✓ Payments router imported successfully")
    except Exception as e:
        errors.append(f"Payments router: {e}")
        print(f"✗ Payments router failed: {e}")

    try:
        from app.routers.reviews import router as reviews_router
        print("✓ Reviews router imported successfully")
    except Exception as e:
        errors.append(f"Reviews router: {e}")
        print(f"✗ Reviews router failed: {e}")

    # Test services
    try:
        from app.services.stripe_service import stripe_service, StripeService
        print("✓ Stripe service imported successfully")
    except Exception as e:
        errors.append(f"Stripe service: {e}")
        print(f"✗ Stripe service failed: {e}")

    # Test database init
    try:
        from app.mentormatch_db import init_mentormatch_db
        print("✓ Database init imported successfully")
    except Exception as e:
        errors.append(f"Database init: {e}")
        print(f"✗ Database init failed: {e}")

    print("-" * 50)

    if errors:
        print(f"\n❌ {len(errors)} import error(s) found:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print("\n✅ All imports successful!")
        print("\nMentorMatch API is ready to use.")
        print("Start the server with: uvicorn app.main:app --reload --port 8080")
        return True


def count_endpoints():
    """Count total endpoints"""
    print("\n" + "=" * 50)
    print("Endpoint Summary")
    print("=" * 50)

    try:
        from app.routers.bookings import router as bookings_router
        from app.routers.sessions import router as sessions_router
        from app.routers.payments import router as payments_router
        from app.routers.reviews import router as reviews_router

        routers = {
            "Bookings": bookings_router,
            "Sessions": sessions_router,
            "Payments": payments_router,
            "Reviews": reviews_router
        }

        total = 0
        for name, router in routers.items():
            count = len(router.routes)
            print(f"{name}: {count} endpoints")
            total += count

        print(f"\nTotal: {total} endpoints")

    except Exception as e:
        print(f"Could not count endpoints: {e}")


if __name__ == "__main__":
    success = test_imports()

    if success:
        count_endpoints()
        sys.exit(0)
    else:
        sys.exit(1)
