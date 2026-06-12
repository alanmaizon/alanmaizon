import { NextResponse } from "next/server"
import { getAssessmentClip, isEarConcept } from "@/lib/clips"

export const runtime = "nodejs"

/**
 * GET /api/tools/assessment-clip?concept=rhythm|tonal|coord
 * Returns { promptToStudent, clipAUrl, clipBUrl, correctAnswer } with
 * A/B order randomized per call.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const concept = searchParams.get("concept") ?? ""

  if (!isEarConcept(concept)) {
    return NextResponse.json(
      { error: `Invalid or missing 'concept' query parameter '${concept}'. It must be exactly one of: "rhythm", "tonal", or "coord" (lowercase).` },
      { status: 400 },
    )
  }

  return NextResponse.json(getAssessmentClip(concept))
}
