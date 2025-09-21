#!/usr/bin/env node
/*
Ingest daily graded German readings from Wikipedia (CC BY-SA 4.0) and import to backend.

Usage:
  node scripts/ingest_readings.mjs \
    --api https://api.yourdomain.com \
    --token $(cat token.txt) \
    --levels A1,A2,B1 \
    --per-level 2

Notes:
  - Uses Wikipedia REST API (de) to fetch summaries and extracts.
  - Applies a lightweight CEFR grader.
  - Respects CC BY-SA license by storing title, source_url, license.
*/

const args = process.argv.slice(2)
const getArg = (name, def) => {
  const p = `--${name}=`
  const f = args.find(a => a.startsWith(p))
  return f ? f.slice(p.length) : def
}

const API = getArg('api', process.env.API || 'http://localhost:8080')
const TOKEN = getArg('token', process.env.TOKEN)
const LEVELS = (getArg('levels', 'A1,A2')).split(',').map(s => s.trim()).filter(Boolean)
const PER_LEVEL = Number(getArg('per-level', '2'))

if (!TOKEN) {
  console.error('Missing --token or TOKEN env')
  process.exit(1)
}

const WIKI_BASE = 'https://de.wikipedia.org/api/rest_v1'

// Utility: sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Very lightweight CEFR grader based on surface features
function cefrGrade(text) {
  const t = text.trim()
  const words = t.split(/\s+/)
  const len = words.length
  const lower = t.toLowerCase()
  const hasComplex = /(dass|weil|obwohl|damit|indem|w\w+re|k\w+nnte|sollte|m\w+sste|dürfte)/.test(lower)
  const commaCount = (t.match(/[,;:]/g) || []).length

  if (len <= 80 && !hasComplex && commaCount === 0) return 'A1'
  if (len <= 120 && !hasComplex && commaCount <= 1) return 'A2'
  if (len <= 180 && commaCount <= 2) return 'B1'
  if (len <= 240) return 'B2'
  return 'C1'
}

function splitIntoParas(text) {
  // Split by double newline or create artificial paragraphs ~80-140 words
  const raw = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
  if (raw.length) return raw
  const words = text.split(/\s+/)
  const paras = []
  let buf = []
  for (const w of words) {
    buf.push(w)
    if (buf.length >= 90 && /[.!?]$/.test(w)) {
      paras.push(buf.join(' '))
      buf = []
    }
  }
  if (buf.length) paras.push(buf.join(' '))
  return paras
}

async function fetchRandomSummary() {
  const res = await fetch(`${WIKI_BASE}/page/random/summary`, {
    headers: { 'User-Agent': 'GermanBuddy/1.0 (+https://german-buddy-dayzero.vercel.app)' }
  })
  if (!res.ok) throw new Error('wiki summary failed')
  return res.json()
}

async function fetchExtract(title) {
  const enc = encodeURIComponent(title)
  const res = await fetch(`${WIKI_BASE}/page/summary/${enc}`, {
    headers: { 'User-Agent': 'GermanBuddy/1.0 (+https://german-buddy-dayzero.vercel.app)' }
  })
  if (!res.ok) throw new Error('wiki extract failed')
  return res.json()
}

function candidateParasFromSummary(sum) {
  const title = sum.title || ''
  const url = sum.content_urls?.desktop?.page || ''
  const extract = [sum.extract, sum.description].filter(Boolean).join('\n\n')
  const paras = splitIntoParas(extract)
  return { title, url, paras }
}

async function buildItems(targetLevels, perLevel) {
  const bucket = {}
  for (const lvl of targetLevels) bucket[lvl] = []

  let tries = 0
  while (Object.values(bucket).some(arr => arr.length < perLevel) && tries < 200) {
    tries++
    try {
      const sum = await fetchRandomSummary()
      const { title, url, paras } = candidateParasFromSummary(sum)
      for (const p of paras) {
        const text = p.trim()
        if (text.length < 40) continue
        const g = cefrGrade(text)
        if (!targetLevels.includes(g)) continue
        if (bucket[g].length >= perLevel) continue
        bucket[g].push({
          cefr: g,
          topic: sum?.titles?.normalized || '',
          title,
          text,
          tokens: text.split(/\s+/).length,
          features_json: '{}',
          license: 'CC BY-SA 4.0',
          source_url: url
        })
      }
      await sleep(250)
    } catch (e) {
      await sleep(500)
    }
  }
  return Object.values(bucket).flat()
}

async function importItems(api, token, items) {
  if (!items.length) return { inserted: 0 }
  const res = await fetch(`${api}/reading/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(items)
  })
  if (!res.ok) throw new Error(`Import failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  const items = await buildItems(LEVELS, PER_LEVEL)
  console.log(`Prepared ${items.length} reading items for ${LEVELS.join(', ')}`)
  const out = await importItems(API, TOKEN, items)
  console.log(`Imported: ${out.inserted}`)
}

main().catch(e => { console.error(e); process.exit(1) })

