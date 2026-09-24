import { NextResponse } from "next/server"
import { requireWorkerToken } from "@/lib/trellis/config"
import { claimNextJob } from "@/lib/trellis/store"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!requireWorkerToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { workerId?: string }
  const workerId = body.workerId || "trellis-worker"
  const job = await claimNextJob(workerId)

  return NextResponse.json({ job })
}
