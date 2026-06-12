import { NextResponse } from "next/server"
import { ScanCommand } from "@aws-sdk/lib-dynamodb"
import { getDocClient, TABLE_NAME } from "@/lib/aws"

export const runtime = "nodejs"

function isAuthorized(request: Request): boolean {
  const secret = process.env.DASHBOARD_SECRET
  if (!secret) return false
  const { searchParams } = new URL(request.url)
  const provided = searchParams.get("secret") ?? request.headers.get("x-dashboard-secret")
  return provided === secret
}

/**
 * GET /api/students?secret=...
 * Scans for PROFILE items, newest first. Dashboard list.
 * (The provisioned table has no GSI; a filtered scan is fine at studio scale.)
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const doc = getDocClient()
    const result = await doc.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :sk",
        ExpressionAttributeValues: { ":sk": "PROFILE" },
      }),
    )

    const items = (result.Items ?? []).sort((a, b) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
    )

    const students = items.map((item) => ({
      studentId: item.studentId,
      language: item.language,
      stage: item.stage,
      earScore: item.earScore,
      earFlag: item.earFlag,
      practiceMins: item.practiceMins,
      practiceDays: item.practiceDays,
      coordinationQuote: item.coordinationQuote,
      createdAt: item.createdAt,
    }))

    return NextResponse.json({ students })
  } catch (err) {
    console.error("[students] DynamoDB error:", err)
    return NextResponse.json({ error: "Failed to load students" }, { status: 500 })
  }
}
