'use client'

import { useState, useEffect } from 'react'
import QuantumCard from '@/components/QuantumCard'
import MasteryMatrix from '@/components/MasteryMatrix'
import PlayPhrasePlayer from '@/components/PlayPhrasePlayer'
import SessionSummary from '@/components/SessionSummary'

// Real German phrases from your PlayPhrase data
const germanPhrases = [
  {
    id: 1,
    german: "Guten Morgen",
    english: "Good morning",
    example: "Guten Morgen! Wie haben Sie geschlafen?",
    culturalNote: "Standard morning greeting in German-speaking countries, more formal than 'Morgen'"
  },
  {
    id: 2,
    german: "Wie geht's?",
    english: "How are you?",
    example: "Hey, wie geht's dir denn heute?",
    culturalNote: "Casual greeting between friends and family, shortened from 'Wie geht es dir?'"
  },
  {
    id: 3,
    german: "Danke schön",
    english: "Thank you very much",
    example: "Danke schön für Ihre Hilfe!",
    culturalNote: "More formal and emphatic than just 'Danke', shows genuine gratitude"
  },
  {
    id: 4,
    german: "Entschuldigung",
    english: "Excuse me / I'm sorry",
    example: "Entschuldigung, wo ist der Bahnhof?",
    culturalNote: "Can mean both 'excuse me' (to get attention) and 'I'm sorry' depending on context"
  },
  {
    id: 5,
    german: "Auf Wiedersehen",
    english: "Goodbye",
    example: "Auf Wiedersehen, bis morgen!",
    culturalNote: "Formal goodbye, literally means 'until we see each other again'"
  },
  {
    id: 6,
    german: "Ich liebe dich",
    english: "I love you",
    example: "Ich liebe dich von ganzem Herzen.",
    culturalNote: "Strong declaration of love, used in romantic relationships"
  },
  {
    id: 7,
    german: "Was ist los?",
    english: "What's wrong? / What's up?",
    example: "Was ist los mit dir heute?",
    culturalNote: "Used when sensing something is wrong or to ask what's happening"
  }
]

const mockMastery = {
  recognition: 75,
  production: 40,
  pronunciation: 60,
  contextual: 55,
  cultural: 30,
  spelling: 80,
  speed: 45
}

export default function Home() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [confidence, setConfidence] = useState(50)
  const [streak, setStreak] = useState(7)
  const [wordsLearned, setWordsLearned] = useState(127)
  const [answers, setAnswers] = useState<{ id: number; german: string; english: string; difficulty: number; confidence: number }[]>([])
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const sessionSize = 5

  const currentPhrase = germanPhrases[currentPhraseIndex]

  const handleReveal = () => {
    setIsFlipped(true)
  }

  const handleSubmit = (difficulty: number) => {
    // Here we'll integrate with the SRS system
    console.log('Submitted with difficulty:', difficulty, 'confidence:', confidence)

    // Simple streak logic
    if (difficulty >= 3) {
      setStreak(streak + 1)
      setWordsLearned(wordsLearned + 1)
    }

    // Record answer
    setAnswers(prev => [...prev, {
      id: currentPhrase.id,
      german: currentPhrase.german,
      english: currentPhrase.english,
      difficulty,
      confidence
    }])

    // Determine if session is complete
    if (answers.length + 1 >= sessionSize) {
      setSessionComplete(true)
      setIsFlipped(false)
    } else {
      // Move to next phrase
      const nextIndex = (currentPhraseIndex + 1) % germanPhrases.length
      setCurrentPhraseIndex(nextIndex)
      // Reset card state
      setIsFlipped(false)
      setConfidence(50)
    }

    // Show success toast (you can implement toast later)
    if (difficulty >= 3) {
      console.log('Great! Keep it up! 🎉')
    } else {
      console.log('No worries, practice makes perfect! 💪')
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 via-black to-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D0</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">German Buddy</h1>
              <p className="text-xs text-gray-400">Day Zero - Start Your Journey</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Streak</p>
              <p className="text-lg font-bold">{streak} 🔥</p>
            </div>
          </div>
        </header>

        {/* Mastery Progress */}
        <MasteryMatrix mastery={mockMastery} />

        {/* Main Content */}
        {!sessionStarted ? (
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 via-black to-yellow-500 mx-auto mb-4 flex items-center justify-center text-xl font-bold">D0</div>
            <h2 className="text-2xl font-bold mb-2">Ready to Learn?</h2>
            <p className="text-gray-400 mb-6">Today’s goal: Learn {sessionSize} phrases with real movie context.</p>
            <button
              onClick={() => setSessionStarted(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
              aria-label="Start Session"
            >
              Start Session
            </button>
          </div>
        ) : sessionComplete ? (
          <SessionSummary
            results={answers}
            onRestart={() => {
              setAnswers([])
              setSessionComplete(false)
              setCurrentPhraseIndex(0)
              setIsFlipped(false)
              setConfidence(50)
              setSessionStarted(false)
            }}
          />
        ) : (
          <>
            {/* PlayPhrase Integration */}
            <PlayPhrasePlayer
              phrase={currentPhrase.german}
              englishTranslation={currentPhrase.english}
            />

            {/* Learning Card */}
            <QuantumCard
              phrase={currentPhrase}
              isFlipped={isFlipped}
              onReveal={handleReveal}
              onSubmit={handleSubmit}
              confidence={confidence}
              onConfidenceChange={setConfidence}
            />
          </>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{wordsLearned}</p>
            <p className="text-sm text-gray-400">Words Learned</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">89%</p>
            <p className="text-sm text-gray-400">Accuracy</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">A2</p>
            <p className="text-sm text-gray-400">Level</p>
          </div>
        </div>

        {/* Current Phrase Info */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-bold mb-2 flex items-center">
            💡 Cultural Context
          </h3>
          <p className="text-gray-300 text-sm">
            {currentPhrase.culturalNote}
          </p>
        </div>

        {/* Navigation / Progress */}
        {sessionStarted && !sessionComplete && (
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-400">
              {answers.length} / {sessionSize} this session
            </div>

            <span className="text-sm text-gray-400">
              Card {currentPhraseIndex + 1} of {germanPhrases.length}
            </span>

            <button
              onClick={() => {
                const nextIndex = (currentPhraseIndex + 1) % germanPhrases.length
                setCurrentPhraseIndex(nextIndex)
                setIsFlipped(false)
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
            >
              Skip →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
