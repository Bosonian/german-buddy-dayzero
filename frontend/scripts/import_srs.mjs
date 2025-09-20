#!/usr/bin/env node
/* eslint-disable */
// Import curated SRS items into backend /items using auth token
// Usage:
//  node scripts/import_srs.mjs --api http://localhost:8080 --levels A1,A2 --token $(cat token.txt)

import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const getArg = (name, def = undefined) => {
  const pref = `--${name}=`
  const found = args.find(a => a.startsWith(pref))
  return found ? found.slice(pref.length) : def
}

const API = getArg('api', process.env.API || 'http://localhost:8080')
const LEVELS = (getArg('levels', 'A1,A2') || '').split(',').map(s => s.trim()).filter(Boolean)
const TOKEN = getArg('token', process.env.TOKEN)

if (!TOKEN) { console.error('Missing --token or TOKEN env'); process.exit(1) }

async function importFile(file) {
  const text = fs.readFileSync(file, 'utf-8')
  const items = JSON.parse(text)
  const payload = items.map(it => ({ id: it.id, german: it.german, english: it.english, level: it.level, frequency: it.frequency }))
  const res = await fetch(`${API}/srs/items/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(payload)
  })
  if (!res.ok) { throw new Error(`Import failed for ${file}: ${res.status} ${await res.text()}`) }
  const out = await res.json()
  console.log(`Imported ${out.inserted} from ${path.basename(file)}`)
}

async function main() {
  const root = path.resolve(path.join(process.cwd(), 'public', 'srs'))
  for (const lvl of LEVELS) {
    const dir = path.join(root, lvl)
    if (!fs.existsSync(dir)) { console.warn(`Skip ${lvl}: missing ${dir}`); continue }
    const files = fs.readdirSync(dir).filter(f => f.startsWith('part-') && f.endsWith('.json')).sort()
    for (const f of files) {
      await importFile(path.join(dir, f))
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
