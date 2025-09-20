import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI with API key (must be set in env)
const API_KEY = process.env.GOOGLE_API_KEY
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    if (!genAI) {
      return NextResponse.json({ error: 'Missing GOOGLE_API_KEY server env var' }, { status: 500 })
    }
    const { text, context = 'conversation', voice = 'Kore' } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Create contextual prompt for better German pronunciation
    const prompt = createGermanPrompt(text, context)

    // Get the TTS model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-tts',
    })

    // Generate audio
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'audio/wav',
      },
      systemInstruction: {
        role: 'system',
        parts: [{
          text: `You are a professional German language instructor. Speak with perfect German pronunciation,
                 clear articulation, and appropriate intonation. Use native German speech patterns and rhythm.
                 Adjust your tone based on the context provided. Use the ${voice} voice style.`
        }]
      }
    })

    if (!result.response) {
      throw new Error('No audio response received')
    }

    // Extract inline audio data (base64) from response
    let base64 = ''
    let mime = 'audio/wav'
    for (const cand of result.response.candidates ?? []) {
      for (const part of cand.content?.parts ?? []) {
        const inline = (part as any).inlineData
        if (inline?.data) {
          base64 = inline.data
          if (inline.mimeType) mime = inline.mimeType
          break
        }
      }
      if (base64) break
    }

    if (!base64) {
      throw new Error('No inline audio data found in response')
    }

    const audioBuffer = Buffer.from(base64, 'base64')
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': mime,
        'Content-Length': String(audioBuffer.length),
        'Cache-Control': 'public, max-age=3600',
      },
    })

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

  // Call the same logic as POST without constructing a NextRequest
  try {
    if (!genAI) {
      return NextResponse.json({ error: 'Missing GOOGLE_API_KEY server env var' }, { status: 500 })
    }
    const prompt = createGermanPrompt(text, context)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-tts' })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'audio/wav' },
    })

    let base64 = ''
    let mime = 'audio/wav'
    for (const cand of result.response?.candidates ?? []) {
      for (const part of cand.content?.parts ?? []) {
        const inline = (part as any).inlineData
        if (inline?.data) { base64 = inline.data; mime = inline.mimeType || mime; break }
      }
      if (base64) break
    }
    if (!base64) return NextResponse.json({ error: 'No audio data' }, { status: 500 })
    const audioBuffer = Buffer.from(base64, 'base64')
    return new NextResponse(audioBuffer, { headers: { 'Content-Type': mime, 'Content-Length': String(audioBuffer.length) } })
  } catch (e) {
    console.error('German TTS GET error:', e)
    return NextResponse.json({ error: 'Failed to generate German audio' }, { status: 500 })
  }
}
