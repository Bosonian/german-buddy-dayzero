export interface GermanSentence {
  id: string
  german: string
  english: string
  extra?: string
  tags?: string
  source_deck: string
  difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  frequency?: number
}

export interface Collocation {
  german: string
  frequency: number
  pattern: string
  example_sentence: string
  translation: string
  sources: string[]
}

export interface VerbPrepPattern {
  pattern: string
  example: string
  translation: string
  count: number
}

class DataLoader {
  private static instance: DataLoader
  private sentences: GermanSentence[] = []
  private collocations: Collocation[] = []
  private verbPreps: VerbPrepPattern[] = []
  private loaded = false

  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader()
    }
    return DataLoader.instance
  }

  async loadData(): Promise<void> {
    if (this.loaded) return

    try {
      // Load sentences (sample of 10k)
      const sentencesResponse = await fetch('/sentences_sample.csv')
      const sentencesText = await sentencesResponse.text()
      this.sentences = this.parseCSV(sentencesText).map(row => ({
        id: row.id,
        german: row.german,
        english: row.english,
        extra: row.extra,
        tags: row.tags,
        source_deck: row.source_deck,
        difficulty: this.estimateDifficulty(row.german),
        frequency: this.estimateFrequency(row.german)
      }))

      // Load collocations
      const collocationsResponse = await fetch('/collocations_extracted.csv')
      const collocationsText = await collocationsResponse.text()
      this.collocations = this.parseCSV(collocationsText).map(row => ({
        german: row.german,
        frequency: parseInt(row.frequency),
        pattern: row.pattern,
        example_sentence: row.example_sentence,
        translation: row.translation,
        sources: row.sources ? row.sources.split(',') : []
      }))

      // Load verb+prep patterns
      const verbPrepResponse = await fetch('/verb_preposition_patterns.csv')
      const verbPrepText = await verbPrepResponse.text()
      this.verbPreps = this.parseCSV(verbPrepText).map(row => ({
        pattern: row.pattern,
        example: row.example,
        translation: row.translation,
        count: parseInt(row.count)
      }))

      this.loaded = true
      console.log(`✅ Data loaded: ${this.sentences.length} sentences, ${this.collocations.length} collocations, ${this.verbPreps.length} verb patterns`)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  private parseCSV(text: string): any[] {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',')

    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line)
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      return obj
    })
  }

  private parseCSVLine(line: string): string[] {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  private estimateDifficulty(german: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
    const words = german.split(' ').length
    const hasComplexGrammar = /\b(würde|hätte|wäre|nachdem|obwohl|dennoch)\b/.test(german.toLowerCase())
    const hasSubjunctive = /\b(könnte|sollte|müsste|dürfte)\b/.test(german.toLowerCase())

    if (words <= 5 && !hasComplexGrammar) return 'A1'
    if (words <= 8 && !hasSubjunctive) return 'A2'
    if (words <= 12 && !hasComplexGrammar) return 'B1'
    if (words <= 15 || hasSubjunctive) return 'B2'
    if (hasComplexGrammar) return 'C1'
    return 'C2'
  }

  private estimateFrequency(german: string): number {
    // Basic frequency estimation based on common words
    const commonWords = ['der', 'die', 'das', 'und', 'ich', 'ist', 'nicht', 'haben', 'sein', 'mit']
    const words = german.toLowerCase().split(/\s+/)
    const commonWordCount = words.filter(word => commonWords.includes(word)).length
    return Math.round((commonWordCount / words.length) * 100)
  }

  // Get sentences by difficulty level
  getSentencesByLevel(level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2', count: number = 50): GermanSentence[] {
    return this.sentences
      .filter(s => s.difficulty === level)
      .slice(0, count)
  }

  // Get sentences by frequency (most common first)
  getFrequentSentences(count: number = 100): GermanSentence[] {
    return this.sentences
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, count)
  }

  // Get high-frequency collocations
  getTopCollocations(count: number = 50): Collocation[] {
    return this.collocations
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, count)
  }

  // Get verb+preposition patterns
  getVerbPrepPatterns(count: number = 20): VerbPrepPattern[] {
    return this.verbPreps
      .sort((a, b) => b.count - a.count)
      .slice(0, count)
  }

  // Get random sentences for exercises
  getRandomSentences(count: number = 10, level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'): GermanSentence[] {
    const pool = level ? this.getSentencesByLevel(level, 1000) : this.sentences
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  // Search functionality
  searchSentences(query: string, limit: number = 20): GermanSentence[] {
    const lowerQuery = query.toLowerCase()
    return this.sentences
      .filter(s =>
        s.german.toLowerCase().includes(lowerQuery) ||
        s.english.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit)
  }

  // Get all data for debugging
  getAllData() {
    return {
      sentences: this.sentences.length,
      collocations: this.collocations.length,
      verbPreps: this.verbPreps.length,
      loaded: this.loaded
    }
  }
}

export default DataLoader