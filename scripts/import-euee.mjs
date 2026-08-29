/**
 * Qorma EUEE Importer — reads .docx files using pure Node.js (no PowerShell)
 * A .docx is a ZIP file; we read word/document.xml directly using the ZIP spec.
 *
 * Usage: npm run db:import
 */

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { Pool } from 'pg'

// ── Config ────────────────────────────────────────────────────────────────────

const EUEE_ROOT = path.resolve(process.cwd(), 'EUEE')

const SUBJECT_FOLDER_MAP = {
  Biology: 'biology',
  chemistry: 'chemistry',
  English: 'english',
  physics: 'physics',
}

// ── DB ────────────────────────────────────────────────────────────────────────

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function query(sql, params = []) {
  const client = await pool.connect()
  try { return await client.query(sql, params) }
  finally { client.release() }
}

// ── Pure-Node ZIP reader ──────────────────────────────────────────────────────
// Reads a specific file from a ZIP archive without extracting to disk.

function readZipEntry(zipBuffer, targetPath) {
  // Find End of Central Directory record
  let eocdOffset = -1
  for (let i = zipBuffer.length - 22; i >= 0; i--) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) { eocdOffset = i; break }
  }
  if (eocdOffset === -1) throw new Error('Not a valid ZIP file')

  const centralDirOffset = zipBuffer.readUInt32LE(eocdOffset + 16)
  const centralDirSize = zipBuffer.readUInt32LE(eocdOffset + 12)
  const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10)

  let pos = centralDirOffset
  for (let i = 0; i < totalEntries; i++) {
    if (zipBuffer.readUInt32LE(pos) !== 0x02014b50) break

    const compression = zipBuffer.readUInt16LE(pos + 10)
    const compressedSize = zipBuffer.readUInt32LE(pos + 20)
    const uncompressedSize = zipBuffer.readUInt32LE(pos + 24)
    const fileNameLen = zipBuffer.readUInt16LE(pos + 28)
    const extraLen = zipBuffer.readUInt16LE(pos + 30)
    const commentLen = zipBuffer.readUInt16LE(pos + 32)
    const localHeaderOffset = zipBuffer.readUInt32LE(pos + 42)
    const fileName = zipBuffer.slice(pos + 46, pos + 46 + fileNameLen).toString('utf8')

    pos += 46 + fileNameLen + extraLen + commentLen

    if (fileName === targetPath) {
      // Read local file header
      const localFileNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26)
      const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28)
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen
      const compressedData = zipBuffer.slice(dataStart, dataStart + compressedSize)

      if (compression === 0) return compressedData // stored
      if (compression === 8) return zlib.inflateRawSync(compressedData) // deflated
      throw new Error(`Unsupported compression: ${compression}`)
    }
  }
  throw new Error(`Entry not found in ZIP: ${targetPath}`)
}

function extractText(docxPath) {
  const buf = fs.readFileSync(docxPath)
  const xmlBuf = readZipEntry(buf, 'word/document.xml')
  const xml = xmlBuf.toString('utf8')

  return xml
    .replace(/<w:br[^/]*/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── Parser ────────────────────────────────────────────────────────────────────

function parseDocument(text) {
  const answerKeyIndex = text.search(/\bAnswer\s+Key\b/i)
  if (answerKeyIndex === -1) throw new Error('Answer Key section not found')

  const questionsText = text.slice(0, answerKeyIndex)
  const answerKeyText = text.slice(answerKeyIndex)

  // Parse answer key — handles both "1.C" and "/>1.C" formats
  const answerMap = new Map()
  const akPattern = /\/?>\s*(\d+)\s*[.)]\s*([A-Da-d])/g
  let m
  while ((m = akPattern.exec(answerKeyText)) !== null) {
    answerMap.set(parseInt(m[1], 10), m[2].toUpperCase())
  }
  const akPattern2 = /^(\d+)\s*[.)]\s*([A-Da-d])\s*$/gm
  while ((m = akPattern2.exec(answerKeyText)) !== null) {
    if (!answerMap.has(parseInt(m[1], 10))) {
      answerMap.set(parseInt(m[1], 10), m[2].toUpperCase())
    }
  }

  // Parse questions
  const lines = questionsText.split('\n').map(l => l.trim()).filter(Boolean)
  const questions = []
  let current = null

  for (const line of lines) {
    const qMatch = line.match(/^(\d+)\s*[.)]\s+(.+)/)
    if (qMatch) {
      if (current) questions.push(current)
      current = { orderIndex: parseInt(qMatch[1], 10), body: qMatch[2].trim(), options: [] }
      continue
    }
    if (!current) continue

    const optMatch = line.match(/^([A-Da-d])\s*[.)]\s+(.+)/)
    if (optMatch) {
      current.options.push({ label: optMatch[1].toUpperCase(), body: optMatch[2].trim() })
      continue
    }

    if (current.options.length === 0) current.body += ' ' + line
    else current.options[current.options.length - 1].body += ' ' + line
  }
  if (current) questions.push(current)

  const enriched = questions
    .filter(q => q.options.length >= 2)
    .map(q => ({
      ...q,
      options: q.options.map(opt => ({
        ...opt,
        isCorrect: opt.label === answerMap.get(q.orderIndex),
      })),
    }))

  return { questions: enriched }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getSubjectId(slug) {
  const res = await query('SELECT id FROM subject WHERE slug = $1', [slug])
  if (!res.rows[0]) throw new Error(`Subject not found: ${slug}. Run db:seed first.`)
  return res.rows[0].id
}

async function getOrCreateExamId(year) {
  const res = await query("SELECT id FROM exam WHERE year = $1 AND exam_type = 'euee'", [year])
  if (res.rows[0]) return res.rows[0].id
  const ins = await query(
    "INSERT INTO exam (exam_type, year, label) VALUES ('euee', $1, $2) RETURNING id",
    [year, `EUEE ${year}`]
  )
  return ins.rows[0].id
}

// ── Import one file ───────────────────────────────────────────────────────────

async function importFile(docxPath, subjectSlug, year) {
  console.log(`  Parsing: ${path.basename(docxPath)}`)

  let text
  try { text = extractText(docxPath) }
  catch (err) { console.error(`    ✗ Extract failed: ${err.message}`); return { inserted: 0, skipped: 0 } }

  let parsed
  try { parsed = parseDocument(text) }
  catch (err) { console.error(`    ✗ Parse failed: ${err.message}`); return { inserted: 0, skipped: 0 } }

  const subjectId = await getSubjectId(subjectSlug)
  const examId = await getOrCreateExamId(year)

  let inserted = 0, skipped = 0

  for (const q of parsed.questions) {
    const exists = await query(
      'SELECT id FROM question WHERE exam_id=$1 AND subject_id=$2 AND order_index=$3',
      [examId, subjectId, q.orderIndex]
    )
    if (exists.rows.length > 0) { skipped++; continue }

    if (!q.options.some(o => o.isCorrect)) { skipped++; continue }

    const qRes = await query(
      'INSERT INTO question (exam_id, subject_id, order_index, body) VALUES ($1,$2,$3,$4) RETURNING id',
      [examId, subjectId, q.orderIndex, q.body]
    )
    for (const opt of q.options) {
      await query(
        'INSERT INTO option (question_id, label, body, is_correct) VALUES ($1,$2,$3,$4)',
        [qRes.rows[0].id, opt.label, opt.body, opt.isCorrect]
      )
    }
    inserted++
  }

  console.log(`    ✓ ${inserted} inserted, ${skipped} skipped`)
  return { inserted, skipped }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required')
  console.log('🌱  Qorma EUEE Importer (pure Node)\n')

  let totalInserted = 0, totalSkipped = 0

  for (const [folder, slug] of Object.entries(SUBJECT_FOLDER_MAP)) {
    const folderPath = path.join(EUEE_ROOT, folder)
    if (!fs.existsSync(folderPath)) { console.log(`⚠  Missing: ${folder}`); continue }

    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.docx') && !f.startsWith('~$'))
      .sort()

    console.log(`\n📚  ${folder} (${files.length} files)`)

    for (const file of files) {
      const yearMatch = file.match(/^(\d{4})/)
      if (!yearMatch) { console.log(`  ⚠  Skipping: ${file}`); continue }
      const year = parseInt(yearMatch[1], 10)
      const result = await importFile(path.join(folderPath, file), slug, year)
      totalInserted += result.inserted
      totalSkipped += result.skipped
    }
  }

  await pool.end()
  console.log('\n' + '─'.repeat(50))
  console.log(`✅  Done: ${totalInserted} inserted, ${totalSkipped} skipped`)
}

main().catch(async err => {
  console.error('\n❌', err.message)
  await pool.end()
  process.exit(1)
})
