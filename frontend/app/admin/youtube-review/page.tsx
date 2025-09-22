'use client'

import { useEffect, useMemo, useState } from 'react'
import YouTubeClips, { YouTubeClipMeta } from '@/components/YouTubeClips'

type IndexMap = Record<string, YouTubeClipMeta[]>
type PhraseMap = Record<string, any>

export default function YouTubeReviewPage() {
  const [index, setIndex] = useState<IndexMap>({})
  const [phrases, setPhrases] = useState<PhraseMap>({})
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [approved, setApproved] = useState<Record<string, YouTubeClipMeta[]>>({})

  useEffect(() => {
    fetch('/youtube_index.json').then(r => r.ok ? r.json() : {}).then(setIndex).catch(() => console.error('Failed to load youtube_index.json'))
    fetch('/german_phrases.json').then(r => r.ok ? r.json() : {}).then(setPhrases).catch(() => console.error('Failed to load german_phrases.json'))
  }, [])

  const keys = useMemo(() => Object.keys(index).sort(), [index])
  const clips = selectedKey ? index[selectedKey] : []
  const displayPhrase = useMemo(() => selectedKey?.replace(/_/g, ' ') || '', [selectedKey])

  const toggleApprove = (clip: YouTubeClipMeta) => {
    setApproved(prev => {
      const arr = prev[selectedKey] || []
      const exists = arr.find(c => c.videoId === clip.videoId && c.start === clip.start)
      const next = exists ? arr.filter(c => !(c.videoId === clip.videoId && c.start === clip.start)) : [...arr, clip]
      return { ...prev, [selectedKey]: next }
    })
  }

  const downloadApproved = () => {
    const blob = new Blob([JSON.stringify(approved, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'youtube_index_approved.json'
    a.click()
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">YouTube Review</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadApproved}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm"
              disabled={!Object.keys(approved).length}
            >
              Download Approved JSON
            </button>
          </div>
        </header>

        <div className="grid grid-cols-4 gap-4">
          {/* Sidebar */}
          <div className="col-span-1 bg-gray-800 rounded-xl border border-gray-700 p-3 max-h-[80vh] overflow-auto">
            <input
              placeholder="Search…"
              className="w-full mb-2 p-2 rounded bg-gray-900 border border-gray-700 text-sm"
              onChange={(e) => {
                const q = e.target.value.toLowerCase()
                const k = Object.keys(index).find(k => k.includes(q.replace(/\s+/g, '_')))
                if (k) setSelectedKey(k)
              }}
            />
            <ul className="space-y-1 text-sm">
              {keys.map(k => (
                <li key={k}>
                  <button
                    onClick={() => setSelectedKey(k)}
                    className={`w-full text-left px-2 py-1 rounded ${selectedKey === k ? 'bg-blue-900/30 border border-blue-700' : 'hover:bg-gray-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{k.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">{index[k]?.length || 0}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main */}
          <div className="col-span-3 space-y-4">
            {!selectedKey ? (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
                Select a phrase on the left to review clips.
              </div>
            ) : (
              <>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <h2 className="text-lg font-bold">{displayPhrase}</h2>
                  <p className="text-xs text-gray-400">{phrases[selectedKey]?.context || ''}</p>
                </div>

                {clips && clips.length ? (
                  <div className="space-y-4">
                    <YouTubeClips phrase={displayPhrase} clips={clips} />
                    <div className="grid grid-cols-2 gap-2">
                      {clips.map((c, i) => {
                        const isApproved = !!(approved[selectedKey]?.find(x => x.videoId === c.videoId && x.start === c.start))
                        return (
                          <div key={i} className={`p-3 rounded-lg border ${isApproved ? 'border-green-600 bg-green-900/20' : 'border-gray-700 bg-gray-800'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-gray-200 truncate max-w-[220px]">{c.title || 'YouTube Clip'}</div>
                                <div className="text-[10px] text-gray-400">{c.channel || 'YouTube'} • {c.videoId}</div>
                              </div>
                              <button
                                onClick={() => toggleApprove(c)}
                                className={`px-2 py-1 rounded text-xs ${isApproved ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                              >
                                {isApproved ? 'Approved' : 'Approve'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
                    No clips found in index for this phrase.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

