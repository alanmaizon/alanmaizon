import { NextResponse } from "next/server"
import { getTrellisJob, publicJob } from "@/lib/trellis/store"

export const runtime = "nodejs"

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const job = await getTrellisJob(jobId)

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 })
  }

  return NextResponse.json({ job: publicJob(job) })
}
