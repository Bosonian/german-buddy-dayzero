'use client'

import { useState } from 'react'
import { ExternalLink, Play, Film } from 'lucide-react'

interface PlayPhraseButtonProps {
  phrase: string
  className?: string
  variant?: 'primary' | 'secondary' | 'minimal'
}

export default function PlayPhraseButton({
  phrase,
  className = '',
  variant = 'primary'
}: PlayPhraseButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Convert German phrase to PlayPhrase.me search format
  const createPlayPhraseUrl = (germanPhrase: string): string => {
    // Keep German characters intact - PlayPhrase.me needs them!
    const searchQuery = germanPhrase
      .toLowerCase()
      .trim()
      // Only remove punctuation, keep umlauts and ß
      .replace(/[.,!?;:"'()\[\]{}]/g, '')
      // Replace spaces with +
      .replace(/\s+/g, '+')

    // encodeURIComponent will properly encode German characters
    return `https://www.playphrase.me/#/search?q=${encodeURIComponent(searchQuery)}&language=de`
  }

  const handleClick = () => {
    const url = createPlayPhraseUrl(phrase)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
      case 'secondary':
        return 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 hover:border-gray-500'
      case 'minimal':
        return 'bg-transparent hover:bg-gray-800/20 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500'
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
        font-medium text-sm transition-all duration-200 ease-out
        transform hover:scale-105 active:scale-95
        ${getVariantStyles()}
        ${className}
      `}
      title={`Watch "${phrase}" in movies on PlayPhrase.me`}
    >
      {/* Icon with animation */}
      <div className="relative">
        <Film
          className={`w-4 h-4 transition-all duration-200 ${
            isHovered ? 'scale-110 rotate-3' : ''
          }`}
        />
        {isHovered && (
          <div className="absolute -inset-1 bg-white/20 rounded-full animate-ping" />
        )}
      </div>

      {/* Text */}
      <span className="relative">
        Watch in Movies
      </span>

      {/* External link icon */}
      <ExternalLink
        className={`w-3.5 h-3.5 transition-all duration-200 ${
          isHovered ? 'translate-x-0.5 -translate-y-0.5' : ''
        }`}
      />

      {/* Shimmer effect for primary variant */}
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      )}

      {/* Subtle glow effect */}
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/0 via-purple-600/20 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
      )}
    </button>
  )
}

// Additional components for different contexts

export function PlayPhraseButtonCompact({ phrase }: { phrase: string }) {
  return (
    <PlayPhraseButton
      phrase={phrase}
      variant="minimal"
      className="px-3 py-1.5 text-xs"
    />
  )
}

export function PlayPhraseButtonLarge({ phrase }: { phrase: string }) {
  const [isHovered, setIsHovered] = useState(false)

  const createPlayPhraseUrl = (germanPhrase: string): string => {
    // Keep German characters intact - PlayPhrase.me needs them!
    const searchQuery = germanPhrase
      .toLowerCase()
      .trim()
      // Only remove punctuation, keep umlauts and ß
      .replace(/[.,!?;:"'()\[\]{}]/g, '')
      // Replace spaces with +
      .replace(/\s+/g, '+')

    // encodeURIComponent will properly encode German characters
    return `https://www.playphrase.me/#/search?q=${encodeURIComponent(searchQuery)}&language=de`
  }

  const handleClick = () => {
    const url = createPlayPhraseUrl(phrase)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="
        group relative w-full px-6 py-4 rounded-xl
        bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600
        hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700
        text-white font-semibold text-base
        shadow-2xl hover:shadow-3xl
        transform hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-300 ease-out
        border border-white/10 hover:border-white/20
      "
      title={`Watch "${phrase}" in authentic German movies`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent" />

      {/* Content */}
      <div className="relative flex items-center justify-center gap-3">
        <div className="relative">
          <Play className={`w-6 h-6 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
          {isHovered && (
            <div className="absolute -inset-2 bg-white/20 rounded-full animate-pulse" />
          )}
        </div>

        <div className="text-center">
          <div className="font-bold">Watch in Authentic Movies</div>
          <div className="text-sm text-white/80 font-normal">
            See "{phrase}" used in real German cinema
          </div>
        </div>

        <ExternalLink className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
      </div>

      {/* Animated shimmer */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </button>
  )
}