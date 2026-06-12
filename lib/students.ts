import { QueryCommand } from "@aws-sdk/lib-dynamodb"
import { getDocClient, TABLE_NAME } from "./aws"
import { generatePlan } from "./curricula"
import type { EarItem, GeneratedPlan, StudentProfile } from "./types"

export interface StudentData {
  profile: StudentProfile
  earItems: EarItem[]
  plan: GeneratedPlan
}

/** Fetch PROFILE + EAR items for a student and generate their plan. */
export async function getStudentData(studentId: string): Promise<StudentData | null> {
  const doc = getDocClient()
  const result = await doc.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": `STUDENT#${studentId}` },
    }),
  )

  const items = result.Items ?? []
  const profileItem = items.find((i) => i.SK === "PROFILE")
  if (!profileItem) return null

  const profile = profileItem as unknown as StudentProfile
  const earItems: EarItem[] = items
    .filter((i) => typeof i.SK === "string" && i.SK.startsWith("EAR#"))
    .map((i) => ({ concept: i.concept, correct: Boolean(i.correct), createdAt: i.createdAt }))

  const plan = generatePlan({
    stage: profile.stage,
    goalSongs: profile.goalSongs ?? [],
    practiceMins: profile.practiceMins,
    practiceDays: profile.practiceDays,
    quitReason: profile.quitReason ?? null,
  })

  return { profile, earItems, plan }
}
