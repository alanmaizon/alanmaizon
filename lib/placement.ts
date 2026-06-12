import type { Coordination, EarItem, SkillLevel, Stage } from "./types"

export interface PlacementInput {
  hands: SkillLevel
  voice: SkillLevel
  coordination: Coordination
  earItems: EarItem[]
}

export interface PlacementResult {
  stage: Stage
  earScore: number
  earFlag: boolean
  rationale: string
}

/**
 * Pure deterministic placement logic.
 *
 * Rules (first match wins for stage):
 *  1. hands=="not_yet" || voice=="not_yet"        -> "S"
 *  2. coordination=="broken"                       -> "L"
 *  3. coordination=="emerging" -> "L" if earRhythm==0 else "P"
 *  4. coordination=="working"                      -> "P"
 */
export function placeStudent(input: PlacementInput): PlacementResult {
  const { hands, voice, coordination, earItems } = input

  const earScore = earItems.filter((i) => i.correct).length
  const earRhythm = earItems.some((i) => i.concept === "rhythm" && i.correct) ? 1 : 0
  const earTonal = earItems.some((i) => i.concept === "tonal" && i.correct) ? 1 : 0

  let stage: Stage
  let rationale: string

  if (hands === "not_yet" || voice === "not_yet") {
    stage = "S"
    rationale = `Rule 1: ${hands === "not_yet" ? "hands" : "voice"} not yet functional alone -> Stage S (Separate)`
  } else if (coordination === "broken") {
    stage = "L"
    rationale = "Rule 2: coordination is broken when combining -> Stage L (Layer)"
  } else if (coordination === "emerging") {
    if (earRhythm === 0) {
      stage = "L"
      rationale =
        "Rule 3: coordination emerging but rhythm ear assessment missed -> Stage L (Layer)"
    } else {
      stage = "P"
      rationale =
        "Rule 3: coordination emerging with rhythm ear assessment passed -> Stage P (Perform)"
    }
  } else {
    stage = "P"
    rationale = "Rule 4: coordination working -> Stage P (Perform)"
  }

  const earFlag =
    (stage === "P" && earScore <= 1) ||
    (hands === "functional" && earRhythm === 0) ||
    (voice === "functional" && earTonal === 0)

  return { stage, earScore, earFlag, rationale }
}
