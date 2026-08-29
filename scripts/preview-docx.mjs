/**
 * Read raw text from a .docx file using only Node built-ins.
 * A .docx is a zip file; word/document.xml contains all the text.
 *
 * Usage: node scripts/preview-docx.mjs "EUEE/Maths/2005 Mathematics @EUEE_bot.docx"
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/preview-docx.mjs <path>')
  process.exit(1)
}

const abs = path.resolve(process.cwd(), filePath)

// Use PowerShell's built-in Expand-Archive to extract word/document.xml
const tmpDir = path.join(process.cwd(), 'scripts', '_tmp_docx')
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
fs.mkdirSync(tmpDir, { recursive: true })

// Copy to .zip so PowerShell's Expand-Archive accepts it
const tmpZip = abs.replace(/\.docx$/i, '_tmp.zip')
fs.copyFileSync(abs, tmpZip)
execSync(`powershell -Command "Expand-Archive -Path '${tmpZip}' -DestinationPath '${tmpDir}' -Force"`)
fs.unlinkSync(tmpZip)

const xmlPath = path.join(tmpDir, 'word', 'document.xml')
const xml = fs.readFileSync(xmlPath, 'utf-8')

// Strip XML tags and decode common entities
const text = xml
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

// Cleanup
fs.rmSync(tmpDir, { recursive: true })

console.log('=== FIRST 3000 CHARS ===\n')
console.log(text.slice(0, 3000))
console.log('\n\n=== LAST 1500 CHARS (answer key area) ===\n')
console.log(text.slice(-1500))
