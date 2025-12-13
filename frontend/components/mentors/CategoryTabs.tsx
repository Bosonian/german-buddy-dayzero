'use client'

import { useRef, useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  icon: string
  count: number
}

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

export default function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(true)

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setShowLeftShadow(container.scrollLeft > 0)
    setShowRightShadow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll() // Initial check
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 200
    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {/* Left shadow and scroll button */}
      {showLeftShadow && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`relative group flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                isActive
                  ? 'text-white shadow-lg scale-105'
                  : 'text-gray-400 hover:text-white hover:scale-105'
              }`}
            >
              {/* Active background gradient */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20" />
              )}

              {/* Hover background */}
              {!isActive && (
                <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}

              {/* Border */}
              <div
                className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'border-2 border-blue-500/50'
                    : 'border border-gray-700 group-hover:border-gray-600'
                }`}
              />

              {/* Content */}
              <span className="relative z-10 text-xl">{category.icon}</span>
              <div className="relative z-10 flex items-center gap-2">
                <span className="font-medium text-sm">{category.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-gray-700/50 text-gray-400 group-hover:bg-gray-600/50'
                  }`}
                >
                  {category.count}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Right shadow and scroll button */}
      {showRightShadow && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
