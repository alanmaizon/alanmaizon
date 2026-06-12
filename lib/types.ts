export type Language = "en" | "es"

export type Stage = "S" | "L" | "P"

export type History = "none" | "self_taught" | "former_lessons"

export type SkillLevel = "not_yet" | "forming" | "functional"

export type Coordination = "broken" | "emerging" | "working"

export type EarConcept = "rhythm" | "tonal" | "coord"

export interface EarItem {
  concept: EarConcept
  correct: boolean
  createdAt: string
}

export interface IntakeInput {
  studentId: string
  language: Language
  history: History
  hands: SkillLevel
  handsQuote: string
  voice: SkillLevel
  voiceQuote: string
  coordination: Coordination
  coordinationQuote: string
  goalSongs: string[]
  practiceMins: number
  practiceDays: number
  quitReason: string | null
}

export interface StudentProfile extends IntakeInput {
  stage: Stage
  placementRationale: string
  earScore: number
  earFlag: boolean
  createdAt: string
}

export interface PlanWeek {
  week: number
  title: { en: string; es: string }
  focus: { en: string; es: string }
  exercises: { en: string; es: string }[]
  songs?: string[]
  lightVariant?: boolean
  deferredNote?: { en: string; es: string }
}

export interface GeneratedPlan {
  stage: Stage
  weeks: PlanWeek[]
  totalWeeklyMinutes: number
  lightVariant: boolean
}
