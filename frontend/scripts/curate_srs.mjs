#!/usr/bin/env node
// Curate A1/A2 sentences from Anki CSVs into chunked JSON for the PWA.
// Usage:
//  node scripts/curate_srs.mjs --csv-dir "/path/to/anki_data/output" --levels A1,A2 --min-frequency 400 --chunk 1000

import fs from 'fs'
import path from 'path'
import { parse as parseCsv } from 'csv-parse/sync'

const args = process.argv.slice(2)
const getArg = (name, def = undefined) => {
  const pref = `--${name}=`
  const found = args.find(a => a.startsWith(pref))
  return found ? found.slice(pref.length) : def
}

const csvDir = getArg('csv-dir')
if (!csvDir || !fs.existsSync(csvDir)) {
  console.error('missing or invalid --csv-dir path')
  process.exit(1)
}
const levelsArg = getArg('levels', 'A1,A2')
const levels = new Set(levelsArg.split(',').map(s => s.trim().toUpperCase()))
const minFreq = Number(getArg('min-frequency', '0'))
const chunk = Number(getArg('chunk', '1000'))

const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'))
let rows = []
for (const f of files) {
  const full = path.join(csvDir, f)
  const text = fs.readFileSync(full, 'utf-8')
  const parsed = parseCsv(text, { columns: true, skip_empty_lines: true })
  rows.push(...parsed)
}

const isComplex = (t) => /(dass|weil|obwohl|damit|indem|würde|hätte|wäre|könnte|sollte|müsste|dürfte)/.test(String(t).toLowerCase())

const strictRules = {
  A1: { maxWords: 6, forbidComma: true },
  A2: { maxWords: 10, forbidComma: true }
}

function keep(row) {
  const lvl = String(row.difficulty || '').toUpperCase()
  if (levels.size && !levels.has(lvl)) return false
  const german = String(row.german || '')
  if (!german) return false
  const words = german.trim().split(/\s+/).length
  const freq = Number(row.frequency || 0)
  if (freq < minFreq) return false
  if (strictRules[lvl]) {
    const r = strictRules[lvl]
    if (words > r.maxWords) return false
    if (r.forbidComma && /[,;:]/.test(german)) return false
    if (isComplex(german)) return false
  }
  return true
}

const curated = rows.filter(keep).map((r, idx) => ({
  id: Number(r.id || idx + 1),
  german: String(r.german).trim(),
  english: String(r.english || '').trim(),
  level: String(r.difficulty || '').toUpperCase() || 'A1',
  frequency: Number(r.frequency || 0)
}))

curated.sort((a, b) => (b.frequency || 0) - (a.frequency || 0))

const outRoot = path.resolve(path.join(process.cwd(), 'public', 'srs'))
if (!fs.existsSync(outRoot)) fs.mkdirSync(outRoot)

for (const lvl of levels) {
  const dir = path.join(outRoot, lvl)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  const arr = curated.filter(x => x.level === lvl)
  let i = 0, part = 1
  while (i < arr.length) {
    const slice = arr.slice(i, i + chunk)
    const out = path.join(dir, `part-${String(part).padStart(3, '0')}.json`)
    fs.writeFileSync(out, JSON.stringify(slice, null, 2))
    console.log(`Wrote ${slice.length} to ${out}`)
    i += chunk; part += 1
  }
}

