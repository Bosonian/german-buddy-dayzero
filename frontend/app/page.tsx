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

const phraseTracker = new PhraseTracker()

const exerciseTypes: ExerciseType[] = [
  'recognition',    // Start with familiar format
  'audio',         // Then listening comprehension
  'production',    // Active recall
  'spelling',      // Written accuracy
  'contextual',    // Situational awareness
  'pronunciation', // Speaking practice
  'speed'          // Fluency building
]

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

  const [adaptiveDailyQuota, setAdaptiveDailyQuota] = useState(3)
  const [confidenceBooster, setConfidenceBooster] = useState<{message: string, bonus: number} | null>(null)
  const [milestone, setMilestone] = useState<any>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  // Progressive constraint stage within a level (expands sentence length gradually)
  const [stage, setStage] = useState(0)

  const [isClient, setIsClient] = useState(false)
  const [userLevel, setUserLevel] = useState('A1')

  // Initialize data loader and load sentences
  useEffect(() => {
    setIsClient(true)
    // Read auth token once on mount/level change
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('gb_token'))
      const level = localStorage.getItem('gb_proficiency_level') || 'A1'
      setUserLevel(level)
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
          } catch (error) {
            console.error('Failed to fetch exercises:', error)
          }
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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">


        {/* Hero Section - only show when not started */}
        {isLoadingData ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center animate-pulse">
                <span className="text-white font-bold text-2xl">GB</span>
              </div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Loading Your German Journey
              </h2>
              <p className="text-xl text-gray-300 mb-8">Preparing personalized content...</p>
              <div className="max-w-md mx-auto">
                <div className="w-full bg-gray-700/50 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full animate-pulse transition-all duration-1000" style={{ width: '70%' }} />
                </div>
              </div>
            </div>
          </div>
        ) : !sessionStarted ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-12 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <span className="text-white font-bold text-2xl">GB</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Master German
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Learn with 100k+ authentic sentences using spaced repetition and AI-powered insights
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{germanSentences.length.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Sentences</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{userLevel}</div>
                    <div className="text-sm text-gray-400">Your Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400">{adaptiveDailyQuota}</div>
                    <div className="text-sm text-gray-400">Daily Goal</div>
                  </div>
                </div>

                <button
                  onClick={() => setSessionStarted(true)}
                  disabled={germanSentences.length === 0}
                  className="group relative px-12 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-2xl font-bold text-lg text-white shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="relative z-10">Start Your Journey</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Smart Practice</h3>
                <p className="text-gray-400">AI-powered spaced repetition adapts to your learning pace</p>
              </div>

              <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Real Stories</h3>
                <p className="text-gray-400">Learn through authentic German texts and conversations</p>
              </div>

              <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Track Progress</h3>
                <p className="text-gray-400">Detailed analytics show your improvement over time</p>
              </div>
            </div>

            {/* Notification Setup */}
            {!showNotificationSetup ? (
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 2l5 5h-5V2zM9 19h6v2H9v-2zM3 7h18v10H3V7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-300">Daily Learning Reminders</h3>
                      <p className="text-blue-200">Never miss your German practice sessions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotificationSetup(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Enable
                  </button>
                </div>
              </div>
            ) : (
              <NotificationSetup
                onPermissionChanged={(granted) => {
                  if (granted) {
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
          <div className="space-y-8">
            {/* Progress Header */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Daily Practice</h2>
                  <p className="text-gray-400">Keep your streak alive!</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {learnedPhrases.size}/{adaptiveDailyQuota}
                    </div>
                    <div className="text-sm text-gray-400">Goal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                      {streak}
                    </div>
                    <div className="text-sm text-gray-400">Streak</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-700/50 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${Math.min((learnedPhrases.size / adaptiveDailyQuota) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="text-center mt-2">
                  <span className="text-sm font-medium text-gray-300">
                    {learnedPhrases.size === 0 && "Ready to start? Let's go! 🚀"}
                    {learnedPhrases.size > 0 && learnedPhrases.size < adaptiveDailyQuota && `${adaptiveDailyQuota - learnedPhrases.size} more to reach your goal! 🎯`}
                    {learnedPhrases.size >= adaptiveDailyQuota && "Daily goal complete! Fantastic! 🎉"}
                  </span>
                </div>
              </div>
            </div>

            {/* PlayPhrase Integration - Modern card */}
            {(currentExerciseType === 'recognition' || currentExerciseType === 'audio' || currentExerciseType === 'pronunciation') && (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
                <PlayPhrasePlayer
                  phrase={currentPhrase.german}
                  englishTranslation={currentPhrase.english}
                />
              </div>
            )}

            {/* Exercise Card */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
              <ExerciseSelector
                phrase={currentPhrase}
                exerciseType={currentExerciseType}
                onComplete={handleExerciseComplete}
                confidence={confidence}
                onConfidenceChange={setConfidence}
                isFlipped={isFlipped}
                onReveal={handleReveal}
              />
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
