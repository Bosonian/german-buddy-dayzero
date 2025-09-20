'use client'

import { ExerciseResult, ExerciseType } from './ExerciseSelector'

interface SessionResult {
  id: number
  german: string
  english: string
  exerciseType: ExerciseType
  result: ExerciseResult
}

interface SessionSummaryProps {
  results: SessionResult[]
  onRestart: () => void
}

export default function SessionSummary({ results, onRestart }: SessionSummaryProps) {
  const total = results.length
  const gotIt = results.filter(r => r.result.correct).length
  const practice = total - gotIt
  const avgConfidence = total > 0
    ? Math.round(results.reduce((a, b) => a + b.result.confidence, 0) / total)
    : 0

  // Calculate overall mastery across dimensions
  const calculateOverallMastery = () => {
    if (total === 0) return { recognition: 0, production: 0, pronunciation: 0, contextual: 0, cultural: 0, spelling: 0, speed: 0 }

    const dimensions = {
      recognition: 0,
      production: 0,
      pronunciation: 0,
      contextual: 0,
      cultural: 0,
      spelling: 0,
      speed: 0
    }

    results.forEach(r => {
      Object.keys(dimensions).forEach(key => {
        dimensions[key as keyof typeof dimensions] += r.result.dimensions[key as keyof typeof dimensions]
      })
    })

    // Average the scores
    Object.keys(dimensions).forEach(key => {
      dimensions[key as keyof typeof dimensions] = Math.round(dimensions[key as keyof typeof dimensions] / total)
    })

    return dimensions
  }

  const overallMastery = calculateOverallMastery()

  const getExerciseIcon = (exerciseType: ExerciseType) => {
    const icons = {
      recognition: '🧠',
      production: '✍️',
      audio: '🎧',
      pronunciation: '🎤',
      spelling: '✏️',
      speed: '⚡',
      contextual: '🎭'
    }
    return icons[exerciseType] || '📝'
  }

  const getExerciseName = (exerciseType: ExerciseType) => {
    const names = {
      recognition: 'Recognition',
      production: 'Production',
      audio: 'Audio Recognition',
      pronunciation: 'Pronunciation',
      spelling: 'Spelling',
      speed: 'Speed Drill',
      contextual: 'Contextual Usage'
    }
    return names[exerciseType] || 'Exercise'
  }

  return (
    <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Session Complete! 🎉</h2>
        <p className="text-gray-400">You practiced {total} exercises</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-400">{gotIt}</div>
          <div className="text-sm text-gray-400">Got it</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-400">{avgConfidence}%</div>
          <div className="text-sm text-gray-400">Confidence</div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-colors"
      >
        Start New Session
      </button>
    </div>
  )
}
