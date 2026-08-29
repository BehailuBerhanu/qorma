/**
 * Preview raw text from a docx file to understand the format.
 * Usage: npx tsx scripts/preview-docx.ts "EUEE/Maths/2005 Mathematics @EUEE_bot.docx"
 */
import mammoth from 'mammoth'
import path from 'path'

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npx tsx scripts/preview-docx.ts <path-to-docx>')
    process.exit(1)
  }

  const abs = path.resolve(process.cwd(), filePath)
  const result = await mammoth.extractRawText({ path: abs })

  // Print first 3000 chars to see question format
  console.log('=== FIRST 3000 CHARS ===\n')
  console.log(result.value.slice(0, 3000))

  // Print last 1000 chars to see answer key format
  console.log('\n\n=== LAST 1000 CHARS (answer key area) ===\n')
  console.log(result.value.slice(-1000))
}

main().catch(console.error)
