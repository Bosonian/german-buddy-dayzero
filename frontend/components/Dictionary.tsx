'use client'

import { useState, useEffect, useMemo } from 'react'

interface DictionaryEntry {
  id: number
  german: string
  english: string
  pronunciation: string
  gender?: string
  plural?: string
  wordType: string
  level: string
  conjugation?: {
    ich?: string
    du?: string
    er?: string
    wir?: string
    ihr?: string
    sie?: string
  }
  examples: Array<{
    german: string
    english: string
  }>
  categories: string[]
  storyDays: number[]
  searchTerms: string[]
}

interface DictionaryStats {
  totalEntries: number
  byWordType: {
    noun: number
    verb: number
    adjective: number
    number: number
    other: number
  }
  byLevel: {
    A1: number
    A2: number
    B1: number
    B2: number
    C1: number
    C2: number
  }
  categories: string[]
}

export default function Dictionary() {
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([])
  const [stats, setStats] = useState<DictionaryStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedWordType, setSelectedWordType] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null)

  // Load dictionary data
  useEffect(() => {
    loadDictionary()
  }, [])

  const loadDictionary = async () => {
    setLoading(true)
    try {
      // Load dictionary entries
      const dictResponse = await fetch('/data/german_dictionary.json')
      if (dictResponse.ok) {
        const dictData: DictionaryEntry[] = await dictResponse.json()
        setDictionary(dictData)
      }

      // Load statistics
      const statsResponse = await fetch('/data/dictionary_stats.json')
      if (statsResponse.ok) {
        const statsData: DictionaryStats = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error loading dictionary:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search dictionary entries
  const filteredEntries = useMemo(() => {
    return dictionary.filter(entry => {
      // Search term filter
      const matchesSearch = searchTerm === '' ||
        entry.searchTerms.some(term =>
          term.includes(searchTerm.toLowerCase())
        )

      // Category filter
      const matchesCategory = selectedCategory === 'all' ||
        entry.categories.includes(selectedCategory)

      // Word type filter
      const matchesWordType = selectedWordType === 'all' ||
        entry.wordType === selectedWordType

      // Level filter
      const matchesLevel = selectedLevel === 'all' ||
        entry.level === selectedLevel

      return matchesSearch && matchesCategory && matchesWordType && matchesLevel
    }).sort((a, b) => a.german.localeCompare(b.german))
  }, [dictionary, searchTerm, selectedCategory, selectedWordType, selectedLevel])

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dictionary Header */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">📚 German Dictionary</h1>
        <p className="text-gray-300 mb-4">
          Comprehensive dictionary with {stats?.totalEntries || 0} German words from your daily stories
        </p>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-900/30 border border-blue-700 p-3 rounded">
              <div className="text-blue-400 text-sm">Nouns</div>
              <div className="text-xl font-bold">{stats.byWordType.noun}</div>
            </div>
            <div className="bg-green-900/30 border border-green-700 p-3 rounded">
              <div className="text-green-400 text-sm">Verbs</div>
              <div className="text-xl font-bold">{stats.byWordType.verb}</div>
            </div>
            <div className="bg-purple-900/30 border border-purple-700 p-3 rounded">
              <div className="text-purple-400 text-sm">Adjectives</div>
              <div className="text-xl font-bold">{stats.byWordType.adjective}</div>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded">
              <div className="text-yellow-400 text-sm">A1 Level</div>
              <div className="text-xl font-bold">{stats.byLevel.A1}</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder="Search German or English words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {stats?.categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* Word Type Filter */}
            <select
              value={selectedWordType}
              onChange={(e) => setSelectedWordType(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Word Types</option>
              <option value="noun">Nouns</option>
              <option value="verb">Verbs</option>
              <option value="adjective">Adjectives</option>
              <option value="number">Numbers</option>
            </select>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-gray-400 text-sm">
        Showing {filteredEntries.length} of {dictionary.length} entries
      </div>

      {/* Dictionary Entries */}
      <div className="grid gap-4">
        {filteredEntries.map(entry => (
          <div
            key={entry.id}
            className="bg-gray-800 border border-gray-700 p-4 rounded-xl hover:border-blue-600 transition-colors cursor-pointer"
            onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{entry.german}</h3>
                    {entry.gender && (
                      <span className="px-2 py-1 bg-blue-600 text-xs rounded">{entry.gender}</span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded ${
                      entry.wordType === 'noun' ? 'bg-blue-900/50 text-blue-300' :
                      entry.wordType === 'verb' ? 'bg-green-900/50 text-green-300' :
                      entry.wordType === 'adjective' ? 'bg-purple-900/50 text-purple-300' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {entry.wordType}
                    </span>
                    <span className="px-2 py-1 bg-yellow-600 text-xs rounded text-black font-bold">
                      {entry.level}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">{entry.english}</p>
                  <p className="text-gray-500 text-sm mt-1">/{entry.pronunciation}/</p>
                </div>
              </div>
              <div className="text-gray-400">
                {selectedEntry?.id === entry.id ? '−' : '+'}
              </div>
            </div>

            {/* Expanded Details */}
            {selectedEntry?.id === entry.id && (
              <div className="mt-4 pt-4 border-t border-gray-600 space-y-4">
                {/* Noun Details */}
                {entry.wordType === 'noun' && entry.plural && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-400 mb-1">Plural</h4>
                    <p className="text-gray-300">{entry.plural}</p>
                  </div>
                )}

                {/* Verb Conjugation */}
                {entry.wordType === 'verb' && entry.conjugation && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-2">Conjugation</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(entry.conjugation).map(([pronoun, form]) => (
                        <div key={pronoun} className="flex justify-between">
                          <span className="text-gray-400">{pronoun}:</span>
                          <span className="text-gray-300">{form}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                <div>
                  <h4 className="text-sm font-semibold text-purple-400 mb-2">Examples</h4>
                  <div className="space-y-2">
                    {entry.examples.map((example, idx) => (
                      <div key={idx} className="bg-gray-700 p-3 rounded">
                        <p className="text-white">{example.german}</p>
                        <p className="text-gray-400 text-sm">{example.english}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {entry.categories.map(category => (
                      <span
                        key={category}
                        className="px-2 py-1 bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-xs rounded"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Story References */}
                {entry.storyDays.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">Found in Stories</h4>
                    <div className="flex flex-wrap gap-2">
                      {entry.storyDays.map(day => (
                        <span
                          key={day}
                          className="px-2 py-1 bg-orange-900/50 border border-orange-700 text-orange-300 text-xs rounded"
                        >
                          Day {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredEntries.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl text-center">
          <p className="text-gray-400">No dictionary entries found matching your search criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('all')
              setSelectedWordType('all')
              setSelectedLevel('all')
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}