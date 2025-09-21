'use client'

import React, { useState, useRef, useEffect } from 'react'

interface SpellingExerciseProps {
  phrase: {
    german: string
    english: string
    example: string
    culturalNote: string
  }
  onComplete: (correct: boolean, confidence: number) => void
}

export default function SpellingExercise({ phrase, onComplete }: SpellingExerciseProps) {
  const [userInput, setUserInput] = useState('')
  const [showHints, setShowHints] = useState(false)
  const [confidence, setConfidence] = useState(50)
  const [submitted, setSubmitted] = useState(false)
  const [mistakes, setMistakes] = useState<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const playAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phrase.german)
      utterance.lang = 'de-DE'
      utterance.rate = 0.7 // Slower for spelling
      window.speechSynthesis.speak(utterance)
    }
  }

  const checkSpelling = () => {
    const correct = phrase.german.toLowerCase()
    const input = userInput.toLowerCase()
    const mistakes: number[] = []

    // Find character-level mistakes
    for (let i = 0; i < Math.max(correct.length, input.length); i++) {
      if (correct[i] !== input[i]) {
        mistakes.push(i)
      }
    }

    setMistakes(mistakes)
    setSubmitted(true)
    const isCorrect = mistakes.length === 0 && correct.length === input.length
    const backgroundConfidence = isCorrect ? 85 : (userInput.length > 0 ? 55 : 35)
    setTimeout(() => onComplete(isCorrect, backgroundConfidence), 2500)
  }

  const getHints = () => {
    const words = phrase.german.split(' ')
    return {
      letterCount: `${phrase.german.length} letters total`,
      wordCount: `${words.length} word${words.length > 1 ? 's' : ''}`,
      firstLetters: words.map(word => word[0]).join(' '),
      specialChars: phrase.german.match(/[äöüßÄÖÜ]/g)?.length || 0
    }
  }

  const hints = getHints()
  const isCorrect = submitted && userInput.toLowerCase() === phrase.german.toLowerCase()
  const hasErrors = submitted && mistakes.length > 0

  const renderInputWithErrors = () => {
    if (!submitted) return userInput

    const correct = phrase.german.toLowerCase()
    const input = userInput.toLowerCase()
    const result: React.ReactElement[] = []

    for (let i = 0; i < Math.max(correct.length, input.length); i++) {
      const char = userInput[i] || ''
      const isError = mistakes.includes(i)

      result.push(
        <span
          key={i}
          className={isError ? 'bg-red-500 text-white px-0.5 rounded' : ''}
        >
          {char}
        </span>
      )
    }

    return result
  }

  return (
    <div className="w-full bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✏️</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Spelling Exercise</h3>
        <p className="text-gray-400 text-sm">Listen and spell the German phrase correctly</p>
      </div>

      <div className="space-y-6">
        {/* Audio and Translation */}
        <div className="bg-gray-900 rounded-xl p-4 text-center space-y-3">
          <button
            onClick={playAudio}
            className="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center mx-auto transition-all hover:scale-105"
          >
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
          <p className="text-blue-400 font-semibold">{phrase.english}</p>
          <button
            onClick={playAudio}
            className="text-indigo-400 hover:text-indigo-300 text-sm underline"
          >
            🔄 Play again
          </button>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Type what you hear:</label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !submitted && checkSpelling()}
              disabled={submitted}
              className={`w-full p-4 text-lg rounded-xl border-2 bg-gray-900 text-white placeholder-gray-500 transition-all ${
                isCorrect
                  ? 'border-green-500 bg-green-900/20'
                  : hasErrors
                  ? 'border-red-500 bg-red-900/20'
                  : 'border-gray-600 focus:border-indigo-500'
              }`}
              placeholder="Spell the German phrase..."
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

          {/* Error highlighting */}
          {submitted && hasErrors && (
            <div className="text-sm text-gray-400">
              <span>Your input: </span>
              <span className="font-mono text-base">{renderInputWithErrors()}</span>
            </div>
          )}
        </div>

        {/* Hints */}
        {showHints && !submitted && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
            <p className="text-yellow-300 text-sm font-semibold mb-2">💡 Spelling Hints:</p>
            <div className="text-yellow-200 text-sm space-y-1">
              <p>• {hints.letterCount}</p>
              <p>• {hints.wordCount}</p>
              <p>• First letters: <span className="font-mono">{hints.firstLetters}</span></p>
              {hints.specialChars > 0 && (
                <p>• Contains {hints.specialChars} special German character{hints.specialChars > 1 ? 's' : ''} (ä, ö, ü, ß)</p>
              )}
            </div>
          </div>
        )}

        {/* Correct Answer */}
        {submitted && hasErrors && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
            <p className="text-red-300 text-sm font-semibold mb-2">Correct spelling:</p>
            <p className="text-red-200 font-semibold text-xl font-mono">{phrase.german}</p>
            <p className="text-red-300 text-sm mt-2 italic">{phrase.example}</p>
          </div>
        )}

        {/* Success message */}
        {isCorrect && (
          <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 text-center">
            <p className="text-green-300 text-lg font-semibold">Perfect spelling! 🎉</p>
            <p className="text-green-400 text-sm mt-1 italic">{phrase.example}</p>
          </div>
        )}

        <div className="space-y-2">
        </div>

        <div className="flex space-x-3">
          {!submitted && (
            <>
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-semibold transition-colors"
              >
                {showHints ? 'Hide Hints' : 'Show Hints'}
              </button>
              <button
                onClick={checkSpelling}
                disabled={!userInput.trim()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
              >
                Check Spelling
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}