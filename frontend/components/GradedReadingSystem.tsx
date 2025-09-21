'use client'

import { useState, useEffect } from 'react'

interface ReadingText {
  id: string
  bookNumber: number
  title: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  text: string
  vocabulary: {
    totalWords: number
    uniqueWords: number
    newWords: string[]
    difficultyScore: number
  }
  grammar: {
    tenses: string[]
    structures: string[]
    complexity: number
  }
  readability: {
    estimatedMinutes: number
    averageSentenceLength: number
  }
  comprehensionQuestions: ComprehensionQuestion[]
  culturalNotes?: string[]
  audioUrl?: string
}

interface ComprehensionQuestion {
  type: 'multiple_choice' | 'true_false' | 'open_ended'
  question: string
  options?: string[]
  correct: number | boolean | string
  explanation: string
  keywords?: string[]
}

interface ReadingProgress {
  currentBook: number
  comprehensionAccuracy: number
  readingSpeed: number // words per minute
  vocabularyRetention: number
  completedBooks: Set<number>
}

interface GradedReadingSystemProps {
  userLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  onProgressUpdate: (progress: ReadingProgress) => void
}

export default function GradedReadingSystem({ userLevel, onProgressUpdate }: GradedReadingSystemProps) {
  const [currentReading, setCurrentReading] = useState<ReadingText | null>(null)
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({
    currentBook: 1,
    comprehensionAccuracy: 0,
    readingSpeed: 0,
    vocabularyRetention: 0,
    completedBooks: new Set()
  })
  const [isReading, setIsReading] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<(string | number | boolean)[]>([])
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null)
  const [showVocabulary, setShowVocabulary] = useState(false)

  // Load reading text based on user level and progress
  useEffect(() => {
    loadNextReading()
  }, [userLevel, readingProgress.currentBook])

  const loadNextReading = async () => {
    try {
      // This would load from your Ollama-analyzed data
      // For now, showing the structure
      const response = await fetch(`/api/graded-reading?book=${readingProgress.currentBook}&level=${userLevel}`)
      if (response.ok) {
        const reading = await response.json()
        setCurrentReading(reading)
      }
    } catch (error) {
      console.error('Failed to load reading:', error)
    }
  }

  const startReading = () => {
    setIsReading(true)
    setReadingStartTime(new Date())
  }

  const finishReading = () => {
    if (readingStartTime && currentReading) {
      const readingTime = (Date.now() - readingStartTime.getTime()) / 1000 / 60 // minutes
      const wordsPerMinute = currentReading.vocabulary.totalWords / readingTime

      setReadingProgress(prev => ({
        ...prev,
        readingSpeed: Math.round(wordsPerMinute)
      }))
    }

    setIsReading(false)
    setShowQuestions(true)
  }

  const answerQuestion = (answer: string | number | boolean) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answer
    setAnswers(newAnswers)

    if (currentQuestionIndex < (currentReading?.comprehensionQuestions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      completeReading()
    }
  }

  const completeReading = () => {
    if (!currentReading) return

    // Calculate comprehension accuracy
    let correct = 0
    answers.forEach((answer, index) => {
      const question = currentReading.comprehensionQuestions[index]
      if (answer === question.correct) {
        correct++
      }
    })

    const accuracy = (correct / answers.length) * 100

    // Update progress
    const newProgress = {
      ...readingProgress,
      currentBook: readingProgress.currentBook + 1,
      comprehensionAccuracy: Math.round((readingProgress.comprehensionAccuracy + accuracy) / 2),
      completedBooks: new Set([...readingProgress.completedBooks, readingProgress.currentBook])
    }

    setReadingProgress(newProgress)
    onProgressUpdate(newProgress)

    // Reset for next reading
    setShowQuestions(false)
    setCurrentQuestionIndex(0)
    setAnswers([])
  }

  const toggleVocabularyHelp = () => {
    setShowVocabulary(!showVocabulary)
  }

  if (!currentReading) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Loading your next reading...</p>
      </div>
    )
  }

  if (showQuestions) {
    const currentQuestion = currentReading.comprehensionQuestions[currentQuestionIndex]

    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Reading Comprehension</h3>
            <span className="text-sm text-gray-400">
              Question {currentQuestionIndex + 1} of {currentReading.comprehensionQuestions.length}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / currentReading.comprehensionQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-xl mb-4">{currentQuestion.question}</h4>

          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => answerQuestion(index)}
                  className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-all"
                >
                  <span className="font-semibold text-blue-400 mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => answerQuestion(true)}
                className="p-4 bg-green-700 hover:bg-green-600 rounded-lg font-semibold transition-all"
              >
                ✓ Richtig
              </button>
              <button
                onClick={() => answerQuestion(false)}
                className="p-4 bg-red-700 hover:bg-red-600 rounded-lg font-semibold transition-all"
              >
                ✗ Falsch
              </button>
            </div>
          )}

          {currentQuestion.type === 'open_ended' && (
            <div className="space-y-4">
              <textarea
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg resize-none"
                rows={4}
                placeholder="Schreiben Sie Ihre Antwort hier..."
                onChange={(e) => answerQuestion(e.target.value)}
              />
              <button
                onClick={() => answerQuestion(answers[currentQuestionIndex] || '')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
              >
                Antwort senden
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reading Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{currentReading.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className={`px-2 py-1 rounded ${
                currentReading.level === 'A1' ? 'bg-green-900 text-green-300' :
                currentReading.level === 'A2' ? 'bg-blue-900 text-blue-300' :
                currentReading.level === 'B1' ? 'bg-yellow-900 text-yellow-300' :
                currentReading.level === 'B2' ? 'bg-orange-900 text-orange-300' :
                'bg-red-900 text-red-300'
              }`}>
                {currentReading.level}
              </span>
              <span>📖 Book {currentReading.bookNumber}</span>
              <span>⏱️ ~{currentReading.readability.estimatedMinutes} min</span>
              <span>📝 {currentReading.vocabulary.totalWords} words</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={toggleVocabularyHelp}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
            >
              📚 Vocabulary
            </button>
            {currentReading.audioUrl && (
              <button className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm transition-colors">
                🔊 Audio
              </button>
            )}
          </div>
        </div>

        {/* Vocabulary Helper */}
        {showVocabulary && (
          <div className="mb-4 p-4 bg-gray-900 rounded-lg border border-gray-600">
            <h4 className="font-semibold mb-2">New Vocabulary:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {currentReading.vocabulary.newWords.map((word, index) => (
                <span key={index} className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-sm">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reading Text */}
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
        {!isReading ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold mb-4">Ready to start reading?</h3>
            <p className="text-gray-400 mb-6">
              This story will help you practice {currentReading.grammar.structures.join(', ')}
              and learn {currentReading.vocabulary.newWords.length} new words.
            </p>
            <button
              onClick={startReading}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold text-lg transition-colors"
            >
              Start Reading
            </button>
          </div>
        ) : (
          <div>
            <div className="prose max-w-none text-gray-200 leading-relaxed text-lg">
              {currentReading.text.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={finishReading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-colors"
              >
                I finished reading
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reading Progress */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h4 className="font-semibold mb-3">Your Reading Progress</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{readingProgress.completedBooks.size}</div>
            <div className="text-gray-400">Books Read</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{readingProgress.comprehensionAccuracy}%</div>
            <div className="text-gray-400">Comprehension</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{readingProgress.readingSpeed}</div>
            <div className="text-gray-400">Words/Min</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{userLevel}</div>
            <div className="text-gray-400">Current Level</div>
          </div>
        </div>
      </div>
    </div>
  )
}