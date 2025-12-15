# DayZero - MentorMatch 🚀

**Your Journey Starts at Day Zero**

A modern mentoring marketplace connecting people with expert mentors in Engineering, Medicine, Nursing, and Life Abroad.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

- **Expert Mentors** - Verified professionals across multiple domains
- **On-Demand Booking** - Video calls, voice calls, or async chat
- **Flexible Pricing** - Mentors set their own rates
- **Secure Payments** - Stripe Connect marketplace integration
- **Video Sessions** - Built-in video conferencing support
- **Reviews & Ratings** - Build trust through feedback
- **Smart Matching** - Save and like mentors, get personalized recommendations

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15.5, React, TypeScript, Tailwind CSS |
| **Backend** | FastAPI, SQLAlchemy, Pydantic |
| **Database** | SQLite (dev), PostgreSQL (production-ready) |
| **Payments** | Stripe Connect |
| **Video** | Ready for Daily.co / Twilio integration |
| **Deployment** | Vercel (frontend), Railway/Render (backend) |

## 📁 Project Structure

```
german-buddy-dayzero/
├── frontend/              # Next.js frontend
│   ├── app/
│   │   ├── mentors/      # Mentor discovery and profiles
│   │   ├── bookings/     # Booking management
│   │   ├── sessions/     # Video session interface
│   │   ├── dashboard/    # Mentor dashboard
│   │   └── onboarding/   # User onboarding flow
│   ├── components/
│   │   ├── mentors/      # Mentor UI components
│   │   ├── booking/      # Booking flow components
│   │   └── ui/           # Reusable UI components
│   └── lib/
│       ├── api/          # API client functions
│       └── hooks/        # React hooks
├── backend/              # FastAPI backend
│   └── app/
│       ├── models.py     # Database models
│       ├── routers/      # API endpoints
│       │   ├── mentors.py
│       │   ├── bookings.py
│       │   ├── sessions.py
│       │   ├── payments.py
│       │   └── reviews.py
│       ├── services/     # Business logic
│       │   └── stripe_service.py
│       └── schemas/      # Request/response schemas
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (or use SQLite for development)

### Local Development

#### 1. Clone the repository
```bash
git clone https://github.com/yourusername/german-buddy-dayzero.git
cd german-buddy-dayzero
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your secrets

# Seed categories (optional)
python -m app.seed_data

# Run the server
uvicorn app.main:app --reload --port 8080
```

Backend will be available at:
- API: http://localhost:8080
- API Docs: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your API URL

# Run development server
npm run dev
```

Frontend will be available at http://localhost:3000

### Docker Setup (Alternative)

```bash
docker-compose up -d
```

This will start both frontend and backend services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

## 🔑 Environment Variables

### Backend (`backend/.env`)

```bash
# Database
DATABASE_URL=sqlite:///./srs.db  # or postgresql://user:pass@localhost/dbname

# Authentication
JWT_SECRET=your-secret-key-change-this

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

### Key Endpoints

#### Mentors
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mentors` | GET | List/search mentors |
| `/mentors/{id}` | GET | Get mentor profile |
| `/mentors/{id}/like` | POST | Like a mentor |
| `/mentors/{id}/reviews` | GET | Get mentor reviews |

#### Bookings
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bookings` | POST | Create a booking |
| `/bookings` | GET | List user bookings |
| `/bookings/{id}` | GET | Get booking details |
| `/bookings/{id}/cancel` | PUT | Cancel booking |
| `/bookings/{id}/reschedule` | PUT | Reschedule booking |

#### Sessions
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sessions/{booking_id}/start` | POST | Start video session |
| `/sessions/{id}/end` | POST | End session |
| `/sessions/{id}/token` | GET | Get video room token |

#### Payments
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payments/checkout` | POST | Create checkout session |
| `/payments/connect/onboard` | POST | Mentor Stripe onboarding |
| `/payments/webhook` | POST | Stripe webhooks |

#### Reviews
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/reviews` | POST | Create a review |
| `/reviews/mentor/{id}` | GET | Get mentor reviews |

## 💳 Stripe Connect Setup

### For Mentors

1. **Onboarding**:
   - Navigate to dashboard → Settings → Payouts
   - Click "Connect Stripe Account"
   - Complete Stripe Connect Express onboarding
   - Provide business details and bank account

2. **Receiving Payments**:
   - Set your hourly rate and trial session price
   - When mentees book sessions, payment is held in escrow
   - After session completion, funds are transferred to your Stripe account
   - Platform fee: 10% on bookings, 0% on tips

### For Mentees

1. **Booking Sessions**:
   - Browse mentors and select a time slot
   - Click "Book Session"
   - Complete Stripe Checkout
   - Session is confirmed automatically

2. **Cancellation Policy**:
   - Free cancellation up to 24 hours before session
   - Cancellations within 24 hours are charged 50%
   - No-shows are charged 100%

## 🎯 User Flows

### Mentor Onboarding Flow

1. Sign up → Select "I want to be a mentor"
2. Complete profile (bio, expertise, hourly rate)
3. Set availability (recurring weekly slots)
4. Connect Stripe account
5. Start accepting bookings

### Mentee Booking Flow

1. Sign up → Browse mentors by category
2. Filter by expertise, price, rating
3. View mentor profile and reviews
4. Select available time slot
5. Complete payment via Stripe
6. Join video session at scheduled time
7. Leave review after session

## 🗺️ Roadmap

### Phase 1: MVP ✅
- [x] User authentication and profiles
- [x] Mentor discovery and search
- [x] Booking system
- [x] Stripe Connect integration
- [x] Session management
- [x] Review system
- [x] Basic video session infrastructure

### Phase 2: Enhanced Features 🚧
- [ ] Video integration (Daily.co or Twilio)
- [ ] Real-time chat/messaging
- [ ] Email notifications (booking confirmations, reminders)
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Advanced search and filters
- [ ] Mentor recommendations algorithm
- [ ] Group sessions

### Phase 3: Growth & Scale 🔮
- [ ] Mobile app (React Native)
- [ ] AI-powered mentor matching
- [ ] Content library (courses, guides)
- [ ] Subscription tiers
- [ ] Referral program
- [ ] Analytics dashboard for mentors
- [ ] Multi-language support

### Phase 4: Marketplace Expansion 🌐
- [ ] Community features (forums, events)
- [ ] Mentor certifications
- [ ] Corporate partnerships
- [ ] White-label solution
- [ ] International payment methods

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing

1. **Create Test Accounts**:
   - Create a mentor account
   - Create a mentee account
   - Set up test Stripe keys

2. **Test Booking Flow**:
   - Set availability as mentor
   - Book session as mentee
   - Use Stripe test cards (4242 4242 4242 4242)
   - Start and end session

3. **Test Payments**:
   - Complete Stripe Connect onboarding
   - Create booking with payment
   - Verify webhook handling
   - Check transaction records

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `mentor_profiles` - Mentor-specific data
- `categories` - Service categories
- `bookings` - Session bookings
- `sessions` - Active/completed sessions
- `reviews` - Ratings and feedback
- `transactions` - Payment records
- `payment_accounts` - Stripe Connect accounts

See `backend/app/models.py` for full schema.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Development Guidelines

- Follow TypeScript/Python best practices
- Write tests for new features
- Update documentation
- Follow existing code style
- Create feature branches for new work

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stripe** for payment infrastructure
- **FastAPI** for the excellent Python framework
- **Next.js** team for the React framework
- **Vercel** for seamless deployment
- **Daily.co/Twilio** for video infrastructure

## 📞 Support

- **Documentation**: See `/docs` folder and API docs at `/docs` endpoint
- **Issues**: Report bugs on GitHub Issues
- **Email**: support@dayzero.xyz (coming soon)
- **Twitter**: [@dayzeroapp](https://twitter.com/dayzeroapp) (coming soon)

---

<div align="center">

**🚀 Ready to start your mentoring journey? 🚀**

[**Launch DayZero →**](https://dayzero.xyz)

*Built with ❤️ by the DayZero team*

</div>
