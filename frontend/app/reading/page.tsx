"use client"

import { useEffect, useState } from 'react'

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

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/reading/daily?level=${level}&limit=2`)
      if (!res.ok) throw new Error('Failed to load readings')
      const data = await res.json()
      setItems(data)
    } catch (e) {
      setError('Failed to load daily readings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [level])

  const track = async (itemId: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('gb_token') : null
      if (!token) return
      setPosting(true)
      await fetch(`${API}/reading/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_id: itemId, score: 0, time_ms: 0 })
      })
    } catch {} finally { setPosting(false) }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Daily Reading</h1>
          <div className="flex gap-2">
            {(['A1','A2','B1','B2','C1','C2'] as const).map(l => (
              <button key={l} onClick={() => setLevel(l)} className={\`px-3 py-1 rounded ${level===l?'bg-blue-600':'bg-gray-700 hover:bg-gray-600'}\`}>{l}</button>
            ))}
          </div>
        </header>

        {loading && (
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl text-center">Loading…</div>
        )}
        {error && (
          <div className="bg-red-900/30 border border-red-600 p-4 rounded-xl text-red-200 text-sm">{error}</div>
        )}

        {items.map((it) => (
          <article key={it.id} className="bg-gray-800 border border-gray-700 p-5 rounded-xl space-y-2">
            <div className="text-xs text-gray-400">{it.cefr}{it.topic?` • ${it.topic}`:''}</div>
            {it.title && <h2 className="text-lg font-semibold">{it.title}</h2>}
            <p className="text-gray-200 leading-7 whitespace-pre-line">{it.text}</p>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <div>
                {it.source_url ? <a href={it.source_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">Source</a> : <span>Source: curated</span>}
                {it.license ? <span className="ml-2">• {it.license}</span> : null}
              </div>
              <button disabled={posting} onClick={() => track(it.id)} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600">Mark Read</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
