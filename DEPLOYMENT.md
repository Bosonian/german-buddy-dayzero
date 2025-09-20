# 🚀 German Buddy Full Production Deployment Guide

## Prerequisites
- Vercel account (frontend)
- Fly.io/Render/Railway account (backend)
- PostgreSQL database (Supabase/Neon recommended)
- Google AI Studio API key
- Anki CSV data files (optional)

## 1️⃣ Backend Deployment (FastAPI)

### Option A: Deploy to Fly.io (Recommended)
```bash
cd backend

# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly
fly auth login

# Launch app (first time only)
fly launch --name german-buddy-api --region iad

# Set secrets
fly secrets set DATABASE_URL="postgresql://user:pass@host/dbname"
fly secrets set JWT_SECRET="your-secure-random-string"
fly secrets set JWT_ALGORITHM="HS256"

# Deploy
fly deploy

# Get your backend URL
fly status
# → https://german-buddy-api.fly.dev
```

### Option B: Deploy to Render
1. Connect GitHub repo at render.com
2. Create new Web Service
3. Set root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Secure random string
   - `JWT_ALGORITHM`: HS256

### Option C: Deploy to Railway
```bash
cd backend

# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add

# Deploy
railway up

# Get URL
railway domain
```

## 2️⃣ Database Setup (PostgreSQL)

### Using Supabase (Free tier available)
1. Create project at supabase.com
2. Get connection string from Settings > Database
3. Set as `DATABASE_URL` in backend

### Using Neon (Serverless PostgreSQL)
1. Create database at neon.tech
2. Copy connection string
3. Set as `DATABASE_URL` in backend

## 3️⃣ Frontend Deployment (Vercel)

### Step 1: Configure Environment Variables
Go to [Vercel Dashboard](https://vercel.com) > Your Project > Settings > Environment Variables

Add these variables:
```bash
# Backend API URL (from Step 1)
NEXT_PUBLIC_API_URL=https://german-buddy-api.fly.dev

# Google AI Studio API key (for TTS)
GOOGLE_API_KEY=AIzaSyB8wwEs1w2bCpahCEo5PTQv6thqyuic3a4
```

⚠️ **IMPORTANT**: Do NOT set `YT_API_KEY` on Vercel (YouTube indexing is local-only)

### Step 2: Deploy Frontend
```bash
cd frontend

# If not already connected
vercel link

# Deploy to production
vercel --prod

# Your app is now live at:
# https://german-buddy-dayzero.vercel.app
```

## 4️⃣ SRS Data Setup (100k+ German Sentences)

### Step 1: Prepare Anki CSV Data
```bash
cd frontend

# Download or export Anki decks as CSV
# Place CSV files in a directory, e.g., /path/to/anki_csvs/
```

### Step 2: Curate A1/A2 Sentences
```bash
# Run curation script
node scripts/curate_srs.mjs \
  --csv-dir "/path/to/anki_csvs" \
  --levels A1,A2 \
  --min-frequency 400 \
  --chunk 1000

# This creates:
# public/srs/A1/part-001.json, part-002.json, ...
# public/srs/A2/part-001.json, part-002.json, ...
```

### Step 3: Import to Backend
```bash
# First, get auth token
curl -X POST https://your-backend-url.com/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your-email&password=your-password" \
  | jq -r '.access_token' > token.txt

# Import curated data
TOKEN=$(cat token.txt) \
API=https://your-backend-url.com \
npm run srs:import
```

## 5️⃣ YouTube Clips Setup

### Step 1: Build YouTube Index (Local Only)
```bash
cd frontend

# Set YouTube API key (local only, not on Vercel)
export YT_API_KEY=AIzaSyB8wwEs1w2bCpahCEo5PTQv6thqyuic3a4

# Build index
npm run yt:index

# This creates: public/youtube_index.json
```

### Step 2: Review and Approve Clips
1. Start dev server: `npm run dev`
2. Navigate to: http://localhost:3000/admin/youtube-review
3. Review clips and approve/reject
4. Click "Export Approved" to save final index

### Step 3: Deploy Updated Index
```bash
# Commit approved index
git add public/youtube_index.json
git commit -m "Update YouTube clips index"
git push

# Vercel auto-deploys on push
```

## 6️⃣ Testing Production

### Test TTS Endpoint
```bash
curl -X POST https://german-buddy-dayzero.vercel.app/api/german-tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Guten Tag", "voice": "Kore", "speed": 1.0}' \
  --output test.wav

# Play the audio
open test.wav  # macOS
# or
play test.wav  # Linux
```

### Test SRS Features
1. Visit https://german-buddy-dayzero.vercel.app/auth
2. Sign up with email/password
3. Return to home page
4. You should see "Saving progress" indicator
5. Complete exercises to test review tracking

### Test YouTube Clips
1. Visit main app
2. Click "Watch clips" on any phrase
3. Verify YouTube player loads with German content

## 7️⃣ Monitoring & Maintenance

### Backend Logs
```bash
# Fly.io
fly logs

# Render
# View in dashboard

# Railway
railway logs
```

### Frontend Analytics
- Vercel Analytics (automatic)
- Check build logs in Vercel dashboard

### Database Monitoring
```bash
# Connect to production DB
psql $DATABASE_URL

# Check user count
SELECT COUNT(*) FROM users;

# Check review count
SELECT COUNT(*) FROM reviews;
```

## 📋 Production Checklist

### Frontend (Vercel)
- [ ] Set `NEXT_PUBLIC_API_URL` to backend URL
- [ ] Set `GOOGLE_API_KEY` for TTS
- [ ] Do NOT set `YT_API_KEY` on Vercel
- [ ] Deploy with `vercel --prod`

### Backend (Fly/Render/Railway)
- [ ] Deploy FastAPI app
- [ ] Set `DATABASE_URL` to PostgreSQL
- [ ] Set `JWT_SECRET` securely
- [ ] Verify CORS allows frontend domain

### Data
- [ ] Curate A1/A2 sentences from Anki
- [ ] Import to backend via API
- [ ] Build YouTube index locally
- [ ] Review and approve clips

### Testing
- [ ] TTS endpoint returns audio
- [ ] Auth/signup works
- [ ] Reviews save to backend
- [ ] YouTube clips play

## 🆘 Troubleshooting

### "API connection failed"
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running
- Check CORS configuration

### "TTS not working"
- Verify `GOOGLE_API_KEY` is set on Vercel
- Check API key has Generative Language API enabled
- Test locally first

### "No exercises loading"
- Import SRS data to backend
- Check auth token is valid
- Verify fallback data exists in `public/srs/`

### "YouTube clips not showing"
- Build index locally first
- Review and approve clips
- Commit `youtube_index.json` to repo

## 🎉 Success!

Once deployed, your app will have:
- ✅ 100k+ German sentences with SRS
- ✅ AI-powered German TTS voices
- ✅ YouTube clips for authentic learning
- ✅ User accounts with progress tracking
- ✅ PWA with offline support

Production URL: https://german-buddy-dayzero.vercel.app

---

For support, open an issue on GitHub or check the README for more details.