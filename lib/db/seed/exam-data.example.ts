/**
 * EXAMPLE STRUCTURE — do NOT import this file directly.
 *
 * When you extract questions from your PDFs, create one file per exam year
 * following this exact structure, e.g.:
 *   lib/db/seed/data/euee-2005-mathematics.ts
 *
 * Then import those files into lib/db/seed/run.ts
 */

import type { ExamImport } from './types'

export const example: ExamImport = {
  examType: 'euee',
  year: 2005,
  subject: 'mathematics', // must match a slug in subjects.ts
  questions: [
    {
      orderIndex: 1,
      body: 'If f(x) = 2x² − 3x + 1, what is f(2)?',
      explanation:
        'Substitute x = 2: f(2) = 2(4) − 3(2) + 1 = 8 − 6 + 1 = 3.',
      difficulty: 'easy',
      topic: 'Functions', // optional — creates the topic row if new
      options: [
        { label: 'A', body: '1', isCorrect: false },
        { label: 'B', body: '3', isCorrect: true },
        { label: 'C', body: '5', isCorrect: false },
        { label: 'D', body: '7', isCorrect: false },
      ],
    },
    // ... more questions
  ],
}
