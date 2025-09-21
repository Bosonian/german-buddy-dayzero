#!/usr/bin/env node

/**
 * Ollama-Powered Progressive German Reading Content Generator
 * Analyzes 88 graded PDFs and generates new reading materials with perfect complexity progression
 */

import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'

class OllamaContentGenerator {
  constructor(ollamaModel = 'llama3.1:8b') {
    this.model = ollamaModel
    this.progressionRules = null
    this.vocabularyBank = new Map()
    this.grammarProgression = []
    this.complexityLevels = []
  }

  // Step 1: Upload and analyze all 88 PDFs to learn progression patterns
  async learnFromPDFs(pdfsDirectory) {
    console.log('📚 Learning progression patterns from 88 German reading books...')

    if (!(await this.checkOllama())) {
      return false
    }

    // Extract text from all PDFs first
    const bookTexts = await this.extractAllPDFs(pdfsDirectory)

    // Learn progression patterns
    console.log('🧠 Analyzing progression patterns...')
    const patterns = await this.analyzeProgressionPatterns(bookTexts)

    // Create generation rules
    this.progressionRules = await this.createGenerationRules(patterns)

    // Save learned rules for future use
    const rulesPath = path.join(pdfsDirectory, 'learned_progression_rules.json')
    await fs.writeFile(rulesPath, JSON.stringify(this.progressionRules, null, 2))
    console.log(`💾 Progression rules saved to: ${rulesPath}`)

    console.log('✅ Learning complete! Ready to generate new content.')
    return true
  }

  async extractAllPDFs(pdfsDirectory) {
    const files = await fs.readdir(pdfsDirectory)
    const pdfFiles = files.filter(f => f.endsWith('.pdf')).sort().slice(0, 88)

    const bookTexts = []

    for (let i = 0; i < pdfFiles.length; i++) {
      const pdfPath = path.join(pdfsDirectory, pdfFiles[i])
      console.log(`📖 Extracting Book ${i + 1}/88: ${pdfFiles[i]}`)

      // You'll need a PDF extraction tool here
      // For now, assuming text extraction exists
      try {
        const text = await this.extractPDFText(pdfPath)
        bookTexts.push({
          bookNumber: i + 1,
          filename: pdfFiles[i],
          text: text,
          level: this.estimateLevel(i + 1) // A1-C1 based on position
        })
      } catch (error) {
        console.log(`⚠️ Skipping ${pdfFiles[i]}: ${error.message}`)
      }
    }

    return bookTexts
  }

  // Analyze progression patterns from all books
  async analyzeProgressionPatterns(bookTexts) {
    const prompt = `
You are a German language learning expert. Analyze these 88 graded reading books to understand how reading complexity should progress:

${bookTexts.map(book => `
BOOK ${book.bookNumber} (${book.level}):
${book.text.slice(0, 500)}...
`).slice(0, 10).join('\n')} // Show first 10 as examples

Based on all 88 books, identify:

IMPORTANT: Respond with ONLY valid JSON. No explanatory text before or after.

1. VOCABULARY PROGRESSION:
   - How new words are introduced (frequency, complexity)
   - Vocabulary themes by level (A1: daily life, A2: past events, etc.)
   - Word families and semantic fields

2. GRAMMAR PROGRESSION:
   - Sentence structure evolution (simple → complex)
   - Tense introduction order (present → past → future → subjunctive)
   - Grammar point sequencing

3. CONTENT COMPLEXITY:
   - Topic sophistication (concrete → abstract)
   - Cultural element integration
   - Narrative complexity (description → story → analysis)

4. READING SKILLS:
   - Comprehension level requirements
   - Text length progression
   - Cognitive load management

Respond with a detailed progression framework in JSON:
{
  "vocabularyProgression": {
    "A1": ["core verbs", "family", "food", "numbers"],
    "A2": ["past actions", "opinions", "descriptions"],
    "B1": ["complex actions", "explanations", "reasoning"],
    "B2": ["abstract concepts", "formal language"],
    "C1": ["specialized terminology", "nuanced expressions"]
  },
  "grammarProgression": {
    "A1": ["present tense", "articles", "basic word order"],
    "A2": ["past tense", "modal verbs", "subordinate clauses"],
    "B1": ["passive voice", "relative clauses", "conjunctions"],
    "B2": ["subjunctive", "complex sentences", "reported speech"],
    "C1": ["advanced syntax", "stylistic variations"]
  },
  "contentProgression": {
    "themes": [...],
    "textTypes": [...],
    "complexityMetrics": [...]
  },
  "generationRules": {
    "sentenceLength": {...},
    "vocabularyDensity": {...},
    "grammarComplexity": {...}
  }
}`

    return await this.callOllama(prompt)
  }

  // Create specific rules for generating new content
  async createGenerationRules(patterns) {
    const prompt = `
Based on the progression analysis, create specific rules for generating new German reading content:

PROGRESSION PATTERNS: ${patterns}

IMPORTANT: Respond with ONLY valid JSON. No explanatory text before or after.

Create generation rules for each level:

{
  "A1": {
    "sentenceLength": "4-8 words average",
    "vocabulary": "500 most common German words",
    "grammar": "present tense, basic word order",
    "topics": ["daily routines", "family", "food", "shopping"],
    "textLength": "50-100 words",
    "readingTime": "2-3 minutes",
    "comprehensionLevel": "literal understanding"
  },
  "A2": {
    "sentenceLength": "6-12 words average",
    "vocabulary": "1000-1500 words, introduce past tense vocabulary",
    "grammar": "past tense, modal verbs, simple subordinate clauses",
    "topics": ["past experiences", "future plans", "opinions", "descriptions"],
    "textLength": "100-200 words",
    "readingTime": "3-5 minutes",
    "comprehensionLevel": "basic inference"
  },
  // ... continue for B1, B2, C1
}

Also provide content generation templates and quality metrics.`

    const rules = await this.callOllama(prompt)
    return JSON.parse(rules)
  }

  // Generate new reading content with specific complexity level
  async generateReading(level, topic, targetWords = 150, rulesPath = null) {
    if (!this.progressionRules) {
      // Try to load saved rules
      if (rulesPath) {
        try {
          const rulesData = await fs.readFile(rulesPath, 'utf8')
          this.progressionRules = JSON.parse(rulesData)
          console.log('📚 Loaded previously learned progression rules')
        } catch (error) {
          throw new Error('Must learn from PDFs first! Call learnFromPDFs() or provide valid rules path')
        }
      } else {
        throw new Error('Must learn from PDFs first! Call learnFromPDFs()')
      }
    }

    const rules = this.progressionRules[level]

    const prompt = `
Generate a German reading passage for ${level} level learners.

IMPORTANT: Respond with ONLY valid JSON. No explanatory text before or after.

REQUIREMENTS:
- Level: ${level}
- Topic: ${topic}
- Length: ~${targetWords} words
- Follow these rules: ${JSON.stringify(rules)}

PROGRESSION CONTEXT:
Based on analysis of 88 graded German books, create content that:
1. Uses appropriate vocabulary for ${level} level
2. Applies correct grammar complexity for this stage
3. Follows the learned progression patterns
4. Introduces exactly the right amount of new concepts

CONTENT GUIDELINES:
- Make it engaging and culturally relevant
- Include 3-5 new vocabulary words appropriate for ${level}
- Use grammar structures typical for this level
- Create natural, authentic German text
- Ensure smooth reading flow

RESPONSE FORMAT:
{
  "text": "The German reading passage...",
  "level": "${level}",
  "topic": "${topic}",
  "metadata": {
    "wordCount": number,
    "newVocabulary": ["word1", "word2", "word3"],
    "grammarFocus": ["present tense", "accusative case"],
    "culturalElements": ["German customs mentioned"],
    "readingTime": "estimated minutes"
  },
  "comprehensionQuestions": [
    {
      "question": "Was macht der Protagonist?",
      "type": "multiple_choice",
      "options": ["...", "...", "...", "..."],
      "correct": 1,
      "explanation": "..."
    }
  ]
}`

    const response = await this.callOllama(prompt)
    return JSON.parse(response)
  }

  // Generate a complete reading series with progressive difficulty
  async generateReadingSeries(startLevel, endLevel, topicsPerLevel = 5) {
    console.log(`📖 Generating reading series from ${startLevel} to ${endLevel}...`)

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1']
    const startIndex = levels.indexOf(startLevel)
    const endIndex = levels.indexOf(endLevel)

    const series = []

    for (let i = startIndex; i <= endIndex; i++) {
      const level = levels[i]
      console.log(`\n📚 Generating ${level} level content...`)

      const topics = await this.generateTopicsForLevel(level, topicsPerLevel)

      for (let j = 0; j < topics.length; j++) {
        const topic = topics[j]
        console.log(`  📝 Creating story ${j + 1}/${topics.length}: ${topic}`)

        try {
          const reading = await this.generateReading(level, topic)
          series.push({
            id: `${level.toLowerCase()}_${j + 1}`,
            order: series.length + 1,
            ...reading
          })

          // Small delay to avoid overwhelming Ollama
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (error) {
          console.error(`❌ Failed to generate ${level} story about ${topic}:`, error.message)
        }
      }
    }

    console.log(`✅ Generated ${series.length} reading passages!`)
    return series
  }

  // Generate appropriate topics for each level
  async generateTopicsForLevel(level, count = 5) {
    const prompt = `
Generate ${count} engaging reading topics appropriate for German ${level} level learners.

Based on the progression analysis from 88 graded books, suggest topics that:
1. Match the complexity level of ${level}
2. Are culturally relevant to German-speaking countries
3. Build on previous levels' knowledge
4. Prepare for the next level's concepts

Topics should be specific enough to create 150-200 word stories.

Return as JSON array: ["topic1", "topic2", "topic3", ...]`

    const response = await this.callOllama(prompt)
    return JSON.parse(response)
  }

  // Batch generate content for German Buddy integration
  async generateForGermanBuddy(outputDir = './generated_readings') {
    console.log('🚀 Generating progressive German reading content for German Buddy...')

    // Generate complete A1-B2 series (adjust as needed)
    const series = await this.generateReadingSeries('A1', 'B2', 3)

    // Organize by level
    const byLevel = {
      A1: series.filter(s => s.level === 'A1'),
      A2: series.filter(s => s.level === 'A2'),
      B1: series.filter(s => s.level === 'B1'),
      B2: series.filter(s => s.level === 'B2')
    }

    // Create output structure
    await fs.mkdir(outputDir, { recursive: true })

    for (const [level, readings] of Object.entries(byLevel)) {
      const levelDir = path.join(outputDir, level)
      await fs.mkdir(levelDir, { recursive: true })

      // Save individual readings
      for (let i = 0; i < readings.length; i++) {
        const reading = readings[i]
        const filename = `reading-${i + 1}.json`
        await fs.writeFile(
          path.join(levelDir, filename),
          JSON.stringify(reading, null, 2)
        )
      }

      // Save level summary
      await fs.writeFile(
        path.join(levelDir, 'index.json'),
        JSON.stringify({
          level,
          totalReadings: readings.length,
          averageLength: Math.round(readings.reduce((sum, r) => sum + r.metadata.wordCount, 0) / readings.length),
          topics: readings.map(r => r.topic),
          generatedAt: new Date().toISOString()
        }, null, 2)
      )
    }

    // Create master index
    await fs.writeFile(
      path.join(outputDir, 'master_index.json'),
      JSON.stringify({
        totalReadings: series.length,
        byLevel: Object.keys(byLevel).reduce((acc, level) => {
          acc[level] = byLevel[level].length
          return acc
        }, {}),
        generatedAt: new Date().toISOString(),
        ollamaModel: this.model,
        source: '88 graded German reading books'
      }, null, 2)
    )

    console.log(`\n✅ Generated content saved to: ${outputDir}`)
    console.log(`📊 Total readings: ${series.length}`)
    console.log(`📚 By level: ${Object.entries(byLevel).map(([l, r]) => `${l}: ${r.length}`).join(', ')}`)

    return outputDir
  }

  // Helper methods
  async checkOllama() {
    try {
      execSync('ollama list', { encoding: 'utf8' })
      return true
    } catch {
      console.error('❌ Ollama not running. Start with: ollama serve')
      return false
    }
  }

  async callOllama(prompt) {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.3, top_p: 0.9 }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    let responseText = data.response.trim()

    // Clean up common JSON formatting issues
    responseText = responseText.replace(/^[^{]*{/, '{') // Remove text before first {
    responseText = responseText.replace(/}[^}]*$/, '}') // Remove text after last }

    return responseText
  }

  async extractPDFText(pdfPath) {
    // Placeholder - implement with pdf-parse or similar
    // For now, return mock data
    const textPath = pdfPath.replace('.pdf', '.txt')
    try {
      return await fs.readFile(textPath, 'utf8')
    } catch {
      throw new Error('PDF extraction not implemented - convert PDFs to .txt files first')
    }
  }

  estimateLevel(bookNumber) {
    if (bookNumber <= 15) return 'A1'
    if (bookNumber <= 30) return 'A2'
    if (bookNumber <= 50) return 'B1'
    if (bookNumber <= 70) return 'B2'
    return 'C1'
  }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new OllamaContentGenerator()

  const command = process.argv[2]

  if (command === 'learn') {
    const pdfsDir = process.argv[3]
    if (!pdfsDir) {
      console.log('Usage: node ollama_content_generator.mjs learn <pdfs-directory>')
      process.exit(1)
    }

    generator.learnFromPDFs(pdfsDir)
      .then(() => console.log('🎓 Learning complete!'))
      .catch(console.error)

  } else if (command === 'generate') {
    const level = process.argv[3]
    const topic = process.argv[4]

    if (!level || !topic) {
      console.log('Usage: node ollama_content_generator.mjs generate <level> <topic>')
      console.log('Example: node ollama_content_generator.mjs generate A2 "Shopping in Berlin"')
      process.exit(1)
    }

    // Try to find rules file in current directory
    const rulesPath = path.join(process.cwd(), 'learned_progression_rules.json')

    generator.generateReading(level, topic, 150, rulesPath)
      .then(content => console.log(JSON.stringify(content, null, 2)))
      .catch(console.error)

  } else if (command === 'batch') {
    const pdfsDir = process.argv[3]
    const outputDir = process.argv[4] || './generated_readings'

    if (!pdfsDir) {
      console.log('Usage: node ollama_content_generator.mjs batch <pdfs-directory> [output-directory]')
      process.exit(1)
    }

    generator.learnFromPDFs(pdfsDir)
      .then(() => generator.generateForGermanBuddy(outputDir))
      .then(() => console.log('🎉 Ready for German Buddy integration!'))
      .catch(console.error)

  } else {
    console.log('German Reading Content Generator with Ollama')
    console.log('')
    console.log('Commands:')
    console.log('  learn <pdfs-dir>           - Learn patterns from 88 PDFs')
    console.log('  generate <level> <topic>   - Generate single reading')
    console.log('  batch <pdfs-dir> [out-dir] - Generate complete series')
    console.log('')
    console.log('Examples:')
    console.log('  node ollama_content_generator.mjs batch ./german-books/ ./readings/')
    console.log('  node ollama_content_generator.mjs generate A2 "German Christmas traditions"')
  }
}

export { OllamaContentGenerator }