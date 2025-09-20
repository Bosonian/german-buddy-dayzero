'use client'

import { useState } from 'react'

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
  return (
    <div className="w-full">
      <div className={`quantum-card relative w-full h-72 ${isFlipped ? 'is-flipped' : ''}`}>
        <div className="quantum-card-inner w-full h-full">
          {/* Front of card */}
          <div className="quantum-card-front absolute w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-8 flex flex-col justify-center items-center shadow-2xl border border-gray-600">
            <span className="text-sm text-blue-400 font-semibold mb-4 uppercase tracking-wider">
              Recognition Challenge
            </span>
            <p className="text-3xl font-bold text-center mb-6">
              {phrase.german}
            </p>
            <p className="text-gray-400 text-center italic mb-8">
              "{phrase.example}"
            </p>
            {!isFlipped && (
              <button
                onClick={onReveal}
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

            {/* Confidence Slider */}
            <div className="w-full mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
                How confident are you? ({confidence}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => onConfidenceChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not sure</span>
                <span>Confident</span>
                <span>Perfect!</span>
              </div>
            </div>

            {/* Response Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => onSubmit(1)}
                className="p-4 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 rounded-xl transition-all"
              >
                <span className="text-red-400 font-semibold">Need Practice</span>
              </button>
              <button
                onClick={() => onSubmit(4)}
                className="p-4 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/50 rounded-xl transition-all"
              >
                <span className="text-green-400 font-semibold">Got It!</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}