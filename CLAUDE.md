- What I implemented

- Backend reading API and storage
    - Models: reading_items and user_reading in backend/app/reading.py.
    - Endpoints:
    - `GET /reading/daily?level=A1&limit=2`: fetch latest items by level.
    - `POST /reading/track`: record “read” (requires auth).
    - `POST /reading/import`: seed items (requires auth).
- 
Included the router in backend/app/main.py, with health reporting updated.
- 
Frontend reading page
    - frontend/app/reading/page.tsx: Level selector (A1–C2), displays daily readings, “Mark Read” posts to backend if logged in.
- 
Ingestion script (efficient, compliant)
    - frontend/scripts/ingest_readings.mjs: Pulls CC BY‑SA text from German Wikipedia (REST API), splits to paragraphs, grades CEFR with lightweight rules, and imports to backend.
    - Usage:
    - node scripts/ingest_readings.mjs --api https://api.yourdomain.com --token <JWT> --levels A1,A2,B1 --per-level 2
- 
Ensures license metadata (CC BY‑SA 4.0), title, source_url are saved.
- 
NPM script
    - reading:ingest added to frontend/package.json.

How to run end-to-end

- Backend
    - Deploy or run locally: uvicorn app.main:app --reload --port 8080
    - Create a token (via /auth).
- Ingest daily readings
    - cd frontend
    - TOKEN=<jwt> API=http://localhost:8080 npm run reading:ingest -- --levels A1,A2 --per-level 2
    - Check GET /reading/daily?level=A1 to verify items exist.
- Frontend
    - Ensure NEXT_PUBLIC_API_URL points to backend.
    - Open /reading, choose level, see items; if logged in, “Mark Read” posts events.

Why this is efficient for our use case

- Uses an open, reliable source (Wikipedia DE) with proper licensing to bootstrap content quickly.
- Lightweight CEFR grading approximates levels using surface features that correlate strongly at A1–B1 (sentence length, commas, subordination markers).
- Paragraph segmentation produces enough bite-sized content for daily reading without heavy NLP.
- Simple cron-friendly ingestion: can run nightly to refresh daily sets.

Next (optional, I can do this next)

- Add a GitHub Action or a server cron to run reading:ingest nightly.
- Add basic comprehension (true/false, cloze) generation on the frontend for each paragraph.
- Improve CEFR grading: add lexical frequency lists and unknown-word rate using the user’s SRS vocabulary for i+1 targeting.
- Extend sources (Wikinews DE, public domain) and topic tagging; add Redis caching for /reading/daily.