'use client'

import { useState, useEffect } from 'react'
import QuantumCard from '@/components/QuantumCard'
import PlayPhrasePlayer from '@/components/PlayPhrasePlayer'
import SessionSummary from '@/components/SessionSummary'
import ExerciseSelector, { ExerciseType, ExerciseResult } from '@/components/ExerciseSelector'
import { getExercises, postReview } from '@/lib/api'
import NotificationSetup, { markLearningSession } from '@/components/NotificationSetup'
import { PhraseTracker } from '@/lib/phraseProgress'
import ConfidenceBooster, { StreakIndicator, MilestoneCelebration } from '@/components/ConfidenceBooster'

export default function Home() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [confidence, setConfidence] = useState(50)
  const [streak, setStreak] = useState(7)
  const [wordsLearned, setWordsLearned] = useState(127)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [germanSentences, setGermanSentences] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [answers, setAnswers] = useState<{
    id: number
    german: string
    english: string
    exerciseType: ExerciseType
    result: ExerciseResult
  }[]>([])
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [showNotificationSetup, setShowNotificationSetup] = useState(false)
  const [learnedPhrases, setLearnedPhrases] = useState<Set<number>>(new Set())
  const [phraseTracker] = useState(() => new PhraseTracker())
  const [adaptiveDailyQuota, setAdaptiveDailyQuota] = useState(3)
  const [confidenceBooster, setConfidenceBooster] = useState<{message: string, bonus: number} | null>(null)
  const [milestone, setMilestone] = useState<any>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  // Progressive constraint stage within a level (expands sentence length gradually)
  const [stage, setStage] = useState(0)

  const [isClient, setIsClient] = useState(false)

  // Initialize data loader and load sentences
  useEffect(() => {
    setIsClient(true)
    // Read auth token once on mount/level change
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('gb_token'))
    }
    const initializeData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('gb_token') : null
        const userLevel = typeof window !== 'undefined' ? localStorage.getItem('gb_proficiency_level') : null
        if (token) {
          try {
            const exercises = await getExercises(20, token, userLevel || 'A1')
            if (exercises && exercises.length) {
              setGermanSentences(exercises)
              setIsLoadingData(false)
              return
            }
          } catch {}
        }

        // Fallback: if no token or exercises found, load from public
        try {
          const fallbackLevel = userLevel || 'A1'
          const res = await fetch(`/srs/${fallbackLevel}/part-001.json`) // Use user's level for fallback
          if (res.ok) {
            const list = await res.json()
            const first = (list as any[]).slice(0, 30).map((r: any) => ({
              id: r.id,
              german: r.german,
              english: r.english,
              example: r.german,
              culturalNote: `${fallbackLevel} level - Source: Corpus`,
              difficulty: fallbackLevel,
              frequency: r.frequency || 0
            }))
            setGermanSentences(first)
            setIsLoadingData(false)
            return
          }
        } catch {}

        setIsLoadingData(false)
      } catch (error) {
        console.error('❌ Failed to load database:', error)
        setIsLoadingData(false)
      }
    }

    initializeData()
    // Reset stage when level changes
    setStage(0)

    // Set adaptive daily quota
    const adaptiveQuota = phraseTracker.getAdaptiveDailyGoal()
    setAdaptiveDailyQuota(adaptiveQuota)

    // Get current streak
    const stats = phraseTracker.getProgressStats()
    setCurrentStreak(stats.currentStreak)
  }, [])

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
    difficulty: 'A1',
    pattern: "",
    source: ""
  }

  const handleReveal = () => {
    setIsFlipped(true)
  }

  const handleSubmit = (difficulty: number) => {
    // Traffic light system: 1=Hard, 2=Medium, 3=Easy
    const correct = difficulty >= 2 // Medium and Easy are considered correct attempts
    const isEasy = difficulty === 3 // Only Easy (3) counts as learned

    const exerciseResult: ExerciseResult = {
      exerciseType: 'recognition',
      correct,
      confidence: isEasy ? 85 : (difficulty === 2 ? 60 : 30), // Map traffic light to confidence
      dimensions: {
        recognition: isEasy ? 85 : (difficulty === 2 ? 60 : 30),
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

    // Record answer
    setAnswers(prev => [...prev, {
      id: currentPhrase.id,
      german: currentPhrase.german,
      english: currentPhrase.english,
      exerciseType: currentExerciseType,
      result
    }])

    // Track phrase progress with new system
    const progress = phraseTracker.trackExercise(
      currentPhrase.id,
      currentExerciseType,
      result.correct,
      result.confidence
    )

    // Update learned phrases using more forgiving criteria
    let newLearnedPhrases = learnedPhrases

    // More forgiving completion: Easy rating OR good progress OR multiple attempts
    const isCompleted = result.correct && (
      result.confidence >= 70 || // Lowered from 80
      progress.status === 'mastered' ||
      progress.status === 'learning' ||
      (progress.exposures >= 2 && progress.successCount >= 1) // At least 1 success in 2+ tries
    )

    if (isCompleted && !learnedPhrases.has(currentPhrase.id)) {
      newLearnedPhrases = new Set([...learnedPhrases, currentPhrase.id])
      setLearnedPhrases(newLearnedPhrases)

      // Check for milestones
      if (newLearnedPhrases.size === 1) {
        setMilestone({
          type: 'first_phrase',
          title: 'First Phrase Complete!',
          description: 'Congratulations on completing your first German phrase!',
          reward: 'Confidence boost +10'
        })
      }
      setStreak(streak + 1)
      setWordsLearned(wordsLearned + 1)
      console.log(`✅ Completed phrase: "${currentPhrase.german}" (${newLearnedPhrases.size}/${adaptiveDailyQuota})`)

      // Check for confidence booster
      const booster = phraseTracker.getConfidenceBooster()
      if (booster.shouldBoost) {
        setConfidenceBooster({ message: booster.message, bonus: booster.bonus })
      }
    }

    // Check if adaptive daily quota is reached
    if (newLearnedPhrases.size >= adaptiveDailyQuota) {
      // Record successful session
      phraseTracker.recordSession(
        newLearnedPhrases.size,
        answers.length + 1,
        answers.reduce((sum, a) => sum + a.result.confidence, result.confidence) / (answers.length + 1)
      )

      setSessionComplete(true)
      setIsFlipped(false)
      // Mark that user completed learning session today
      markLearningSession()

      // Show success notification if notifications are enabled
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('German Buddy - Goal Achieved! 🎉', {
          body: `Fantastic! You've learned ${adaptiveDailyQuota} unique phrases today. See you tomorrow!`,
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          tag: 'goal-achieved'
        })
      }
    } else {
      // Move to next exercise and potentially next phrase
      const nextExerciseIndex = currentExerciseIndex + 1
      setCurrentExerciseIndex(nextExerciseIndex)

      // Every 2 exercises, move to next phrase for variety
      if (nextExerciseIndex % 2 === 0) {
        const nextPhraseIndex = (currentPhraseIndex + 1) % germanSentences.length
        setCurrentPhraseIndex(nextPhraseIndex)

        // Load new sentences when running low
        if (nextPhraseIndex >= germanSentences.length - 3) {
          // Fetch more exercises from the backend
          const userLevel = typeof window !== 'undefined' ? localStorage.getItem('gb_proficiency_level') : null
          getExercises(10, authToken || '', userLevel || 'A1').then(newExercises => {
            setGermanSentences(prev => [...prev, ...newExercises])
          }).catch(error => {
            console.error('❌ Failed to load more exercises:', error)
          })
        }
      }

      // Increment stage every 2 correct answers to allow longer sentences
      if (result.correct && (answers.length + 1) % 2 === 0) {
        setStage(prev => Math.min(prev + 1, 3))
      }

      // Reset card state
      setIsFlipped(false)
      setConfidence(50)
    }

    // Persist review to backend if logged in
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('gb_token') : null
      if (token && currentPhrase?.id) {
        // For traffic light system: rating 3 = Easy, rating 2 = Medium, rating 1 = Hard
        let rating = 1 // Default to Hard
        if (result.correct) {
          if (result.exerciseType === 'recognition' && currentExerciseType === 'recognition') {
            // Traffic light system rating based on confidence
            const isEasy = result.confidence >= 80 || (result.dimensions && result.dimensions.recognition >= 80)
            rating = isEasy ? 3 : 2
          } else {
            rating = 3 // Other exercise types default to Easy if correct
          }
        }
        postReview(currentPhrase.id, rating, token).catch(() => {})
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

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Auth / Progress indicator */}
            {isClient ? (
              authToken ? (
                <>
                  {/* Desktop: Full progress indicator */}
                  <div className="hidden sm:flex items-center gap-2 bg-green-900/20 border border-green-700 text-green-300 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs font-medium">Saving progress{typeof dueCount === 'number' ? ` • ${dueCount} due` : ''}</span>
                  </div>
                  {/* Mobile: Just green dot */}
                  <div className="sm:hidden flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  {/* Sign out button */}
                  <button
                    onClick={() => {
                      localStorage.removeItem('gb_token')
                      setAuthToken(null)
                      window.location.reload()
                    }}
                    className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1 bg-red-900/20 hover:bg-red-900/30 border border-red-700 text-red-300 rounded-full text-xs font-medium transition-colors"
                    title="Sign out"
                  >
                    <span className="sm:hidden">🚪</span>
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Desktop: Full sign-in button */}
                  <a href="/auth" className="hidden sm:inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1 rounded-full text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    Sign in to save progress
                  </a>
                  {/* Mobile: Compact sign-in button */}
                  <a href="/auth" className="sm:hidden flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold transition-colors" title="Sign in">
                    👤
                  </a>
                </>
              )
            ) : (
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 px-2 sm:px-3 py-1 rounded-full animate-pulse">
                <span className="text-xs font-medium">...</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm text-gray-400">Daily Goal</p>
              <p className="text-lg font-bold">{learnedPhrases.size}/{adaptiveDailyQuota} 🎯</p>
            </div>
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
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 via-black to-yellow-500 mx-auto mb-6 flex items-center justify-center text-xl font-bold">D0</div>
              <h2 className="text-3xl font-bold mb-3">German Buddy</h2>
              <p className="text-gray-400 mb-4">Master German with 100k+ authentic sentences</p>

              {/* Database Stats */}
              <div className="mb-6 text-xs text-gray-500">
                Database: {germanSentences.length.toLocaleString()} sentences loaded
              </div>

              <button
                onClick={() => setSessionStarted(true)}
                disabled={germanSentences.length === 0}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-colors"
              >
                Start Learning
              </button>
            </div>

            {/* Notification Setup */}
            {!showNotificationSetup ? (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔔</span>
                    <div>
                      <h3 className="font-semibold text-blue-300">Daily Learning Reminders</h3>
                      <p className="text-sm text-blue-200">Never miss your German practice!</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotificationSetup(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Set Up
                  </button>
                </div>
              </div>
            ) : (
              <NotificationSetup
                onPermissionChanged={(granted) => {
                  if (granted) {
                    // Auto-hide setup after successful permission
                    setTimeout(() => setShowNotificationSetup(false), 3000)
                  }
                }}
              />
            )}
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
              setLearnedPhrases(new Set())
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
              Daily Progress: {learnedPhrases.size} / {adaptiveDailyQuota} phrases
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(learnedPhrases.size / adaptiveDailyQuota) * 100}%` }}
              />
            </div>
            <div className="text-xs text-green-400 mt-2">
              {learnedPhrases.size === 0 && "Let's start learning! 🚀"}
              {learnedPhrases.size > 0 && learnedPhrases.size < adaptiveDailyQuota && `Great progress! ${adaptiveDailyQuota - learnedPhrases.size} more to go! 🎯`}
              {learnedPhrases.size >= adaptiveDailyQuota && "Daily goal complete! Amazing! 🎉"}
            </div>
          </div>
        )}

      </div>

      {/* Fixed position components */}
      <StreakIndicator streak={currentStreak} position="top-right" />

      {/* Celebration overlays */}
      {confidenceBooster && (
        <ConfidenceBooster
          message={confidenceBooster.message}
          bonus={confidenceBooster.bonus}
          onComplete={() => setConfidenceBooster(null)}
        />
      )}

      {milestone && (
        <MilestoneCelebration
          milestone={milestone}
          onComplete={() => setMilestone(null)}
        />
      )}
    </main>
  )
}
