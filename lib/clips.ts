import type { EarConcept } from "./types"

export function isEarConcept(value: string): value is EarConcept {
  return value === "rhythm" || value === "tonal" || value === "coord"
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
