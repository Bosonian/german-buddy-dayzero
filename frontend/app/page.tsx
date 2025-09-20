'use client'

import { useState, useEffect } from 'react'
import QuantumCard from '@/components/QuantumCard'
import PlayPhrasePlayer from '@/components/PlayPhrasePlayer'
import SessionSummary from '@/components/SessionSummary'
import ExerciseSelector, { ExerciseType, ExerciseResult } from '@/components/ExerciseSelector'
import DataLoader, { GermanSentence } from '@/lib/dataLoader'
import { getDue, postReview } from '@/lib/api'

// Convert database sentences to exercise format
function convertToExerciseFormat(sentence: GermanSentence) {
  const source = sentence.source_deck ? sentence.source_deck.split('_')[0] : 'Corpus'
  return {
    id: parseInt(sentence.id) || Math.random(),
    german: sentence.german,
    english: sentence.english,
    example: sentence.extra || sentence.german,
    culturalNote: `${sentence.difficulty || 'A1'} level - Source: ${source}`,
    difficulty: sentence.difficulty,
    frequency: sentence.frequency
  }
}


export default function Home() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [confidence, setConfidence] = useState(50)
  const [streak, setStreak] = useState(7)
  const [wordsLearned, setWordsLearned] = useState(127)
  const [germanSentences, setGermanSentences] = useState<any[]>([])
  const [dataLoader, setDataLoader] = useState<DataLoader | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [currentLevel, setCurrentLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1')
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
  // Progressive constraint stage within a level (expands sentence length gradually)
  const [stage, setStage] = useState(0)

  // Initialize data loader and load sentences
  useEffect(() => {
    const initializeData = async () => {
      try {
        const loader = DataLoader.getInstance()
        await loader.loadData()
        setDataLoader(loader)

        // Start with strict short sentences for A1/A2
        const initialSentences = (currentLevel === 'A1' || currentLevel === 'A2')
          ? loader.getStrictByLevel(currentLevel as 'A1' | 'A2', 30)
          : loader.getRandomSentences(20, currentLevel)
        const convertedSentences = initialSentences.map(convertToExerciseFormat)
        setGermanSentences(convertedSentences)

        setIsLoadingData(false)
        console.log('📚 Loaded database:', loader.getAllData())
      } catch (error) {
        console.error('❌ Failed to load database:', error)
        setIsLoadingData(false)
      }
    }

    initializeData()
    // Reset stage when level changes
    setStage(0)
  }, [currentLevel])

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

  const currentPhrase = germanSentences[currentPhraseIndex] || {
    id: 1,
    german: "Loading...",
    english: "Loading data...",
    example: "Please wait...",
    culturalNote: "Loading your German sentences...",
    difficulty: 'A1'
  }

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
        const nextPhraseIndex = (currentPhraseIndex + 1) % germanSentences.length
        setCurrentPhraseIndex(nextPhraseIndex)

        // Load new sentences when running low
        if (nextPhraseIndex >= germanSentences.length - 3 && dataLoader) {
          const newSentences = dataLoader.getRandomSentences(10, currentLevel)
          const convertedSentences = newSentences.map(convertToExerciseFormat)
          setGermanSentences(prev => [...prev, ...convertedSentences])
        }
      }

      // Increment stage every 2 correct answers to allow longer sentences
      if (result.correct && (answers.length + 1) % 2 === 0) {
        setStage(prev => Math.min(prev + 1, 3))
        // If on low levels, expand pool with slightly longer items
        if (dataLoader && (currentLevel === 'A1' || currentLevel === 'A2')) {
          const more = dataLoader.getStrictByLevel(currentLevel as 'A1' | 'A2', 20 + stage * 10)
          const converted = more.map(convertToExerciseFormat)
          setGermanSentences(prev => {
            // merge unique by id/text
            const seen = new Set(prev.map(p => p.german))
            const merged = [...prev]
            for (const c of converted) {
              if (!seen.has(c.german)) merged.push(c)
            }
            return merged
          })
        }
      }

      // Reset card state
      setIsFlipped(false)
      setConfidence(50)
    }

    // Persist review to backend if logged in
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('gb_token') : null
      if (token && currentPhrase?.id) {
        const rating = result.correct ? 3 : 1
        postReview(currentPhrase.id, rating, 0, token).catch(() => {})
      }
    } catch {}

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
        {isLoadingData ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 via-black to-yellow-500 mx-auto mb-6 flex items-center justify-center text-xl font-bold animate-spin">D0</div>
            <h2 className="text-2xl font-bold mb-3">Loading German Database</h2>
            <p className="text-gray-400 mb-4">Preparing 100k+ authentic German sentences...</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : !sessionStarted ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 via-black to-yellow-500 mx-auto mb-6 flex items-center justify-center text-xl font-bold">D0</div>
            <h2 className="text-3xl font-bold mb-3">German Buddy</h2>
            <p className="text-gray-400 mb-4">Master German with 100k+ authentic sentences</p>

            {/* Level Selection */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Select your level:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setCurrentLevel(level)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      currentLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Database Stats */}
            {dataLoader && (
              <div className="mb-6 text-xs text-gray-500">
                Database: {dataLoader.getAllData().sentences.toLocaleString()} sentences •
                {dataLoader.getAllData().collocations} patterns •
                {dataLoader.getAllData().verbPreps} verb combinations
              </div>
            )}

            <button
              onClick={() => setSessionStarted(true)}
              disabled={germanSentences.length === 0}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-colors"
            >
              Start Learning ({currentLevel} Level)
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
              setStage(0)
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
