'use client'

import { useState, useRef, useEffect } from 'react'
import { GermanSpeechRecognizer, analyzePronunciation, fallbackScoring } from '@/lib/speechRecognition'

interface PronunciationExerciseProps {
  phrase: {
    german: string
    english: string
    example: string
    culturalNote: string
  }
  onComplete: (score: number, confidence: number) => void
}

export default function PronunciationExercise({ phrase, onComplete }: PronunciationExerciseProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [audioURL, setAudioURL] = useState<string>('')
  const [score, setScore] = useState<number | null>(null)
  const [confidence, setConfidence] = useState(50)
  const [submitted, setSubmitted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [transcript, setTranscript] = useState<string>('')
  const [detailedScore, setDetailedScore] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognizerRef = useRef<GermanSpeechRecognizer | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioURL(url)
        setHasRecorded(true)
        setIsProcessing(true)

        try {
          // Use real speech recognition
          if (recognizerRef.current) {
            recognizerRef.current.stop()
          }

          // Analyze the recorded audio
          const recognizer = new GermanSpeechRecognizer()
          recognizerRef.current = recognizer

          try {
            // Try to get transcription from recorded audio
            const result = await recognizer.recognizeAudio(blob)
            setTranscript(result.transcript)

            // Analyze pronunciation accuracy
            const analysis = analyzePronunciation(
              phrase.german,
              result.transcript,
              result.confidence
            )

            setScore(analysis.overall)
            setDetailedScore(analysis)
          } catch (recognitionError) {
            console.warn('Speech recognition failed, using fallback:', recognitionError)
            // Use fallback scoring based on audio properties
            const fallback = fallbackScoring(blob, phrase.german)
            setScore(fallback.overall)
            setDetailedScore(fallback)
            setTranscript('')
          }
        } catch (error) {
          console.error('Pronunciation analysis failed:', error)
          // Last resort fallback
          setScore(65)
          setDetailedScore({
            overall: 65,
            accuracy: 0,
            fluency: 65,
            completeness: 65,
            feedback: ['Unable to analyze pronunciation. Please try again.']
          })
        } finally {
          setIsProcessing(false)
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      // Fallback - notify user that microphone is required
      alert('Microphone access is required for pronunciation exercises. Please enable microphone permissions and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    if (recognizerRef.current) {
      recognizerRef.current.stop()
    }
  }

  // Alternative: Live speech recognition
  const startLiveRecognition = async () => {
    try {
      setIsRecording(true)
      const recognizer = new GermanSpeechRecognizer()
      recognizerRef.current = recognizer

      const result = await recognizer.startLiveRecognition()
      setTranscript(result.transcript)
      setHasRecorded(true)
      setIsRecording(false)
      setIsProcessing(true)

      // Analyze pronunciation
      const analysis = analyzePronunciation(
        phrase.german,
        result.transcript,
        result.confidence
      )

      setScore(analysis.overall)
      setDetailedScore(analysis)
      setIsProcessing(false)
    } catch (error) {
      console.error('Live recognition failed:', error)
      setIsRecording(false)
      alert('Speech recognition failed. Please try recording instead.')
    }
  }

  const playReference = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phrase.german)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  const playRecording = () => {
    if (audioURL) {
      const audio = new Audio(audioURL)
      audio.play()
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
    // Calculate background confidence based on pronunciation score
    const backgroundConfidence = score ? Math.min(100, score + 10) : 70
    setTimeout(() => onComplete(score || 0, backgroundConfidence), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-blue-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreText = (score: number) => {
    if (score >= 90) return 'Excellent!'
    if (score >= 80) return 'Very Good!'
    if (score >= 70) return 'Good!'
    return 'Needs Practice'
  }

  return (
    <div className="w-full bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎤</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Pronunciation Exercise</h3>
        <p className="text-gray-400 text-sm">Record yourself saying the German phrase</p>
      </div>

      <div className="space-y-6">
        {/* Target Phrase */}
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm mb-2">Say this phrase:</p>
          <p className="text-2xl font-bold text-white mb-2">{phrase.german}</p>
          <p className="text-blue-400 text-sm mb-3">{phrase.english}</p>
          <button
            onClick={playReference}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
          >
            🔊 Listen to Reference
          </button>
        </div>

        {/* Recording Interface */}
        <div className="bg-gray-900 rounded-xl p-6 text-center">
          {!hasRecorded ? (
            <div className="space-y-4">
              <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-600 animate-pulse'
                  : 'bg-orange-600 hover:bg-orange-500 cursor-pointer hover:scale-105'
              }`}>
                {isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />
                ) : (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {isRecording ? (
                <div className="space-y-2">
                  <p className="text-red-400 font-semibold">Recording...</p>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
                  >
                    Stop Recording
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-400">Tap to start recording</p>
                  <button
                    onClick={startRecording}
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-semibold transition-colors"
                  >
                    Start Recording
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Processing Indicator */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-blue-400">Analyzing pronunciation...</p>
                </div>
              )}

              {/* Score Display */}
              {!isProcessing && score !== null && (
                <div className="space-y-2">
                  <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </div>
                  <div className={`text-lg font-semibold ${getScoreColor(score)}`}>
                    {getScoreText(score)}
                  </div>

                  {/* Detailed Scores */}
                  {detailedScore && (
                    <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                      <div className="bg-gray-800 rounded-lg p-2">
                        <p className="text-gray-400">Accuracy</p>
                        <p className="text-white font-bold">{detailedScore.accuracy}%</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2">
                        <p className="text-gray-400">Fluency</p>
                        <p className="text-white font-bold">{detailedScore.fluency}%</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2">
                        <p className="text-gray-400">Complete</p>
                        <p className="text-white font-bold">{detailedScore.completeness}%</p>
                      </div>
                    </div>
                  )}

                  {/* Transcription */}
                  {transcript && (
                    <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                      <p className="text-gray-400 text-xs mb-1">What we heard:</p>
                      <p className="text-white text-sm font-mono">"{transcript}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Playback Controls */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={playReference}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  🔊 Reference
                </button>
                {audioURL && (
                  <button
                    onClick={playRecording}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                  >
                    🎵 Your Recording
                  </button>
                )}
              </div>

              {!isProcessing && (
                <button
                  onClick={() => {
                    setHasRecorded(false)
                    setScore(null)
                    setAudioURL('')
                    setTranscript('')
                    setDetailedScore(null)
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors"
                >
                  Record Again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pronunciation Feedback */}
        {hasRecorded && detailedScore && detailedScore.feedback && (
          <div className={`border rounded-lg p-4 ${
            score !== null && score >= 80
              ? 'bg-green-900/20 border-green-600'
              : 'bg-yellow-900/20 border-yellow-600'
          }`}>
            <p className={`text-sm font-semibold mb-2 ${
              score !== null && score >= 80 ? 'text-green-300' : 'text-yellow-300'
            }`}>
              {score !== null && score >= 80 ? '✅ Feedback:' : '💡 Tips for Improvement:'}
            </p>
            <ul className={`text-sm space-y-1 ${
              score !== null && score >= 80 ? 'text-green-200' : 'text-yellow-200'
            }`}>
              {detailedScore.feedback.map((tip: string, index: number) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}


        {hasRecorded && !submitted && (
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-xl font-semibold transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}