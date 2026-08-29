export type OptionImport = {
  label: 'A' | 'B' | 'C' | 'D' | 'E'
  body: string
  isCorrect: boolean
}

export type QuestionImport = {
  orderIndex: number
  body: string
  /** Explanation sourced from the answer key — leave undefined if not in PDF */
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  /** Optional topic label — will be created/reused automatically */
  topic?: string
  options: OptionImport[]
}

export type ExamImport = {
  examType: 'euee'
  year: number
  /** Must match a slug defined in subjects.ts */
  subject: 'mathematics' | 'physics' | 'chemistry' | 'biology' | 'english'
  questions: QuestionImport[]
}
