interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  alternatives?: string[]
}

interface PronunciationScore {
  overall: number
  accuracy: number
  fluency: number
  completeness: number
  feedback: string[]
}

export class GermanSpeechRecognizer {
  private recognition: any
  private isSupported: boolean

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      this.isSupported = !!SpeechRecognition

      if (this.isSupported) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.maxAlternatives = 3
        this.recognition.lang = 'de-DE'
      }
    } else {
      this.isSupported = false
    }
  }

  async recognizeAudio(audioBlob: Blob): Promise<SpeechRecognitionResult> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech recognition not supported'))
        return
      }

      let finalTranscript = ''
      let finalConfidence = 0

      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1
        const result = event.results[last]

        if (result.isFinal) {
          finalTranscript = result[0].transcript
          finalConfidence = result[0].confidence || 0.5
        }
      }

      this.recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition.onend = () => {
        resolve({
          transcript: finalTranscript,
          confidence: finalConfidence
        })
      }

      // Convert blob to audio stream for recognition
      this.playAudioToRecognition(audioBlob)
      this.recognition.start()
    })
  }

  private playAudioToRecognition(audioBlob: Blob) {
    // For Web Speech API, we need to play the audio through the microphone
    // This is a limitation of the API - it only works with live audio
    const audio = new Audio(URL.createObjectURL(audioBlob))
    audio.play()
  }

  startLiveRecognition(): Promise<SpeechRecognitionResult> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech recognition not supported'))
        return
      }

      let finalTranscript = ''
      let finalConfidence = 0
      const alternatives: string[] = []

      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1
        const result = event.results[last]

        if (result.isFinal) {
          finalTranscript = result[0].transcript
          finalConfidence = result[0].confidence || 0.5

          // Collect alternatives
          for (let i = 1; i < Math.min(3, result.length); i++) {
            alternatives.push(result[i].transcript)
          }
        }
      }

      this.recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition.onend = () => {
        resolve({
          transcript: finalTranscript,
          confidence: finalConfidence,
          alternatives
        })
      }

      this.recognition.start()
    })
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop()
    }
  }
}

// Levenshtein distance for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = []

  for (let i = 0; i <= m; i++) {
    dp[i] = []
    dp[i][0] = i
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  return dp[m][n]
}

// Calculate similarity percentage
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 100

  const distance = levenshteinDistance(s1, s2)
  const maxLength = Math.max(s1.length, s2.length)

  if (maxLength === 0) return 0

  return Math.max(0, (1 - distance / maxLength) * 100)
}

// Analyze pronunciation accuracy
export function analyzePronunciation(
  targetPhrase: string,
  spokenTranscript: string,
  confidence: number
): PronunciationScore {
  const feedback: string[] = []

  // Clean and normalize strings
  const target = targetPhrase.toLowerCase().trim()
  const spoken = spokenTranscript.toLowerCase().trim()

  // Calculate word-level accuracy
  const targetWords = target.split(/\s+/)
  const spokenWords = spoken.split(/\s+/)

  let correctWords = 0
  let totalWords = targetWords.length

  // Word-by-word comparison
  const wordScores: number[] = []
  for (let i = 0; i < targetWords.length; i++) {
    if (i < spokenWords.length) {
      const similarity = calculateSimilarity(targetWords[i], spokenWords[i])
      wordScores.push(similarity)

      if (similarity >= 80) {
        correctWords++
      } else if (similarity >= 60) {
        feedback.push(`The word "${targetWords[i]}" needs clearer pronunciation`)
        correctWords += 0.5
      } else {
        feedback.push(`The word "${targetWords[i]}" was not recognized correctly`)
      }
    } else {
      feedback.push(`Missing word: "${targetWords[i]}"`)
      wordScores.push(0)
    }
  }

  // Check for extra words
  if (spokenWords.length > targetWords.length) {
    feedback.push(`Extra words detected. Try to match the phrase exactly.`)
  }

  // Calculate scores
  const accuracy = (correctWords / totalWords) * 100
  const completeness = Math.min(100, (spokenWords.length / targetWords.length) * 100)
  const fluency = confidence * 100 // Use speech recognition confidence as fluency indicator

  // Calculate overall score with weighted average
  const overall = (accuracy * 0.5) + (fluency * 0.2) + (completeness * 0.3)

  // Add specific feedback based on common German pronunciation issues
  if (target.includes('ü') && !spoken.includes('ü') && !spoken.includes('ue')) {
    feedback.push('Pay attention to the "ü" umlaut sound - it\'s like saying "ee" with rounded lips')
  }

  if (target.includes('ö') && !spoken.includes('ö') && !spoken.includes('oe')) {
    feedback.push('The "ö" sound is unique - try saying "e" with rounded lips')
  }

  if (target.includes('ä') && !spoken.includes('ä') && !spoken.includes('ae')) {
    feedback.push('The "ä" sound is like the "e" in "bed"')
  }

  if (target.includes('ch') && spoken.replace('ch', '').includes('k')) {
    feedback.push('The "ch" sound should be softer, like a gentle hiss')
  }

  if (target.includes('r') && overall < 70) {
    feedback.push('German "r" is pronounced in the throat, not rolled like Spanish')
  }

  // Add encouragement based on score
  if (overall >= 90) {
    feedback.unshift('Excellent pronunciation! Native-like accuracy.')
  } else if (overall >= 80) {
    feedback.unshift('Very good! Minor improvements needed.')
  } else if (overall >= 70) {
    feedback.unshift('Good effort! Keep practicing for better fluency.')
  } else if (overall >= 60) {
    feedback.unshift('Getting there! Focus on the specific sounds mentioned below.')
  } else {
    feedback.unshift('Keep practicing! Try listening to the reference audio again.')
  }

  return {
    overall: Math.round(overall),
    accuracy: Math.round(accuracy),
    fluency: Math.round(fluency * 100),
    completeness: Math.round(completeness),
    feedback
  }
}

// Fallback scoring for when speech recognition fails
export function fallbackScoring(audioBlob: Blob, targetPhrase: string): PronunciationScore {
  // Analyze audio properties as a fallback
  const duration = audioBlob.size / 16000 // Rough estimate of duration
  const expectedDuration = targetPhrase.length * 0.1 // Rough estimate

  const durationScore = Math.max(0, Math.min(100, 100 - Math.abs(duration - expectedDuration) * 10))

  return {
    overall: Math.min(70, durationScore), // Cap at 70% for fallback
    accuracy: 0, // Cannot determine without transcription
    fluency: durationScore,
    completeness: durationScore,
    feedback: [
      'Speech recognition unavailable. Score based on audio duration only.',
      'For accurate scoring, please use Chrome or Edge browser.',
      'Make sure to speak clearly and at a natural pace.'
    ]
  }
}