# MentorMatch API - Quick Start Guide

## Installation

1. **Install Python dependencies:**
   ```bash
   cd /home/user/german-buddy-dayzero/backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Create or update `.env` file:
   ```bash
   # Database
   DATABASE_URL=sqlite:///./srs.db

   # JWT Authentication
   JWT_SECRET=your_secret_key_here
   ACCESS_EXPIRES_MIN=60

   # Stripe (get from https://dashboard.stripe.com)
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Server
   PORT=8080
   ```

3. **Start the server:**
   ```bash
   python -m app.main
   # or
   uvicorn app.main:app --reload --port 8080
   ```

4. **Verify installation:**
   ```bash
   python verify_mentormatch.py
   ```

## Access API Documentation

Once the server is running:
- **Swagger UI**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc
- **Health Check**: http://localhost:8080/health

## Test the API

### 1. Create a User (if not already done)
Use the existing auth endpoints to create and authenticate users.

### 2. Test Booking Flow

```bash
# Create a booking (requires JWT token)
curl -X POST "http://localhost:8080/bookings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mentor_id": 1,
    "scheduled_at": "2025-12-20T10:00:00Z",
    "duration_minutes": 60,
    "session_type": "one_on_one",
    "notes": "Looking forward to learning German!"
  }'

# List bookings
curl -X GET "http://localhost:8080/bookings?upcoming_only=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Payment Flow

```bash
# Start Stripe Connect onboarding (mentor)
curl -X POST "http://localhost:8080/payments/connect/onboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_url": "http://localhost:3000/onboarding/refresh",
    "return_url": "http://localhost:3000/dashboard"
  }'

# Create checkout session (mentee)
curl -X POST "http://localhost:8080/payments/checkout" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "success_url": "http://localhost:3000/booking/success",
    "cancel_url": "http://localhost:3000/booking/cancel"
  }'
```

## Stripe Setup

### For Development:

1. **Create Stripe account**: https://dashboard.stripe.com/register
2. **Get API keys**: Dashboard → Developers → API keys
3. **Enable Connect**: Dashboard → Connect → Get started
4. **Get webhook secret**: Dashboard → Developers → Webhooks

### Webhook Setup:

1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:8080/payments/webhook
   ```

2. Or use ngrok for testing:
   ```bash
   ngrok http 8080
   # Use the ngrok URL in Stripe webhook settings
   ```

## File Structure

```
backend/
├── app/
│   ├── main.py                      # FastAPI app (updated)
│   ├── database.py                  # Database config
│   ├── models.py                    # NEW: MentorMatch models
│   ├── mentormatch_db.py           # NEW: Database init
│   ├── schemas/
│   │   ├── booking.py              # NEW: Booking schemas
│   │   └── payment.py              # NEW: Payment schemas
│   ├── routers/
│   │   ├── bookings.py             # NEW: Booking endpoints
│   │   ├── sessions.py             # NEW: Session endpoints
│   │   ├── payments.py             # NEW: Payment endpoints
│   │   └── reviews.py              # NEW: Review endpoints
│   └── services/
│       └── stripe_service.py       # NEW: Stripe integration
├── requirements.txt                 # Updated with stripe
├── MENTORMATCH.md                  # Full documentation
├── MENTORMATCH_SUMMARY.md          # Implementation summary
├── QUICKSTART.md                   # This file
└── verify_mentormatch.py           # Verification script
```

## API Endpoints Overview

### Bookings (6 endpoints)
- Create, list, view, cancel, reschedule, confirm bookings

### Sessions (4 endpoints)
- Start, end, get session details, get video tokens

### Payments (7 endpoints)
- Stripe Connect onboarding, checkout, webhooks, transactions, payouts, tips

### Reviews (4 endpoints)
- Create, view, delete reviews, get mentor ratings

**Total: 21 new endpoints**

## Common Use Cases

### As a Mentor:

1. Complete Stripe Connect onboarding
2. Set availability (coming soon)
3. View pending bookings
4. Confirm bookings
5. Start sessions
6. End sessions
7. View earnings and payouts

### As a Mentee:

1. Browse mentors (coming soon)
2. Create booking
3. Pay for booking via Stripe
4. Join session with video token
5. Leave review after session
6. Send tip to mentor

## Troubleshooting

### Database Issues
```bash
# Reset database (WARNING: deletes all data)
rm srs.db
python -m app.main  # Will recreate tables
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Stripe Errors
- Check `STRIPE_SECRET_KEY` is set correctly
- Ensure using test keys (starts with `sk_test_`)
- Verify webhook secret matches Stripe CLI or dashboard

## Next Steps

1. **Set up frontend**: Integrate with React/Next.js frontend
2. **Configure Stripe**: Set up Connect in production mode
3. **Add video service**: Integrate Twilio/Agora/Daily.co
4. **Add email**: Set up notifications via SendGrid/Mailgun
5. **Deploy**: Deploy to production (Heroku, AWS, Railway, etc.)

## Support

- Full documentation: `MENTORMATCH.md`
- Implementation details: `MENTORMATCH_SUMMARY.md`
- Swagger docs: http://localhost:8080/docs

---

**Ready to accept your first booking!** 🚀
