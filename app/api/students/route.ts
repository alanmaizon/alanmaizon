import { NextResponse } from "next/server"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"
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
 * GSI1 query (GSI1PK = "INTAKE"), newest first. Dashboard list.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const doc = getDocClient()
    const result = await doc.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": "INTAKE" },
        ScanIndexForward: false, // newest first
      }),
    )

    const students = (result.Items ?? []).map((item) => ({
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
