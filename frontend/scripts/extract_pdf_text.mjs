#!/usr/bin/env node

/**
 * PDF Text Extraction Helper for German Reading Books
 * Extracts text from PDFs and saves as .txt files for Ollama analysis
 */

import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'

// Check for pdftotext command
let hasPdfToText = false
try {
  execSync('which pdftotext', { encoding: 'utf8' })
  hasPdfToText = true
  console.log('✅ Found pdftotext command - will use for PDF extraction')
} catch {
  console.log('⚠️  pdftotext not found - will try pdf-parse library')
}

// Import pdf-parse as fallback
let pdf = null
if (!hasPdfToText) {
  try {
    const pdfModule = await import('pdf-parse')
    pdf = pdfModule.default || pdfModule
    console.log('✅ pdf-parse library loaded successfully')
  } catch (error) {
    console.error('⚠️  Warning: pdf-parse module has import issues')
    console.log('💡 Install poppler-utils: brew install poppler')
    console.log('   Or manually convert PDFs to text files')
  }
}

class PDFTextExtractor {
  constructor() {
    this.extractedCount = 0
  }

  async extractAllPDFs(pdfsDirectory) {
    console.log('📄 Extracting text from German PDF books...')

    try {
      const files = await fs.readdir(pdfsDirectory)
      const pdfFiles = files
        .filter(f => f.toLowerCase().endsWith('.pdf'))
        .sort() // Important: maintain order for progression analysis

      if (pdfFiles.length === 0) {
        console.log('❌ No PDF files found in', pdfsDirectory)
        console.log('📋 Instructions:')
        console.log('1. Copy your 88 German PDF books to:', pdfsDirectory)
        console.log('2. Name them in difficulty order (001-beginner.pdf, 002-elementary.pdf, etc.)')
        console.log('3. Run this script again')
        return false
      }

      console.log(`Found ${pdfFiles.length} PDF files to extract`)

      for (let i = 0; i < pdfFiles.length; i++) {
        const pdfFile = pdfFiles[i]
        const pdfPath = path.join(pdfsDirectory, pdfFile)
        const txtPath = pdfPath.replace(/\.pdf$/i, '.txt')

        // Skip if text file already exists
        try {
          await fs.access(txtPath)
          console.log(`⏭️  ${i + 1}/${pdfFiles.length}: ${pdfFile} - text already extracted`)
          this.extractedCount++
          continue
        } catch {
          // File doesn't exist, proceed with extraction
        }

        console.log(`📖 ${i + 1}/${pdfFiles.length}: Extracting ${pdfFile}...`)

        try {
          let text = ''

          // Try pdftotext first (more reliable)
          if (hasPdfToText) {
            try {
              text = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf8' })
              console.log(`📄 Extracted using pdftotext`)
            } catch (error) {
              console.log(`⚠️  pdftotext failed for ${pdfFile}, trying pdf-parse...`)
              hasPdfToText = false // Fallback for this file
            }
          }

          // Fallback to pdf-parse
          if (!hasPdfToText && !text) {
            if (!pdf) {
              console.log(`❌ Cannot extract ${pdfFile}: no extraction method available`)
              console.log(`💡 Please manually convert ${pdfFile} to ${path.basename(txtPath)}`)

              // Create instruction file
              const instructionText = `# Manual conversion needed for ${pdfFile}
#
# Neither pdftotext nor pdf-parse could extract this PDF. Please manually convert:
#
# Methods:
# 1. Copy text from PDF viewer and paste into this file
# 2. Use online PDF to text converter
# 3. Use Adobe Reader's "Save as Text" feature
# 4. Install poppler-utils: brew install poppler
#
# Replace this content with the actual German text from the PDF.
`
              await fs.writeFile(txtPath, instructionText, 'utf8')
              continue
            }

            // Read PDF file
            const pdfBuffer = await fs.readFile(pdfPath)

            // Extract text using pdf-parse
            const data = await pdf(pdfBuffer)
            text = data.text
            console.log(`📄 Extracted using pdf-parse`)
          }

          // Clean up the text
          text = this.cleanText(text)

          if (text.trim().length < 100) {
            console.log(`⚠️  Warning: ${pdfFile} extracted very little text (${text.length} chars)`)
            console.log('   This might be a scanned PDF requiring OCR')
          }

          // Save as text file
          await fs.writeFile(txtPath, text, 'utf8')

          console.log(`✅ Extracted ${text.length} characters from ${pdfFile}`)
          this.extractedCount++

        } catch (error) {
          console.error(`❌ Failed to extract ${pdfFile}:`, error.message)

          // Create placeholder text file noting the error
          const errorText = `# ERROR: Could not extract text from ${pdfFile}
# Error: ${error.message}
# This PDF might be:
# - Password protected
# - Scanned images requiring OCR
# - Corrupted
# - In a complex format

# Please manually convert this PDF to text or provide a readable version.
`
          await fs.writeFile(txtPath, errorText, 'utf8')
        }

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`\n✅ Text extraction complete!`)
      console.log(`📊 Successfully extracted: ${this.extractedCount}/${pdfFiles.length} files`)
      console.log(`📁 Text files saved in: ${pdfsDirectory}`)

      return true

    } catch (error) {
      console.error('❌ Failed to extract PDFs:', error)
      return false
    }
  }

  // Clean extracted text
  cleanText(text) {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers (common patterns)
      .replace(/^\d+\s*$/gm, '') // Lines with just numbers
      .replace(/^[A-Z\s]{5,}$/gm, '') // Lines with all caps (likely headers)
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between words joined incorrectly
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after punctuation
      // Remove control characters
      .replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  // Preview extracted text
  async previewExtractions(pdfsDirectory, maxFiles = 3) {
    const files = await fs.readdir(pdfsDirectory)
    const txtFiles = files
      .filter(f => f.toLowerCase().endsWith('.txt'))
      .sort()
      .slice(0, maxFiles)

    console.log(`\n📋 Preview of extracted text (first ${maxFiles} files):`)

    for (const txtFile of txtFiles) {
      const txtPath = path.join(pdfsDirectory, txtFile)
      const text = await fs.readFile(txtPath, 'utf8')

      console.log(`\n--- ${txtFile} ---`)
      console.log(`Length: ${text.length} characters`)
      console.log(`Preview: ${text.slice(0, 200)}...`)
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new PDFTextExtractor()
  const booksDirectory = process.argv[2] || path.join(process.env.HOME, 'german-books')
  const command = process.argv[3] || 'extract'

  if (command === 'extract') {
    extractor.extractAllPDFs(booksDirectory)
      .then(success => {
        if (success) {
          console.log('\n🎉 Ready for Ollama analysis!')
          console.log('Next step: node scripts/ollama_reading_analyzer.mjs', booksDirectory)
        }
      })
      .catch(console.error)

  } else if (command === 'preview') {
    extractor.previewExtractions(booksDirectory)
      .catch(console.error)

  } else {
    console.log('Usage:')
    console.log('  node extract_pdf_text.mjs [books-directory] [extract|preview]')
    console.log('')
    console.log('Examples:')
    console.log('  node extract_pdf_text.mjs ~/german-books extract')
    console.log('  node extract_pdf_text.mjs ~/german-books preview')
  }
}

export { PDFTextExtractor }