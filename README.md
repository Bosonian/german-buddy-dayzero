# 🇩🇪 German Buddy - Day Zero

> **Cinema-quality German learning with authentic movie clips**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://german-buddy-dayzero.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 What Makes German Buddy Special

German Buddy revolutionizes language learning by combining **authentic German movie clips** with advanced spaced repetition. Unlike traditional apps, every phrase you learn comes with real cinema context from PlayPhrase.me.

### ✨ Key Features

🎬 **Real Movie Integration**
- Authentic German pronunciation from actual films
- Cultural context for every phrase
- PlayPhrase.me integration for immersive learning

🧠 **Advanced Learning Science**
- 7-dimensional mastery tracking (Recognition, Production, Pronunciation, Contextual, Cultural, Spelling, Speed)
- Quantum flip cards with confidence-based SRS
- Intelligent difficulty adaptation

📱 **Modern PWA Experience**
- Offline-first functionality
- Install on any device (mobile, desktop, tablet)
- German cultural theming (🖤❤️💛)
- Responsive design for all screen sizes

## 🚀 Live Demo

**🌐 [Try German Buddy Now](https://german-buddy-dayzero.vercel.app)**

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15.5.3, TypeScript, Tailwind CSS |
| **UI Components** | Quantum Cards, Mastery Matrix, PlayPhrase Player |
| **Data** | Local JSON with curated German phrases |
| **Deployment** | Vercel with automatic GitHub deployment |
| **Performance** | Static generation, image optimization |

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

# Start development server
npm run dev

# Open http://localhost:3000
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
│   │   ├── page.tsx              # Main learning interface
│   │   ├── layout.tsx            # App layout and metadata
│   │   └── globals.css           # Tailwind and custom styles
│   ├── components/
│   │   ├── QuantumCard.tsx       # Flip card learning component
│   │   ├── MasteryMatrix.tsx     # 7-dimensional progress display
│   │   └── PlayPhrasePlayer.tsx  # Movie clip integration
│   ├── public/
│   │   └── german_phrases.json   # Curated German phrases with metadata
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

### Phase 2: Enhancement 🚧
- [ ] Voice recognition and pronunciation scoring
- [ ] User accounts and progress sync
- [ ] Expanded phrase library (500+ phrases)
- [ ] Offline mode improvements

### Phase 3: Advanced Features 🔮
- [ ] Social learning features
- [ ] AI-powered conversation practice
- [ ] Gamification with German cities
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

- **PlayPhrase.me** for providing authentic German movie clips
- **Next.js** team for the excellent framework
- **Vercel** for seamless deployment
- **German cinema** for inspiring authentic learning

---

<div align="center">

**🇩🇪 Guten Tag! Ready to start your German journey? 🇩🇪**

[**Launch German Buddy →**](https://german-buddy-dayzero.vercel.app)

*Built with ❤️ for language learners worldwide*

</div>