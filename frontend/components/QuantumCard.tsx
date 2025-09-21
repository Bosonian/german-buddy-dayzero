'use client'

import { useState } from 'react'
import GermanSpeakerButton from './GermanSpeakerButton'
import { PlayPhraseButtonCompact } from './PlayPhraseButton'

interface QuantumCardProps {
  phrase: {
    id: number
    german: string
    english: string
    example: string
  }
  isFlipped: boolean
  onReveal: () => void
  onSubmit: (difficulty: number) => void
  confidence: number
  onConfidenceChange: (value: number) => void
}

export default function QuantumCard({
  phrase,
  isFlipped,
  onReveal,
  onSubmit,
  confidence,
  onConfidenceChange,
}: QuantumCardProps) {
  const [showResults, setShowResults] = useState(false)
  const [lastRating, setLastRating] = useState<number | null>(null)

  const handleRatingSubmit = (rating: number) => {
    setLastRating(rating)
    setShowResults(true)
    // Don't call onSubmit immediately - wait for "Next" button
  }

  const handleNext = () => {
    if (lastRating !== null) {
      onSubmit(lastRating)
      setShowResults(false)
      setLastRating(null)
    }
  }

  const getRatingFeedback = (rating: number) => {
    switch (rating) {
      case 1:
        return {
          color: "text-red-400",
          message: "Marked as Hard - Keep practicing this phrase!",
          emoji: "🔴",
          advice: "This phrase will appear again soon for more practice."
        }
      case 2:
        return {
          color: "text-yellow-400",
          message: "Marked as Medium - You're getting there!",
          emoji: "🟡",
          advice: "With a bit more practice, you'll master this phrase."
        }
      case 3:
        return {
          color: "text-green-400",
          message: "Marked as Easy - Excellent work! ✨",
          emoji: "🟢",
          advice: "This phrase has been added to your daily progress!"
        }
      default:
        return {
          color: "text-gray-400",
          message: "Rating submitted",
          emoji: "⚪",
          advice: ""
        }
    }
  }
  return (
    <div className="w-full">
      <div className={`quantum-card relative w-full h-72 ${isFlipped ? 'is-flipped' : ''}`}>
        <div className="quantum-card-inner w-full h-full">
          {/* Front of card */}
          <div className="quantum-card-front absolute w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-8 flex flex-col justify-center items-center shadow-2xl border border-gray-600">
            <span className="text-sm text-blue-400 font-semibold mb-4 uppercase tracking-wider">
              Recognition Challenge
            </span>
            <div className="flex items-center gap-4 mb-6">
              <p className="text-3xl font-bold text-center">
                {phrase.german}
              </p>
              <GermanSpeakerButton
                text={phrase.german}
                context="vocabulary"
                size="lg"
                variant="primary"
              />
            </div>
            <div className="flex items-center justify-center gap-2 mb-8">
              <p className="text-gray-400 text-center italic">
                "{phrase.example}"
              </p>
              <GermanSpeakerButton
                text={phrase.example}
                context="conversation"
                size="sm"
                variant="minimal"
              />
            </div>
            {!isFlipped && (
              <button
                onClick={onReveal}
                aria-label="Reveal translation"
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
              >
                Reveal Answer
              </button>
            )}
          </div>

          {/* Back of card */}
          <div className="quantum-card-back absolute w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-8 flex flex-col justify-center items-center shadow-2xl border border-gray-600">
            <span className="text-sm text-green-400 font-semibold mb-4 uppercase tracking-wider">
              Translation
            </span>
            <p className="text-3xl font-bold text-center mb-8">
              {phrase.english}
            </p>

            {/* Simple instruction */}
            <div className="w-full mb-6 text-center">
              <p className="text-sm text-gray-400">
                Rate how well you knew this phrase:
              </p>
            </div>

            {/* PlayPhrase Movie Button */}
            <div className="mb-4 flex justify-center">
              <PlayPhraseButtonCompact phrase={phrase.german} />
            </div>

            {!showResults ? (
              /* Traffic Light System Buttons */
              <div className="grid grid-cols-3 gap-3 w-full">
                <button
                  onClick={() => handleRatingSubmit(1)}
                  aria-label="Hard - very difficult"
                  className="p-3 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 rounded-xl transition-all group"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 bg-red-500 rounded-full group-hover:bg-red-400"></div>
                    <span className="text-red-400 font-semibold text-sm">Hard</span>
                  </div>
                </button>
                <button
                  onClick={() => handleRatingSubmit(2)}
                  aria-label="Medium - need more practice"
                  className="p-3 bg-yellow-500/20 hover:bg-yellow-500/30 border-2 border-yellow-500/50 rounded-xl transition-all group"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full group-hover:bg-yellow-400"></div>
                    <span className="text-yellow-400 font-semibold text-sm">Medium</span>
                  </div>
                </button>
                <button
                  onClick={() => handleRatingSubmit(3)}
                  aria-label="Easy - I got this!"
                  className="p-3 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/50 rounded-xl transition-all group"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full group-hover:bg-green-400"></div>
                    <span className="text-green-400 font-semibold text-sm">Easy</span>
                  </div>
                </button>
              </div>
            ) : (
              /* Results Screen */
              <div className="w-full text-center space-y-4">
                {lastRating && (
                  <>
                    <div className="mb-4">
                      <div className={`text-2xl mb-2 ${getRatingFeedback(lastRating).color}`}>
                        {getRatingFeedback(lastRating).emoji} {getRatingFeedback(lastRating).message}
                      </div>
                      <p className="text-sm text-gray-400">
                        {getRatingFeedback(lastRating).advice}
                      </p>
                    </div>

                    {/* Show the correct translation again for review */}
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                      <div className="text-lg font-semibold text-blue-300 mb-1">
                        "{phrase.german}"
                      </div>
                      <div className="text-gray-300">
                        means: "{phrase.english}"
                      </div>
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={handleNext}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
                    >
                      Continue to Next Phrase →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
