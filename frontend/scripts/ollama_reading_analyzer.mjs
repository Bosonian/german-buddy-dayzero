#!/usr/bin/env node

/**
 * Ollama-Powered German Reading Analysis System
 * Analyzes 88 graded reading books to create sophisticated progression system
 */

import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'

class OllamaReadingAnalyzer {
  constructor(ollamaModel = 'llama3.1:8b') {
    this.model = ollamaModel
    this.booksAnalyzed = []
    this.progressionMap = new Map()
    this.vocabularyProgression = []
    this.grammarProgression = []
  }

  // Check if Ollama is running
  async checkOllama() {
    try {
      const result = execSync('ollama list', { encoding: 'utf8' })
      console.log('✅ Ollama is running')
      console.log('Available models:', result.split('\n').slice(0, 3).join('\n'))
      return true
    } catch (error) {
      console.error('❌ Ollama not running. Please start Ollama first.')
      console.log('Run: ollama serve')
      return false
    }
  }

  // Extract text from PDF (you'll need to implement PDF parsing)
  async extractTextFromPDF(pdfPath) {
    // Placeholder - you can use pdf-parse or similar library
    // For now, assuming you have text files
    const textPath = pdfPath.replace('.pdf', '.txt')
    try {
      return await fs.readFile(textPath, 'utf8')
    } catch (error) {
      console.log(`📝 Please extract ${pdfPath} to ${textPath} first`)
      return null
    }
  }

  // Analyze single book with Ollama
  async analyzeBook(bookText, bookNumber, bookTitle) {
    const prompt = `
Analyze this German graded reading text for language learning progression:

BOOK #${bookNumber}: "${bookTitle}"
TEXT: ${bookText.slice(0, 2000)}...

IMPORTANT: Respond with ONLY valid JSON. No explanatory text before or after.

{
  "level": "A1/A2/B1/B2/C1",
  "vocabulary": {
    "totalWords": number,
    "uniqueWords": number,
    "newWordsIntroduced": ["word1", "word2"],
    "difficultyScore": 1-10
  },
  "grammar": {
    "tenses": ["present", "past", "future"],
    "structures": ["simple sentences", "subordinate clauses"],
    "complexity": 1-10
  },
  "readability": {
    "averageSentenceLength": number,
    "averageWordsPerSentence": number,
    "readingTime": "estimated minutes"
  },
  "content": {
    "topics": ["daily life", "travel", "work"],
    "culturalElements": ["german customs", "geography"],
    "learningObjectives": ["introduce past tense", "practice accusative"]
  },
  "progression": {
    "buildsOnPrevious": ["concept1", "concept2"],
    "preparesFor": ["future concept1", "future concept2"],
    "keyLearningSteps": ["step1", "step2"]
  }
}

Focus on how this book fits in the German learning progression sequence.`

    try {
      const response = await this.callOllama(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error(`❌ Failed to analyze book ${bookNumber}:`, error.message)
      return null
    }
  }

  // Call Ollama API
  async callOllama(prompt) {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1, // Low temperature for consistent analysis
            top_p: 0.9
          }
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
    } catch (error) {
      throw new Error(`Ollama request failed: ${error.message}`)
    }
  }

  // Analyze progression patterns across all books
  async analyzeProgression(analyses) {
    const prompt = `
Analyze the progression pattern in these German graded reading books:

${analyses.map((analysis, i) => `
BOOK ${i + 1}: Level ${analysis?.level || 'Unknown'}
- Vocabulary: ${analysis?.vocabulary?.uniqueWords || 0} unique words
- Grammar: ${analysis?.grammar?.complexity || 0}/10 complexity
- Topics: ${analysis?.content?.topics?.join(', ') || 'Unknown'}
`).join('\n')}

Please identify:
1. Vocabulary introduction pattern (how new words are introduced)
2. Grammar progression sequence (which concepts build on others)
3. Optimal learning path recommendations
4. Missing gaps or jumps in difficulty
5. Recommended reading schedule (daily/weekly progression)

Respond in JSON format with actionable insights for building a learning app.`

    try {
      const response = await this.callOllama(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error('❌ Failed to analyze progression:', error.message)
      return null
    }
  }

  // Generate comprehension questions for a text
  async generateComprehensionQuestions(bookText, level, learningObjectives) {
    const prompt = `
Create comprehension questions for this German ${level} level text:

TEXT: ${bookText.slice(0, 1000)}...

LEARNING OBJECTIVES: ${learningObjectives?.join(', ') || 'General comprehension'}

Generate 5 questions in JSON format:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Was macht Max am Morgen?",
      "options": ["Er schläft", "Er isst Frühstück", "Er arbeitet", "Er spielt"],
      "correct": 1,
      "explanation": "Der Text sagt..."
    },
    {
      "type": "true_false",
      "question": "Maria wohnt in Berlin.",
      "correct": true,
      "explanation": "..."
    },
    {
      "type": "open_ended",
      "question": "Warum ist der Protagonist traurig?",
      "sampleAnswer": "Er ist traurig, weil...",
      "keywords": ["traurig", "weil", "Problem"]
    }
  ]
}

Mix question types: literal comprehension, inference, vocabulary, grammar application.`

    try {
      const response = await this.callOllama(prompt)
      return JSON.parse(response)
    } catch (error) {
      console.error('❌ Failed to generate questions:', error.message)
      return null
    }
  }

  // Process all 88 books
  async processBooksDirectory(booksDirectory) {
    console.log('📚 Starting analysis of 88 German graded reading books...')

    if (!(await this.checkOllama())) {
      return false
    }

    try {
      const files = await fs.readdir(booksDirectory)
      const bookFiles = files
        .filter(file => file.endsWith('.pdf') || file.endsWith('.txt'))
        .sort() // Assuming files are named in order
        .slice(0, 88) // Limit to 88 books

      console.log(`Found ${bookFiles.length} books to analyze`)

      const analyses = []

      for (let i = 0; i < bookFiles.length; i++) {
        const bookFile = bookFiles[i]
        const bookPath = path.join(booksDirectory, bookFile)

        console.log(`\n📖 Analyzing Book ${i + 1}/88: ${bookFile}`)

        // Extract text
        const bookText = await this.extractTextFromPDF(bookPath)
        if (!bookText) {
          console.log(`⏭️ Skipping ${bookFile} - no text available`)
          analyses.push(null)
          continue
        }

        // Analyze with Ollama
        const analysis = await this.analyzeBook(bookText, i + 1, bookFile)
        analyses.push(analysis)

        if (analysis) {
          console.log(`✅ Level: ${analysis.level}, Complexity: ${analysis.grammar?.complexity}/10`)

          // Generate sample comprehension questions
          const questions = await this.generateComprehensionQuestions(
            bookText,
            analysis.level,
            analysis.content?.learningObjectives
          )

          if (questions) {
            analysis.comprehensionQuestions = questions.questions
          }
        }

        // Small delay to avoid overwhelming Ollama
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Analyze overall progression
      console.log('\n🔍 Analyzing overall progression pattern...')
      const progressionAnalysis = await this.analyzeProgression(analyses.filter(a => a !== null))

      // Save results
      const results = {
        metadata: {
          totalBooks: analyses.length,
          analyzedBooks: analyses.filter(a => a !== null).length,
          analysisDate: new Date().toISOString(),
          ollamaModel: this.model
        },
        bookAnalyses: analyses,
        progressionPattern: progressionAnalysis,
        recommendations: this.generateRecommendations(analyses, progressionAnalysis)
      }

      const outputPath = path.join(booksDirectory, 'ollama_reading_analysis.json')
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2))

      console.log(`\n✅ Analysis complete! Results saved to: ${outputPath}`)
      console.log(`📊 Analyzed: ${results.metadata.analyzedBooks}/${results.metadata.totalBooks} books`)

      return results

    } catch (error) {
      console.error('❌ Failed to process books:', error)
      return false
    }
  }

  // Generate recommendations for German Buddy integration
  generateRecommendations(analyses, progressionAnalysis) {
    const validAnalyses = analyses.filter(a => a !== null)

    return {
      readingSchedule: {
        beginner: "Books 1-20: 1 story per day, focus on vocabulary",
        intermediate: "Books 21-50: 1 story every 2 days, add comprehension questions",
        advanced: "Books 51-88: 1 story per week, deep analysis and discussion"
      },
      integrationPoints: {
        dailyFlow: "Morning: Read story, Afternoon: Practice phrases from story, Evening: Review vocabulary",
        exerciseTypes: ["Reading comprehension", "Vocabulary extraction", "Grammar identification", "Cultural discussion"],
        progressTracking: "Track reading level, comprehension accuracy, vocabulary retention"
      },
      technicalImplementation: {
        components: ["GradedReadingViewer", "ComprehensionQuiz", "VocabularyExtractor", "ReadingProgressTracker"],
        dataStructure: "JSON with text, questions, vocabulary, grammar points",
        adaptiveLogic: "Adjust reading level based on comprehension accuracy and time spent"
      }
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new OllamaReadingAnalyzer()
  const booksDirectory = process.argv[2]

  if (!booksDirectory) {
    console.log('Usage: node ollama_reading_analyzer.mjs <books-directory>')
    console.log('Example: node ollama_reading_analyzer.mjs ./german-books/')
    process.exit(1)
  }

  analyzer.processBooksDirectory(booksDirectory)
    .then(results => {
      if (results) {
        console.log('\n🎉 Ready to integrate with German Buddy!')
        console.log('📋 Next steps:')
        console.log('1. Review ollama_reading_analysis.json')
        console.log('2. Build GradedReading components')
        console.log('3. Integrate with existing app')
      }
    })
    .catch(error => {
      console.error('💥 Analysis failed:', error)
      process.exit(1)
    })
}

export { OllamaReadingAnalyzer }