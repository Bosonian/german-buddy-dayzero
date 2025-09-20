'use client'

import { useState, useEffect } from 'react'
import QuantumCard from '@/components/QuantumCard'
import MasteryMatrix from '@/components/MasteryMatrix'
import CinemaView from '@/components/CinemaView'

// Mock data - will be replaced with API calls
const mockPhrase = {
  id: 1,
  german: "Das ist ein Kinderspiel",
  english: "That's a piece of cake",
  videoId: "unhzrvp_0uA",
  example: "Die Prüfung? Das ist ein Kinderspiel für mich!",
  culturalNote: "Germans use this idiom to express that something is very easy, literally translating to 'child's play'"
}

const mockMastery = {
  recognition: 75,
  production: 40,
  pronunciation: 60,
  contextual: 55,
  cultural: 30,
  spelling: 80,
  speed: 45
}

export default function Home() {
  const [currentPhrase, setCurrentPhrase] = useState(mockPhrase)
  const [isFlipped, setIsFlipped] = useState(false)
  const [confidence, setConfidence] = useState(50)

  const handleReveal = () => {
    setIsFlipped(true)
  }

  const handleSubmit = (difficulty: number) => {
    // Here we'll integrate with the SRS system
    console.log('Submitted with difficulty:', difficulty, 'confidence:', confidence)

    // Reset for next card
    setIsFlipped(false)
    setConfidence(50)

    // Load next phrase (mock for now)
    // In production, this will call the API
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-german-red to-german-gold rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D0</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">German Buddy</h1>
              <p className="text-xs text-gray-400">Day Zero - Start Your Journey</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Streak</p>
              <p className="text-lg font-bold">7 🔥</p>
            </div>
          </div>
        </header>

        {/* Mastery Progress */}
        <MasteryMatrix mastery={mockMastery} />

        {/* Cinema View */}
        <CinemaView
          videoId={currentPhrase.videoId}
          phrase={currentPhrase}
        />

        {/* Learning Card */}
        <QuantumCard
          phrase={currentPhrase}
          isFlipped={isFlipped}
          onReveal={handleReveal}
          onSubmit={handleSubmit}
          confidence={confidence}
          onConfidenceChange={setConfidence}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">127</p>
            <p className="text-sm text-gray-400">Words Learned</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">89%</p>
            <p className="text-sm text-gray-400">Accuracy</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">A2</p>
            <p className="text-sm text-gray-400">Level</p>
          </div>
        </div>
      </div>
    </main>
  )
}