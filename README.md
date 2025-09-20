# 🇩🇪 German Buddy - Day Zero

> **Cinema-quality German learning with authentic movie clips**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://german-buddy-dayzero.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 What Makes German Buddy Special

German Buddy revolutionizes language learning by combining **authentic German movie clips**, **Google AI-powered speech**, and a **massive 100k sentence database** with advanced spaced repetition. Unlike traditional apps, every phrase you learn comes with real cinema context and professional-quality German audio.

### ✨ Key Features

🎭 **Cinema-Quality Audio & Video**
- **Google AI Studio (Gemini 2.5 TTS)** with 30+ German voice styles
- Authentic German pronunciation from actual YouTube clips
- Context-aware audio (vocabulary, conversation, explanation, encouragement)
- Professional voice actors: Kore (educational), Puck (enthusiastic), Charon (formal), Zephyr (casual)

🎬 **Authentic Video Content**
- **YouTube Data API v3** integration with 24+ curated German phrases
- Real movie clips from Universal Pictures Germany, Deutsche Welle, Netflix Deutschland
- Cultural context for every phrase
- PlayPhrase.me fallback for extended content

🧠 **Advanced Learning Science**
- **100,000+ German sentences** from Anki community decks
- 7-dimensional mastery tracking (Recognition, Production, Pronunciation, Contextual, Cultural, Spelling, Speed)
- Quantum flip cards with confidence-based SRS
- Intelligent difficulty adaptation (A1-C2 levels)

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
| **AI & Audio** | Google AI Studio (Gemini 2.5 TTS), YouTube Data API v3 |
| **UI Components** | Quantum Cards, German Speaker Buttons, YouTube Clip Player |
| **Data** | 100k+ sentences from Anki decks, curated YouTube clips database |
| **APIs** | `/api/german-tts` endpoint, YouTube search integration |
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

# Set up environment variables (optional for basic usage)
echo "GOOGLE_API_KEY=your_api_key_here" > .env.local

# Start development server
npm run dev

# Open http://localhost:3000
```

### API Setup (Optional)

For full TTS and YouTube features, configure Google Cloud:

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Authenticate with Google Cloud
gcloud auth login

# Create project and enable APIs
gcloud projects create your-project-id
gcloud config set project your-project-id
gcloud services enable youtube.googleapis.com
gcloud services enable generativeai.googleapis.com

# Create API key
gcloud alpha services api-keys create --display-name="German Buddy API"
```

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
│   │   │   └── german-tts/       # Gemini 2.5 TTS API endpoint
│   │   ├── page.tsx              # Main learning interface
│   │   ├── layout.tsx            # App layout and metadata
│   │   └── globals.css           # Tailwind and custom styles
│   ├── components/
│   │   ├── QuantumCard.tsx       # Flip card learning component
│   │   ├── GermanSpeakerButton.tsx # TTS audio controls
│   │   ├── PlayPhrasePlayer.tsx  # Movie/YouTube clip integration
│   │   ├── YouTubeClipPlayer.tsx # YouTube video player
│   │   └── MasteryMatrix.tsx     # 7-dimensional progress display
│   ├── hooks/
│   │   └── useGermanTTS.ts       # React hooks for TTS integration
│   ├── lib/
│   │   ├── germanTTSService.ts   # Google AI Studio TTS service
│   │   ├── youtubeService.ts     # YouTube Data API integration
│   │   └── dataLoader.ts         # 100k sentence database loader
│   ├── scripts/
│   │   └── youtube_clip_finder.py # YouTube content discovery
│   ├── public/
│   │   ├── german_phrases.json   # Legacy phrase data
│   │   └── german_youtube_clips.json # YouTube clips database
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

### Phase 2: AI & Content Revolution ✅
- [x] **Google AI Studio (Gemini 2.5 TTS)** with 30+ German voices
- [x] **YouTube Data API v3** integration with authentic clips
- [x] **100,000+ German sentences** from Anki community
- [x] Context-aware audio generation (vocabulary, conversation, etc.)
- [x] Audio caching and performance optimization
- [x] Next.js 15 compliance and modern architecture

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