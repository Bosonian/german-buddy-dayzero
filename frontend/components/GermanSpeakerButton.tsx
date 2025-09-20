'use client'

import { useVocabularyTTS } from '@/hooks/useGermanTTS'
import { useState } from 'react'

interface GermanSpeakerButtonProps {
  text: string
  context?: 'vocabulary' | 'conversation' | 'explanation' | 'encouragement'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'minimal'
  showText?: boolean
  className?: string
}

export default function GermanSpeakerButton({
  text,
  context = 'conversation',
  size = 'md',
  variant = 'primary',
  showText = false,
  className = ''
}: GermanSpeakerButtonProps) {
  const { speak, isPlaying, isLoading, error } = useVocabularyTTS()
  const [hasInteracted, setHasInteracted] = useState(false)

  const handleSpeak = async () => {
    if (!hasInteracted) setHasInteracted(true)

    try {
      await speak(text, { context })
    } catch (err) {
      console.error('Failed to speak German text:', err)
    }
  }

  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  // Variant configurations
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600',
    minimal: 'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white'
  }

  const baseClasses = `
    inline-flex items-center justify-center rounded-full
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    group relative
  `

  const isActive = isPlaying || isLoading

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={handleSpeak}
        disabled={isActive}
        className={`
          ${baseClasses}
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${isActive ? 'scale-110' : 'hover:scale-105'}
          ${error ? 'ring-2 ring-red-500' : ''}
        `}
        title={`Speak in German: "${text}"`}
        aria-label={`Play German pronunciation of ${text}`}
      >
        {/* Loading state */}
        {isLoading && (
          <div className={`animate-spin ${iconSizes[size]}`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="60"
                strokeDashoffset="30"
              />
            </svg>
          </div>
        )}

        {/* Playing state */}
        {isPlaying && !isLoading && (
          <div className={`${iconSizes[size]} relative`}>
            <div className="absolute inset-0 animate-pulse">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </div>
            <div className="absolute inset-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                <path d="M19 12c0 2.27-1.11 4.27-2.81 5.5L17.5 19c2.16-1.47 3.5-3.89 3.5-6.5s-1.34-5.03-3.5-6.5L16.19 6.5C17.89 7.73 19 9.73 19 12z" opacity="0.7"/>
                <path d="M3 9v6h4l5 5V4L7 9H3z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Default/idle state */}
        {!isActive && (
          <svg viewBox="0 0 24 24" fill="currentColor" className={iconSizes[size]}>
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}

        {/* Error indicator */}
        {error && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}

        {/* Ripple effect on interaction */}
        {hasInteracted && (
          <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" />
        )}
      </button>

      {/* Show text alongside button */}
      {showText && (
        <span className="text-sm text-gray-300 font-medium">
          {text}
        </span>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
          Audio unavailable
        </div>
      )}
    </div>
  )
}

// Convenience component for vocabulary items
export function VocabularySpeakerButton({ word, className }: { word: string; className?: string }) {
  return (
    <GermanSpeakerButton
      text={word}
      context="vocabulary"
      size="sm"
      variant="secondary"
      className={className}
    />
  )
}

// Convenience component for phrases
export function PhraseSpeakerButton({ phrase, className }: { phrase: string; className?: string }) {
  return (
    <GermanSpeakerButton
      text={phrase}
      context="conversation"
      size="md"
      variant="primary"
      className={className}
    />
  )
}