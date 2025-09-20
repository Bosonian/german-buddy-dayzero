'use client'

import { useState } from 'react'
import QuantumCard from './QuantumCard'
import ProductionExercise from './exercises/ProductionExercise'
import AudioRecognitionExercise from './exercises/AudioRecognitionExercise'
import PronunciationExercise from './exercises/PronunciationExercise'
import SpellingExercise from './exercises/SpellingExercise'
import SpeedDrillExercise from './exercises/SpeedDrillExercise'
import ContextualExercise from './exercises/ContextualExercise'

export type ExerciseType =
  | 'recognition'     // Original quantum card (Recognition)
  | 'production'      // Type the German phrase (Production)
  | 'audio'          // Listen and select (Recognition + Audio)
  | 'pronunciation'   // Record pronunciation (Pronunciation)
  | 'spelling'       // Listen and spell (Spelling)
  | 'speed'          // Speed drill (Speed)
  | 'contextual'     // Situational usage (Contextual + Cultural)

interface ExerciseSelectorProps {
  phrase: {
    id: number
    german: string
    english: string
    example: string
    culturalNote: string
  }
  exerciseType: ExerciseType
  onComplete: (result: ExerciseResult) => void
  confidence: number
  onConfidenceChange: (confidence: number) => void
  isFlipped?: boolean
  onReveal?: () => void
}

export interface ExerciseResult {
  exerciseType: ExerciseType
  correct: boolean
  confidence: number
  timeSpent?: number
  accuracy?: number
  score?: number
  dimensions: {
    recognition: number
    production: number
    pronunciation: number
    contextual: number
    cultural: number
    spelling: number
    speed: number
  }
}

export default function ExerciseSelector({
  phrase,
  exerciseType,
  onComplete,
  confidence,
  onConfidenceChange,
  isFlipped = false,
  onReveal
}: ExerciseSelectorProps) {

  const calculateDimensions = (
    exerciseType: ExerciseType,
    correct: boolean,
    confidence: number,
    additionalData?: any
  ) => {
    const baseScore = correct ? Math.max(70, confidence) : Math.min(50, confidence)
    const dimensions = {
      recognition: 0,
      production: 0,
      pronunciation: 0,
      contextual: 0,
      cultural: 0,
      spelling: 0,
      speed: 0
    }

    switch (exerciseType) {
      case 'recognition':
        dimensions.recognition = baseScore
        break
      case 'production':
        dimensions.production = baseScore
        dimensions.spelling = baseScore * 0.8 // Secondary benefit
        break
      case 'audio':
        dimensions.recognition = baseScore
        break
      case 'pronunciation':
        dimensions.pronunciation = additionalData?.score || baseScore
        break
      case 'spelling':
        dimensions.spelling = baseScore
        break
      case 'speed':
        dimensions.speed = additionalData?.averageTime < 3000 ? baseScore : baseScore * 0.7
        dimensions.production = baseScore * 0.6 // Secondary benefit
        break
      case 'contextual':
        dimensions.contextual = baseScore
        dimensions.cultural = baseScore * 0.9 // High cultural component
        break
    }

    return dimensions
  }

  const handleExerciseComplete = (
    correct: boolean,
    exerciseConfidence: number,
    additionalData?: any
  ) => {
    const dimensions = calculateDimensions(exerciseType, correct, exerciseConfidence, additionalData)

    const result: ExerciseResult = {
      exerciseType,
      correct,
      confidence: exerciseConfidence,
      dimensions,
      ...additionalData
    }

    onComplete(result)
  }

  const handleQuantumCardSubmit = (difficulty: number) => {
    const correct = difficulty >= 3
    handleExerciseComplete(correct, confidence)
  }

  const handleSpeedDrillComplete = (averageTime: number, accuracy: number, exerciseConfidence: number) => {
    const correct = accuracy >= 70 // 70% accuracy threshold
    handleExerciseComplete(correct, exerciseConfidence, { averageTime, accuracy })
  }

  const handlePronunciationComplete = (score: number, exerciseConfidence: number) => {
    const correct = score >= 75 // 75% pronunciation score threshold
    handleExerciseComplete(correct, exerciseConfidence, { score })
  }

  switch (exerciseType) {
    case 'recognition':
      return (
        <QuantumCard
          phrase={phrase}
          isFlipped={isFlipped}
          onReveal={onReveal || (() => {})}
          onSubmit={handleQuantumCardSubmit}
          confidence={confidence}
          onConfidenceChange={onConfidenceChange}
        />
      )

    case 'production':
      return (
        <ProductionExercise
          phrase={phrase}
          onComplete={handleExerciseComplete}
        />
      )

    case 'audio':
      return (
        <AudioRecognitionExercise
          phrase={phrase}
          onComplete={handleExerciseComplete}
        />
      )

    case 'pronunciation':
      return (
        <PronunciationExercise
          phrase={phrase}
          onComplete={handlePronunciationComplete}
        />
      )

    case 'spelling':
      return (
        <SpellingExercise
          phrase={phrase}
          onComplete={handleExerciseComplete}
        />
      )

    case 'speed':
      return (
        <SpeedDrillExercise
          phrase={phrase}
          onComplete={handleSpeedDrillComplete}
        />
      )

    case 'contextual':
      return (
        <ContextualExercise
          phrase={phrase}
          onComplete={handleExerciseComplete}
        />
      )

    default:
      return (
        <div className="w-full bg-red-800 rounded-2xl p-6 border border-red-600 text-center">
          <p className="text-white">Unknown exercise type: {exerciseType}</p>
        </div>
      )
  }
}