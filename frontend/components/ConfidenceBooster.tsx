'use client'

import { useState, useEffect } from 'react'

interface ConfidenceBoosterProps {
  message: string
  bonus: number
  onComplete: () => void
}

export default function ConfidenceBooster({ message, bonus, onComplete }: ConfidenceBoosterProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setAnimate(true), 100)

    // Auto-dismiss after 3 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 300) // Wait for fade out animation
    }, 3000)

    return () => {
      clearTimeout(timer)
      clearTimeout(dismissTimer)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className={`bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-6 mx-4 max-w-sm text-center shadow-2xl transform transition-all duration-300 ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${!isVisible ? 'scale-95 opacity-0' : ''}`}
      >
        {/* Celebration animation */}
        <div className="relative mb-4">
          <div className="text-4xl mb-2">🎉</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-white/30 rounded-full animate-ping" />
          </div>
        </div>

        {/* Message */}
        <h3 className="text-white font-bold text-lg mb-2">
          Confidence Boost!
        </h3>
        <p className="text-white/90 text-sm mb-3">
          {message}
        </p>

        {/* Bonus indicator */}
        <div className="bg-white/20 rounded-full px-4 py-2 inline-flex items-center space-x-2">
          <span className="text-white font-bold">+{bonus}</span>
          <span className="text-white/80 text-sm">confidence</span>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/60 rounded-full animate-bounce"
              style={{
                left: `${20 + i * 12}%`,
                top: `${20 + (i % 2) * 40}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Streak indicator component
export function StreakIndicator({ streak, position = 'top-right' }: {
  streak: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}) {
  if (streak < 2) return null

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥'
    if (streak >= 14) return '⚡'
    if (streak >= 7) return '🌟'
    if (streak >= 3) return '✨'
    return '🎯'
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'from-red-500 to-orange-500'
    if (streak >= 14) return 'from-purple-500 to-pink-500'
    if (streak >= 7) return 'from-blue-500 to-green-500'
    if (streak >= 3) return 'from-green-500 to-blue-500'
    return 'from-gray-500 to-blue-500'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <div className={`bg-gradient-to-r ${getStreakColor(streak)} rounded-full px-3 py-2 text-white text-sm font-bold shadow-lg animate-pulse`}>
        <div className="flex items-center space-x-1">
          <span className="text-lg">{getStreakEmoji(streak)}</span>
          <span>{streak} day{streak !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}

// Milestone celebration component
export function MilestoneCelebration({
  milestone,
  onComplete
}: {
  milestone: {
    type: 'first_phrase' | 'first_week' | 'streak_milestone' | 'mastery_milestone'
    title: string
    description: string
    reward?: string
  }
  onComplete: () => void
}) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500)
    }, 4000)

    return () => clearTimeout(timer)
  }, [onComplete])

  const getMilestoneEmoji = (type: string) => {
    switch (type) {
      case 'first_phrase': return '🎯'
      case 'first_week': return '📅'
      case 'streak_milestone': return '🔥'
      case 'mastery_milestone': return '🏆'
      default: return '🎉'
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 mx-4 max-w-md text-center border border-gray-700 shadow-2xl">
        {/* Celebration header */}
        <div className="text-6xl mb-4 animate-bounce">
          {getMilestoneEmoji(milestone.type)}
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          {milestone.title}
        </h2>

        <p className="text-gray-300 mb-4">
          {milestone.description}
        </p>

        {milestone.reward && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">
              🎁 Reward: {milestone.reward}
            </p>
          </div>
        )}

        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onComplete, 300)
          }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors"
        >
          Continue Learning
        </button>
      </div>
    </div>
  )
}