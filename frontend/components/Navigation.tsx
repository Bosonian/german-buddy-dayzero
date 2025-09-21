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

  useEffect(() => {
    // Get user's current proficiency level
    if (typeof window !== 'undefined') {
      const level = localStorage.getItem('gb_proficiency_level') || 'A1'
      setUserLevel(level)
    }
  }, [])

  const navItems = [
    {
      href: '/',
      label: 'Learning',
      icon: '🎯',
      description: 'Daily phrase exercises'
    },
    {
      href: '/reading',
      label: 'Reading',
      icon: '📚',
      description: 'Daily German texts'
    },
    {
      href: '/auth',
      label: 'Profile',
      icon: '👤',
      description: 'Account & progress'
    }
  ]

  return (
    <nav className={`bg-gray-800 border-b border-gray-700 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="text-2xl">🇩🇪</div>
            <div>
              <div className="text-xl font-bold text-white">German Buddy</div>
              <div className="text-xs text-gray-400">Level: {userLevel}</div>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}