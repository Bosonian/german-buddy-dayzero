# MentorMatch API Documentation

Complete booking and payments API for the MentorMatch mentoring platform, integrated into the German Buddy backend.

## Overview

The MentorMatch API provides comprehensive functionality for:
- Booking mentoring sessions
- Managing availability
- Processing payments via Stripe
- Conducting video sessions
- Leaving reviews and ratings

## Architecture

### Database Models
Located in `/home/user/german-buddy-dayzero/backend/app/models.py`:

- **MentorProfile**: Mentor information, rates, and stats
- **AvailabilitySlot**: Mentor availability schedules
- **Booking**: Session bookings with status tracking
- **Session**: Active/completed sessions with video room info
- **Review**: Session reviews and ratings
- **PaymentAccount**: Stripe Connect accounts for mentors
- **Transaction**: Payment transaction history
- **Subscription**: Recurring subscriptions
- **Tip**: Tips sent to mentors
- **Payout**: Mentor payout records

### Schemas
Pydantic validation schemas:
- `/home/user/german-buddy-dayzero/backend/app/schemas/booking.py`
- `/home/user/german-buddy-dayzero/backend/app/schemas/payment.py`

### Services
- `/home/user/german-buddy-dayzero/backend/app/services/stripe_service.py`: Stripe payment integration

## API Endpoints

### Bookings (`/bookings`)

#### `POST /bookings`
Create a new booking
- **Auth**: Required
- **Body**: `BookingCreate`
  - `mentor_id`: ID of the mentor
  - `scheduled_at`: ISO datetime
  - `duration_minutes`: Session length (15-180)
  - `session_type`: "one_on_one", "group", or "trial"
  - `notes`: Optional notes for mentor
- **Returns**: `BookingResponse` with `payment_required` flag
- **Validations**:
  - Time slot is available
  - Mentor is active
  - No double booking
  - Future date only

#### `GET /bookings`
List user's bookings
- **Auth**: Required
- **Query Params**:
  - `status`: Filter by status (pending, confirmed, cancelled, completed)
  - `upcoming_only`: Show only future bookings
  - `role`: Filter by "mentor" or "mentee"
- **Returns**: `List[BookingResponse]`

#### `GET /bookings/{booking_id}`
Get detailed booking information
- **Auth**: Required (must be mentor or mentee)
- **Returns**: `BookingDetailResponse`

#### `PUT /bookings/{booking_id}/cancel`
Cancel a booking
- **Auth**: Required (mentor or mentee)
- **Body**: Optional cancellation reason
- **Policy**: 24+ hours notice = full refund
- **Returns**: `BookingResponse`

#### `PUT /bookings/{booking_id}/reschedule`
Reschedule a booking
- **Auth**: Required (mentee only)
- **Body**: `BookingUpdate`
- **Returns**: `BookingResponse` (status reset to "pending")

#### `PUT /bookings/{booking_id}/confirm`
Confirm a pending booking
- **Auth**: Required (mentor only)
- **Returns**: `BookingResponse`

---

### Sessions (`/sessions`)

#### `GET /sessions/{session_id}`
Get session details
- **Auth**: Required (must be participant)
- **Returns**: `SessionResponse`

#### `POST /sessions/{booking_id}/start`
Start a session (creates video room)
- **Auth**: Required (mentor only)
- **Returns**: `SessionStartResponse` with:
  - `session_id`
  - `video_room_id`
  - `video_room_token`
  - `video_room_url`

#### `POST /sessions/{session_id}/end`
End a session
- **Auth**: Required (mentor or mentee)
- **Body**: Optional notes
- **Returns**: `SessionResponse`
- **Updates**: Booking status to "completed"

#### `GET /sessions/{session_id}/token`
Get video room token for joining
- **Auth**: Required (must be participant)
- **Returns**: `SessionTokenResponse`

---

### Payments (`/payments`)

#### `POST /payments/connect/onboard`
Start Stripe Connect onboarding for mentor
- **Auth**: Required
- **Body**:
  - `refresh_url`: URL for restarting onboarding
  - `return_url`: URL after completion
- **Returns**: `ConnectOnboardingResponse` with onboarding URL

#### `GET /payments/connect/status`
Check Stripe Connect account status
- **Auth**: Required
- **Returns**: `ConnectStatusResponse` with:
  - Account status flags
  - Requirements pending
  - Requirements errors

#### `POST /payments/checkout`
Create Stripe checkout session for booking
- **Auth**: Required (mentee)
- **Body**: `CheckoutSessionCreate`
  - `booking_id`
  - `success_url`
  - `cancel_url`
- **Returns**: `CheckoutSessionResponse` with checkout URL
- **Platform Fee**: 10% of booking price

#### `POST /payments/webhook`
Handle Stripe webhooks
- **Auth**: Stripe signature verification
- **Events Handled**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.subscription.*`

#### `GET /payments/transactions`
Get user's transaction history
- **Auth**: Required
- **Returns**: `List[TransactionResponse]`

#### `GET /payments/payouts`
Get mentor's payout history
- **Auth**: Required (mentor only)
- **Returns**: `List[PayoutResponse]`

#### `POST /payments/tip`
Send a tip to a mentor
- **Auth**: Required
- **Body**: `TipCreate`
  - `mentor_id`
  - `amount_cents` (minimum 100 = $1)
  - `message`: Optional
  - `session_id`: Optional
- **Returns**: `TipResponse`
- **Platform Fee**: None (0% on tips)

---

### Reviews (`/reviews`)

#### `POST /reviews`
Create a review for a completed session
- **Auth**: Required (mentee only)
- **Body**: `ReviewCreate`
  - `session_id`
  - `rating`: 1-5 stars
  - `comment`: Optional text
  - `is_public`: Visibility flag
- **Returns**: `ReviewResponse`
- **Validations**:
  - Session is completed
  - User was the mentee
  - No duplicate reviews

#### `GET /reviews/mentor/{mentor_id}`
Get reviews for a mentor
- **Auth**: Optional
- **Query Params**:
  - `include_private`: Include private reviews (mentor only)
  - `limit`: Results per page (1-100, default 10)
  - `offset`: Pagination offset
- **Returns**: `MentorReviewsResponse` with:
  - Average rating
  - Total reviews
  - Rating distribution
  - List of reviews

#### `GET /reviews/session/{session_id}`
Get review for a specific session
- **Auth**: Required (must be participant)
- **Returns**: `ReviewResponse`

#### `DELETE /reviews/{review_id}`
Delete a review
- **Auth**: Required (reviewer only)
- **Returns**: Success message
- **Updates**: Mentor average rating

---

## Environment Variables

Add to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Existing variables
DATABASE_URL=sqlite:///./srs.db
JWT_SECRET=your_jwt_secret
```

## Installation

1. Install dependencies:
```bash
cd /home/user/german-buddy-dayzero/backend
pip install -r requirements.txt
```

2. Set up environment variables in `.env`

3. Run the server:
```bash
python -m app.main
# or
uvicorn app.main:app --reload --port 8080
```

## Database Initialization

Tables are automatically created on startup via `init_mentormatch_db()` in `main.py`.

## Usage Flow

### For Mentors

1. **Set up payment account**:
   - `POST /payments/connect/onboard` → Get onboarding URL
   - Complete Stripe onboarding
   - `GET /payments/connect/status` → Verify activation

2. **Receive bookings**:
   - `GET /bookings?role=mentor&status=pending` → View pending bookings
   - `PUT /bookings/{id}/confirm` → Confirm booking

3. **Conduct sessions**:
   - `POST /sessions/{booking_id}/start` → Start session
   - `POST /sessions/{session_id}/end` → End session

4. **Track earnings**:
   - `GET /payments/transactions` → View earnings
   - `GET /payments/payouts` → View payouts

### For Mentees

1. **Book a session**:
   - `POST /bookings` → Create booking
   - `POST /payments/checkout` → Get payment URL
   - Complete Stripe checkout

2. **Join session**:
   - `GET /sessions/{session_id}/token` → Get video room token
   - Join video room

3. **Leave review**:
   - `POST /reviews` → Submit review after session

## Error Handling

All endpoints include comprehensive error handling:
- 400: Bad request (validation errors, business logic violations)
- 401: Unauthorized (missing or invalid auth)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 500: Server error (Stripe errors, etc.)

## Testing

Access the interactive API documentation at:
- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

## Video Integration

The current implementation includes placeholder video room functionality. To integrate with a real video service:

1. Choose a provider (Twilio, Agora, Daily.co, Zoom, etc.)
2. Update `backend/app/routers/sessions.py`:
   - `generate_video_room_token()` → Call video service API
   - `get_video_room_url()` → Return actual room URL
3. Add video service credentials to `.env`

## Stripe Connect Flow

1. Mentor completes onboarding
2. Mentee books session
3. Mentee pays via Stripe Checkout
4. Stripe:
   - Charges mentee
   - Takes 10% platform fee
   - Transfers 90% to mentor's Connect account
5. Mentor receives payout on their schedule

## Next Steps

Optional enhancements:
- [ ] Add availability slot management endpoints
- [ ] Implement subscription pricing tiers
- [ ] Add email notifications
- [ ] Implement calendar sync (Google Calendar, etc.)
- [ ] Add group session support
- [ ] Implement refund processing
- [ ] Add analytics dashboard endpoints
- [ ] Integrate with real video service
- [ ] Add mentor profile search/filtering
- [ ] Implement chat/messaging system
