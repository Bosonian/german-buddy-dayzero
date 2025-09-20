'use client'

import { useState, useEffect } from 'react'
import QuantumCard from '@/components/QuantumCard'
import PlayPhrasePlayer from '@/components/PlayPhrasePlayer'
import SessionSummary from '@/components/SessionSummary'
import ExerciseSelector, { ExerciseType, ExerciseResult } from '@/components/ExerciseSelector'

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


export default function Home() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [confidence, setConfidence] = useState(50)
  const [streak, setStreak] = useState(7)
  const [wordsLearned, setWordsLearned] = useState(127)
  const [answers, setAnswers] = useState<{
    id: number
    german: string
    english: string
    exerciseType: ExerciseType
    result: ExerciseResult
  }[]>([])
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const sessionSize = 5

  // Exercise types cycle for comprehensive 7-dimensional training
  const exerciseTypes: ExerciseType[] = [
    'recognition',    // Start with familiar format
    'audio',         // Then listening comprehension
    'production',    // Active recall
    'spelling',      // Written accuracy
    'contextual',    // Situational awareness
    'pronunciation', // Speaking practice
    'speed'          // Fluency building
  ]

  const currentExerciseType = exerciseTypes[currentExerciseIndex % exerciseTypes.length]

  const currentPhrase = germanPhrases[currentPhraseIndex]

  const handleReveal = () => {
    setIsFlipped(true)
  }

  const handleSubmit = (difficulty: number) => {
    // Legacy function for quantum card compatibility
    const correct = difficulty >= 3
    const exerciseResult: ExerciseResult = {
      exerciseType: 'recognition',
      correct,
      confidence,
      dimensions: {
        recognition: correct ? Math.max(70, confidence) : Math.min(50, confidence),
        production: 0,
        pronunciation: 0,
        contextual: 0,
        cultural: 0,
        spelling: 0,
        speed: 0
      }
    }

    handleExerciseComplete(exerciseResult)
  }

  const handleExerciseComplete = (result: ExerciseResult) => {
    console.log('Exercise completed:', result)

    // Simple streak logic
    if (result.correct) {
      setStreak(streak + 1)
      setWordsLearned(wordsLearned + 1)
    }

    // Record answer
    setAnswers(prev => [...prev, {
      id: currentPhrase.id,
      german: currentPhrase.german,
      english: currentPhrase.english,
      exerciseType: currentExerciseType,
      result
    }])

    // Determine if session is complete
    if (answers.length + 1 >= sessionSize) {
      setSessionComplete(true)
      setIsFlipped(false)
    } else {
      // Move to next exercise and potentially next phrase
      const nextExerciseIndex = currentExerciseIndex + 1
      setCurrentExerciseIndex(nextExerciseIndex)

      // Every 2 exercises, move to next phrase for variety
      if (nextExerciseIndex % 2 === 0) {
        const nextPhraseIndex = (currentPhraseIndex + 1) % germanPhrases.length
        setCurrentPhraseIndex(nextPhraseIndex)
      }

      // Reset card state
      setIsFlipped(false)
      setConfidence(50)
    }

    // Show success feedback
    if (result.correct) {
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


        {/* Main Content */}
        {!sessionStarted ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 via-black to-yellow-500 mx-auto mb-6 flex items-center justify-center text-xl font-bold">D0</div>
            <h2 className="text-3xl font-bold mb-3">German Buddy</h2>
            <p className="text-gray-400 mb-8">Learn German with authentic movie clips</p>
            <button
              onClick={() => setSessionStarted(true)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-colors"
            >
              Start Learning
            </button>
          </div>
        ) : sessionComplete ? (
          <SessionSummary
            results={answers}
            onRestart={() => {
              setAnswers([])
              setSessionComplete(false)
              setCurrentPhraseIndex(0)
              setCurrentExerciseIndex(0)
              setIsFlipped(false)
              setConfidence(50)
              setSessionStarted(false)
            }}
          />
        ) : (
          <>
            {/* PlayPhrase Integration - Show for some exercise types */}
            {(currentExerciseType === 'recognition' || currentExerciseType === 'audio' || currentExerciseType === 'pronunciation') && (
              <PlayPhrasePlayer
                phrase={currentPhrase.german}
                englishTranslation={currentPhrase.english}
              />
            )}

            {/* Dynamic Exercise Component */}
            <ExerciseSelector
              phrase={currentPhrase}
              exerciseType={currentExerciseType}
              onComplete={handleExerciseComplete}
              confidence={confidence}
              onConfidenceChange={setConfidence}
              isFlipped={isFlipped}
              onReveal={handleReveal}
            />
          </>
        )}

        {/* Simple Progress */}
        {sessionStarted && !sessionComplete && (
          <div className="text-center pt-6">
            <div className="text-sm text-gray-400 mb-2">
              Progress: {answers.length} / {sessionSize}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(answers.length / sessionSize) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
