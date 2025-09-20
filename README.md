# 🇩🇪 German Buddy - Day Zero

> **Cinema-quality German learning with authentic movie clips**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://german-buddy-dayzero.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 What Makes German Buddy Special

German Buddy combines **authentic German movie clips** with **in‑app looping YouTube segments** and optional **Google AI‑powered speech**. Every phrase includes real context and clean UI for focused practice.

### ✨ Key Features

🎭 **Audio & Video**
- Optional Google AI Studio (Gemini 2.5 TTS) endpoint for on‑demand audio
- In‑app YouTube segment playback with captions (looped start/end)
- Companion flow to open PlayPhrase.me when no embeddable clip exists

🎬 **Authentic Video Content**
- **YouTube Data API v3** integration with 24+ curated German phrases
- Real movie clips from Universal Pictures Germany, Deutsche Welle, Netflix Deutschland
- Cultural context for every phrase
- PlayPhrase.me fallback for extended content

🧠 **Advanced Learning Science**
- 7-dimensional mastery tracking (Recognition, Production, Pronunciation, Contextual, Cultural, Spelling, Speed)
- Quantum flip cards with confidence-based SRS
- Intelligent difficulty adaptation

📱 **Modern PWA Experience**
- Offline-first functionality with audio caching
- Install on any device (mobile, desktop, tablet)
- German cultural theming (🖤❤️💛)
- Responsive design for all screen sizes

## 🚀 Live Demo

**🌐 [Try German Buddy Now](https://german-buddy-dayzero.vercel.app)**

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15.5.3, TypeScript, Tailwind CSS |
| **AI & Audio** | Google AI Studio (Gemini 2.5 TTS), YouTube Data API v3 (indexer) |
| **UI Components** | Quantum Cards, YouTube Clip Player, Mastery Matrix |
| **Data** | Local phrases JSON; optional auto‑built YouTube clips index |
| **APIs** | `/api/german-tts` endpoint; Node indexer script for YouTube |
| **Deployment** | Vercel with automatic GitHub deployment |
| **Performance** | Static generation, audio caching, image optimization |

## 🏁 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone https://github.com/Bosonian/german-buddy-dayzero.git
cd german-buddy-dayzero

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Then edit .env.local to set GOOGLE_API_KEY and (optional) YT_API_KEY

# Start development server
npm run dev

# Open http://localhost:3000
```

### API Setup (Optional)

- Google AI Studio: create an API key and set `GOOGLE_API_KEY` for `/api/german-tts`.
- YouTube Data API v3: create an API key and set `YT_API_KEY` to run the indexer.

### Build for Production

```bash
# Create optimized build
npm run build

# Start production server
npm start
```

## 📱 PWA Installation

German Buddy works as a Progressive Web App:

1. **Desktop**: Look for the install prompt in your browser
2. **Mobile**: Add to Home Screen from browser menu
3. **Offline**: Full functionality without internet connection

## 🎯 Learning Methodology

### 7-Dimensional Mastery Matrix

German Buddy tracks your progress across seven learning dimensions:

| Dimension | Description |
|-----------|-------------|
| **Recognition** | Understanding phrases when heard |
| **Production** | Ability to recall and use phrases |
| **Pronunciation** | Correct German accent and intonation |
| **Contextual** | Using phrases in appropriate situations |
| **Cultural** | Understanding cultural nuances |
| **Spelling** | Written German accuracy |
| **Speed** | Fluent, natural delivery |

### Quantum Flip Cards

Our unique card system adapts to your confidence level:
- **High confidence**: Longer intervals between reviews
- **Low confidence**: More frequent practice
- **Real-time adjustment**: Based on your self-assessment

## 🎬 PlayPhrase.me Integration

Every German phrase connects to authentic movie clips:

```typescript
// Example: "Guten Morgen" → https://www.playphrase.me/#/search?q=guten+morgen&language=de
const searchQuery = phrase.toLowerCase()
  .replace(/[äöü]/g, match => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[match] || match))
  .replace(/ß/g, 'ss')
  .replace(/[^a-z0-9\s]/g, '')
  .replace(/\s+/g, '+')
```

## 📊 Project Structure

```
german-buddy-dayzero/
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   └── german-tts/       # Gemini 2.5 TTS API endpoint (optional)
│   │   ├── page.tsx              # Main learning interface
│   │   ├── layout.tsx            # App layout and metadata
│   │   └── globals.css           # Tailwind and custom styles
│   ├── components/
│   │   ├── QuantumCard.tsx       # Flip card learning component
│   │   ├── PlayPhrasePlayer.tsx  # Movie/YouTube clip integration
│   │   ├── YouTubeClipPlayer.tsx # YouTube video player
│   │   ├── YouTubeClips.tsx      # Multi-clip selector + context
│   │   └── MasteryMatrix.tsx     # 7-dimensional progress display
│   ├── hooks/
│   │   └── (optional)
│   ├── lib/
│   │   └── (reserved for future services)
│   ├── scripts/
│   │   ├── youtube_indexer.mjs   # YouTube search + transcript timestamps
│   │   ├── channels.json         # Curated German channels
│   │   └── phrases.json          # Seed phrases list
│   ├── public/
│   │   ├── german_phrases.json   # Legacy phrase data
│   │   ├── youtube_index.json    # Auto-built clips index (optional)
│   │   └── manifest.json         # PWA manifest
│   └── package.json              # Dependencies and scripts
├── backend/                      # Future FastAPI integration
└── README.md                     # This file
```

## 🌍 Deployment

### Vercel Configuration

For deploying to Vercel:

- **Root Directory**: `frontend`
- **Framework**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next` (auto-detected)

### Custom Domain Setup

To connect your domain (like DayZero.xyz):
1. Add domain in Vercel dashboard
2. Update DNS records to point to Vercel
3. SSL certificates are automatically provisioned

## 🔄 Continuous Deployment

Every push to `main` branch automatically:
1. Triggers Vercel build
2. Runs TypeScript compilation
3. Optimizes for production
4. Deploys to live URL

## 📣 Current Status (What’s Done vs. What’s Blocking)

### ✅ What We’ve Achieved
- YouTube clips in‑app: Looped segment player with captions, multi‑clip selector, and context lines before/after.
- Clip discovery pipeline: Script builds `public/youtube_index.json` via YouTube Search + transcripts; admin reviewer UI at `/admin/youtube-review` to approve results.
- PlayPhrase fallback: Clear CTA to open external results when no embeddable clip is found (with mini‑preview fallback when possible).
- TTS endpoint hardened: `/api/german-tts` uses server env `GOOGLE_API_KEY`, returns audio bytes (wav) with correct headers.
- Strict A1/A2 lessons: Short sentences only for early levels (no commas/complex clauses), plus gradual difficulty increase within a session.
- SRS foundation: Backend auth (signup/login), per‑user SM‑2 scheduling with `/srs/due` and `/srs/review`, and import endpoint for initial items.
- SRS data tooling: Curator script converts Anki CSVs → chunked JSON under `public/srs/{level}/part-XXX.json`; importer posts those to backend.

### ⚠️ What’s Blocking / Known Issues
- Environment configuration in Vercel:
  - `NEXT_PUBLIC_API_URL` must point to the backend (e.g., `https://api.yourdomain.com`). If not set, the app tries `http://localhost:8080` and SRS/auth won’t work in prod.
  - `GOOGLE_API_KEY` is required on the server for the TTS endpoint; never expose TTS keys client‑side.
  - The YouTube indexer runs locally; do not set `YT_API_KEY` on Vercel.
- API keys and security:
  - Rotate any key posted in plaintext and restrict per‑service (YouTube Data API v3, Generative Language API).
  - Prefer separate keys (AI Studio vs. YouTube) or strictly restrict one key to both services.
- Data curation/licensing:
  - Large Anki datasets shouldn’t be committed wholesale; use the curator to produce small per‑level chunks. Verify redistribution rights.
- SRS algorithm:
  - Phase‑1 uses SM‑2; FSRS (state‑of‑the‑art) is planned next.
  - Due queue UI is minimal; a richer view (due/learning/new) is on the roadmap.
- PlayPhrase embedding:
  - Most pages block iframe embedding (X‑Frame‑Options/CSP). We provide a side CTA; mini‑preview shows a graceful fallback when blocked.

### ▶️ Immediate Next Steps
- Backend URL: Set `NEXT_PUBLIC_API_URL` in Vercel to your backend origin.
- TTS: Set `GOOGLE_API_KEY` in Vercel (server env only) to enable `/api/german-tts`.
- Curate and import A1/A2:
  - `node scripts/curate_srs.mjs --csv-dir "/path/to/anki_data/output" --levels A1,A2 --min-frequency 400 --chunk 1000`
  - Start backend and import: `TOKEN=<jwt> API=<backend> npm run srs:import`
- Build YouTube index and approve:
  - `YT_API_KEY=<key> npm run yt:index`, then review at `/admin/youtube-review` and replace `public/youtube_index.json`.

### 🔮 Near‑Term Roadmap
- Replace SM‑2 with FSRS on the backend; persist review logs for parameter tuning.
- Harden auth (httpOnly cookies + refresh tokens) and add offline review sync.
- Improve “Due” UX on the home screen (due/learning/new counts; session suggestions).
- Expand curated channels and ranking (recency/views/quality weighting).

## 🎨 Design Philosophy

**German Cultural Integration**
- Color scheme inspired by German flag (🖤❤️💛)
- Typography optimized for German text
- Cultural context for every phrase

**User Experience Principles**
- Zero cognitive overload
- Immediate feedback
- Progressive disclosure
- Mobile-first design

## 📈 Roadmap

### Phase 1: Foundation ✅
- [x] Next.js PWA setup
- [x] Quantum flip cards
- [x] Mastery matrix
- [x] PlayPhrase.me integration
- [x] Vercel deployment

### Phase 2: AI & Content Enhancements 🚧
- [ ] Google AI Studio TTS endpoint hardened and documented
- [x] YouTube segment player with multi-clip selector
- [x] YouTube indexer (search + transcripts) with reviewer UI
- [ ] Expand phrases and finalize curated sources

### Phase 3: Advanced Features 🚧
- [ ] Voice recognition and pronunciation scoring
- [ ] User accounts and progress sync across devices
- [ ] Expanded YouTube clips database (500+ phrases)
- [ ] Advanced SRS algorithms with AI recommendations

### Phase 4: Social & Gamification 🔮
- [ ] Social learning features and study groups
- [ ] AI-powered conversation practice with Gemini
- [ ] Gamification with German cities and achievements
- [ ] Integration with German media (news, podcasts)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain mobile-first responsive design
- Add JSDoc comments for complex functions
- Test thoroughly on different devices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI Studio** for revolutionary Gemini 2.5 TTS technology
- **YouTube Data API v3** for authentic German video content
- **PlayPhrase.me** for providing additional movie clips
- **Anki Community** for the massive German sentence database
- **Next.js** team for the excellent framework
- **Vercel** for seamless deployment
- **German content creators** (Universal Pictures Germany, Deutsche Welle, Netflix Deutschland) for authentic learning material

---

<div align="center">

**🇩🇪 Guten Tag! Ready to start your German journey? 🇩🇪**

[**Launch German Buddy →**](https://german-buddy-dayzero.vercel.app)

*Built with ❤️ for language learners worldwide*

</div>
