'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { saveMentor, unsaveMentor } from '@/lib/api/mentors'
import type { Mentor } from '@/lib/api/mentors'

interface MentorCardProps {
  mentor: Mentor
  onSaveChange?: () => void
}

export default function MentorCard({ mentor, onSaveChange }: MentorCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Check if saved on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('gb_saved_mentors') || '[]')
      setIsSaved(saved.includes(mentor.id))
    }
  })

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent link navigation
    e.stopPropagation()

    setIsSaving(true)
    try {
      if (isSaved) {
        await unsaveMentor(mentor.id)
        setIsSaved(false)
      } else {
        await saveMentor(mentor.id)
        setIsSaved(true)
      }
      onSaveChange?.()
    } catch (error) {
      console.error('Failed to toggle save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rating)
          const partial = star === Math.ceil(rating) && rating % 1 !== 0

          return (
            <svg
              key={star}
              className={`w-4 h-4 ${
                filled
                  ? 'text-yellow-400'
                  : partial
                  ? 'text-yellow-400/50'
                  : 'text-gray-600'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )
        })}
      </div>
    )
  }

  return (
    <Link
      href={`/mentors/${mentor.id}`}
      className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
    >
      {/* Premium badge */}
      {mentor.isPremium && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-medium text-yellow-400">Premium</span>
          </div>
        </div>
      )}

      {/* Save/Heart button */}
      <button
        onClick={handleSaveToggle}
        disabled={isSaving}
        className="absolute top-3 left-3 z-10 w-9 h-9 rounded-lg bg-gray-900/80 backdrop-blur-sm border border-gray-700 flex items-center justify-center hover:bg-gray-800 transition-all duration-300 hover:scale-110 disabled:opacity-50"
      >
        <svg
          className={`w-5 h-5 transition-all duration-300 ${
            isSaved
              ? 'text-red-500 fill-current scale-110'
              : 'text-gray-400 group-hover:text-red-400'
          }`}
          fill={isSaved ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Avatar and availability indicator */}
      <div className="relative w-20 h-20 mx-auto mb-4">
        <Image
          src={mentor.avatar}
          alt={mentor.name}
          width={80}
          height={80}
          className="rounded-full border-2 border-gray-700 group-hover:border-blue-500/50 transition-all duration-300"
        />
        {mentor.availableToday && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Name and headline */}
      <div className="text-center mb-3">
        <h3 className="font-semibold text-white mb-1 line-clamp-1">{mentor.name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">{mentor.headline}</p>
      </div>

      {/* Rating and sessions */}
      <div className="flex items-center justify-center gap-3 mb-3 pb-3 border-b border-gray-700/50">
        <div className="flex items-center gap-1">
          {renderStars(mentor.rating)}
          <span className="text-sm font-medium text-white ml-1">{mentor.rating}</span>
        </div>
        <span className="text-gray-600">•</span>
        <div className="text-sm text-gray-400">
          {mentor.sessionCount} sessions
        </div>
      </div>

      {/* Category badge */}
      <div className="flex items-center justify-center mb-3">
        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-xs font-medium text-blue-300">
          {mentor.category}
        </span>
      </div>

      {/* Expertise tags */}
      <div className="flex flex-wrap gap-1.5 mb-4 min-h-[2.5rem]">
        {mentor.expertise.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="px-2 py-0.5 rounded-md bg-gray-700/50 text-xs text-gray-300 line-clamp-1"
          >
            {tag}
          </span>
        ))}
        {mentor.expertise.length > 3 && (
          <span className="px-2 py-0.5 rounded-md bg-gray-700/50 text-xs text-gray-400">
            +{mentor.expertise.length - 3}
          </span>
        )}
      </div>

      {/* Price and CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Per session</div>
          <div className="text-xl font-bold text-white">€{mentor.pricePerSession}</div>
        </div>
        <button className="relative group/btn px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
          <span className="relative z-10">Quick Book</span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {/* Languages */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-700/50">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="text-xs text-gray-400">
          {mentor.languages.join(', ')}
        </span>
      </div>
    </Link>
  )
}

// Loading skeleton
export function MentorCardSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 animate-pulse">
      <div className="w-20 h-20 mx-auto mb-4 bg-gray-700 rounded-full" />
      <div className="space-y-3">
        <div className="h-5 bg-gray-700 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-700 rounded w-2/3 mx-auto" />
        <div className="flex gap-2 justify-center pt-3">
          <div className="h-6 bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-700 rounded w-16" />
        </div>
        <div className="flex gap-2 pt-3">
          <div className="h-6 bg-gray-700 rounded flex-1" />
          <div className="h-6 bg-gray-700 rounded flex-1" />
        </div>
      </div>
    </div>
  )
}
