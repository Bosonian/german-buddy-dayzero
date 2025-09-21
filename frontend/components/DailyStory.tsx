'use client'

import { useState, useEffect } from 'react'
import DictionaryModal from './DictionaryModal'

interface Story {
  day: number
  date: string
  level: string
  topic: string
  title: string
  text: string
  vocabulary: string[]
  grammar_focus: string
  cultural_note: string
  completed: boolean
  comprehension_questions?: Array<{
    question: string
    type: string
    options: string[]
    correct: number
    explanation: string
  }>
  targetWordCount?: number
  source?: string
  quality_score?: number
}

export default function DailyStory() {
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [showVocabulary, setShowVocabulary] = useState(false)
  const [dayOffset, setDayOffset] = useState(0)
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [showDictionary, setShowDictionary] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [questionAnswers, setQuestionAnswers] = useState<{[key: number]: number}>({})
  const [questionsCompleted, setQuestionsCompleted] = useState(false)
  const [totalProgress, setTotalProgress] = useState({ completed: 0, total: 80 })

  // Calculate current day of year
  const getDayOfYear = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const oneDay = 1000 * 60 * 60 * 24
    return Math.floor(diff / oneDay)
  }

  useEffect(() => {
    loadDailyStory()
  }, [dayOffset])

  // Load completion status when story loads
  useEffect(() => {
    if (story && typeof window !== 'undefined') {
      try {
        // Check story completion
        const completedStories = JSON.parse(localStorage.getItem('gb_completed_stories') || '[]')
        const isCompleted = completedStories.includes(story.day)
        setStory(prev => prev ? { ...prev, completed: isCompleted } : null)

        // Check question completion
        const completedQuestions = JSON.parse(localStorage.getItem('gb_completed_questions') || '{}')
        if (completedQuestions[story.day]) {
          setQuestionAnswers(completedQuestions[story.day].answers || {})
          setQuestionsCompleted(true)
        } else {
          setQuestionAnswers({})
          setQuestionsCompleted(false)
        }

        // Update total progress
        const allCompletedStories = JSON.parse(localStorage.getItem('gb_completed_stories') || '[]')
        setTotalProgress({ completed: allCompletedStories.length, total: 80 })
      } catch (error) {
        console.error('Error loading completion status:', error)
      }
    }
  }, [story?.day])

  const loadDailyStory = async () => {
    setLoading(true)
    try {
      // Load curated stories (highest quality)
      let response = await fetch('/data/german_stories_curated.json')
      if (!response.ok) {
        // Fallback to sample stories
        response = await fetch('/data/sample_stories.json')
        if (!response.ok) {
          throw new Error('Stories not found')
        }
      }

      const stories: Story[] = await response.json()

      // Get story for current day (with offset for navigation)
      const storyIndex = Math.abs(dayOffset) % stories.length
      const todayStory = stories[storyIndex] || stories[0]

      setStory(todayStory)
    } catch (error) {
      console.error('Error loading story:', error)
      // Use fallback story
      setStory({
        day: 1,
        date: 'Day 1',
        level: 'A1',
        topic: 'Familie',
        title: 'Meine Familie',
        text: 'Ich habe eine kleine Familie. Mein Vater heißt Hans. Meine Mutter heißt Anna. Ich habe einen Bruder. Er heißt Max. Wir wohnen in Berlin. Unsere Familie ist glücklich. Am Wochenende essen wir zusammen. Das ist schön.',
        vocabulary: ['Familie', 'Vater', 'Mutter', 'Bruder', 'wohnen'],
        grammar_focus: 'Possessive pronouns (mein, meine)',
        cultural_note: 'German families often eat together on weekends.',
        completed: false
      })
    } finally {
      setLoading(false)
    }
  }

  const markComplete = () => {
    if (story) {
      // Save completion to localStorage
      try {
        const completed = JSON.parse(localStorage.getItem('gb_completed_stories') || '[]')
        if (!completed.includes(story.day)) {
          completed.push(story.day)
          localStorage.setItem('gb_completed_stories', JSON.stringify(completed))
        }

        // Save detailed completion data
        const detailedProgress = JSON.parse(localStorage.getItem('gb_story_progress') || '{}')
        detailedProgress[story.day] = {
          title: story.title,
          level: story.level,
          topic: story.topic,
          completed_at: new Date().toISOString(),
          questions_completed: questionsCompleted,
          vocabulary_viewed: showVocabulary
        }
        localStorage.setItem('gb_story_progress', JSON.stringify(detailedProgress))

        // Update total progress
        const updatedCompleted = JSON.parse(localStorage.getItem('gb_completed_stories') || '[]')
        setTotalProgress({ completed: updatedCompleted.length, total: 80 })

      } catch (error) {
        console.error('Error saving story completion:', error)
      }

      setStory({ ...story, completed: true })
    }
  }

  const navigateDay = (direction: number) => {
    setDayOffset(prev => prev + direction)
  }

  // Handle word clicking for dictionary lookup
  const handleWordClick = (word: string) => {
    const cleanWord = word.replace(/[.,!?;:]/g, '').trim()
    if (cleanWord) {
      setSelectedWord(cleanWord)
      setShowDictionary(true)
    }
  }

  // Handle question answers
  const handleQuestionAnswer = (questionIndex: number, answerIndex: number) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }))
  }

  // Check if all questions are answered
  const areAllQuestionsAnswered = () => {
    if (!story?.comprehension_questions) return false
    return story.comprehension_questions.every((_, index) =>
      questionAnswers.hasOwnProperty(index)
    )
  }

  // Submit questions and check answers
  const submitQuestions = () => {
    if (!story?.comprehension_questions) return

    let correctCount = 0
    story.comprehension_questions.forEach((question, index) => {
      if (questionAnswers[index] === question.correct) {
        correctCount++
      }
    })

    setQuestionsCompleted(true)

    // Save completion to localStorage
    try {
      const completedQuestions = JSON.parse(localStorage.getItem('gb_completed_questions') || '{}')
      completedQuestions[story.day] = {
        answers: questionAnswers,
        score: correctCount,
        total: story.comprehension_questions.length,
        completed_at: new Date().toISOString()
      }
      localStorage.setItem('gb_completed_questions', JSON.stringify(completedQuestions))
    } catch (error) {
      console.error('Error saving question completion:', error)
    }
  }

  // Create clickable text with word highlighting
  const createClickableText = (text: string) => {
    const words = text.split(/(\s+)/)
    return words.map((word, index) => {
      const isWhitespace = /^\s+$/.test(word)
      if (isWhitespace) {
        return word
      }

      const cleanWord = word.replace(/[.,!?;:]/g, '')
      const isVocabularyWord = story?.vocabulary.some(
        vocabWord => vocabWord.toLowerCase() === cleanWord.toLowerCase()
      )

      return (
        <span
          key={index}
          onClick={() => handleWordClick(word)}
          className={`cursor-pointer transition-colors ${
            isVocabularyWord
              ? 'text-blue-300 hover:text-blue-200 underline decoration-dotted'
              : 'hover:text-gray-100 hover:bg-gray-700 rounded px-1'
          }`}
          title={isVocabularyWord ? 'Vocabulary word - click for definition' : 'Click for dictionary lookup'}
        >
          {word}
        </span>
      )
    })
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="bg-red-900/30 border border-red-600 p-4 rounded-xl">
        <p className="text-red-200">No story available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Story Header */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                story.level === 'A1' ? 'bg-green-600' :
                story.level === 'A2' ? 'bg-blue-600' :
                story.level === 'B1' ? 'bg-yellow-600' :
                story.level === 'B2' ? 'bg-orange-600' :
                story.level === 'C1' ? 'bg-red-600' :
                'bg-purple-600'
              } text-white`}>
                {story.level}
              </span>
              <span className="text-xs text-gray-400">{story.topic}</span>
              <span className="text-xs text-gray-500">• Day {story.day}</span>
            </div>
            <h2 className="text-xl font-bold">{story.title}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateDay(-1)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="Previous day"
            >
              ←
            </button>
            <button
              onClick={() => navigateDay(1)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="Next day"
            >
              →
            </button>
          </div>
        </div>

        {/* Story Text */}
        <div className="text-gray-200 leading-relaxed mb-4 text-lg">
          {createClickableText(story.text)}
        </div>

        {/* Dictionary Tip */}
        <div className="text-xs text-gray-500 mb-4 text-center">
          💡 Click any word to look up its meaning in the dictionary
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowVocabulary(!showVocabulary)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            {showVocabulary ? 'Hide' : 'Show'} Vocabulary
          </button>
          {story.comprehension_questions && story.comprehension_questions.length > 0 && (
            <button
              onClick={() => setShowQuestions(!showQuestions)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded transition-colors"
            >
              {showQuestions ? 'Hide' : 'Show'} Questions
            </button>
          )}
          {!story.completed && (
            <button
              onClick={markComplete}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded transition-colors"
            >
              Mark Complete ✓
            </button>
          )}
          {story.completed && (
            <span className="px-4 py-2 bg-green-900 text-green-300 rounded">
              ✓ Completed
            </span>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">A1 Level Progress</span>
          <span className="text-sm text-gray-400">{totalProgress.completed} / {totalProgress.total} stories</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-600 to-green-500"
            style={{ width: `${(totalProgress.completed / totalProgress.total) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-center">
          {totalProgress.completed === totalProgress.total ? (
            <span className="text-green-400 font-medium">🎉 A1 Level Complete! Amazing progress!</span>
          ) : (
            <span className="text-gray-400">
              {Math.round((totalProgress.completed / totalProgress.total) * 100)}% complete •
              {totalProgress.total - totalProgress.completed} stories remaining
            </span>
          )}
        </div>
      </div>

      {/* Vocabulary & Grammar Section */}
      {showVocabulary && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Vocabulary */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-400 mb-3">📚 Key Vocabulary</h3>
            <div className="flex flex-wrap gap-2">
              {story.vocabulary.map((word, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-900/50 border border-blue-700 rounded text-sm"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Grammar Focus */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">📖 Grammar Focus</h3>
            <p className="text-gray-300">{story.grammar_focus}</p>
          </div>
        </div>
      )}

      {/* Comprehension Questions */}
      {showQuestions && story.comprehension_questions && story.comprehension_questions.length > 0 && (
        <div className="bg-gray-800 border border-purple-700 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-purple-400 mb-4">🤔 Test Your Understanding</h3>
          <div className="space-y-6">
            {story.comprehension_questions.map((question, questionIndex) => (
              <div key={questionIndex} className="space-y-3">
                <h4 className="text-gray-200 font-medium">
                  {questionIndex + 1}. {question.question}
                </h4>
                <div className="grid gap-2">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = questionAnswers[questionIndex] === optionIndex
                    const isCorrect = question.correct === optionIndex
                    const showResult = questionsCompleted

                    let buttonClass = "p-3 rounded-lg border text-left transition-all "
                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "border-green-500 bg-green-900/30 text-green-300"
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "border-red-500 bg-red-900/30 text-red-300"
                      } else {
                        buttonClass += "border-gray-600 bg-gray-700 text-gray-400"
                      }
                    } else {
                      if (isSelected) {
                        buttonClass += "border-purple-500 bg-purple-900/30 text-purple-200"
                      } else {
                        buttonClass += "border-gray-600 bg-gray-700 text-gray-300 hover:border-purple-500 hover:bg-purple-900/20"
                      }
                    }

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => !questionsCompleted && handleQuestionAnswer(questionIndex, optionIndex)}
                        disabled={questionsCompleted}
                        className={buttonClass}
                      >
                        <span className="font-semibold mr-2">
                          {String.fromCharCode(65 + optionIndex)})
                        </span>
                        {option}
                        {showResult && isCorrect && <span className="ml-2">✓</span>}
                        {showResult && isSelected && !isCorrect && <span className="ml-2">✗</span>}
                      </button>
                    )
                  })}
                </div>
                {questionsCompleted && question.explanation && (
                  <div className="bg-blue-900/30 border border-blue-700 p-3 rounded">
                    <p className="text-blue-200 text-sm">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {!questionsCompleted && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={submitQuestions}
                  disabled={!areAllQuestionsAnswered()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg transition-colors font-medium"
                >
                  {areAllQuestionsAnswered() ? 'Check Answers' : `Answer all questions (${Object.keys(questionAnswers).length}/${story.comprehension_questions.length})`}
                </button>
              </div>
            )}

            {questionsCompleted && (
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500 p-4 rounded-lg text-center">
                <h4 className="text-purple-300 font-semibold mb-2">Quiz Complete! 🎉</h4>
                <p className="text-gray-300">
                  You got{' '}
                  <span className="font-bold text-green-400">
                    {story.comprehension_questions.filter((q, i) => questionAnswers[i] === q.correct).length}
                  </span>
                  {' '}out of{' '}
                  <span className="font-bold">{story.comprehension_questions.length}</span>
                  {' '}questions correct!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cultural Note */}
      {story.cultural_note && (
        <div className="bg-gray-800 border border-yellow-700/50 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">🌍 Cultural Note</h3>
          <p className="text-gray-300 text-sm">{story.cultural_note}</p>
        </div>
      )}

      {/* Dictionary Modal */}
      <DictionaryModal
        word={selectedWord}
        isOpen={showDictionary}
        onClose={() => setShowDictionary(false)}
      />
    </div>
  )
}