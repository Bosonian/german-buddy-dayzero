'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = '' }: NavigationProps) {
  const pathname = usePathname()
  const [userLevel, setUserLevel] = useState<string>('A1')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const level = localStorage.getItem('gb_proficiency_level') || 'A1'
      const token = localStorage.getItem('gb_token')
      setUserLevel(level)
      setIsAuthenticated(!!token)
    }
  }, [])

  const navItems = [
    {
      href: '/',
      label: 'Practice',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      href: '/reading',
      label: 'Stories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      href: '/dictionary',
      label: 'Dictionary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      href: '/vocabulary-review',
      label: 'Review',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <nav className={`backdrop-blur-xl bg-gray-900/80 border-b border-gray-800/50 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <span className="text-white font-bold text-lg">GB</span>
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                German Buddy
              </div>
              <div className="text-xs text-gray-400">Level {userLevel}</div>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative group flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {/* Active background gradient */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl opacity-20`} />
                  )}

                  {/* Hover background */}
                  <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Icon */}
                  <div className={`relative z-10 ${isActive ? `text-transparent bg-gradient-to-r ${item.gradient} bg-clip-text` : ''}`}>
                    {item.icon}
                  </div>

                  {/* Label - hidden on mobile */}
                  <span className={`relative z-10 font-medium text-sm hidden md:block ${
                    isActive ? `text-transparent bg-gradient-to-r ${item.gradient} bg-clip-text` : ''
                  }`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Profile/Auth */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                href="/auth"
                className="relative group flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 text-gray-400 hover:text-white"
              >
                <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center relative z-10">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="hidden sm:block text-sm font-medium relative z-10">Profile</span>
              </Link>
            ) : (
              <Link
                href="/auth"
                className="relative group flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-purple-500/30"
              >
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium text-blue-400 hidden sm:block">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}