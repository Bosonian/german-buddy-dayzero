'use client'

import { useState } from 'react'

interface AudioRecognitionExerciseProps {
  phrase: {
    german: string
    english: string
    example: string
    culturalNote: string
  }
  onComplete: (correct: boolean, confidence: number) => void
}

export default function AudioRecognitionExercise({ phrase, onComplete }: AudioRecognitionExerciseProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [confidence, setConfidence] = useState(50)
  const [submitted, setSubmitted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Generate distractors for multiple choice
  const generateDistractors = () => {
    const allPhrases = [
      "Guten Morgen", "Wie geht's?", "Danke schön", "Entschuldigung",
      "Auf Wiedersehen", "Ich liebe dich", "Was ist los?", "Bitte schön",
      "Guten Tag", "Wie heißen Sie?", "Wo ist das?", "Haben Sie Zeit?"
    ]

    const distractors = allPhrases
      .filter(p => p !== phrase.german)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)

    return [phrase.german, ...distractors].sort(() => Math.random() - 0.5)
  }

  const [options] = useState(generateDistractors())

  const playAudio = () => {
    setIsPlaying(true)

    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phrase.german)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
    } else {
      // Fallback - just simulate audio playing
      setTimeout(() => setIsPlaying(false), 2000)
    }
  }

  const handleSubmit = () => {
    const isCorrect = selectedAnswer === phrase.german
    setSubmitted(true)
    const backgroundConfidence = isCorrect ? 80 : 40
    setTimeout(() => onComplete(isCorrect, backgroundConfidence), 2000)
  }

  const isCorrect = submitted && selectedAnswer === phrase.german
  const isIncorrect = submitted && selectedAnswer !== phrase.german

  return (
    <div className="w-full bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎧</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Audio Recognition</h3>
        <p className="text-gray-400 text-sm">Listen and select what you hear</p>
      </div>

      <div className="space-y-6">
        {/* Audio Player */}
        <div className="bg-gray-900 rounded-xl p-6 text-center">
          <button
            onClick={playAudio}
            disabled={isPlaying}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
              isPlaying
                ? 'bg-purple-700 animate-pulse'
                : 'bg-purple-600 hover:bg-purple-500 hover:scale-105'
            }`}
          >
            {isPlaying ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <p className="text-gray-400 text-sm mt-3">
            {isPlaying ? 'Playing...' : 'Click to play audio'}
          </p>
          {!submitted && (
            <button
              onClick={playAudio}
              className="text-purple-400 hover:text-purple-300 text-sm mt-2 underline"
            >
              Play again
            </button>
          )}
        </div>

        {/* Multiple Choice Options */}
        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrectAnswer = option === phrase.german

            let buttonClass = 'w-full p-4 text-left rounded-xl border-2 transition-all '

            if (submitted) {
              if (isCorrectAnswer) {
                buttonClass += 'border-green-500 bg-green-900/20 text-green-300'
              } else if (isSelected && !isCorrectAnswer) {
                buttonClass += 'border-red-500 bg-red-900/20 text-red-300'
              } else {
                buttonClass += 'border-gray-600 bg-gray-900 text-gray-500'
              }
            } else {
              buttonClass += isSelected
                ? 'border-purple-500 bg-purple-900/20 text-purple-300'
                : 'border-gray-600 bg-gray-900 text-white hover:border-purple-400'
            }

            return (
              <button
                key={index}
                onClick={() => !submitted && setSelectedAnswer(option)}
                disabled={submitted}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{option}</span>
                  {submitted && isCorrectAnswer && (
                    <span className="text-green-500 text-xl">✓</span>
                  )}
                  {submitted && isSelected && !isCorrectAnswer && (
                    <span className="text-red-500 text-xl">✗</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {submitted && (
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-gray-300 text-sm font-semibold mb-2">Translation:</p>
            <p className="text-blue-400 font-semibold">{phrase.english}</p>
            <p className="text-gray-400 text-sm mt-2 italic">{phrase.example}</p>
          </div>
        )}

        <div className="space-y-2">
        </div>

        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
          >
            Submit Answer
          </button>
        )}
      </div>
    </div>
  )
}