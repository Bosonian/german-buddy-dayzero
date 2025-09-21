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
  const [posting, setPosting] = useState(false) // trigger refresh
  const [phraseTracker] = useState(() => new PhraseTracker())
  const [readingsCompleted, setReadingsCompleted] = useState(0)
  const [dailyGoal] = useState(2) // Default goal: 2 readings per day
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set())
  const [contentSource, setContentSource] = useState<'wikipedia' | 'daily'>('daily')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/reading/daily?level=${level}&limit=2`)
      if (!res.ok) {
        // If backend is not available, use fallback data
        console.log('Backend not available, using fallback data')
        setItems([
          {
            id: 1,
            cefr: level,
            topic: 'Daily Life',
            title: 'Ein Tag in Berlin',
            text: 'Berlin ist die Hauptstadt von Deutschland. Die Stadt ist sehr groß und hat viele interessante Orte. Jeden Tag kommen viele Touristen nach Berlin. Sie besuchen das Brandenburger Tor und andere Sehenswürdigkeiten.',
            tokens: 40,
            source_url: '#',
            license: 'Demo Content'
          },
          {
            id: 2,
            cefr: level,
            topic: 'Food',
            title: 'Deutsches Frühstück',
            text: 'In Deutschland essen viele Menschen Brot zum Frühstück. Sie trinken auch Kaffee oder Tee. Am Wochenende gibt es oft Brötchen mit Marmelade oder Honig. Das Frühstück ist eine wichtige Mahlzeit.',
            tokens: 35,
            source_url: '#',
            license: 'Demo Content'
          }
        ])
      } else {
        const data = await res.json()
        setItems(data)
      }
    } catch (e) {
      console.error('Error loading readings:', e)
      // Use fallback data on error
      setItems([
        {
          id: 1,
          cefr: level,
          topic: 'Daily Life',
          title: 'Ein Tag in Berlin',
          text: 'Berlin ist die Hauptstadt von Deutschland. Die Stadt ist sehr groß und hat viele interessante Orte. Jeden Tag kommen viele Touristen nach Berlin. Sie besuchen das Brandenburger Tor und andere Sehenswürdigkeiten.',
          tokens: 40,
          source_url: '#',
          license: 'Demo Content'
        },
        {
          id: 2,
          cefr: level,
          topic: 'Food',
          title: 'Deutsches Frühstück',
          text: 'In Deutschland essen viele Menschen Brot zum Frühstück. Sie trinken auch Kaffee oder Tee. Am Wochenende gibt es oft Brötchen mit Marmelade oder Honig. Das Frühstück ist eine wichtige Mahlzeit.',
          tokens: 35,
          source_url: '#',
          license: 'Demo Content'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Initialize user level and load content
  useEffect(() => {
    // Auto-detect user level from proficiency settings
    if (typeof window !== 'undefined') {
      const userLevel = localStorage.getItem('gb_proficiency_level') as 'A1'|'A2'|'B1'|'B2'|'C1'|'C2'
      if (userLevel && userLevel !== level) {
        setLevel(userLevel)
      }

      // Load today's reading progress
      const today = new Date().toDateString()
      const completed = parseInt(localStorage.getItem(`gb_readings_${today}`) || '0')
      setReadingsCompleted(completed)
    }
  }, [])

  useEffect(() => {
    if (contentSource === 'wikipedia') {
      load()
    }
  }, [level, contentSource])


  const track = async (itemId: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('gb_token') : null
      if (!token) return
      setPosting(true)

      // Track reading in backend
      await fetch(`${API}/reading/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_id: itemId, score: 100, time_ms: 0 })
      })

      // Update local progress
      const today = new Date().toDateString()
      const newCompleted = readingsCompleted + 1
      setReadingsCompleted(newCompleted)
      setCompletedItems(prev => new Set([...prev, itemId]))
      localStorage.setItem(`gb_readings_${today}`, newCompleted.toString())

      // Integrate with phrase tracker for streaks and milestones
      const progress = phraseTracker.trackReadingProgress(newCompleted, dailyGoal)
      if (progress.streakBonus) {
        console.log('Reading streak bonus!', progress)
      }

    } catch {} finally { setPosting(false) }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto p-4 pt-8 space-y-6">
        <header className="space-y-4">
          {/* Navigation */}
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <a href="/" className="text-gray-400 hover:text-white transition-colors">
                🏠 Practice
              </a>
              <a href="/reading" className="text-blue-400 hover:text-blue-300 transition-colors">
                📖 Stories
              </a>
              <a href="/dictionary" className="text-gray-400 hover:text-white transition-colors">
                📚 Dictionary
              </a>
              <a href="/vocabulary-review" className="text-gray-400 hover:text-white transition-colors">
                🧠 Vocabulary Review
              </a>
            </div>
            <div className="flex gap-2">
              {(['A1','A2','B1','B2','C1','C2'] as const).map(l => {
                const btnClass = 'px-3 py-1 rounded ' + (level===l?'bg-blue-600':'bg-gray-700 hover:bg-gray-600')
                return <button key={l} onClick={() => setLevel(l)} className={btnClass}>{l}</button>
              })}
            </div>
          </nav>

          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Daily Reading</h1>
          </div>

          {/* Content Source Selection */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setContentSource('daily')}
              className={'px-4 py-2 rounded-lg transition-all ' + (contentSource === 'daily' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600')}
            >
              📅 Daily Story
            </button>
            <button
              onClick={() => setContentSource('wikipedia')}
              className={'px-4 py-2 rounded-lg transition-all ' + (contentSource === 'wikipedia' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600')}
            >
              📰 Wikipedia News
            </button>
          </div>

          {/* Daily Progress */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Daily Reading Goal</span>
              <span className="text-sm text-gray-400">{readingsCompleted} / {dailyGoal} completed</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={'h-2 rounded-full transition-all duration-300 ' + (readingsCompleted >= dailyGoal ? 'bg-green-500' : 'bg-blue-600')}
                style={{ width: `${Math.min((readingsCompleted / dailyGoal) * 100, 100)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {readingsCompleted >= dailyGoal ? (
                <span className="text-green-400">🎉 Daily goal complete! Amazing!</span>
              ) : readingsCompleted > 0 ? (
                <span>Great progress! {dailyGoal - readingsCompleted} more to go! 🎯</span>
              ) : (
                <span>Let's start reading! 🚀</span>
              )}
            </div>
          </div>
        </header>

        {loading && (
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading Wikipedia content...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-900/30 border border-red-600 p-4 rounded-xl text-red-200 text-sm">{error}</div>
        )}

        {/* Daily Story Content */}
        {contentSource === 'daily' && (
          <DailyStory />
        )}

        {/* Wikipedia Content */}
        {contentSource === 'wikipedia' && items.map((it) => (
          <article key={it.id} className="bg-gray-800 border border-gray-700 p-5 rounded-xl space-y-2">
            <div className="text-xs text-gray-400">{it.cefr}{it.topic?` • ${it.topic}`:''}</div>
            {it.title && <h2 className="text-lg font-semibold">{it.title}</h2>}
            <p className="text-gray-200 leading-7 whitespace-pre-line">{it.text}</p>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <div>
                {it.source_url ? <a href={it.source_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">Source</a> : <span>Source: curated</span>}
                {it.license ? <span className="ml-2">• {it.license}</span> : null}
              </div>
              {completedItems.has(it.id) ? (
                <span className="px-3 py-1 rounded bg-green-600 text-green-100 text-xs">✓ Completed</span>
              ) : (
                <button
                  disabled={posting}
                  onClick={() => track(it.id)}
                  className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 transition-colors text-xs disabled:opacity-50"
                >
                  {posting ? 'Saving...' : 'Mark Read'}
                </button>
              )}
            </div>
          </article>
        ))}

      </div>
    </main>
  )
}
