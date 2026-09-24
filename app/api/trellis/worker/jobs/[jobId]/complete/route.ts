import { NextResponse } from "next/server"
import { requireWorkerToken } from "@/lib/trellis/config"
import { completeJob } from "@/lib/trellis/store"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  if (!requireWorkerToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { jobId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    receiptHandle?: string
    inferenceSeconds?: number
    glbBytes?: number
  }

  await completeJob({
    jobId,
    receiptHandle: body.receiptHandle,
    ok: body.ok !== false,
    error: body.error,
    inferenceSeconds: body.inferenceSeconds,
    glbBytes: body.glbBytes,
  })

  return NextResponse.json({ ok: true })
}
