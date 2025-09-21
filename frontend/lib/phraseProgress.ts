// Phrase Progress Tracking System
// More forgiving mastery criteria based on user simulation findings

export interface PhraseProgress {
  id: number
  exposures: number
  successCount: number
  totalConfidence: number
  exerciseTypes: Set<string>
  status: 'new' | 'familiar' | 'learning' | 'mastered'
  firstSeen: Date
  lastSeen: Date
  consecutiveSuccesses: number
  masteredAt?: Date
}

export interface LearningSession {
  date: string
  phrasesCompleted: number
  exercisesCompleted: number
  masteredCount: number
  avgConfidence: number
  streak: number
}

export class PhraseTracker {
  private phrases: Map<number, PhraseProgress> = new Map()
  private sessions: LearningSession[] = []
  private currentStreak: number = 0

  constructor() {
    this.loadFromStorage()
  }

  // Track phrase interaction with more forgiving criteria
  trackExercise(
    phraseId: number,
    exerciseType: string,
    success: boolean,
    confidence: number
  ): PhraseProgress {
    let progress = this.phrases.get(phraseId)

    if (!progress) {
      progress = {
        id: phraseId,
        exposures: 0,
        successCount: 0,
        totalConfidence: 0,
        exerciseTypes: new Set(),
        status: 'new',
        firstSeen: new Date(),
        lastSeen: new Date(),
        consecutiveSuccesses: 0
      }
      this.phrases.set(phraseId, progress)
    }

    // Update tracking data
    progress.exposures++
    progress.lastSeen = new Date()
    progress.exerciseTypes.add(exerciseType)
    progress.totalConfidence += confidence

    if (success) {
      progress.successCount++
      progress.consecutiveSuccesses++
    } else {
      progress.consecutiveSuccesses = 0
    }

    // Update status with more forgiving criteria
    progress.status = this.calculateStatus(progress)

    this.saveToStorage()
    return progress
  }

  // More forgiving mastery criteria based on simulation results
  private calculateStatus(progress: PhraseProgress): 'new' | 'familiar' | 'learning' | 'mastered' {
    const successRate = progress.successCount / progress.exposures
    const avgConfidence = progress.totalConfidence / progress.exposures

    // Mastered: 4+ exposures + 60% success + 55% confidence (lowered from 5/70%/65%)
    if (progress.exposures >= 4 && successRate >= 0.6 && avgConfidence >= 55) {
      if (progress.status !== 'mastered') {
        progress.masteredAt = new Date()
      }
      return 'mastered'
    }

    // Learning: 3+ exposures + 50% success (lowered from 5/60%)
    if (progress.exposures >= 3 && successRate >= 0.5) {
      return 'learning'
    }

    // Familiar: 2+ exposures (unchanged)
    if (progress.exposures >= 2) {
      return 'familiar'
    }

    return 'new'
  }

  // Get adaptive daily goal based on user pattern
  getAdaptiveDailyGoal(): number {
    const recentSessions = this.sessions.slice(-7) // Last 7 days

    if (recentSessions.length === 0) return 3 // Start easy for new users

    const avgCompletion = recentSessions.reduce((sum, s) => sum + s.phrasesCompleted, 0) / recentSessions.length
    const consistency = recentSessions.length / 7 // How many of last 7 days were active

    // Adaptive goals based on performance
    if (consistency >= 0.8 && avgCompletion >= 4) return 6 // High performer
    if (consistency >= 0.6 && avgCompletion >= 3) return 5 // Regular user
    if (consistency >= 0.4) return 4 // Casual but engaged
    return 3 // Struggling user - keep it achievable
  }

  // Get confidence booster based on recent performance
  getConfidenceBooster(): { shouldBoost: boolean; message: string; bonus: number } {
    const recent = Array.from(this.phrases.values())
      .filter(p => p.lastSeen.getTime() > Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours

    if (recent.length === 0) return { shouldBoost: false, message: '', bonus: 0 }

    const recentMastery = recent.filter(p => p.status === 'mastered').length
    const recentSuccess = recent.reduce((sum, p) => sum + p.successCount, 0) / recent.reduce((sum, p) => sum + p.exposures, 1)

    // Success streak bonus
    if (recentMastery >= 2) {
      return {
        shouldBoost: true,
        message: `🔥 Amazing! You mastered ${recentMastery} phrases today!`,
        bonus: 10
      }
    }

    // High success rate bonus
    if (recentSuccess >= 0.8 && recent.length >= 3) {
      return {
        shouldBoost: true,
        message: `⭐ Great accuracy! ${Math.round(recentSuccess * 100)}% success rate!`,
        bonus: 5
      }
    }

    // Consistency bonus
    if (this.currentStreak >= 3) {
      return {
        shouldBoost: true,
        message: `🎯 ${this.currentStreak} day streak! Keep it up!`,
        bonus: this.currentStreak
      }
    }

    return { shouldBoost: false, message: '', bonus: 0 }
  }

  // Track reading progress (separate from phrase exercises)
  trackReadingProgress(readingsCompleted: number, dailyGoal: number): { streakBonus: boolean; message: string } {
    const today = new Date().toISOString().split('T')[0]

    // Check if goal is achieved
    if (readingsCompleted >= dailyGoal) {
      // Update reading streak separately
      const readingStreak = parseInt(localStorage.getItem('gb_reading_streak') || '0') + 1
      localStorage.setItem('gb_reading_streak', readingStreak.toString())
      localStorage.setItem('gb_last_reading_date', today)

      if (readingStreak >= 3) {
        return {
          streakBonus: true,
          message: `📚 ${readingStreak} day reading streak! Excellent consistency!`
        }
      }

      return {
        streakBonus: false,
        message: `🎉 Daily reading goal achieved!`
      }
    }

    return { streakBonus: false, message: '' }
  }

  // Record daily session
  recordSession(phrasesCompleted: number, exercisesCompleted: number, avgConfidence: number) {
    const today = new Date().toISOString().split('T')[0]
    const todayMastered = Array.from(this.phrases.values()).filter(
      p => p.masteredAt && p.masteredAt.toISOString().split('T')[0] === today
    ).length

    const session: LearningSession = {
      date: today,
      phrasesCompleted,
      exercisesCompleted,
      masteredCount: todayMastered,
      avgConfidence,
      streak: this.currentStreak
    }

    // Update or add today's session
    const existingIndex = this.sessions.findIndex(s => s.date === today)
    if (existingIndex >= 0) {
      this.sessions[existingIndex] = session
    } else {
      this.sessions.push(session)
      this.currentStreak++
    }

    this.saveToStorage()
  }

  // Get progress statistics
  getProgressStats() {
    const phrases = Array.from(this.phrases.values())
    const total = phrases.length

    const statusCounts = {
      new: phrases.filter(p => p.status === 'new').length,
      familiar: phrases.filter(p => p.status === 'familiar').length,
      learning: phrases.filter(p => p.status === 'learning').length,
      mastered: phrases.filter(p => p.status === 'mastered').length
    }

    const masteryRate = total > 0 ? statusCounts.mastered / total : 0
    const avgExposures = total > 0 ? phrases.reduce((sum, p) => sum + p.exposures, 0) / total : 0

    return {
      total,
      statusCounts,
      masteryRate,
      avgExposures,
      currentStreak: this.currentStreak,
      totalSessions: this.sessions.length
    }
  }

  // Get phrases by status for UI display
  getPhrasesByStatus(status: 'new' | 'familiar' | 'learning' | 'mastered'): PhraseProgress[] {
    return Array.from(this.phrases.values()).filter(p => p.status === status)
  }

  // Check if daily goal is met (more forgiving)
  isDailyGoalMet(): boolean {
    const goal = this.getAdaptiveDailyGoal()
    const today = new Date().toISOString().split('T')[0]
    const todaySession = this.sessions.find(s => s.date === today)

    return todaySession ? todaySession.phrasesCompleted >= goal : false
  }

  // Storage methods
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      const data = {
        phrases: Array.from(this.phrases.entries()).map(([id, progress]) => [
          id,
          {
            ...progress,
            exerciseTypes: Array.from(progress.exerciseTypes),
            firstSeen: progress.firstSeen.toISOString(),
            lastSeen: progress.lastSeen.toISOString(),
            masteredAt: progress.masteredAt?.toISOString()
          }
        ]),
        sessions: this.sessions,
        currentStreak: this.currentStreak
      }
      localStorage.setItem('gb_phrase_progress', JSON.stringify(data))
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gb_phrase_progress')
      if (stored) {
        try {
          const data = JSON.parse(stored)

          // Restore phrases map
          if (data.phrases) {
            this.phrases = new Map(
              data.phrases.map(([id, progress]: [number, any]) => [
                id,
                {
                  ...progress,
                  exerciseTypes: new Set(progress.exerciseTypes),
                  firstSeen: new Date(progress.firstSeen),
                  lastSeen: new Date(progress.lastSeen),
                  masteredAt: progress.masteredAt ? new Date(progress.masteredAt) : undefined
                }
              ])
            )
          }

          // Restore sessions and streak
          this.sessions = data.sessions || []
          this.currentStreak = data.currentStreak || 0
        } catch (error) {
          console.error('Failed to load phrase progress:', error)
        }
      }
    }
  }

  // Reset progress (for testing)
  reset() {
    this.phrases.clear()
    this.sessions = []
    this.currentStreak = 0
    this.saveToStorage()
  }
}