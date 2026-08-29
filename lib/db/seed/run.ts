/**
 * Qorma database seeder
 *
 * Usage:
 *   pnpm tsx lib/db/seed/run.ts
 *
 * This script:
 *   1. Seeds subjects (idempotent — skips if already exist)
 *   2. Imports each ExamImport file you add to the `imports` array below
 *
 * To add a new exam:
 *   1. Create lib/db/seed/data/euee-YEAR-SUBJECT.ts following the ExamImport type
 *   2. Import it here and add it to the `imports` array
 */

import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../schema'
import { eq, and } from 'drizzle-orm'
import { SUBJECTS } from './subjects'
import type { ExamImport } from './types'

// ─── Add your exam data imports here ────────────────────────────────────────
// import { euee2005Mathematics } from './data/euee-2005-mathematics'
// import { euee2005Physics } from './data/euee-2005-physics'
// ... add more as you extract PDFs
const imports: ExamImport[] = [
  // euee2005Mathematics,
  // euee2005Physics,
]
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool, { schema })

  console.log('🌱  Starting Qorma seed...\n')

  // ── 1. Seed subjects ──────────────────────────────────────────────────────
  console.log('  Seeding subjects...')
  for (const s of SUBJECTS) {
    const existing = await db
      .select()
      .from(schema.subject)
      .where(eq(schema.subject.slug, s.slug))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(schema.subject).values(s)
      console.log(`    ✓ Created subject: ${s.name}`)
    } else {
      console.log(`    – Skipped subject (exists): ${s.name}`)
    }
  }
  console.log()

  // ── 2. Import each exam file ──────────────────────────────────────────────
  for (const examData of imports) {
    console.log(`  Importing EUEE ${examData.year} – ${examData.subject}...`)

    // Resolve subject
    const [subjectRow] = await db
      .select()
      .from(schema.subject)
      .where(eq(schema.subject.slug, examData.subject))
      .limit(1)

    if (!subjectRow) {
      console.error(`    ✗ Subject not found: ${examData.subject}`)
      continue
    }

    // Upsert exam row
    const examLabel = `EUEE ${examData.year}`
    let [examRow] = await db
      .select()
      .from(schema.exam)
      .where(and(eq(schema.exam.year, examData.year), eq(schema.exam.examType, examData.examType)))
      .limit(1)

    if (!examRow) {
      const [inserted] = await db
        .insert(schema.exam)
        .values({
          examType: examData.examType,
          year: examData.year,
          label: examLabel,
        })
        .returning()
      examRow = inserted
      console.log(`    ✓ Created exam: ${examLabel}`)
    } else {
      console.log(`    – Reusing exam: ${examLabel} (id ${examRow.id})`)
    }

    // Topic cache (name → id) within this import run
    const topicCache = new Map<string, number>()

    let questionCount = 0
    let skippedCount = 0

    for (const q of examData.questions) {
      // Check for duplicate (same exam, subject, orderIndex)
      const [dupe] = await db
        .select()
        .from(schema.question)
        .where(
          and(
            eq(schema.question.examId, examRow.id),
            eq(schema.question.subjectId, subjectRow.id),
            eq(schema.question.orderIndex, q.orderIndex)
          )
        )
        .limit(1)

      if (dupe) {
        skippedCount++
        continue
      }

      // Resolve topic
      let topicId: number | undefined
      if (q.topic) {
        if (topicCache.has(q.topic)) {
          topicId = topicCache.get(q.topic)
        } else {
          // Find or create topic
          const topicSlug = q.topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          let [topicRow] = await db
            .select()
            .from(schema.topic)
            .where(
              and(
                eq(schema.topic.subjectId, subjectRow.id),
                eq(schema.topic.slug, topicSlug)
              )
            )
            .limit(1)

          if (!topicRow) {
            const [inserted] = await db
              .insert(schema.topic)
              .values({ subjectId: subjectRow.id, name: q.topic, slug: topicSlug })
              .returning()
            topicRow = inserted
          }

          topicId = topicRow.id
          topicCache.set(q.topic, topicId)
        }
      }

      // Insert question
      const [questionRow] = await db
        .insert(schema.question)
        .values({
          examId: examRow.id,
          subjectId: subjectRow.id,
          topicId: topicId ?? null,
          orderIndex: q.orderIndex,
          body: q.body,
          explanation: q.explanation ?? null,
          difficulty: q.difficulty ?? null,
        })
        .returning()

      // Insert options
      for (const opt of q.options) {
        await db.insert(schema.option).values({
          questionId: questionRow.id,
          label: opt.label,
          body: opt.body,
          isCorrect: opt.isCorrect,
        })
      }

      questionCount++
    }

    console.log(
      `    ✓ Inserted ${questionCount} questions` +
        (skippedCount > 0 ? ` (${skippedCount} skipped — already exist)` : '')
    )
  }

  await pool.end()
  console.log('\n✅  Seed complete.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
