/**
 * Quick inspect of a docx using the same extractor as import-euee.mjs
 * Usage: node scripts/check-subject.mjs "EUEE/chemistry/2005 Chemistry @EUEE_bot.docx"
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

function readZipEntry(zipBuffer, targetPath) {
  let eocdOffset = -1
  for (let i = zipBuffer.length - 22; i >= 0; i--) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) { eocdOffset = i; break }
  }
  if (eocdOffset === -1) throw new Error('Not a valid ZIP file')
  const centralDirOffset = zipBuffer.readUInt32LE(eocdOffset + 16)
  const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10)
  let pos = centralDirOffset
  for (let i = 0; i < totalEntries; i++) {
    if (zipBuffer.readUInt32LE(pos) !== 0x02014b50) break
    const compression = zipBuffer.readUInt16LE(pos + 10)
    const compressedSize = zipBuffer.readUInt32LE(pos + 20)
    const fileNameLen = zipBuffer.readUInt16LE(pos + 28)
    const extraLen = zipBuffer.readUInt16LE(pos + 30)
    const commentLen = zipBuffer.readUInt16LE(pos + 32)
    const localHeaderOffset = zipBuffer.readUInt32LE(pos + 42)
    const fileName = zipBuffer.slice(pos + 46, pos + 46 + fileNameLen).toString('utf8')
    pos += 46 + fileNameLen + extraLen + commentLen
    if (fileName === targetPath) {
      const localFileNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26)
      const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28)
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen
      const compressedData = zipBuffer.slice(dataStart, dataStart + compressedSize)
      if (compression === 0) return compressedData
      if (compression === 8) return zlib.inflateRawSync(compressedData)
      throw new Error(`Unsupported compression: ${compression}`)
    }
  }
  throw new Error(`Entry not found: ${targetPath}`)
}

const filePath = process.argv[2]
const abs = path.resolve(process.cwd(), filePath)
const buf = fs.readFileSync(abs)
const xmlBuf = readZipEntry(buf, 'word/document.xml')
const xml = xmlBuf.toString('utf8')
const text = xml
  .replace(/<w:br[^/]*/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\n{3,}/g, '\n\n').trim()

console.log('=== FIRST 2000 CHARS ===\n')
console.log(text.slice(0, 2000))
console.log('\n=== LAST 800 CHARS ===\n')
console.log(text.slice(-800))
