'use client'

import { useState } from 'react'

interface Question {
  id: number
  german: string
  options: string[]
  correct: number
  level: string
}

interface EinstufungstestProps {
  onComplete: (level: string, score: number) => void
}

// Comprehensive German proficiency test questions
const QUESTIONS: Question[] = [
  // A1 Level Questions (Basic)
  {
    id: 1,
    german: "Wie heißen Sie?",
    options: ["My name is", "What is your name?", "How are you?", "Where are you from?"],
    correct: 1,
    level: "A1"
  },
  {
    id: 2,
    german: "Ich bin zwanzig Jahre ___.",
    options: ["alt", "jung", "groß", "klein"],
    correct: 0,
    level: "A1"
  },
  {
    id: 3,
    german: "Der Mann ___ ein Auto.",
    options: ["haben", "hat", "habe", "habt"],
    correct: 1,
    level: "A1"
  },

  // A2 Level Questions
  {
    id: 4,
    german: "Gestern ___ ich ins Kino gegangen.",
    options: ["bin", "habe", "war", "ist"],
    correct: 0,
    level: "A2"
  },
  {
    id: 5,
    german: "Wenn ich Zeit hätte, ___ ich gerne reisen.",
    options: ["würde", "werde", "will", "kann"],
    correct: 0,
    level: "A2"
  },
  {
    id: 6,
    german: "Das Buch, ___ auf dem Tisch liegt, gehört mir.",
    options: ["der", "die", "das", "welches"],
    correct: 2,
    level: "A2"
  },

  // B1 Level Questions
  {
    id: 7,
    german: "Obwohl es regnet, ___ wir spazieren gehen.",
    options: ["werden", "würden", "wollen", "sollen"],
    correct: 0,
    level: "B1"
  },
  {
    id: 8,
    german: "Der Brief wurde ___ dem Postboten ___ uns gebracht.",
    options: ["von, zu", "durch, für", "bei, mit", "um, nach"],
    correct: 0,
    level: "B1"
  },
  {
    id: 9,
    german: "Je länger ich warte, ___ ungeduldiger werde ich.",
    options: ["umso", "als", "wie", "so"],
    correct: 0,
    level: "B1"
  },

  // B2 Level Questions
  {
    id: 10,
    german: "Hätte ich das gewusst, ___ ich anders gehandelt.",
    options: ["hätte", "wäre", "würde", "könnte"],
    correct: 0,
    level: "B2"
  },
  {
    id: 11,
    german: "Der Vorschlag, ___ von der Regierung gemacht wurde, stößt auf Kritik.",
    options: ["der", "welcher", "was", "dass"],
    correct: 0,
    level: "B2"
  },
  {
    id: 12,
    german: "Es ist nicht ___, dass er pünktlich kommt.",
    options: ["anzunehmen", "zu nehmen", "genommen", "nehmend"],
    correct: 0,
    level: "B2"
  },

  // C1 Level Questions
  {
    id: 13,
    german: "Die Verhandlungen sind ins Stocken ___, weil beide Seiten unnachgiebig sind.",
    options: ["geraten", "gekommen", "gelangt", "gefallen"],
    correct: 0,
    level: "C1"
  },
  {
    id: 14,
    german: "Angesichts der ___ Wirtschaftslage müssen drastische Maßnahmen ergriffen werden.",
    options: ["prekären", "prekäre", "prekärer", "prekären"],
    correct: 0,
    level: "C1"
  },
  {
    id: 15,
    german: "Seine Aussage ist ___ jeder Kritik erhaben.",
    options: ["über", "von", "gegen", "vor"],
    correct: 0,
    level: "C1"
  }
]

export default function Einstufungstest({ onComplete }: EinstufungstestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [isStarted, setIsStarted] = useState(false)

  const calculateLevel = (userAnswers: number[]): { level: string; score: number; percentage: number } => {
    let correct = 0
    let levelScores = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 }

    userAnswers.forEach((answer, index) => {
      const question = QUESTIONS[index]
      if (answer === question.correct) {
        correct++
        levelScores[question.level as keyof typeof levelScores]++
      }
    })

    const percentage = Math.round((correct / QUESTIONS.length) * 100)

    // Determine level based on performance
    if (percentage >= 90) return { level: "C1", score: correct, percentage }
    if (percentage >= 80) return { level: "B2", score: correct, percentage }
    if (percentage >= 65) return { level: "B1", score: correct, percentage }
    if (percentage >= 50) return { level: "A2", score: correct, percentage }
    return { level: "A1", score: correct, percentage }
  }

  const handleAnswer = (selectedOption: number) => {
    const newAnswers = [...answers, selectedOption]
    setAnswers(newAnswers)

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Test completed
      setShowResult(true)
      const result = calculateLevel(newAnswers)
      setTimeout(() => {
        onComplete(result.level, result.score)
      }, 3000)
    }
  }

  const getLevelDescription = (level: string) => {
    const descriptions = {
      A1: "Beginner - You can understand and use familiar everyday expressions and very basic phrases.",
      A2: "Elementary - You can communicate in simple and routine tasks requiring a simple exchange of information.",
      B1: "Intermediate - You can deal with most situations likely to arise while traveling in areas where German is spoken.",
      B2: "Upper Intermediate - You can interact with native speakers with a degree of fluency and spontaneity.",
      C1: "Advanced - You can use German flexibly and effectively for social, academic and professional purposes."
    }
    return descriptions[level as keyof typeof descriptions] || ""
  }

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-xl border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">🎯 Einstufungstest</h2>
          <p className="text-gray-300 mb-6">
            Determine your German proficiency level with this comprehensive test.
            Answer 15 questions to get placed in the right learning level.
          </p>
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-300 mb-2">Test Overview:</h3>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• 15 questions covering A1 to C1 levels</li>
              <li>• Grammar, vocabulary, and comprehension</li>
              <li>• Takes approximately 5-10 minutes</li>
              <li>• Your level determines your starting phrases</li>
            </ul>
          </div>
          <button
            onClick={() => setIsStarted(true)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            Start Test
          </button>
        </div>
      </div>
    )
  }

  if (showResult) {
    const result = calculateLevel(answers)
    return (
      <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-xl border border-gray-700">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">🎉 Test Results</h2>
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 mb-6">
            <div className="text-4xl font-bold text-green-400 mb-2">{result.level}</div>
            <div className="text-lg text-green-300 mb-3">
              {result.score}/{QUESTIONS.length} correct ({result.percentage}%)
            </div>
            <p className="text-gray-300">{getLevelDescription(result.level)}</p>
          </div>
          <p className="text-gray-400 mb-4">
            Starting your German learning journey at {result.level} level...
          </p>
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  const question = QUESTIONS[currentQuestion]
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-xl border border-gray-700">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="text-sm text-blue-400 font-semibold mb-2">
          Level: {question.level}
        </div>
        <h3 className="text-2xl font-bold mb-6 text-center">
          {question.german}
        </h3>

        {/* Answer options */}
        <div className="grid gap-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className="p-4 text-left bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 rounded-lg transition-all"
            >
              <span className="font-semibold text-blue-400 mr-3">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Level indicator */}
      <div className="text-center text-xs text-gray-500">
        This question tests {question.level} level German
      </div>
    </div>
  )
}