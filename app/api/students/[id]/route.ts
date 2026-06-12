import { NextResponse } from "next/server"
import { getStudentData } from "@/lib/students"

export const runtime = "nodejs"

function isAuthorized(request: Request): boolean {
  const secret = process.env.DASHBOARD_SECRET
  if (!secret) return false
  const { searchParams } = new URL(request.url)
  const provided = searchParams.get("secret") ?? request.headers.get("x-dashboard-secret")
  return provided === secret
}

/**
 * GET /api/students/[id]?secret=...
 * Returns PROFILE + EAR items + the generated plan object.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await getStudentData(id)
    if (!data) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("[students/:id] DynamoDB error:", err)
    return NextResponse.json({ error: "Failed to load student" }, { status: 500 })
  }
}
