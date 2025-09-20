export interface YouTubeClip {
  video_id: string
  title: string
  description: string
  thumbnail: string
  channel: string
  published: string
  url: string
  search_query: string
  confidence: number
}

export interface YouTubeClipDatabase {
  [phrase: string]: YouTubeClip[]
}

class YouTubeService {
  private static instance: YouTubeService
  private clipDatabase: YouTubeClipDatabase = {}
  private loaded = false

  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService()
    }
    return YouTubeService.instance
  }

  async loadClipDatabase(): Promise<void> {
    if (this.loaded) return

    try {
      const response = await fetch('/german_youtube_clips.json')
      if (response.ok) {
        this.clipDatabase = await response.json()
        this.loaded = true
        console.log(`🎬 Loaded YouTube clips for ${Object.keys(this.clipDatabase).length} phrases`)
      } else {
        console.log('📺 No YouTube clip database found - using fallback')
        this.clipDatabase = this.createFallbackDatabase()
        this.loaded = true
      }
    } catch (error) {
      console.error('Failed to load YouTube clips:', error)
      this.clipDatabase = this.createFallbackDatabase()
      this.loaded = true
    }
  }

  private createFallbackDatabase(): YouTubeClipDatabase {
    // Fallback clips for common phrases while waiting for real database
    return {
      "guten morgen": [{
        video_id: "dQw4w9WgXcQ",
        title: "German Greetings - Guten Morgen",
        description: "Learn how to say good morning in German",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        channel: "German Learning Channel",
        published: "2024-01-01T00:00:00Z",
        url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        search_query: "guten morgen German",
        confidence: 8.5
      }],
      "wie geht's": [{
        video_id: "dQw4w9WgXcQ",
        title: "How to say 'How are you?' in German",
        description: "Learn wie geht's and other casual greetings",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        channel: "Deutsch für Alle",
        published: "2024-01-01T00:00:00Z",
        url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        search_query: "wie geht's German",
        confidence: 7.8
      }],
      "danke schön": [{
        video_id: "dQw4w9WgXcQ",
        title: "German Politeness - Danke schön",
        description: "Learn how to say thank you very much in German",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        channel: "Learn German Fast",
        published: "2024-01-01T00:00:00Z",
        url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        search_query: "danke schön German",
        confidence: 9.2
      }]
    }
  }

  getClipsForPhrase(phrase: string): YouTubeClip[] {
    const normalizedPhrase = this.normalizePhrase(phrase)

    // Try exact match first
    if (this.clipDatabase[normalizedPhrase]) {
      return this.clipDatabase[normalizedPhrase]
    }

    // Try case-insensitive search
    const lowerPhrase = normalizedPhrase.toLowerCase()
    for (const [key, clips] of Object.entries(this.clipDatabase)) {
      if (key.toLowerCase() === lowerPhrase) {
        return clips
      }
    }

    // Try partial matches (contains phrase words)
    const phraseWords = lowerPhrase.split(' ')
    const partialMatches: { key: string; clips: YouTubeClip[]; score: number }[] = []

    for (const [key, clips] of Object.entries(this.clipDatabase)) {
      const keyWords = key.toLowerCase().split(' ')
      const matchingWords = phraseWords.filter(word => keyWords.includes(word))

      if (matchingWords.length > 0) {
        const score = matchingWords.length / phraseWords.length
        partialMatches.push({ key, clips, score })
      }
    }

    // Return best partial match if found
    if (partialMatches.length > 0) {
      partialMatches.sort((a, b) => b.score - a.score)
      return partialMatches[0].clips
    }

    return []
  }

  getBestClipForPhrase(phrase: string): YouTubeClip | null {
    const clips = this.getClipsForPhrase(phrase)
    if (clips.length === 0) return null

    // Return highest confidence clip
    return clips.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    )
  }

  hasClipsForPhrase(phrase: string): boolean {
    return this.getClipsForPhrase(phrase).length > 0
  }

  private normalizePhrase(phrase: string): string {
    return phrase
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
  }

  getRandomClipFromDatabase(): YouTubeClip | null {
    const allPhrases = Object.keys(this.clipDatabase)
    if (allPhrases.length === 0) return null

    const randomPhrase = allPhrases[Math.floor(Math.random() * allPhrases.length)]
    const clips = this.clipDatabase[randomPhrase]
    return clips[Math.floor(Math.random() * clips.length)]
  }

  getStatistics() {
    const totalPhrases = Object.keys(this.clipDatabase).length
    const totalClips = Object.values(this.clipDatabase).reduce((sum, clips) => sum + clips.length, 0)
    const avgClipsPerPhrase = totalPhrases > 0 ? (totalClips / totalPhrases).toFixed(1) : '0'

    return {
      totalPhrases,
      totalClips,
      avgClipsPerPhrase,
      loaded: this.loaded
    }
  }

  // Search functionality
  searchClips(query: string, limit: number = 10): YouTubeClip[] {
    const lowerQuery = query.toLowerCase()
    const results: YouTubeClip[] = []

    for (const [phrase, clips] of Object.entries(this.clipDatabase)) {
      if (phrase.toLowerCase().includes(lowerQuery)) {
        results.push(...clips)
      } else {
        // Check if any clip titles or descriptions match
        const matchingClips = clips.filter(clip =>
          clip.title.toLowerCase().includes(lowerQuery) ||
          clip.description.toLowerCase().includes(lowerQuery)
        )
        results.push(...matchingClips)
      }
    }

    // Sort by confidence and limit results
    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
  }

  // Get clips by channel
  getClipsByChannel(channelName: string): YouTubeClip[] {
    const results: YouTubeClip[] = []
    const lowerChannelName = channelName.toLowerCase()

    for (const clips of Object.values(this.clipDatabase)) {
      const matchingClips = clips.filter(clip =>
        clip.channel.toLowerCase().includes(lowerChannelName)
      )
      results.push(...matchingClips)
    }

    return results.sort((a, b) => b.confidence - a.confidence)
  }

  // Generate YouTube embed URL with German captions
  generateEmbedUrl(videoId: string, start?: number, end?: number): string {
    const params = new URLSearchParams({
      autoplay: '1',
      cc_lang_pref: 'de',      // German captions preferred
      cc_load_policy: '1',     // Force captions
      rel: '0',                // Don't show related videos
      modestbranding: '1',     // Hide YouTube logo
      fs: '1',                 // Allow fullscreen
      iv_load_policy: '3',     // Hide annotations
    })

    if (start !== undefined) {
      params.set('start', start.toString())
    }

    if (end !== undefined) {
      params.set('end', end.toString())
      params.set('loop', '1')
      params.set('playlist', videoId) // Required for loop
    }

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
  }
}

export default YouTubeService