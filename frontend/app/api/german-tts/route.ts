import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI with API key (must be set in env)
const API_KEY = process.env.GOOGLE_API_KEY
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    const { text, context = 'conversation', voice = 'Kore' } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // NOTE: This endpoint currently returns a fallback response.
    // The actual TTS implementation using a service like Google Cloud Text-to-Speech
    // would be implemented here in the future.
    return NextResponse.json({
      success: false,
      message: 'TTS temporarily unavailable - use browser speech synthesis',
      fallback: true,
      text,
      voice,
      context
    }, { status: 200 })

  } catch (error) {
    console.error('German TTS API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate German audio' },
      { status: 500 }
    )
  }
}

function createGermanPrompt(text: string, context: string): string {
  let prompt = ''

  switch (context) {
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

  return prompt
}

// Also support GET for simple text-to-speech
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get('text')
  const context = searchParams.get('context') || 'conversation'
  const voice = searchParams.get('voice') || 'Kore'

  if (!text) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 })
  }

  // Return the same fallback response
  return NextResponse.json({
    success: false,
    message: 'TTS temporarily unavailable - use browser speech synthesis',
    fallback: true,
    text,
    voice,
    context
  }, { status: 200 })
}
