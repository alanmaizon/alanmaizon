import { NextResponse } from "next/server"
import { getListeningClip, isEarConcept } from "@/lib/clips"

export const runtime = "nodejs"

/**
 * GET /api/tools/assessment-listen?concept=rhythm|tonal|coord
 * Returns { clipUrl, prompt, listenFor } for the single-clip "describe what
 * you hear" assessment. `listenFor` is guidance for the voice agent only.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const concept = searchParams.get("concept") ?? ""

  if (!isEarConcept(concept)) {
    return NextResponse.json(
      {
        error: `Invalid or missing 'concept' query parameter '${concept}'. It must be exactly one of: "rhythm", "tonal", or "coord" (lowercase).`,
      },
      { status: 400 },
    )
  }

  return NextResponse.json(getListeningClip(concept))
}
