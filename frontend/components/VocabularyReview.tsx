'use client'

import { useState, useEffect, useMemo } from 'react'

interface DictionaryEntry {
  id: number
  german: string
  english: string
  pronunciation: string
  gender?: string
  plural?: string
  wordType: string
  level: string
  conjugation?: {
    ich?: string
    du?: string
    er?: string
    wir?: string
    ihr?: string
    sie?: string
  }
  examples: Array<{
    german: string
    english: string
  }>
  categories: string[]
  storyDays: number[]
}

interface ReviewSession {
  word: DictionaryEntry
  attempts: number
  correct: boolean
  lastAttempt: Date
}

export default function VocabularyReview() {
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWord, setCurrentWord] = useState<DictionaryEntry | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [reviewMode, setReviewMode] = useState<'german-to-english' | 'english-to-german'>('german-to-english')
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [studyPhase, setStudyPhase] = useState<'study' | 'test' | 'feedback'>('study')
  const [completedStories, setCompletedStories] = useState<number[]>([])
  const [reviewHistory, setReviewHistory] = useState<{[key: number]: ReviewSession}>({})

  // Load dictionary and user progress
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load dictionary
        const response = await fetch('/data/german_dictionary.json')
        if (response.ok) {
          const dictData = await response.json()
          setDictionary(dictData)
        }

        // Load completed stories for vocabulary filtering
        if (typeof window !== 'undefined') {
          const completed = JSON.parse(localStorage.getItem('gb_completed_stories') || '[]')
          setCompletedStories(completed)

          // Load review history
          const history = JSON.parse(localStorage.getItem('gb_vocabulary_review') || '{}')
          setReviewHistory(history)
        }
      } catch (error) {
        console.error('Error loading vocabulary review data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Get vocabulary from completed stories
  const availableVocabulary = useMemo(() => {
    return dictionary.filter(word =>
      word.storyDays.some(day => completedStories.includes(day))
    )
  }, [dictionary, completedStories])

  // Get next word for review (prioritize least reviewed or incorrect)
  const getNextWord = () => {
    if (availableVocabulary.length === 0) return null

    // Sort by review priority: never seen > never tested > incorrect > least recent
    const sorted = [...availableVocabulary].sort((a, b) => {
      const aHistory = reviewHistory[a.id]
      const bHistory = reviewHistory[b.id]

      // Never seen words first (no history at all)
      if (!aHistory && bHistory) return -1
      if (aHistory && !bHistory) return 1
      if (!aHistory && !bHistory) return Math.random() - 0.5

      // Words that have been studied but never tested
      const aHasBeenTested = aHistory.attempts > 0
      const bHasBeenTested = bHistory.attempts > 0

      if (!aHasBeenTested && bHasBeenTested) return -1
      if (aHasBeenTested && !bHasBeenTested) return 1

      // Incorrect words next
      if (!aHistory.correct && bHistory.correct) return -1
      if (aHistory.correct && !bHistory.correct) return 1

      // Then by last attempt time (oldest first)
      return new Date(aHistory.lastAttempt).getTime() - new Date(bHistory.lastAttempt).getTime()
    })

    return sorted[0]
  }

  // Start new review session
  const startReview = () => {
    const nextWord = getNextWord()
    if (nextWord) {
      setCurrentWord(nextWord)
      setShowAnswer(false)

      // Determine starting phase based on word history
      const wordHistory = reviewHistory[nextWord.id]

      if (!wordHistory) {
        // Never seen before - must start with study
        setStudyPhase('study')
      } else if (wordHistory.attempts === 0) {
        // Studied before but never tested - can go straight to test
        setStudyPhase('test')
      } else {
        // Has been tested before - can go straight to test for review
        setStudyPhase('test')
      }
    }
  }

  // Mark answer as correct/incorrect
  const markAnswer = (correct: boolean) => {
    if (!currentWord) return

    const newSession = sessionStats.total + 1
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: newSession
    }))

    // Update review history
    const newHistory = {
      ...reviewHistory,
      [currentWord.id]: {
        word: currentWord,
        attempts: (reviewHistory[currentWord.id]?.attempts || 0) + 1,
        correct,
        lastAttempt: new Date()
      }
    }
    setReviewHistory(newHistory)

    // Save to localStorage
    try {
      localStorage.setItem('gb_vocabulary_review', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Error saving review history:', error)
    }

    // Move to feedback phase first
    setStudyPhase('feedback')

    // Then move to next word after showing feedback
    setTimeout(() => {
      startReview()
    }, 2000)
  }

  // Mark word as studied (seen) - tracks first exposure without testing
  const markWordStudied = (wordId: number) => {
    if (!reviewHistory[wordId]) {
      const newHistory = {
        ...reviewHistory,
        [wordId]: {
          word: currentWord!,
          attempts: 0, // 0 attempts means studied but not tested yet
          correct: false,
          lastAttempt: new Date()
        }
      }
      setReviewHistory(newHistory)

      // Save to localStorage
      try {
        localStorage.setItem('gb_vocabulary_review', JSON.stringify(newHistory))
      } catch (error) {
        console.error('Error saving study progress:', error)
      }
    }
  }

  // Move from study to test phase
  const startTest = () => {
    if (currentWord) {
      // Mark the word as studied when moving to test phase
      markWordStudied(currentWord.id)
    }
    setStudyPhase('test')
    setShowAnswer(false)
  }

  // Initialize first word
  useEffect(() => {
    if (availableVocabulary.length > 0 && !currentWord) {
      startReview()
    }
  }, [availableVocabulary])

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl text-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading vocabulary review...</p>
      </div>
    )
  }

  if (availableVocabulary.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-gray-300 mb-3">No Vocabulary Available</h3>
        <p className="text-gray-400 mb-4">
          Complete some stories first to unlock vocabulary for review!
        </p>
        <a
          href="/reading"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          📖 Read Stories
        </a>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-green-400 mb-3">🎉 Review Complete!</h3>
        <p className="text-gray-300 mb-4">
          You've reviewed all available vocabulary. Great job!
        </p>
        <button
          onClick={() => setSessionStats({ correct: 0, total: 0 })}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
        >
          Start New Session
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session Stats */}
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-400">Vocabulary Review Session</span>
          <div className="flex gap-4 text-sm">
            <span className="text-green-400">{sessionStats.correct} correct</span>
            <span className="text-gray-400">{sessionStats.total} total</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setReviewMode('german-to-english')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              reviewMode === 'german-to-english'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            German → English
          </button>
          <button
            onClick={() => setReviewMode('english-to-german')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              reviewMode === 'english-to-german'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            English → German
          </button>
        </div>
      </div>

      {/* Review Card */}
      <div className="bg-gray-800 border border-purple-700 p-8 rounded-xl">

        {/* Phase Indicator */}
        <div className="text-center mb-6">
          <div className="flex justify-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${studyPhase === 'study' ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
            <div className={`w-3 h-3 rounded-full ${studyPhase === 'test' ? 'bg-purple-500' : 'bg-gray-600'}`}></div>
            <div className={`w-3 h-3 rounded-full ${studyPhase === 'feedback' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
          </div>
          <div className="text-sm text-gray-400">
            {studyPhase === 'study' && '📚 Study • Learn the word and its meaning'}
            {studyPhase === 'test' && '🧠 Test • Try to recall the translation'}
            {studyPhase === 'feedback' && '✅ Feedback • See how you did'}
          </div>
        </div>

        {/* Study Phase */}
        {studyPhase === 'study' && (
          <div className="text-center space-y-6">
            <div className="bg-blue-900/30 border border-blue-600 p-6 rounded-lg">
              <div className="text-3xl font-bold text-white mb-2">{currentWord.german}</div>
              {currentWord.pronunciation && (
                <div className="text-gray-400 text-sm mb-2">/{currentWord.pronunciation}/</div>
              )}
              {currentWord.gender && (
                <div className="text-blue-400 text-sm mb-4">{currentWord.gender}</div>
              )}
              <div className="text-xl text-blue-200">{currentWord.english}</div>
            </div>

            {currentWord.examples.length > 0 && (
              <div className="text-left bg-gray-700 p-4 rounded">
                <h5 className="text-sm font-semibold text-gray-300 mb-3">Example Usage:</h5>
                <p className="text-white text-sm mb-1">{currentWord.examples[0].german}</p>
                <p className="text-gray-400 text-xs">{currentWord.examples[0].english}</p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-gray-300">Study this word, then test yourself!</p>
              <button
                onClick={startTest}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                I'm Ready to Test Myself →
              </button>
            </div>
          </div>
        )}

        {/* Test Phase */}
        {studyPhase === 'test' && (
          <div className="text-center space-y-6">
            <div className="mb-6">
              <div className="text-sm text-purple-400 mb-2">
                {reviewMode === 'german-to-english' ? 'What does this mean in English?' : 'How do you say this in German?'}
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {reviewMode === 'german-to-english' ? currentWord.german : currentWord.english}
              </div>
              {reviewMode === 'german-to-english' && currentWord.pronunciation && (
                <div className="text-gray-400 text-sm">/{currentWord.pronunciation}/</div>
              )}
              {reviewMode === 'german-to-english' && currentWord.gender && (
                <div className="text-blue-400 text-sm mt-1">{currentWord.gender}</div>
              )}
            </div>

            {!showAnswer ? (
              <div className="space-y-4">
                <p className="text-gray-400">Think about the answer, then reveal it!</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setStudyPhase('study')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-sm"
                  >
                    📚 Study First
                  </button>
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                  >
                    Show Answer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-purple-900/30 border border-purple-600 p-4 rounded-lg">
                  <div className="text-xl font-semibold text-purple-200 mb-2">
                    {reviewMode === 'german-to-english' ? currentWord.english : currentWord.german}
                  </div>
                  {reviewMode === 'english-to-german' && currentWord.pronunciation && (
                    <div className="text-gray-400 text-sm">/{currentWord.pronunciation}/</div>
                  )}
                  {reviewMode === 'english-to-german' && currentWord.gender && (
                    <div className="text-blue-300 text-sm mt-1">{currentWord.gender}</div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-gray-300">Did you get it right?</p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => markAnswer(false)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                    >
                      ❌ No, I got it wrong
                    </button>
                    <button
                      onClick={() => markAnswer(true)}
                      className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                    >
                      ✅ Yes, I got it right!
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback Phase */}
        {studyPhase === 'feedback' && (
          <div className="text-center space-y-6">
            <div className="text-2xl">
              {sessionStats.total > 0 && reviewHistory[currentWord.id]?.correct ? '🎉' : '📚'}
            </div>
            <div className={`p-4 rounded-lg ${
              sessionStats.total > 0 && reviewHistory[currentWord.id]?.correct
                ? 'bg-green-900/30 border border-green-600'
                : 'bg-red-900/30 border border-red-600'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                sessionStats.total > 0 && reviewHistory[currentWord.id]?.correct ? 'text-green-300' : 'text-red-300'
              }`}>
                {sessionStats.total > 0 && reviewHistory[currentWord.id]?.correct ? 'Great job!' : 'Keep practicing!'}
              </h3>
              <p className="text-gray-300">
                {sessionStats.total > 0 && reviewHistory[currentWord.id]?.correct
                  ? 'You got it right! This word will appear less frequently.'
                  : 'No worries! This word will come up again soon for more practice.'
                }
              </p>
            </div>

            <div className="text-gray-400 text-sm">
              Moving to next word...
            </div>
          </div>
        )}
      </div>

      {/* Progress Info */}
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
        <div className="text-sm text-gray-400 text-center">
          Reviewing vocabulary from {completedStories.length} completed stories •
          {availableVocabulary.length} words available for review
        </div>
      </div>
    </div>
  )
}