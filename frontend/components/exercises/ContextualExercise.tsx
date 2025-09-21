'use client'

import { useState } from 'react'

interface ContextualExerciseProps {
  phrase: {
    german: string
    english: string
    example: string
    culturalNote: string
  }
  onComplete: (correct: boolean, confidence: number) => void
}

interface Scenario {
  id: string
  situation: string
  context: string
  isCorrect: boolean
  explanation: string
}

export default function ContextualExercise({ phrase, onComplete }: ContextualExerciseProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const [confidence, setConfidence] = useState(50)
  const [submitted, setSubmitted] = useState(false)

  // Generate scenarios based on the phrase
  const generateScenarios = (): Scenario[] => {
    const phraseScenarios: Record<string, Scenario[]> = {
      "Guten Morgen": [
        {
          id: "1",
          situation: "Meeting your boss at 9 AM in the office",
          context: "Formal business setting, start of workday",
          isCorrect: true,
          explanation: "Perfect! 'Guten Morgen' is appropriate for formal morning greetings."
        },
        {
          id: "2",
          situation: "Greeting friends at a late night party",
          context: "Casual social setting, evening/night time",
          isCorrect: false,
          explanation: "Incorrect. 'Guten Morgen' means 'Good morning' - wrong time of day and too formal."
        },
        {
          id: "3",
          situation: "Calling a restaurant to make a reservation at 2 PM",
          context: "Formal phone call, afternoon",
          isCorrect: false,
          explanation: "Incorrect. 'Guten Tag' would be more appropriate for afternoon situations."
        }
      ],
      "Wie geht's?": [
        {
          id: "1",
          situation: "Asking your best friend how they're doing",
          context: "Casual conversation with close friend",
          isCorrect: true,
          explanation: "Perfect! 'Wie geht's?' is casual and perfect for friends and family."
        },
        {
          id: "2",
          situation: "Speaking to your elderly neighbor formally",
          context: "Formal conversation with older person",
          isCorrect: false,
          explanation: "Too casual. 'Wie geht es Ihnen?' would be more respectful for formal situations."
        },
        {
          id: "3",
          situation: "Greeting your professor at university",
          context: "Academic setting, authority figure",
          isCorrect: false,
          explanation: "Too informal for academic settings. A more formal greeting would be appropriate."
        }
      ],
      "Danke schön": [
        {
          id: "1",
          situation: "After receiving a thoughtful birthday gift",
          context: "Expressing genuine gratitude for something meaningful",
          isCorrect: true,
          explanation: "Perfect! 'Danke schön' shows heartfelt appreciation for significant gestures."
        },
        {
          id: "2",
          situation: "When someone holds the door open briefly",
          context: "Small everyday courtesy",
          isCorrect: false,
          explanation: "Too formal. A simple 'Danke' would be more natural for small courtesies."
        },
        {
          id: "3",
          situation: "Receiving exceptional help from a stranger",
          context: "Significant assistance from someone you don't know",
          isCorrect: true,
          explanation: "Correct! 'Danke schön' is appropriate for expressing deep gratitude."
        }
      ]
    }

    // Default scenarios for phrases not in our specific list
    const defaultScenarios: Scenario[] = [
      {
        id: "1",
        situation: "In a formal business meeting",
        context: "Professional setting with colleagues",
        isCorrect: true,
        explanation: "This phrase can be appropriately used in formal situations."
      },
      {
        id: "2",
        situation: "Casual conversation with friends",
        context: "Informal social setting",
        isCorrect: false,
        explanation: "This phrase might be too formal for casual friend conversations."
      },
      {
        id: "3",
        situation: "Speaking with elderly relatives",
        context: "Family gathering, respectful conversation",
        isCorrect: true,
        explanation: "This phrase shows appropriate respect in family settings."
      }
    ]

    return phraseScenarios[phrase.german] || defaultScenarios
  }

  const scenarios = generateScenarios()
  const correctScenario = scenarios.find(s => s.isCorrect)

  const handleSubmit = () => {
    const selectedScenarioObj = scenarios.find(s => s.id === selectedScenario)
    const isCorrect = selectedScenarioObj?.isCorrect || false
    setSubmitted(true)
    const backgroundConfidence = isCorrect ? 75 : 45
    setTimeout(() => onComplete(isCorrect, backgroundConfidence), 3000)
  }

  const getResultColor = (scenario: Scenario) => {
    if (!submitted) return ''
    if (scenario.isCorrect) return 'border-green-500 bg-green-900/20'
    if (scenario.id === selectedScenario && !scenario.isCorrect) return 'border-red-500 bg-red-900/20'
    return 'border-gray-600 bg-gray-900'
  }

  const getResultIcon = (scenario: Scenario) => {
    if (!submitted) return null
    if (scenario.isCorrect) return <span className="text-green-500 text-xl">✓</span>
    if (scenario.id === selectedScenario && !scenario.isCorrect) return <span className="text-red-500 text-xl">✗</span>
    return null
  }

  return (
    <div className="w-full bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎭</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Contextual Usage</h3>
        <p className="text-gray-400 text-sm">When would you use this phrase appropriately?</p>
      </div>

      <div className="space-y-6">
        {/* Target Phrase */}
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white mb-2">{phrase.german}</p>
          <p className="text-blue-400 text-sm">{phrase.english}</p>
        </div>

        {/* Cultural Context */}
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <p className="text-yellow-300 text-sm font-semibold mb-2">💡 Cultural Context:</p>
          <p className="text-yellow-200 text-sm">{phrase.culturalNote}</p>
        </div>

        {/* Scenarios */}
        <div className="space-y-3">
          <p className="text-gray-300 font-semibold">Choose the most appropriate situation:</p>

          {scenarios.map((scenario) => (
            <div key={scenario.id} className="space-y-2">
              <button
                onClick={() => !submitted && setSelectedScenario(scenario.id)}
                disabled={submitted}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  submitted
                    ? getResultColor(scenario)
                    : selectedScenario === scenario.id
                    ? 'border-teal-500 bg-teal-900/20 text-teal-300'
                    : 'border-gray-600 bg-gray-900 text-white hover:border-teal-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold mb-1">{scenario.situation}</p>
                    <p className="text-sm text-gray-400">{scenario.context}</p>
                  </div>
                  {getResultIcon(scenario)}
                </div>
              </button>

              {/* Show explanation after submission */}
              {submitted && (selectedScenario === scenario.id || scenario.isCorrect) && (
                <div className={`ml-4 p-3 rounded-lg border ${
                  scenario.isCorrect
                    ? 'border-green-600 bg-green-900/20'
                    : 'border-red-600 bg-red-900/20'
                }`}>
                  <p className={`text-sm ${
                    scenario.isCorrect ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {scenario.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Example Usage */}
        {submitted && (
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-gray-300 text-sm font-semibold mb-2">Example in context:</p>
            <p className="text-gray-400 italic">{phrase.example}</p>
          </div>
        )}

        <div className="space-y-2">
        </div>

        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={!selectedScenario}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
          >
            Submit Answer
          </button>
        )}
      </div>
    </div>
  )
}