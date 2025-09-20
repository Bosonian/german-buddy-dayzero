import { useState, useEffect, useCallback } from 'react'
import GermanTTSService, { TTSOptions, GermanVoice, GERMAN_VOICES } from '@/lib/germanTTSService'

interface UseGermanTTSReturn {
  speak: (text: string, options?: TTSOptions) => Promise<void>
  generateAudio: (text: string, options?: TTSOptions) => Promise<string>
  isPlaying: boolean
  isLoading: boolean
  error: string | null
  voices: GermanVoice[]
  clearError: () => void
  stopAudio: () => void
}

export function useGermanTTS(): UseGermanTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [ttsService] = useState(() => GermanTTSService.getInstance())

  // Initialize TTS service on mount
  useEffect(() => {
    const initializeTTS = async () => {
      try {
        await ttsService.initialize()
      } catch (err) {
        setError('Failed to initialize German TTS service')
        console.error('TTS initialization error:', err)
      }
    }

    initializeTTS()
  }, [ttsService])

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        setCurrentAudio(null)
      }
      ttsService.clearCache()
    }
  }, [currentAudio, ttsService])

  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    if (!text.trim()) return

    try {
      setError(null)
      setIsLoading(true)

      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause()
        setCurrentAudio(null)
      }

      const audioUrl = await ttsService.generateGermanAudio(text, options)
      const audio = new Audio(audioUrl)

      audio.volume = 0.8
      setCurrentAudio(audio)

      return new Promise<void>((resolve, reject) => {
        audio.onloadstart = () => {
          setIsLoading(false)
          setIsPlaying(true)
        }

        audio.onended = () => {
          setIsPlaying(false)
          setCurrentAudio(null)
          resolve()
        }

        audio.onerror = (err) => {
          setIsPlaying(false)
          setIsLoading(false)
          setCurrentAudio(null)
          const errorMsg = 'Failed to play German audio'
          setError(errorMsg)
          reject(new Error(errorMsg))
        }

        audio.onpause = () => {
          setIsPlaying(false)
        }

        audio.play().catch((err) => {
          setIsPlaying(false)
          setIsLoading(false)
          setCurrentAudio(null)
          const errorMsg = 'Audio playback failed'
          setError(errorMsg)
          reject(err)
        })
      })
    } catch (err) {
      setIsLoading(false)
      setIsPlaying(false)
      const errorMsg = err instanceof Error ? err.message : 'TTS generation failed'
      setError(errorMsg)
      throw err
    }
  }, [currentAudio, ttsService])

  const generateAudio = useCallback(async (text: string, options: TTSOptions = {}) => {
    if (!text.trim()) throw new Error('No text provided')

    try {
      setError(null)
      setIsLoading(true)

      const audioUrl = await ttsService.generateGermanAudio(text, options)
      setIsLoading(false)

      return audioUrl
    } catch (err) {
      setIsLoading(false)
      const errorMsg = err instanceof Error ? err.message : 'Audio generation failed'
      setError(errorMsg)
      throw err
    }
  }, [ttsService])

  const stopAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }
    setIsPlaying(false)
  }, [currentAudio])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    speak,
    generateAudio,
    isPlaying,
    isLoading,
    error,
    voices: GERMAN_VOICES,
    clearError,
    stopAudio
  }
}

// Specialized hook for vocabulary learning
export function useVocabularyTTS() {
  const tts = useGermanTTS()

  const speakVocabulary = useCallback((word: string) => {
    return tts.speak(word, {
      context: 'vocabulary',
      emphasis: 'normal'
    })
  }, [tts])

  const speakPhrase = useCallback((phrase: string) => {
    return tts.speak(phrase, {
      context: 'conversation',
      emphasis: 'normal'
    })
  }, [tts])

  const speakEncouragement = useCallback((message: string) => {
    return tts.speak(message, {
      context: 'encouragement',
      emphasis: 'gentle'
    })
  }, [tts])

  return {
    ...tts,
    speakVocabulary,
    speakPhrase,
    speakEncouragement
  }
}