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
    <div className="relative bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl overflow-hidden">
      {/* Confetti overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${(i * 4) % 100}%`,
              animationDelay: `${(i % 6) * 0.2}s`,
              backgroundColor: i % 3 === 0 ? '#DD0000' : i % 3 === 1 ? '#FFCC00' : '#ffffff'
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Session Complete 🎉</h2>
        <span className="text-sm text-gray-400">{total} phrases</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-green-400">{gotIt}</div>
          <div className="text-sm text-gray-400">Got it</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-yellow-400">{practice}</div>
          <div className="text-sm text-gray-400">Need practice</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-blue-400">{avgConfidence}%</div>
          <div className="text-sm text-gray-400">Avg confidence</div>
        </div>
      </div>

      {/* 7-Dimensional Mastery Progress */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Session Mastery Gains</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(overallMastery).map(([dimension, score]) => (
            <div key={dimension} className="flex items-center justify-between bg-gray-900 rounded-lg p-2 border border-gray-700">
              <span className="text-gray-300 capitalize">{dimension}</span>
              <span className={`font-semibold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-blue-400' : score >= 40 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Exercise Review</h3>
        <div className="space-y-2 max-h-48 overflow-auto pr-1">
          {results.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getExerciseIcon(r.exerciseType)}</span>
                <div>
                  <div className="font-medium text-gray-100">{r.german}</div>
                  <div className="text-xs text-gray-400">{getExerciseName(r.exerciseType)} • {r.english}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded ${r.result.correct ? 'bg-green-600/20 text-green-300 border border-green-600/40' : 'bg-yellow-600/20 text-yellow-200 border border-yellow-600/40'}`}>
                  {r.result.correct ? 'Got it' : 'Practice'}
                </span>
                <span className="text-xs text-gray-400">{r.result.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
        >
          Start New Session
        </button>
        <button
          onClick={() => {
            const text = `I just completed a German Buddy session: ${gotIt}/${total} got it • Avg confidence ${avgConfidence}% 🔥`
            if (navigator.share) {
              navigator.share({ title: 'German Buddy', text, url: window.location.href }).catch(() => {})
            } else {
              navigator.clipboard?.writeText(text).catch(() => {})
              alert('Copied to clipboard!')
            }
          }}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-colors"
        >
          Share
        </button>
      </div>
    </div>
  )
}
