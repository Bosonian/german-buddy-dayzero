'use client'

import { useState, useEffect } from 'react'

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
  
  // Normalize text to PlayPhrase search format
  const toPlayPhraseQuery = (text: string, language: 'de' | 'en') => {
    let s = text.toLowerCase()
    if (language === 'de') {
      s = s
        .replace(/[äöü]/g, match => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[match] || match))
        .replace(/ß/g, 'ss')
    }
    return s
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '+')
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
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800">
      {/* Video Container */}
      <div className="relative aspect-video bg-gray-900">
        {/* Since PlayPhrase.me doesn't allow direct embedding, we'll show a preview */}
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">

          {/* PlayPhrase.me Preview */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎬</span>
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">{phrase}</h3>
            <p className="text-gray-300 text-lg">{englishTranslation}</p>
          </div>

          {/* Movie Examples */}
          {playPhraseData && (
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm mb-2">Featured in movies:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {playPhraseData.movie_examples.slice(0, 3).map((movie, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-full"
                  >
                    {movie}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <a
            href={playPhraseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
          >
            🎬 Watch in PlayPhrase.me
          </a>

          <p className="text-gray-500 text-xs mt-3">
            Opens in new tab • Real German movie clips
          </p>
        </div>

        {/* Overlay with phrase info */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-white text-xl font-bold">{phrase}</h3>
              <p className="text-gray-300 text-sm">{englishTranslation}</p>
            </div>

            {/* Confidence indicator */}
            {playPhraseData && (
              <div className="flex items-center">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < Math.floor(playPhraseData.confidence * 5)
                          ? 'bg-green-500'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 ml-2">
                  {Math.round(playPhraseData.confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Panel */}
      {playPhraseData && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Context Info */}
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-1">
                    Movie Context
                  </h4>
                  <p className="text-sm text-gray-400">{playPhraseData.context}</p>
                </div>
              </div>
            </div>

            {/* Searchability */}
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-1">
                    Availability
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    playPhraseData.searchability === 'very_high'
                      ? 'bg-green-600 text-green-100'
                      : playPhraseData.searchability === 'high'
                      ? 'bg-blue-600 text-blue-100'
                      : 'bg-yellow-600 text-yellow-100'
                  }`}>
                    {playPhraseData.searchability.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showSubtitles
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            📝 Subtitles
          </button>
          <button
            onClick={() => window.open(playPhraseUrl, '_blank')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all text-gray-300"
          >
            🔄 New Search
          </button>
        </div>

        <a
          href={playPhraseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all text-white"
        >
          🎬 Open PlayPhrase.me
        </a>
      </div>

      {/* Quick Access Links */}
      <div className="p-3 bg-gray-900 border-t border-gray-700">
        <div className="flex justify-center space-x-4 text-xs">
          <a
            href={`https://www.playphrase.me/#/search?q=${toPlayPhraseQuery(phrase, 'de')}&language=de`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            German Search
          </a>
          <span className="text-gray-600">•</span>
          <a
            href={`https://www.playphrase.me/#/search?q=${toPlayPhraseQuery(englishTranslation, 'en')}&language=en`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            English Search
          </a>
          <span className="text-gray-600">•</span>
          <a
            href="https://www.playphrase.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            PlayPhrase.me
          </a>
        </div>
      </div>
    </div>
  )
}
