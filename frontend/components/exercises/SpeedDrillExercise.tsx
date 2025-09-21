'use client'

import { useState, useEffect, useRef } from 'react'

interface SpeedDrillExerciseProps {
  phrase: {
    german: string
    english: string
    example: string
    culturalNote: string
  }
  onComplete: (averageTime: number, accuracy: number, confidence: number) => void
}

export default function SpeedDrillExercise({ phrase, onComplete }: SpeedDrillExerciseProps) {
  const [currentRound, setCurrentRound] = useState(0)
  const [showPhrase, setShowPhrase] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [roundTimes, setRoundTimes] = useState<number[]>([])
  const [roundAccuracy, setRoundAccuracy] = useState<boolean[]>([])
  const [startTime, setStartTime] = useState<number>(0)
  const [confidence, setConfidence] = useState(50)
  const [isComplete, setIsComplete] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const totalRounds = 3

  useEffect(() => {
    if (showPhrase && inputRef.current) {
      inputRef.current.focus()
      setStartTime(Date.now())
    }
  }, [showPhrase])

  const startRound = () => {
    setCountdown(3)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(timer)
          setShowPhrase(true)
          setCountdown(null)
          return null
        }
        return prev! - 1
      })
    }, 1000)
  }

  const normalizeForComparison = (text: string) => {
    return text.toLowerCase()
      .replace(/[.,!?;:]/g, '') // Remove punctuation but keep German characters
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim()
  }

  const handleSubmit = () => {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    const isAccurate = normalizeForComparison(userInput) === normalizeForComparison(phrase.german)

    setRoundTimes(prev => [...prev, responseTime])
    setRoundAccuracy(prev => [...prev, isAccurate])

    if (currentRound + 1 >= totalRounds) {
      // Exercise complete
      const avgTime = [...roundTimes, responseTime].reduce((a, b) => a + b, 0) / totalRounds
      const accuracy = [...roundAccuracy, isAccurate].filter(Boolean).length / totalRounds * 100
      setIsComplete(true)
      const backgroundConfidence = accuracy >= 80 ? 90 : accuracy >= 60 ? 70 : 50
      setTimeout(() => onComplete(avgTime, accuracy, backgroundConfidence), 2000)
    } else {
      // Next round
      setTimeout(() => {
        setCurrentRound(prev => prev + 1)
        setShowPhrase(false)
        setUserInput('')
        startRound()
      }, 1500)
    }
  }

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1) + 's'
  }

  const getSpeedRating = (ms: number) => {
    if (ms < 2000) return { text: 'Lightning Fast!', color: 'text-green-400' }
    if (ms < 3000) return { text: 'Very Fast', color: 'text-blue-400' }
    if (ms < 5000) return { text: 'Good Speed', color: 'text-yellow-400' }
    return { text: 'Take Your Time', color: 'text-orange-400' }
  }

  // Initialize first round
  useEffect(() => {
    startRound()
  }, [])

  return (
    <div className="w-full bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚡</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Speed Drill</h3>
        <p className="text-gray-400 text-sm">Type as fast and accurately as possible</p>
        <div className="mt-2 flex justify-center space-x-4 text-sm">
          <span className="text-gray-400">Round {currentRound + 1} of {totalRounds}</span>
          <span className="text-blue-400">{phrase.english}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Countdown */}
        {countdown !== null && (
          <div className="text-center">
            <div className="text-6xl font-bold text-red-400 animate-pulse">
              {countdown}
            </div>
            <p className="text-gray-400 mt-2">Get ready...</p>
          </div>
        )}

        {/* Phrase Display */}
        {showPhrase && !isComplete && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-white mb-4">{phrase.german}</p>

              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && userInput.trim() && handleSubmit()}
                  className="w-full p-4 text-lg rounded-xl border-2 border-red-500 bg-gray-800 text-white placeholder-gray-500 focus:border-red-400 transition-all"
                  placeholder="Type here..."
                />

                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="text-red-400 text-sm">
                    {Math.max(0, Math.round((Date.now() - startTime) / 100) / 10)}s
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Round Results */}
        {roundTimes.length > currentRound && (
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="text-center">
              <div className="flex justify-center items-center space-x-4 mb-2">
                <div className={`text-2xl font-bold ${getSpeedRating(roundTimes[currentRound]).color}`}>
                  {formatTime(roundTimes[currentRound])}
                </div>
                <div className={`text-2xl ${roundAccuracy[currentRound] ? 'text-green-500' : 'text-red-500'}`}>
                  {roundAccuracy[currentRound] ? '✓' : '✗'}
                </div>
              </div>
              <p className={`text-sm ${getSpeedRating(roundTimes[currentRound]).color}`}>
                {getSpeedRating(roundTimes[currentRound]).text}
              </p>
            </div>
          </div>
        )}

        {/* Final Results */}
        {isComplete && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-600 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-4 text-center">Speed Drill Complete!</h4>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {formatTime(roundTimes.reduce((a, b) => a + b, 0) / totalRounds)}
                  </div>
                  <p className="text-sm text-gray-400">Average Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round(roundAccuracy.filter(Boolean).length / totalRounds * 100)}%
                  </div>
                  <p className="text-sm text-gray-400">Accuracy</p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-300">Round Breakdown:</h5>
                {roundTimes.map((time, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Round {idx + 1}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white">{formatTime(time)}</span>
                      <span className={roundAccuracy[idx] ? 'text-green-500' : 'text-red-500'}>
                        {roundAccuracy[idx] ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
            </div>
          </div>
        )}
      </div>
    </div>
  )
}