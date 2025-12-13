'use client'

import { useState } from 'react'

interface MentorFiltersProps {
  filters: {
    minPrice?: number
    maxPrice?: number
    languages?: string[]
    availableNow?: boolean
    minRating?: number
  }
  onFiltersChange: (filters: any) => void
}

const LANGUAGES = [
  'German',
  'English',
  'Spanish',
  'French',
  'Turkish',
  'Arabic',
  'Russian',
  'Polish',
  'Italian',
]

export default function MentorFilters({ filters, onFiltersChange }: MentorFiltersProps) {
  const [minPrice, setMinPrice] = useState(filters.minPrice || 0)
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || 100)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(filters.languages || [])
  const [availableNow, setAvailableNow] = useState(filters.availableNow || false)
  const [minRating, setMinRating] = useState(filters.minRating || 0)

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    if (type === 'min') {
      setMinPrice(value)
      onFiltersChange({ ...filters, minPrice: value })
    } else {
      setMaxPrice(value)
      onFiltersChange({ ...filters, maxPrice: value })
    }
  }

  const handleLanguageToggle = (language: string) => {
    const updated = selectedLanguages.includes(language)
      ? selectedLanguages.filter(l => l !== language)
      : [...selectedLanguages, language]

    setSelectedLanguages(updated)
    onFiltersChange({ ...filters, languages: updated })
  }

  const handleAvailabilityToggle = () => {
    const updated = !availableNow
    setAvailableNow(updated)
    onFiltersChange({ ...filters, availableNow: updated })
  }

  const handleRatingChange = (rating: number) => {
    setMinRating(rating)
    onFiltersChange({ ...filters, minRating: rating })
  }

  const handleClearFilters = () => {
    setMinPrice(0)
    setMaxPrice(100)
    setSelectedLanguages([])
    setAvailableNow(false)
    setMinRating(0)
    onFiltersChange({})
  }

  const hasActiveFilters = minPrice > 0 || maxPrice < 100 || selectedLanguages.length > 0 || availableNow || minRating > 0

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Price per Session
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Min</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => handlePriceChange('min', Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    min="0"
                    max={maxPrice}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Max</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    min={minPrice}
                  />
                </div>
              </div>
            </div>
            {/* Range slider */}
            <div className="relative pt-1">
              <input
                type="range"
                min="0"
                max="100"
                value={maxPrice}
                onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Languages
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((language) => {
              const isSelected = selectedLanguages.includes(language)
              return (
                <button
                  key={language}
                  onClick={() => handleLanguageToggle(language)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-blue-400/50 shadow-lg shadow-blue-500/20'
                      : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  {language}
                </button>
              )
            })}
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Availability
          </label>
          <button
            onClick={handleAvailabilityToggle}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 ${
              availableNow
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50'
                : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${availableNow ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className={`text-sm font-medium ${availableNow ? 'text-green-300' : 'text-gray-300'}`}>
                Available Today
              </span>
            </div>
            <div
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                availableNow ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  availableNow ? 'translate-x-6' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Minimum Rating
          </label>
          <div className="space-y-2">
            {[4.5, 4.0, 3.5, 3.0].map((rating) => {
              const isSelected = minRating === rating
              return (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(isSelected ? 0 : rating)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50'
                      : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-yellow-300' : 'text-gray-300'}`}>
                    {rating}+ stars
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  )
}
