'use client'

import { useState, useEffect } from 'react'
import WebPreview from './WebPreview'

interface PlayPhraseData {
  playphrase_url: string
  confidence: number
  movie_examples: string[]
  context: string
  searchability: string
}

interface PlayPhrasePlayerProps {
  phrase: string
  englishTranslation: string
}

export default function PlayPhrasePlayer({ phrase, englishTranslation }: PlayPhrasePlayerProps) {
  const [playPhraseData, setPlayPhraseData] = useState<PlayPhraseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [playPhraseUrl, setPlayPhraseUrl] = useState<string>('')
  const [showMiniBrowser, setShowMiniBrowser] = useState(false)
  
  // Convert text to PlayPhrase search format - keep German characters intact
  const toPlayPhraseQuery = (text: string, language: 'de' | 'en') => {
    let s = text.toLowerCase()

    if (language === 'de') {
      // For German: Keep umlauts and ß, but URL encode them properly
      // Only remove punctuation that's not essential (but keep apostrophes)
      s = s
        .replace(/[.,!?;:]/g, '') // Remove these punctuation marks
        .replace(/\s+/g, '+')     // Replace spaces with +
        .trim()
    } else {
      // For English: more aggressive normalization
      s = s
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '+')
        .trim()
    }

    // URL encode the result to handle special characters
    return encodeURIComponent(s.replace(/\+/g, ' ')).replace(/%20/g, '+')
  }

  useEffect(() => {
    // Generate correct PlayPhrase.me URL format
    const searchQuery = toPlayPhraseQuery(phrase, 'de')

    const correctUrl = `https://www.playphrase.me/#/search?q=${searchQuery}&language=de`
    setPlayPhraseUrl(correctUrl)

    // Load PlayPhrase data
    fetch('/german_phrases.json')
      .then(res => res.json())
      .then(data => {
        // Convert phrase to key format (e.g., "Guten Morgen" -> "guten_morgen")
        const phraseKey = phrase.toLowerCase()
          .replace(/[äöü]/g, match => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[match] || match))
          .replace(/ß/g, 'ss')
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')

        const foundData = data[phraseKey]
        if (foundData) {
          setPlayPhraseData(foundData)
        }
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to load PlayPhrase data:', err)
        setIsLoading(false)
      })
  }, [phrase])

  if (isLoading) {
    return (
      <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800">
        <div className="relative aspect-video bg-gray-900 p-6">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="w-20 h-20 rounded-full skeleton mx-auto" />
            <div className="h-6 w-1/2 skeleton mx-auto rounded" />
            <div className="h-4 w-1/3 skeleton mx-auto rounded" />
            <div className="flex justify-center space-x-2 pt-2">
              <div className="h-6 w-24 skeleton rounded" />
              <div className="h-6 w-24 skeleton rounded" />
              <div className="h-6 w-24 skeleton rounded" />
            </div>
            <div className="h-10 w-48 skeleton mx-auto rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-800 rounded-xl border border-gray-700">
      {/* Simple phrase display with movie context */}
      <div className="p-6 text-center">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-white mb-2">{phrase}</h3>
          <p className="text-gray-400">{englishTranslation}</p>
        </div>

        {/* Movie examples - if available */}
        {playPhraseData && playPhraseData.movie_examples.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-500 text-sm mb-2">In movies: {playPhraseData.movie_examples.slice(0, 2).join(', ')}</p>
          </div>
        )}

        {/* Single clean action */}
        <a
          href={playPhraseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
        >
          <span className="mr-2">🎬</span>
          Watch German Clips
        </a>
      </div>
    </div>
  )
}
