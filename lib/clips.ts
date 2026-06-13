import type { EarConcept } from "./types"

interface ClipPair {
  promptToStudent: string
  /** The clip that represents the "correct" answer to the prompt */
  correctClip: string
  otherClip: string
}

/**
 * Static map of ear-assessment clips. Real audio files live in /public/clips/.
 * The map stores which file is conceptually "correct"; the API route decides
 * the A/B presentation order per call.
 */
const CLIP_MAP: Record<EarConcept, ClipPair> = {
  rhythm: {
    promptToStudent: "Which clip kept perfect time — A or B?",
    correctClip: "/clips/steady.mp3",
    otherClip: "/clips/rushing.mp3",
  },
  tonal: {
    promptToStudent: "Which clip felt brighter and happier — A or B?",
    correctClip: "/clips/major.mp3",
    otherClip: "/clips/minor.mp3",
  },
  coord: {
    promptToStudent: "In which clip is someone doing two things at once — A or B?",
    correctClip: "/clips/strum_vocal.mp3",
    otherClip: "/clips/strum_alone.mp3",
  },
}

/** Raw (un-randomized) file mapping for a concept — used by the QA page. */
export function getClipFiles(concept: EarConcept): { correctClip: string; otherClip: string; promptToStudent: string } {
  return CLIP_MAP[concept]
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

/**
 * Single-clip "describe what you hear" assessment. Plays ONE clip and lets the
 * voice mentor ask the student to describe it in their own words, then judge
 * the answer. `listenFor` is guidance for the agent only — never shown to or
 * spoken to the student.
 */
interface ListeningClip {
  clipUrl: string
  prompt: string
  listenFor: string
}

const LISTENING_MAP: Record<EarConcept, ListeningClip> = {
  rhythm: {
    clipUrl: "/clips/steady.mp3",
    prompt: "Describe the timing you hear — does it stay steady, or does it speed up and rush?",
    listenFor:
      "This clip keeps steady, even time. Count it correct if the student describes it as steady, even, in time, on the beat, or not rushing.",
  },
  tonal: {
    clipUrl: "/clips/major.mp3",
    prompt: "Describe the mood of this clip — does it feel bright and happy, or dark and sad?",
    listenFor:
      "This clip is in a major key. Count it correct if the student describes it as bright, happy, cheerful, uplifting, or major.",
  },
  coord: {
    clipUrl: "/clips/strum_vocal.mp3",
    prompt: "Tell me what's happening in this clip — how many things is the musician doing at once?",
    listenFor:
      "In this clip one person strums the guitar AND sings at the same time. Count it correct if the student notices both happening together (playing and singing at once).",
  },
}

export interface ListeningClipResponse {
  clipUrl: string
  prompt: string
  listenFor: string
}

/** Returns the single descriptive clip for a concept. */
export function getListeningClip(concept: EarConcept): ListeningClipResponse {
  return LISTENING_MAP[concept]
}
