import { NextResponse } from "next/server"
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { getDocClient, TABLE_NAME } from "@/lib/aws"
import { placeStudent } from "@/lib/placement"
import type { EarItem, IntakeInput } from "@/lib/types"

export const runtime = "nodejs"

const HISTORY_VALUES = ["none", "self_taught", "former_lessons"] as const
const SKILL_VALUES = ["not_yet", "forming", "functional"] as const
const COORD_VALUES = ["broken", "emerging", "working"] as const
const LANG_VALUES = ["en", "es"] as const

function validate(body: Record<string, unknown>): { ok: true; data: IntakeInput } | { ok: false; error: string } {
  const {
    studentId, language, history, hands, handsQuote, voice, voiceQuote,
    coordination, coordinationQuote, goalSongs, practiceMins, practiceDays, quitReason,
  } = body

  if (typeof studentId !== "string" || studentId.trim().length === 0)
    return { ok: false, error: "Missing or invalid 'studentId'. It must be a non-empty string. Use the same studentId used during the ear assessment." }
  if (typeof language !== "string" || !LANG_VALUES.includes(language as never))
    return { ok: false, error: `Invalid 'language' value '${String(language)}'. It must be exactly "en" or "es".` }
  if (typeof history !== "string" || !HISTORY_VALUES.includes(history as never))
    return { ok: false, error: `Invalid 'history' value '${String(history)}'. It must be one of: "none", "self_taught", "former_lessons".` }
  if (typeof hands !== "string" || !SKILL_VALUES.includes(hands as never))
    return { ok: false, error: `Invalid 'hands' value '${String(hands)}'. It must be one of: "not_yet", "forming", "functional".` }
  if (typeof handsQuote !== "string" || handsQuote.trim().length === 0)
    return { ok: false, error: "Missing 'handsQuote'. Send the student's own words (verbatim quote) describing how their hands/playing feels." }
  if (typeof voice !== "string" || !SKILL_VALUES.includes(voice as never))
    return { ok: false, error: `Invalid 'voice' value '${String(voice)}'. It must be one of: "not_yet", "forming", "functional".` }
  if (typeof voiceQuote !== "string" || voiceQuote.trim().length === 0)
    return { ok: false, error: "Missing 'voiceQuote'. Send the student's own words (verbatim quote) describing how their singing feels." }
  if (typeof coordination !== "string" || !COORD_VALUES.includes(coordination as never))
    return { ok: false, error: `Invalid 'coordination' value '${String(coordination)}'. It must be one of: "broken", "emerging", "working".` }
  if (typeof coordinationQuote !== "string" || coordinationQuote.trim().length === 0)
    return { ok: false, error: "Missing 'coordinationQuote'. Send the student's own words (verbatim quote) about what happens when they try to play and sing at the same time." }
  if (!Array.isArray(goalSongs) || goalSongs.some((s) => typeof s !== "string"))
    return { ok: false, error: "Invalid 'goalSongs'. It must be an array of strings (song titles), with at most 3 entries." }
  if (goalSongs.length > 3)
    return { ok: false, error: `'goalSongs' has ${goalSongs.length} entries but the maximum is 3. Ask the student to pick their top 3 and resend.` }
  if (typeof practiceMins !== "number" || !Number.isFinite(practiceMins) || practiceMins <= 0)
    return { ok: false, error: `Invalid 'practiceMins' value '${String(practiceMins)}'. It must be a positive number of minutes per practice session (e.g. 20).` }
  if (typeof practiceDays !== "number" || !Number.isFinite(practiceDays) || practiceDays <= 0 || practiceDays > 7)
    return { ok: false, error: `Invalid 'practiceDays' value '${String(practiceDays)}'. It must be a number between 1 and 7 (days per week).` }
  if (quitReason !== null && quitReason !== undefined && typeof quitReason !== "string")
    return { ok: false, error: "Invalid 'quitReason'. It must be a string describing why they quit before, or null if they never quit." }

  return {
    ok: true,
    data: {
      studentId: studentId.trim(),
      language: language as IntakeInput["language"],
      history: history as IntakeInput["history"],
      hands: hands as IntakeInput["hands"],
      handsQuote: handsQuote.trim(),
      voice: voice as IntakeInput["voice"],
      voiceQuote: voiceQuote.trim(),
      coordination: coordination as IntakeInput["coordination"],
      coordinationQuote: coordinationQuote.trim(),
      goalSongs: (goalSongs as string[]).map((s) => s.trim()).filter(Boolean),
      practiceMins,
      practiceDays,
      quitReason: typeof quitReason === "string" && quitReason.trim().length > 0 ? quitReason.trim() : null,
    },
  }
}

/**
 * POST /api/tools/save-intake
 * Saves the full intake profile, runs deterministic placement against the
 * student's EAR# items, and returns the plan URL.
 */
export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON. Resend the full intake object." },
      { status: 400 },
    )
  }

  const result = validate((raw ?? {}) as Record<string, unknown>)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  const intake = result.data

  try {
    const doc = getDocClient()

    // Read this student's EAR# items
    const earQuery = await doc.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `STUDENT#${intake.studentId}`,
          ":sk": "EAR#",
        },
      }),
    )

    const earItems: EarItem[] = (earQuery.Items ?? []).map((item) => ({
      concept: item.concept,
      correct: Boolean(item.correct),
      createdAt: item.createdAt,
    }))

    const placement = placeStudent({
      hands: intake.hands,
      voice: intake.voice,
      coordination: intake.coordination,
      earItems,
    })

    const createdAt = new Date().toISOString()

    await doc.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `STUDENT#${intake.studentId}`,
          SK: "PROFILE",
          ...intake,
          stage: placement.stage,
          placementRationale: placement.rationale,
          earScore: placement.earScore,
          earFlag: placement.earFlag,
          createdAt,
          GSI1PK: "INTAKE",
          GSI1SK: createdAt,
        },
      }),
    )

    return NextResponse.json({
      studentId: intake.studentId,
      stage: placement.stage,
      planUrl: `/plan/${intake.studentId}`,
    })
  } catch (err) {
    console.error("[save-intake] DynamoDB error:", err)
    return NextResponse.json(
      { error: "Internal error saving the intake. Retry once; if it fails again, apologize to the student and ask them to book a free trial instead." },
      { status: 500 },
    )
  }
}
