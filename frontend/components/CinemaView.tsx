'use client'

import { useState } from 'react'

interface CinemaViewProps {
  videoId: string
  phrase: {
    german: string
    english: string
    culturalNote?: string
  }
}

export default function CinemaView({ videoId, phrase }: CinemaViewProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800">
      {/* Video Container */}
      <div className="relative aspect-video bg-gray-900">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&start=0`}
          title="German phrase in movie context"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Overlay with phrase info */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
          <h3 className="text-white text-xl font-bold mb-1">{phrase.german}</h3>
          <p className="text-gray-300 text-sm">{phrase.english}</p>
        </div>
      </div>

      {/* Context Panel */}
      {phrase.culturalNote && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-1">
                Cultural Context
              </h4>
              <p className="text-sm text-gray-400">{phrase.culturalNote}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all">
            🔁 Repeat
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all">
            🐢 Slow
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all">
            📝 Subtitles
          </button>
        </div>

        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all">
          🎬 More Clips
        </button>
      </div>
    </div>
  )
}