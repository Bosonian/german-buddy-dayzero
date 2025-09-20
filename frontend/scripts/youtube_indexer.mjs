#!/usr/bin/env node
// Build YouTube segment index for phrases by searching and scanning transcripts.
// Usage: YT_API_KEY=... node scripts/youtube_indexer.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'
import { YoutubeTranscript } from 'youtube-transcript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FRONTEND_ROOT = path.resolve(__dirname, '..')
const DATA_PATH = path.join(FRONTEND_ROOT, 'public', 'german_phrases.json')
const OUTPUT_PATH = path.join(FRONTEND_ROOT, 'public', 'youtube_index.json')

const API_KEY = process.env.YT_API_KEY || process.env.GOOGLE_API_KEY
if (!API_KEY) {
  console.error('Missing YT_API_KEY environment variable')
  process.exit(1)
}

const youtube = google.youtube({ version: 'v3', auth: API_KEY })

const normalize = (s) => s
  .toLowerCase()
  .replace(/[ä]/g, 'ae').replace(/[ö]/g, 'oe').replace(/[ü]/g, 'ue')
  .replace(/ß/g, 'ss')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const fuzzyIncludes = (hay, needle) => {
  if (hay.includes(needle)) return true
  // Allow small deviations: check individual words coverage
  const hWords = new Set(hay.split(' '))
  const nWords = needle.split(' ')
  const hit = nWords.filter(w => hWords.has(w)).length / nWords.length
  return hit >= 0.8
}

async function searchYouTube(q) {
  const res = await youtube.search.list({
    q,
    type: 'video',
    part: ['id', 'snippet'],
    maxResults: 8,
    relevanceLanguage: 'de',
    videoCaption: 'closedCaption'
  })
  return res.data.items || []
}

async function findSegment(videoId, phrase) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'de' })
    const normPhrase = normalize(phrase)
    for (const seg of transcript) {
      const normText = normalize(seg.text)
      if (fuzzyIncludes(normText, normPhrase)) {
        const start = Math.max(0, Math.floor(seg.offset / 1000) - 1)
        const end = start + Math.ceil((seg.duration || 2000) / 1000) + 1
        return { videoId, start, end }
      }
    }
  } catch (e) {
    // No transcript or fetch error
    return null
  }
  return null
}

async function processPhrase(phrase) {
  // Try strict quoted search first, then relaxed
  const queries = [
    `"${phrase}"`,
    phrase
  ]
  for (const q of queries) {
    const items = await searchYouTube(q)
    for (const it of items) {
      const vid = it.id?.videoId
      if (!vid) continue
      const seg = await findSegment(vid, phrase)
      if (seg) return seg
    }
  }
  return null
}

async function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8')
  const data = JSON.parse(raw)

  const entries = Object.entries(data)
  const out = {}

  for (const [key, val] of entries) {
    const display = key.replace(/_/g, ' ')
    const phrase = val.title || val.german || display
    if (!phrase) continue
    // Skip if already has youtube
    if (val.youtube && val.youtube.videoId) {
      out[key] = val.youtube
      continue
    }
    console.log(`Searching: ${phrase}`)
    const seg = await processPhrase(phrase)
    if (seg) {
      out[key] = seg
      console.log(`  Found: ${seg.videoId} [${seg.start}-${seg.end}]`)
    } else {
      console.log('  Not found')
    }
    // Small delay to be gentle on API and transcript fetcher
    await new Promise(r => setTimeout(r, 400))
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2))
  console.log(`Wrote ${Object.keys(out).length} results to ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

