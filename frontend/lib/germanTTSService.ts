import { GoogleGenerativeAI } from '@google/generative-ai'

export interface GermanVoice {
  id: string
  name: string
  description: string
  gender: 'male' | 'female' | 'neutral'
  style: 'casual' | 'formal' | 'educational' | 'enthusiastic'
  suited_for: string[]
}

export const GERMAN_VOICES: GermanVoice[] = [
  {
    id: 'Kore',
    name: 'Kore',
    description: 'Bright and clear voice, perfect for educational content',
    gender: 'female',
    style: 'educational',
    suited_for: ['vocabulary', 'grammar_explanations', 'formal_lessons']
  },
  {
    id: 'Puck',
    name: 'Puck',
    description: 'Upbeat and energetic voice for engaging learning',
    gender: 'neutral',
    style: 'enthusiastic',
    suited_for: ['conversations', 'encouragement', 'interactive_exercises']
  },
  {
    id: 'Charon',
    name: 'Charon',
    description: 'Informative and professional tone',
    gender: 'male',
    style: 'formal',
    suited_for: ['complex_explanations', 'business_german', 'academic_content']
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    description: 'Casual and friendly voice for everyday German',
    gender: 'female',
    style: 'casual',
    suited_for: ['daily_conversations', 'storytelling', 'casual_phrases']
  }
]

export interface TTSOptions {
  voice?: string
  speed?: number
  context?: 'vocabulary' | 'conversation' | 'explanation' | 'encouragement'
  emphasis?: 'normal' | 'strong' | 'gentle'
}

class GermanTTSService {
  private static instance: GermanTTSService
  private genAI: GoogleGenerativeAI | null = null
  private apiKey: string | null = null
  private audioCache = new Map<string, string>()

  static getInstance(): GermanTTSService {
    if (!GermanTTSService.instance) {
      GermanTTSService.instance = new GermanTTSService()
    }
    return GermanTTSService.instance
  }

  async initialize(apiKey?: string): Promise<void> {
    try {
      console.log('🎯 German TTS Service initialized with Gemini 2.5 API')
      // API endpoint handles authentication, no client-side initialization needed
    } catch (error) {
      console.error('Failed to initialize German TTS Service:', error)
      throw error
    }
  }

  async generateGermanAudio(
    text: string,
    options: TTSOptions = {}
  ): Promise<string> {
    // Create cache key
    const cacheKey = `${text}-${JSON.stringify(options)}`
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!
    }

    try {
      // Select appropriate voice based on context
      const voice = options.voice || this.selectVoiceForContext(options.context)

      // Call our API endpoint
      const response = await fetch('/api/german-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          context: options.context || 'conversation',
          voice
        })
      })

      // Check if response is JSON (fallback) or audio blob
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        // Fallback to browser speech synthesis
        const fallbackData = await response.json()
        console.log('Using browser speech synthesis fallback:', fallbackData.message)

        return this.useBrowserSpeechSynthesis(text, options)
      }

      if (!response.ok) {
        throw new Error(`TTS API failed: ${response.statusText}`)
      }

      // Get the audio blob
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Cache the result
      this.audioCache.set(cacheKey, audioUrl)

      return audioUrl
    } catch (error) {
      console.error('German TTS generation failed:', error)
      throw error
    }
  }

  private selectVoiceForContext(context?: string): string {
    switch (context) {
      case 'vocabulary':
        return 'Kore' // Clear and educational
      case 'conversation':
        return 'Zephyr' // Casual and friendly
      case 'explanation':
        return 'Charon' // Informative and professional
      case 'encouragement':
        return 'Puck' // Upbeat and energetic
      default:
        return 'Kore' // Default to educational voice
    }
  }

  private createGermanPrompt(text: string, options: TTSOptions): string {
    let prompt = ''

    // Add emotional context
    switch (options.context) {
      case 'vocabulary':
        prompt = `Speak this German vocabulary clearly and slowly for language learning: "${text}"`
        break
      case 'conversation':
        prompt = `Say this German phrase naturally as if in casual conversation: "${text}"`
        break
      case 'explanation':
        prompt = `Explain this in German with a clear, instructional tone: "${text}"`
        break
      case 'encouragement':
        prompt = `Say this German phrase with enthusiasm and encouragement: "${text}"`
        break
      default:
        prompt = `Speak this German text with perfect pronunciation: "${text}"`
    }

    // Add emphasis instructions
    if (options.emphasis === 'strong') {
      prompt += ' Speak with strong emphasis and clarity.'
    } else if (options.emphasis === 'gentle') {
      prompt += ' Speak gently and softly.'
    }

    return prompt
  }

  private useBrowserSpeechSynthesis(text: string, options: TTSOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = options.speed || 0.9
      utterance.pitch = 1.0
      utterance.volume = 0.8

      // Try to find a German voice
      const voices = speechSynthesis.getVoices()
      const germanVoice = voices.find(voice =>
        voice.lang.startsWith('de') ||
        voice.name.toLowerCase().includes('german') ||
        voice.name.toLowerCase().includes('deutsch')
      )

      if (germanVoice) {
        utterance.voice = germanVoice
        console.log('🇩🇪 Using German browser voice:', germanVoice.name)
      } else {
        console.log('⚠️ No German voice found, using default')
      }

      utterance.onend = () => {
        resolve('browser-speech-synthesis')
      }

      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis failed: ${event.error}`))
      }

      speechSynthesis.speak(utterance)
    })
  }

  // Get recommended voice for specific learning scenarios
  getRecommendedVoice(scenario: string): GermanVoice {
    switch (scenario) {
      case 'vocabulary_drill':
        return GERMAN_VOICES.find(v => v.id === 'Kore')!
      case 'casual_conversation':
        return GERMAN_VOICES.find(v => v.id === 'Zephyr')!
      case 'formal_presentation':
        return GERMAN_VOICES.find(v => v.id === 'Charon')!
      case 'motivational_feedback':
        return GERMAN_VOICES.find(v => v.id === 'Puck')!
      default:
        return GERMAN_VOICES[0]
    }
  }

  // Speak German text with optimal settings for language learning
  async speakGerman(
    text: string,
    context: 'vocabulary' | 'phrase' | 'sentence' | 'encouragement' = 'phrase'
  ): Promise<void> {
    try {
      // Map context types to valid TTS context options
      const ttsContext = context === 'phrase' || context === 'sentence' ? 'conversation' : context
      const audioUrl = await this.generateGermanAudio(text, {
        context: ttsContext as 'vocabulary' | 'conversation' | 'explanation' | 'encouragement'
      })

      // If it's browser speech synthesis, it's already played
      if (audioUrl === 'browser-speech-synthesis') {
        return Promise.resolve()
      }

      const audio = new Audio(audioUrl)
      audio.volume = 0.8

      return new Promise((resolve, reject) => {
        audio.onended = () => resolve()
        audio.onerror = reject
        audio.play()
      })
    } catch (error) {
      console.error('Failed to speak German:', error)
      throw error
    }
  }

  // Batch generate audio for multiple German phrases
  async batchGenerateGermanAudio(
    phrases: string[],
    options: TTSOptions = {}
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>()

    for (const phrase of phrases) {
      try {
        const audioUrl = await this.generateGermanAudio(phrase, options)
        results.set(phrase, audioUrl)
      } catch (error) {
        console.error(`Failed to generate audio for "${phrase}":`, error)
      }
    }

    return results
  }

  // Clear audio cache to free memory
  clearCache(): void {
    // Revoke object URLs to prevent memory leaks
    for (const url of this.audioCache.values()) {
      URL.revokeObjectURL(url)
    }
    this.audioCache.clear()
    console.log('🧹 German TTS cache cleared')
  }

  // Get service statistics
  getStats() {
    return {
      cachedAudios: this.audioCache.size,
      isInitialized: true,
      availableVoices: GERMAN_VOICES.length,
      defaultVoice: this.selectVoiceForContext()
    }
  }
}

export default GermanTTSService