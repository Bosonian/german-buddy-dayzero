import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || 'AIzaSyB8wwEs1w2bCpahCEo5PTQv6thqyuic3a4')

export async function POST(request: NextRequest) {
  try {
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

    // Get the audio data
    const audioData = result.response.candidates?.[0]?.content?.parts?.[0]
    if (!audioData) {
      throw new Error('Invalid audio response format')
    }

    // Return the audio data as a blob
    return new NextResponse(audioData as any, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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

  // Reuse the POST logic
  const mockRequest = {
    json: async () => ({ text, context, voice })
  } as NextRequest

  return POST(mockRequest)
}