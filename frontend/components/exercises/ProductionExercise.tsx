'use client'

import { useState, useRef, useEffect } from 'react'

interface ProductionExerciseProps {
  phrase: {
    german: string
    english: string
    example: string
    culturalNote: string
  }
  onComplete: (correct: boolean, confidence: number) => void
}

export default function ProductionExercise({ phrase, onComplete }: ProductionExerciseProps) {
  const [userInput, setUserInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [confidence, setConfidence] = useState(50)
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const normalizeText = (text: string) => {
    return text.toLowerCase()
      .replace(/[.,!?;:]/g, '') // Remove punctuation but keep German characters
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim()
  }

  const checkAnswer = () => {
    const normalized = normalizeText(userInput)
    const correct = normalizeText(phrase.german)
    const isCorrect = normalized === correct
    setSubmitted(true)
    // Remove automatic progression - let user click Next button
  }

  const handleNext = () => {
    const isCorrect = normalizeText(userInput) === normalizeText(phrase.german)
    // Calculate background confidence based on accuracy and attempts
    const backgroundConfidence = isCorrect ? 85 : (userInput.length > 0 ? 50 : 30)
    onComplete(isCorrect, backgroundConfidence)
  }

  const getHint = () => {
    const words = phrase.german.split(' ')
    return words.map(word => word[0] + '•'.repeat(word.length - 1)).join(' ')
  }

  const isCorrect = submitted && normalizeText(userInput) === normalizeText(phrase.german)
  const isIncorrect = submitted && normalizeText(userInput) !== normalizeText(phrase.german)

  return (
    <div className="w-full bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✍️</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Production Exercise</h3>
        <p className="text-gray-400 text-sm">Type the German phrase for:</p>
        <p className="text-lg font-semibold text-blue-400 mt-2">{phrase.english}</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !submitted && checkAnswer()}
            disabled={submitted}
            className={`w-full p-4 text-lg rounded-xl border-2 bg-gray-900 text-white placeholder-gray-500 transition-all ${
              isCorrect
                ? 'border-green-500 bg-green-900/20'
                : isIncorrect
                ? 'border-red-500 bg-red-900/20'
                : 'border-gray-600 focus:border-blue-500'
            }`}
            placeholder="Type the German phrase..."
          />

          {submitted && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {isCorrect ? (
                <span className="text-green-500 text-2xl">✓</span>
              ) : (
                <span className="text-red-500 text-2xl">✗</span>
              )}
            </div>
          )}
        </div>

        {showHint && !submitted && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
            <p className="text-yellow-300 text-sm font-semibold">Hint:</p>
            <p className="text-yellow-200 font-mono text-lg">{getHint()}</p>
          </div>
        )}

        {submitted && isIncorrect && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
            <p className="text-red-300 text-sm font-semibold">Correct answer:</p>
            <p className="text-red-200 font-semibold text-lg">{phrase.german}</p>
          </div>
        )}

        {submitted && (
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-gray-300 text-sm font-semibold mb-1">Example usage:</p>
            <p className="text-gray-400 italic">{phrase.example}</p>
          </div>
        )}


        <div className="flex space-x-3">
          {!submitted ? (
            <>
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-semibold transition-colors"
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              <button
                onClick={checkAnswer}
                disabled={!userInput.trim()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
              >
                Check Answer
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold transition-colors"
            >
              Continue to Next Exercise →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}