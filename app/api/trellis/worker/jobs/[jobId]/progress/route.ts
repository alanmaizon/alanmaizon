import { NextResponse } from "next/server"
import { requireWorkerToken } from "@/lib/trellis/config"
import { updateJobProgress } from "@/lib/trellis/store"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  if (!requireWorkerToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { jobId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    progress?: number
    message?: string
    workerId?: string
  }

  await updateJobProgress({
    jobId,
    status: "running",
    progress: Math.max(0, Math.min(99, Number(body.progress ?? 10))),
    message: body.message || "TRELLIS generation running",
    workerId: body.workerId,
  })

  return NextResponse.json({ ok: true })
}
