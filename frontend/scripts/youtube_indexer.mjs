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
const PHRASES_JSON = path.join(__dirname, 'phrases.json')
const CHANNELS_JSON = path.join(__dirname, 'channels.json')

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
  if (hay.includes(needle)) return 1
  const hWords = hay.split(' ')
  const nWords = needle.split(' ')
  const setH = new Set(hWords)
  const coverage = nWords.filter(w => setH.has(w)).length / Math.max(1, nWords.length)
  // Additionally, compute a simple character overlap ratio
  const commonChars = [...new Set(needle)].filter(ch => hay.includes(ch)).length
  const charRatio = commonChars / Math.max(1, new Set(needle).size)
  return Math.max(coverage, charRatio)
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
    for (let i = 0; i < transcript.length; i++) {
      const seg = transcript[i]
      const normText = normalize(seg.text)
      const score = fuzzyIncludes(normText, normPhrase)
      if (score >= 0.85) {
        const segStart = Math.floor(seg.offset / 1000)
        const segDur = Math.ceil((seg.duration || 2000) / 1000)
        const start = Math.max(0, segStart - 1)
        const end = start + segDur + 1

        // Build context before/after (approx 4-6 seconds window)
        let before = ''
        let after = ''
        // Accumulate previous segments within ~5s
        for (let j = i - 1; j >= 0; j--) {
          const s = transcript[j]
          if (seg.offset - s.offset > 5000) break
          before = s.text + (before ? ' ' + before : '')
        }
        // Accumulate next segments within ~5s
        for (let j = i + 1; j < transcript.length; j++) {
          const s = transcript[j]
          if (s.offset - seg.offset > 5000) break
          after = after ? after + ' ' + s.text : s.text
        }

        return { videoId, start, end, contextBefore: before, contextAfter: after, score }
      }
    }
  } catch (e) {
    // No transcript or fetch error
    return null
  }
  return null
}

async function getChannelUploads(channelId, max = 20) {
  const cres = await youtube.channels.list({ id: [channelId], part: ['contentDetails', 'snippet'] })
  const channel = cres.data.items?.[0]
  if (!channel) return { videos: [], channelTitle: '' }
  const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads
  const channelTitle = channel.snippet?.title || ''
  if (!uploadsId) return { videos: [], channelTitle }
  const vids = []
  let pageToken
  while (vids.length < max) {
    const pres = await youtube.playlistItems.list({ playlistId: uploadsId, part: ['contentDetails'], maxResults: 50, pageToken })
    for (const it of pres.data.items || []) {
      const vid = it.contentDetails?.videoId
      if (vid) vids.push(vid)
      if (vids.length >= max) break
    }
    pageToken = pres.data.nextPageToken
    if (!pageToken) break
  }
  return { videos: vids, channelTitle }
}

async function getVideoSnippets(videoIds) {
  if (videoIds.length === 0) return {}
  const chunks = []
  for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50))
  const result = {}
  for (const chunk of chunks) {
    const vres = await youtube.videos.list({ id: chunk, part: ['snippet', 'contentDetails', 'statistics'] })
    for (const it of vres.data.items || []) {
      result[it.id] = {
        title: it.snippet?.title || '',
        channel: it.snippet?.channelTitle || '',
        thumb: it.snippet?.thumbnails?.medium?.url || '',
        publishedAt: it.snippet?.publishedAt || '',
        views: Number(it.statistics?.viewCount || 0),
      }
    }
  }
  return result
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
  // Load phrases list
  let phrases = []
  if (fs.existsSync(PHRASES_JSON)) {
    phrases = JSON.parse(fs.readFileSync(PHRASES_JSON, 'utf-8'))
  } else {
    // Fallback: attempt to derive from german_phrases.json keys
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    const data = JSON.parse(raw)
    phrases = Object.keys(data).map(k => k.replace(/_/g, ' '))
  }

  // Load channels
  let channels = []
  if (fs.existsSync(CHANNELS_JSON)) {
    const c = JSON.parse(fs.readFileSync(CHANNELS_JSON, 'utf-8'))
    channels = Object.values(c).flat()
  }

  const out = {}

  // Channel scanning first (preferred sources)
  if (channels.length) {
    console.log(`Scanning ${channels.length} channels…`)
    for (const channelId of channels) {
      console.log(`  Channel: ${channelId}`)
      const { videos } = await getChannelUploads(channelId, 40)
      const snippets = await getVideoSnippets(videos)
      for (const phrase of phrases) {
        // Initialize bucket
        const key = normalize(phrase).replace(/\s+/g, '_')
        if (!out[key]) out[key] = []
        // Skip if we already have 3 clips
        if (out[key].length >= 3) continue
        // Try each video until we find up to 3
        for (const vid of videos) {
          if (out[key].length >= 3) break
          const seg = await findSegment(vid, phrase)
          if (seg) {
            const meta = snippets[vid] || {}
            out[key].push({
              videoId: seg.videoId,
              start: seg.start,
              end: seg.end,
              title: meta.title,
              channel: meta.channel,
              thumbnailUrl: meta.thumb,
              contextBefore: seg.contextBefore,
              contextAfter: seg.contextAfter,
              score: seg.score,
            })
          }
        }
      }
    }
  }

  // Fallback: general search per phrase to fill up to 3 clips
  for (const phrase of phrases) {
    const key = normalize(phrase).replace(/\s+/g, '_')
    const existing = out[key] || []
    if (existing.length >= 3) continue
    console.log(`Searching general: ${phrase}`)
    const items = await searchYouTube(`"${phrase}"`)
    const more = await searchYouTube(phrase)
    const candidates = [...items, ...more]
    const ids = []
    for (const it of candidates) {
      const vid = it.id?.videoId
      if (vid && !ids.includes(vid)) ids.push(vid)
      if (ids.length >= 12) break
    }
    const snippets = await getVideoSnippets(ids)
    for (const vid of ids) {
      if (existing.length >= 3) break
      const seg = await findSegment(vid, phrase)
      if (seg) {
        const meta = snippets[vid] || {}
        existing.push({
          videoId: seg.videoId,
          start: seg.start,
          end: seg.end,
          title: meta.title,
          channel: meta.channel,
          thumbnailUrl: meta.thumb,
          contextBefore: seg.contextBefore,
          contextAfter: seg.contextAfter,
          score: seg.score,
        })
      }
      await new Promise(r => setTimeout(r, 250))
    }
    if (existing.length) out[key] = existing
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2))
  console.log(`Wrote ${Object.keys(out).length} phrases to ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
