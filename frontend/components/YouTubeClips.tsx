'use client'

import { useState } from 'react'
import YouTubeClipPlayer from './YouTubeClipPlayer'

export interface YouTubeClipMeta {
  videoId: string
  start: number
  end: number
  title?: string
  channel?: string
  thumbnailUrl?: string
  contextBefore?: string
  contextAfter?: string
  score?: number
}

interface YouTubeClipsProps {
  phrase: string
  clips: YouTubeClipMeta[]
}

export default function YouTubeClips({ phrase, clips }: YouTubeClipsProps) {
  const [current, setCurrent] = useState(0)
  const clip = clips[current]

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800">
      <YouTubeClipPlayer videoId={clip.videoId} start={clip.start} end={clip.end} />

      {/* Selector */}
      <div className="bg-gray-900 border-t border-gray-800 p-3">
        <div className="flex gap-3 overflow-x-auto">
          {clips.map((c, i) => (
            <button
              key={`${c.videoId}-${i}`}
              onClick={() => setCurrent(i)}
              className={`min-w-[180px] flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                i === current
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
              aria-label={`Select clip ${i + 1}`}
            >
              <img
                src={c.thumbnailUrl || `https://i.ytimg.com/vi/${c.videoId}/hqdefault.jpg`}
                alt={c.title || phrase}
                className="w-12 h-8 object-cover rounded"
              />
              <div className="text-left">
                <div className="text-xs text-gray-200 truncate max-w-[120px]">{c.title || 'YouTube Clip'}</div>
                <div className="text-[10px] text-gray-400 truncate max-w-[120px]">{c.channel || 'YouTube'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Context */}
      {(clip.contextBefore || clip.contextAfter) && (
        <div className="bg-gray-900 border-t border-gray-800 p-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-gray-400 mb-1">Context</p>
            <div className="text-gray-300 text-sm">
              {clip.contextBefore && (
                <p className="text-gray-400 italic">{clip.contextBefore}</p>
              )}
              <p className="text-yellow-200 font-semibold">{phrase}</p>
              {clip.contextAfter && (
                <p className="text-gray-400 italic">{clip.contextAfter}</p>
              )}
            </div>
            {typeof clip.score === 'number' && (
              <p className="text-[10px] text-gray-500 mt-2">Match score: {Math.round(clip.score * 100)}%</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
