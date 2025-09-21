#!/usr/bin/env node

/**
 * Quick German Reading Analysis for books with good text extraction
 */

import fs from 'fs/promises'
import path from 'path'

// Good text files identified from extraction
const goodBooks = [
  '001-sample-A1.txt',
  '002-sample-A2.txt',
  '18.Der Hundetraum.txt',
  '19.Die Blaumacherin.txt',
  '20.Das Idealpaar.txt',
  '39.Der Jaguar.txt',
  '40.Die Neue.txt',
  '41.Gebrochene Herzen.txt',
  '44.Stille Nacht.txt',
  '60.Toedlicher schnee.txt',
  '83.Das letzte Hindernis.txt'
]

async function callOllama(prompt) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.1:8b',
      prompt: prompt,
      stream: false,
      options: { temperature: 0.1, top_p: 0.9 }
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`)
  }

  const data = await response.json()
  let responseText = data.response.trim()

  // Clean up JSON formatting issues
  responseText = responseText.replace(/^[^{]*{/, '{')
  responseText = responseText.replace(/}[^}]*$/, '}')

  return responseText
}

async function analyzeBook(bookText, bookName) {
  const prompt = `
Analyze this German text for language learning progression:

BOOK: "${bookName}"
TEXT: ${bookText.slice(0, 1500)}...

IMPORTANT: Respond with ONLY valid JSON. No explanatory text before or after.

{
  "level": "A1/A2/B1/B2/C1",
  "vocabulary": {
    "totalWords": ${bookText.split(/\s+/).length},
    "uniqueWords": ${new Set(bookText.toLowerCase().split(/\s+/)).size},
    "newWordsIntroduced": ["word1", "word2", "word3"],
    "difficultyScore": 1-10
  },
  "grammar": {
    "tenses": ["present", "past", "future"],
    "structures": ["simple sentences", "complex clauses"],
    "complexity": 1-10
  },
  "readability": {
    "averageSentenceLength": ${Math.round(bookText.split(/[.!?]+/).length)},
    "readingTime": "estimated minutes"
  },
  "content": {
    "topics": ["theme1", "theme2"],
    "culturalElements": ["element1"],
    "learningObjectives": ["objective1"]
  }
}`

  try {
    const response = await callOllama(prompt)
    return JSON.parse(response)
  } catch (error) {
    console.error(`❌ Failed to analyze ${bookName}:`, error.message)
    return null
  }
}

async function quickAnalysis() {
  console.log('🚀 Quick analysis of German books with good text extraction...')

  const booksDir = process.argv[2] || path.join(process.env.HOME, 'german-books')
  const analyses = []

  for (let i = 0; i < goodBooks.length; i++) {
    const bookFile = goodBooks[i]
    const bookPath = path.join(booksDir, bookFile)

    console.log(`📖 Analyzing ${i + 1}/${goodBooks.length}: ${bookFile}`)

    try {
      const bookText = await fs.readFile(bookPath, 'utf8')

      if (bookText.trim().length < 100) {
        console.log(`⏭️ Skipping ${bookFile} - too little text`)
        continue
      }

      const analysis = await analyzeBook(bookText, bookFile)
      if (analysis) {
        analyses.push({
          bookName: bookFile,
          bookNumber: i + 1,
          ...analysis
        })
        console.log(`✅ Level: ${analysis.level}, Complexity: ${analysis.grammar?.complexity || 'N/A'}/10`)
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error(`❌ Error reading ${bookFile}:`, error.message)
    }
  }

  // Save results
  const results = {
    metadata: {
      totalBooks: analyses.length,
      analysisDate: new Date().toISOString(),
      ollamaModel: 'llama3.1:8b',
      source: 'Quick analysis of extracted German books'
    },
    bookAnalyses: analyses,
    progression: {
      levels: [...new Set(analyses.map(a => a.level))].sort(),
      complexityRange: `${Math.min(...analyses.map(a => a.grammar?.complexity || 0))}-${Math.max(...analyses.map(a => a.grammar?.complexity || 0))}/10`,
      topics: [...new Set(analyses.flatMap(a => a.content?.topics || []))]
    }
  }

  const outputPath = path.join(booksDir, 'quick_analysis_results.json')
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2))

  console.log(`\n✅ Quick analysis complete!`)
  console.log(`📊 Analyzed: ${analyses.length} books`)
  console.log(`📁 Results saved to: ${outputPath}`)
  console.log(`🎯 Levels found: ${results.progression.levels.join(', ')}`)

  return results
}

if (import.meta.url === `file://${process.argv[1]}`) {
  quickAnalysis().catch(console.error)
}

export { quickAnalysis }