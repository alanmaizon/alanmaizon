/**
 * Helpers for tolerating the way ElevenLabs voice agents serialize webhook
 * tool parameters. The LLM frequently emits numbers and booleans as strings
 * (e.g. "20", "true"), so the tool routes coerce these rather than rejecting
 * otherwise-valid intake data.
 */

/** Coerces a number or numeric string to a number; returns null otherwise. */
export function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed === "") return null
    const n = Number(trimmed)
    if (Number.isFinite(n)) return n
  }
  return null
}

/**
 * Coerces a boolean or common string/number representation to a boolean.
 * Accepts true/false, "true"/"false", "yes"/"no", "1"/"0", 1/0 (case-
 * insensitive). Returns null for anything unrecognized.
 */
export function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value
  if (typeof value === "number") {
    if (value === 1) return true
    if (value === 0) return false
    return null
  }
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    if (["true", "yes", "y", "1"].includes(v)) return true
    if (["false", "no", "n", "0"].includes(v)) return false
  }
  return null
}

/**
 * Coerces a list of strings. Accepts a real array, or a single string that may
 * be comma- or newline-separated. Returns null if the value is neither.
 */
export function coerceStringArray(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    if (value.some((s) => typeof s !== "string")) return null
    return value as string[]
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return null
}
