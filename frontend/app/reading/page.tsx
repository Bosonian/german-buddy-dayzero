"use client"

import { useEffect, useState } from 'react'
import { PhraseTracker } from '@/lib/phraseProgress'
import DailyStory from '@/components/DailyStory'

interface ReadingItem {
  id: number
  cefr: string
  topic?: string
  title?: string
  text: string
  tokens: number
  source_url?: string
  license?: string
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function ReadingPage() {
  const [level, setLevel] = useState<'A1'|'A2'|'B1'|'B2'|'C1'|'C2'>('A1')
  const [items, setItems] = useState<ReadingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [phraseTracker] = useState(() => new PhraseTracker())
  const [readingsCompleted, setReadingsCompleted] = useState(0)
  const [dailyGoal] = useState(2)
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set())
  const [contentSource, setContentSource] = useState<'wikipedia' | 'daily'>('daily')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/reading/daily?level=${level}&limit=2`)
      if (!res.ok) {
        console.log('Backend not available, using fallback data')
        const fallbackRes = await fetch('/data/fallback_stories.json')
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          setItems(fallbackData.filter((item: ReadingItem) => item.cefr === level))
        } else {
          setItems([])
        }
      } else {
        const data = await res.json()
        setItems(data)
      }
    } catch (e) {
      console.log('Error loading reading items:', e)
      setError('Failed to load content. Please try again.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const track = async (itemId: number) => {
    setPosting(true)
    try {
      const token = localStorage.getItem('gb_token')
      if (token) {
        await fetch(`${API}/reading/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ item_id: itemId })
        })
      }

      setCompletedItems(prev => new Set([...prev, itemId]))
      setReadingsCompleted(prev => prev + 1)
      phraseTracker.recordSession(1, 1, 100)
    } catch (e) {
      console.error('Failed to track reading:', e)
    } finally {
      setPosting(false)
    }
  }

  useEffect(() => {
    if (contentSource === 'wikipedia') {
      load()
    }
  }, [level, contentSource])

  useEffect(() => {
    const stats = phraseTracker.getProgressStats()
    const completed = stats.statusCounts.mastered
    setReadingsCompleted(completed)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
            German Stories
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Immerse yourself in authentic German content at your level
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Reading Progress</h2>
              <p className="text-gray-400">Keep your reading streak alive!</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {readingsCompleted}/{dailyGoal}
              </div>
              <div className="text-sm text-gray-400">Today's Goal</div>
            </div>
          </div>

          <div className="relative">
            <div className="w-full bg-gray-700/50 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((readingsCompleted / dailyGoal) * 100, 100)}%` }}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-gray-300">
                {readingsCompleted >= dailyGoal ? (
                  "Daily goal complete! Amazing! 🎉"
                ) : readingsCompleted > 0 ? (
                  `${dailyGoal - readingsCompleted} more to go! 🎯`
                ) : (
                  "Let's start reading! 🚀"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Content Source Selection */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setContentSource('daily')}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              contentSource === 'daily'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600/50'
            }`}
          >
            📖 Daily Stories
          </button>
          <button
            onClick={() => setContentSource('wikipedia')}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              contentSource === 'wikipedia'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600/50'
            }`}
          >
            📰 Wikipedia News
          </button>
        </div>

        {/* Level Selection - only show for Wikipedia */}
        {contentSource === 'wikipedia' && (
          <div className="flex gap-2 justify-center flex-wrap">
            {(['A1','A2','B1','B2','C1','C2'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  level === l
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-gray-300">Loading content...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-xl border border-red-500/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-red-300">Error Loading Content</h3>
            </div>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Daily Story Content */}
        {contentSource === 'daily' && (
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
            <DailyStory />
          </div>
        )}

        {/* Wikipedia Content */}
        {contentSource === 'wikipedia' && items.map((item) => (
          <article key={item.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${{
                  'A1': 'bg-green-500/20 text-green-300 border border-green-500/30',
                  'A2': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
                  'B1': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
                  'B2': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
                  'C1': 'bg-red-500/20 text-red-300 border border-red-500/30',
                  'C2': 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }[item.cefr] || 'bg-gray-500/20 text-gray-300'}`}>
                  {item.cefr}
                </span>
                {item.topic && (
                  <span className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-lg text-xs">
                    {item.topic}
                  </span>
                )}
              </div>

              {completedItems.has(item.id) ? (
                <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-semibold">
                  ✓ Completed
                </span>
              ) : (
                <button
                  disabled={posting}
                  onClick={() => track(item.id)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                >
                  {posting ? 'Saving...' : 'Mark as Read'}
                </button>
              )}
            </div>

            {item.title && (
              <h2 className="text-xl font-bold text-white">{item.title}</h2>
            )}

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-200 leading-relaxed whitespace-pre-line">{item.text}</p>
            </div>

            {item.source_url && (
              <div className="pt-4 border-t border-gray-700/50">
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Source
                </a>
                {item.license && (
                  <span className="ml-4 text-xs text-gray-500">License: {item.license}</span>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  )
}