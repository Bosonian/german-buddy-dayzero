'use client'

import { useState, useEffect } from 'react'

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
}

interface DictionaryModalProps {
  word: string
  isOpen: boolean
  onClose: () => void
}

export default function DictionaryModal({ word, isOpen, onClose }: DictionaryModalProps) {
  const [entry, setEntry] = useState<DictionaryEntry | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && word) {
      lookupWord(word)
    }
  }, [isOpen, word])

  const lookupWord = async (searchWord: string) => {
    setLoading(true)
    try {
      const response = await fetch('/data/german_dictionary.json')
      if (response.ok) {
        const dictionary: DictionaryEntry[] = await response.json()

        // Clean the search word (remove punctuation, convert to lowercase)
        const cleanWord = searchWord.toLowerCase().replace(/[.,!?;:]/g, '')

        // Find exact match first
        let found = dictionary.find(entry =>
          entry.german.toLowerCase() === cleanWord
        )

        // If no exact match, try partial match
        if (!found) {
          found = dictionary.find(entry =>
            entry.german.toLowerCase().includes(cleanWord) ||
            entry.english.toLowerCase().includes(cleanWord)
          )
        }

        setEntry(found || null)
      }
    } catch (error) {
      console.error('Error looking up word:', error)
      setEntry(null)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Dictionary Lookup</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Looking up "{word}"...</p>
            </div>
          ) : entry ? (
            <div className="space-y-4">
              {/* Word Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-xl font-bold text-white">{entry.german}</h4>
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
                <p className="text-gray-300 text-lg">{entry.english}</p>
                <p className="text-gray-500 text-sm">/{entry.pronunciation}/</p>
              </div>

              {/* Noun Details */}
              {entry.wordType === 'noun' && entry.plural && (
                <div>
                  <h5 className="text-sm font-semibold text-blue-400 mb-1">Plural</h5>
                  <p className="text-gray-300">{entry.plural}</p>
                </div>
              )}

              {/* Verb Conjugation */}
              {entry.wordType === 'verb' && entry.conjugation && (
                <div>
                  <h5 className="text-sm font-semibold text-green-400 mb-2">Conjugation</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
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
                <h5 className="text-sm font-semibold text-purple-400 mb-2">Examples</h5>
                <div className="space-y-2">
                  {entry.examples.slice(0, 2).map((example, idx) => (
                    <div key={idx} className="bg-gray-700 p-3 rounded">
                      <p className="text-white text-sm">{example.german}</p>
                      <p className="text-gray-400 text-xs">{example.english}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h5 className="text-sm font-semibold text-yellow-400 mb-2">Categories</h5>
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
                  <h5 className="text-sm font-semibold text-orange-400 mb-2">Found in Stories</h5>
                  <div className="flex flex-wrap gap-2">
                    {entry.storyDays.slice(0, 5).map(day => (
                      <span
                        key={day}
                        className="px-2 py-1 bg-orange-900/50 border border-orange-700 text-orange-300 text-xs rounded"
                      >
                        Day {day}
                      </span>
                    ))}
                    {entry.storyDays.length > 5 && (
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                        +{entry.storyDays.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* View Full Entry */}
              <div className="pt-4 border-t border-gray-600">
                <a
                  href="/dictionary"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  📚 View in Dictionary
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                No dictionary entry found for "<span className="text-white">{word}</span>"
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Try checking spelling</p>
                <p>• Look for the base form of the word</p>
                <p>• Browse the full dictionary for similar words</p>
              </div>
              <a
                href="/dictionary"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                📚 Browse Dictionary
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}