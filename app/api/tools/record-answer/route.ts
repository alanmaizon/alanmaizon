import { NextResponse } from "next/server"
import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { getDocClient, TABLE_NAME } from "@/lib/aws"
import { isEarConcept } from "@/lib/clips"

export const runtime = "nodejs"

/**
 * POST /api/tools/record-answer
 * body: { studentId, concept: "rhythm"|"tonal"|"coord", correct: boolean }
 * Called by the ElevenLabs voice agent during the ear assessment.
 * Error messages are written so the voice agent can read them and self-correct.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON with fields: studentId (string), concept (one of rhythm, tonal, coord), correct (boolean)." },
      { status: 400 },
    )
  }

  const { studentId, concept, correct } = (body ?? {}) as Record<string, unknown>

  if (typeof studentId !== "string" || studentId.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'studentId'. It must be a non-empty string identifying the student. Send the same studentId you used for the rest of this intake." },
      { status: 400 },
    )
  }

  if (typeof concept !== "string" || !isEarConcept(concept)) {
    return NextResponse.json(
      { error: `Invalid 'concept' value '${String(concept)}'. It must be exactly one of: "rhythm", "tonal", or "coord" (lowercase).` },
      { status: 400 },
    )
  }

  if (typeof correct !== "boolean") {
    return NextResponse.json(
      { error: `Invalid 'correct' value '${String(correct)}'. It must be a boolean: true if the student answered the clip question correctly, false otherwise. Do not send a string.` },
      { status: 400 },
    )
  }

  try {
    const doc = getDocClient()
    await doc.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `STUDENT#${studentId.trim()}`,
          SK: `EAR#${concept}`,
          concept,
          correct,
          createdAt: new Date().toISOString(),
        },
      }),
    )

    return NextResponse.json({ ok: true, studentId: studentId.trim(), concept, correct })
  } catch (err) {
    console.error("[record-answer] DynamoDB error:", err)
    return NextResponse.json(
      { error: "Internal error saving the answer. Please retry once; if it fails again, continue the intake and mention the ear check could not be saved." },
      { status: 500 },
    )
  }
}
