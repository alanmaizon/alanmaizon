import type { EarConcept } from "./types"

interface ClipPair {
  promptToStudent: string
  /** The clip that represents the "correct" answer to the prompt */
  correctClip: string
  otherClip: string
}

/**
 * Static map of ear-assessment clips.
 * Audio files live in /public/clips/ — placeholder filenames,
 * Alan will supply the real audio.
 */
const CLIP_MAP: Record<EarConcept, ClipPair> = {
  rhythm: {
    promptToStudent:
      "You'll hear two short strumming clips. One keeps a steady beat, one rushes ahead. Which one is steady — A or B?",
    correctClip: "/clips/steady.mp3",
    otherClip: "/clips/rushing.mp3",
  },
  tonal: {
    promptToStudent:
      "You'll hear two short melodies. One sounds bright (major), one sounds darker (minor). Which one is the bright, major one — A or B?",
    correctClip: "/clips/major.mp3",
    otherClip: "/clips/minor.mp3",
  },
  coord: {
    promptToStudent:
      "You'll hear two short clips. In one, the strumming and the voice lock together. In the other it's strumming alone. Which one has voice and guitar together — A or B?",
    correctClip: "/clips/strum_vocal.mp3",
    otherClip: "/clips/strum_alone.mp3",
  },
}

export interface AssessmentClip {
  promptToStudent: string
  clipAUrl: string
  clipBUrl: string
  correctAnswer: "A" | "B"
}

export function isEarConcept(value: string): value is EarConcept {
  return value === "rhythm" || value === "tonal" || value === "coord"
}

/** Returns the clip pair for a concept with A/B order randomized per call. */
export function getAssessmentClip(concept: EarConcept): AssessmentClip {
  const pair = CLIP_MAP[concept]
  const correctIsA = Math.random() < 0.5

  return {
    promptToStudent: pair.promptToStudent,
    clipAUrl: correctIsA ? pair.correctClip : pair.otherClip,
    clipBUrl: correctIsA ? pair.otherClip : pair.correctClip,
    correctAnswer: correctIsA ? "A" : "B",
  }
}
