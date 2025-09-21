#!/usr/bin/env node

/**
 * German Buddy 30-Day User Flow Simulation
 * Simulates different user types and learning patterns over 30 days
 */

import fs from 'fs'
import path from 'path'

// Load phrase data for different levels
const loadPhraseData = (level) => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'srs', level, 'part-001.json')
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Failed to load ${level} data:`, error.message)
    return []
  }
}

// Exercise types and their difficulty multipliers
const EXERCISE_TYPES = [
  'recognition',    // Easiest - Quantum card flip
  'audio',         // Listen and select
  'production',    // Type the German phrase
  'spelling',      // Listen and spell
  'contextual',    // Situational usage
  'pronunciation', // Record pronunciation
  'speed'          // Speed drill - Hardest
]

// User archetypes with different learning patterns
const USER_ARCHETYPES = {
  DEDICATED: {
    name: 'Dedicated Learner',
    sessionFrequency: 1.0,        // Always completes daily session
    accuracyRate: 0.85,           // 85% average accuracy
    confidenceTrend: 'increasing', // Gets more confident over time
    skipProbability: 0.05,        // Rarely skips exercises
    sessionLength: 'full'         // Always completes full 5-phrase quota
  },
  CASUAL: {
    name: 'Casual Learner',
    sessionFrequency: 0.7,        // Misses ~30% of days
    accuracyRate: 0.70,           // 70% average accuracy
    confidenceTrend: 'stable',    // Confidence stays steady
    skipProbability: 0.15,        // Sometimes skips difficult exercises
    sessionLength: 'variable'     // Sometimes stops early
  },
  INCONSISTENT: {
    name: 'Inconsistent Learner',
    sessionFrequency: 0.5,        // Only learns half the days
    accuracyRate: 0.60,           // 60% average accuracy
    confidenceTrend: 'variable',  // Confidence fluctuates
    skipProbability: 0.25,        // Often skips hard exercises
    sessionLength: 'short'        // Often stops after 2-3 phrases
  },
  PERFECTIONIST: {
    name: 'Perfectionist',
    sessionFrequency: 0.9,        // Very consistent
    accuracyRate: 0.95,           // Very high accuracy
    confidenceTrend: 'slow',      // Conservative confidence growth
    skipProbability: 0.02,        // Almost never skips
    sessionLength: 'extended'     // Sometimes does extra practice
  }
}

class PhraseTracker {
  constructor() {
    this.phrases = new Map() // phraseId -> { exposures, masteries, lastSeen, difficulty }
    this.dailyProgress = []
    this.totalExposures = 0
    this.masteredPhrases = new Set()
  }

  exposurePhrase(phraseId, exerciseType, success, confidence, day) {
    if (!this.phrases.has(phraseId)) {
      this.phrases.set(phraseId, {
        exposures: 0,
        masteries: 0,
        firstSeen: day,
        lastSeen: day,
        successRate: 0,
        avgConfidence: 0,
        exerciseTypes: new Set(),
        difficulty: 'new'
      })
    }

    const phrase = this.phrases.get(phraseId)
    phrase.exposures++
    phrase.lastSeen = day
    phrase.exerciseTypes.add(exerciseType)

    // Update success rate
    const totalAttempts = phrase.exposures
    const prevSuccesses = Math.round(phrase.successRate * (totalAttempts - 1))
    const newSuccesses = prevSuccesses + (success ? 1 : 0)
    phrase.successRate = newSuccesses / totalAttempts

    // Update confidence
    phrase.avgConfidence = ((phrase.avgConfidence * (totalAttempts - 1)) + confidence) / totalAttempts

    // Determine mastery level (more realistic criteria)
    if (phrase.exposures >= 5 && phrase.successRate >= 0.7 && phrase.avgConfidence >= 65) {
      if (!this.masteredPhrases.has(phraseId)) {
        phrase.masteries++
        this.masteredPhrases.add(phraseId)
        phrase.difficulty = 'mastered'
      }
    } else if (phrase.exposures >= 3 && phrase.successRate >= 0.5) {
      phrase.difficulty = 'learning'
    } else if (phrase.exposures >= 2) {
      phrase.difficulty = 'familiar'
    }

    this.totalExposures++
  }

  getDayStats(day) {
    const dayPhrases = Array.from(this.phrases.values()).filter(p => p.lastSeen === day)
    return {
      day,
      phrasesExposed: dayPhrases.length,
      newPhrases: dayPhrases.filter(p => p.firstSeen === day).length,
      masteredToday: dayPhrases.filter(p => p.difficulty === 'mastered').length,
      totalMastered: this.masteredPhrases.size,
      totalUnique: this.phrases.size
    }
  }

  getFinalStats() {
    const phases = {
      mastered: Array.from(this.phrases.values()).filter(p => p.difficulty === 'mastered'),
      learning: Array.from(this.phrases.values()).filter(p => p.difficulty === 'learning'),
      familiar: Array.from(this.phrases.values()).filter(p => p.difficulty === 'familiar'),
      new: Array.from(this.phrases.values()).filter(p => p.difficulty === 'new')
    }

    const exerciseTypeCoverage = {}
    EXERCISE_TYPES.forEach(type => {
      exerciseTypeCoverage[type] = Array.from(this.phrases.values()).filter(
        p => p.exerciseTypes.has(type)
      ).length
    })

    return {
      totalUniquePhrases: this.phrases.size,
      totalExposures: this.totalExposures,
      masteredPhrases: phases.mastered.length,
      learningPhrases: phases.learning.length,
      familiarPhrases: phases.familiar.length,
      newPhrases: phases.new.length,
      avgExposuresPerPhrase: this.totalExposures / this.phrases.size,
      exerciseTypeCoverage,
      masteryRate: phases.mastered.length / this.phrases.size,
      phases
    }
  }
}

class UserSimulator {
  constructor(archetype, level = 'A1') {
    this.archetype = USER_ARCHETYPES[archetype]
    this.level = level
    this.phraseData = loadPhraseData(level)
    this.tracker = new PhraseTracker()
    this.currentPhraseIndex = 0
    this.daysSinceStart = 0
    this.streakDays = 0
    this.totalSessions = 0
    this.confidence = 50 // Starting confidence
  }

  simulateDay(day) {
    // Decide if user learns today
    const learnsToday = Math.random() < this.archetype.sessionFrequency

    if (!learnsToday) {
      this.streakDays = 0
      return {
        day,
        learned: false,
        reason: 'Skipped day',
        phrasesCompleted: 0,
        exercisesCompleted: 0
      }
    }

    // Simulate learning session
    return this.simulateSession(day)
  }

  simulateSession(day) {
    this.totalSessions++
    this.streakDays++

    const dailyQuota = 5
    let phrasesCompleted = 0
    let exercisesCompleted = 0
    const sessionResults = []

    // Determine session length based on archetype
    let targetPhrases = dailyQuota
    if (this.archetype.sessionLength === 'short') {
      targetPhrases = Math.max(2, Math.floor(Math.random() * 4) + 1)
    } else if (this.archetype.sessionLength === 'extended') {
      targetPhrases = dailyQuota + Math.floor(Math.random() * 3)
    } else if (this.archetype.sessionLength === 'variable') {
      targetPhrases = Math.floor(Math.random() * dailyQuota) + 2
    }

    for (let phraseNum = 0; phraseNum < targetPhrases && phraseNum < this.phraseData.length; phraseNum++) {
      const phrase = this.phraseData[this.currentPhraseIndex % this.phraseData.length]

      // Simulate 7 exercises per phrase (one for each dimension)
      let phraseEasyCount = 0

      for (let exerciseIndex = 0; exerciseIndex < EXERCISE_TYPES.length; exerciseIndex++) {
        const exerciseType = EXERCISE_TYPES[exerciseIndex]

        // Check if user skips this exercise
        if (Math.random() < this.archetype.skipProbability) {
          continue
        }

        // Simulate exercise performance
        const result = this.simulateExercise(phrase, exerciseType, day)
        sessionResults.push(result)
        exercisesCompleted++

        // Track phrase exposure
        this.tracker.exposurePhrase(
          phrase.id,
          exerciseType,
          result.success,
          result.confidence,
          day
        )

        // Count "Easy" ratings for daily quota
        if (result.difficulty === 'easy') {
          phraseEasyCount++
        }
      }

      // Phrase completed if user got at least one "Easy" rating OR completed 4+ exercises
      if (phraseEasyCount > 0 || exercisesCompleted >= 4) {
        phrasesCompleted++
      }

      this.currentPhraseIndex++

      // Early session end based on user frustration or satisfaction
      if (this.shouldEndSession(sessionResults, phraseNum)) {
        break
      }
    }

    // Update user confidence based on session performance
    this.updateConfidence(sessionResults)

    return {
      day,
      learned: true,
      phrasesCompleted,
      exercisesCompleted,
      sessionResults,
      streakDays: this.streakDays,
      confidence: this.confidence
    }
  }

  simulateExercise(phrase, exerciseType, day) {
    // Calculate success probability based on archetype and exercise difficulty
    const baseAccuracy = this.archetype.accuracyRate
    const exerciseDifficulty = EXERCISE_TYPES.indexOf(exerciseType) / EXERCISE_TYPES.length
    const confidenceBonus = (this.confidence - 50) / 100 * 0.2
    const streakBonus = Math.min(this.streakDays * 0.01, 0.1)

    const successProbability = Math.min(0.95,
      baseAccuracy - (exerciseDifficulty * 0.3) + confidenceBonus + streakBonus
    )

    const success = Math.random() < successProbability

    // Simulate confidence rating (1-100)
    let confidence = this.confidence + (Math.random() - 0.5) * 20
    if (success) confidence += 10
    else confidence -= 5
    confidence = Math.max(10, Math.min(100, confidence))

    // Simulate difficulty rating (Easy/Medium/Hard -> only Easy counts toward quota)
    let difficulty = 'medium'
    if (success && confidence > 75) difficulty = 'easy'
    else if (!success || confidence < 40) difficulty = 'hard'

    return {
      phraseId: phrase.id,
      exerciseType,
      success,
      confidence: Math.round(confidence),
      difficulty,
      timeSpent: Math.floor(Math.random() * 30) + 10 // 10-40 seconds
    }
  }

  shouldEndSession(results, phrasesCompleted) {
    if (results.length === 0) return false

    // Check recent performance for frustration indicators
    const recentResults = results.slice(-5)
    const recentSuccessRate = recentResults.filter(r => r.success).length / recentResults.length

    // End early if too many failures (frustration)
    if (recentSuccessRate < 0.3 && Math.random() < 0.4) {
      return true
    }

    // Perfectionist more likely to continue
    if (this.archetype.name === 'Perfectionist' && phrasesCompleted < 7) {
      return Math.random() < 0.1
    }

    // Casual learner might stop early if doing well
    if (this.archetype.name === 'Casual Learner' && recentSuccessRate > 0.8) {
      return Math.random() < 0.2
    }

    return false
  }

  updateConfidence(sessionResults) {
    if (sessionResults.length === 0) return

    const avgSessionConfidence = sessionResults.reduce((sum, r) => sum + r.confidence, 0) / sessionResults.length
    const successRate = sessionResults.filter(r => r.success).length / sessionResults.length

    // Adjust confidence based on archetype trend
    let confidenceChange = 0
    switch (this.archetype.confidenceTrend) {
      case 'increasing':
        confidenceChange = successRate > 0.7 ? 2 : -1
        break
      case 'stable':
        confidenceChange = (successRate - 0.7) * 3
        break
      case 'variable':
        confidenceChange = (Math.random() - 0.5) * 6
        break
      case 'slow':
        confidenceChange = successRate > 0.9 ? 1 : -0.5
        break
    }

    this.confidence = Math.max(10, Math.min(100, this.confidence + confidenceChange))
  }
}

// Main simulation function
function runSimulation(archetypeName, days = 30, level = 'A1') {
  console.log(`\n🎯 Starting ${days}-day simulation for ${archetypeName} (${level} level)`)
  console.log('='.repeat(60))

  const user = new UserSimulator(archetypeName, level)
  const dailyResults = []

  for (let day = 1; day <= days; day++) {
    const dayResult = user.simulateDay(day)
    dailyResults.push(dayResult)

    // Log weekly progress
    if (day % 7 === 0) {
      const weekResults = dailyResults.slice(-7)
      const daysLearned = weekResults.filter(d => d.learned).length
      const totalPhrases = weekResults.reduce((sum, d) => sum + d.phrasesCompleted, 0)
      const avgConfidence = weekResults.filter(d => d.confidence).reduce((sum, d) => sum + d.confidence, 0) / daysLearned || 50

      console.log(`Week ${Math.ceil(day/7)}: ${daysLearned}/7 days active, ${totalPhrases} phrases, ${Math.round(avgConfidence)}% confidence`)
    }
  }

  // Generate final report
  const finalStats = user.tracker.getFinalStats()
  const activeDays = dailyResults.filter(d => d.learned).length
  const totalPhrases = dailyResults.reduce((sum, d) => sum + d.phrasesCompleted, 0)
  const totalExercises = dailyResults.reduce((sum, d) => sum + d.exercisesCompleted, 0)

  return {
    archetypeName,
    level,
    days,
    activeDays,
    totalPhrases,
    totalExercises,
    finalStats,
    dailyResults,
    user
  }
}

// Run simulations for all archetypes
function runAllSimulations() {
  console.log('🚀 GERMAN BUDDY 30-DAY USER FLOW SIMULATION')
  console.log('📊 Testing learning progression and phrase mastery')
  console.log('')

  const results = {}

  // Test each archetype
  Object.keys(USER_ARCHETYPES).forEach(archetype => {
    results[archetype] = runSimulation(archetype, 30, 'A1')
  })

  // Also test A2 level with dedicated learner
  results['DEDICATED_A2'] = runSimulation('DEDICATED', 30, 'A2')

  // Generate comprehensive report
  generateReport(results)
}

function generateReport(results) {
  console.log('\n' + '='.repeat(80))
  console.log('📈 FINAL SIMULATION RESULTS - 30 DAY LEARNING OUTCOMES')
  console.log('='.repeat(80))

  Object.entries(results).forEach(([key, result]) => {
    const { archetypeName, level, finalStats, activeDays, totalPhrases, totalExercises, user } = result

    console.log(`\n👤 ${user.archetype.name} (${level} Level)`)
    console.log('-'.repeat(40))
    console.log(`📅 Active Days: ${activeDays}/30 (${Math.round(activeDays/30*100)}%)`)
    console.log(`🎯 Total Phrases Attempted: ${totalPhrases}`)
    console.log(`📝 Total Exercises Completed: ${totalExercises}`)
    console.log(`🎨 Unique Phrases Exposed: ${finalStats.totalUniquePhrases}`)
    console.log(`✅ Phrases Mastered: ${finalStats.masteredPhrases}`)
    console.log(`📚 Phrases in Learning: ${finalStats.learningPhrases}`)
    console.log(`👁️ Phrases Familiar: ${finalStats.familiarPhrases}`)
    console.log(`📊 Mastery Rate: ${Math.round(finalStats.masteryRate * 100)}%`)
    console.log(`🔄 Avg Exposures/Phrase: ${finalStats.avgExposuresPerPhrase.toFixed(1)}`)
    console.log(`🎭 Final Confidence: ${Math.round(user.confidence)}%`)

    // Exercise type coverage
    console.log('🎮 Exercise Type Coverage:')
    Object.entries(finalStats.exerciseTypeCoverage).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} phrases`)
    })
  })

  // Summary comparison
  console.log('\n' + '='.repeat(80))
  console.log('📊 LEARNING OUTCOME COMPARISON')
  console.log('='.repeat(80))

  console.log('Archetype\t\tActive Days\tMastered\tUnique\tMastery Rate')
  console.log('-'.repeat(70))

  Object.entries(results).forEach(([key, result]) => {
    const name = result.user.archetype.name.substring(0, 12).padEnd(12)
    const level = result.level
    const active = `${result.activeDays}/30`.padEnd(8)
    const mastered = result.finalStats.masteredPhrases.toString().padEnd(8)
    const unique = result.finalStats.totalUniquePhrases.toString().padEnd(6)
    const masteryRate = `${Math.round(result.finalStats.masteryRate * 100)}%`

    console.log(`${name} (${level})\t${active}\t${mastered}\t${unique}\t${masteryRate}`)
  })

  // Key insights
  console.log('\n' + '='.repeat(80))
  console.log('💡 KEY INSIGHTS FOR ROLLOUT')
  console.log('='.repeat(80))

  const dedicated = results.DEDICATED
  const casual = results.CASUAL
  const inconsistent = results.INCONSISTENT

  console.log(`\n🎯 EXPECTED USER OUTCOMES (30 days):`)
  console.log(`   • Dedicated Learners: ${dedicated.finalStats.masteredPhrases} phrases mastered`)
  console.log(`   • Casual Learners: ${casual.finalStats.masteredPhrases} phrases mastered`)
  console.log(`   • Inconsistent Learners: ${inconsistent.finalStats.masteredPhrases} phrases mastered`)

  console.log(`\n📈 ENGAGEMENT METRICS:`)
  console.log(`   • Dedicated: ${dedicated.activeDays}/30 days active (${Math.round(dedicated.activeDays/30*100)}%)`)
  console.log(`   • Casual: ${casual.activeDays}/30 days active (${Math.round(casual.activeDays/30*100)}%)`)
  console.log(`   • Inconsistent: ${inconsistent.activeDays}/30 days active (${Math.round(inconsistent.activeDays/30*100)}%)`)

  console.log(`\n🧠 LEARNING EFFICIENCY:`)
  console.log(`   • Average phrases to mastery: ${dedicated.finalStats.avgExposuresPerPhrase.toFixed(1)} exposures`)
  console.log(`   • Most effective archetype: ${dedicated.user.archetype.name} (${Math.round(dedicated.finalStats.masteryRate * 100)}% mastery rate)`)
  console.log(`   • Exercise completion rate: ${Math.round(dedicated.totalExercises / (dedicated.totalPhrases * 7) * 100)}%`)

  console.log(`\n⚠️ POTENTIAL ISSUES:`)
  console.log(`   • Inconsistent users may only master ${inconsistent.finalStats.masteredPhrases} phrases in 30 days`)
  console.log(`   • ${Math.round((1 - inconsistent.activeDays/30) * 100)}% dropout risk for inconsistent learners`)
  console.log(`   • Need retention features for users with <70% session frequency`)

  console.log(`\n✅ ROLLOUT RECOMMENDATIONS:`)
  console.log(`   • Target: 15-25 mastered phrases per month for average users`)
  console.log(`   • Implement streak bonuses to improve consistency`)
  console.log(`   • Add difficulty adjustment for users struggling with mastery`)
  console.log(`   • Consider reducing daily quota to 3 phrases for better completion rates`)
}

// Run the simulation
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSimulations()
}

export { UserSimulator, runSimulation, runAllSimulations }