import { NextResponse } from "next/server"
import { getArtifactUrl, getTrellisJob } from "@/lib/trellis/store"

export const runtime = "nodejs"

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const job = await getTrellisJob(jobId)

  if (!job || job.status !== "succeeded") {
    return NextResponse.json({ error: "GLB is not ready." }, { status: 404 })
  }

  return NextResponse.redirect(await getArtifactUrl(job))
}
