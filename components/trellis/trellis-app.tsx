"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { Box, Download, ImageUp, Play, RefreshCw, ShieldCheck, Timer } from "lucide-react"
import { GlbPreview } from "@/components/trellis/glb-preview"
import type { PublicTrellisJob } from "@/lib/trellis/types"

async function fetchJob(jobId: string) {
  const res = await fetch(`/api/trellis/jobs/${jobId}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Could not load job status")
  return ((await res.json()) as { job: PublicTrellisJob }).job
}

export function TrellisApp() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [referenceName, setReferenceName] = useState("")
  const [dimensions, setDimensions] = useState("")
  const [job, setJob] = useState<PublicTrellisJob | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRunning = job && !["succeeded", "failed"].includes(job.status)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!job?.jobId || !isRunning) return
    const interval = window.setInterval(async () => {
      try {
        setJob(await fetchJob(job.jobId))
      } catch (err) {
        console.error(err)
      }
    }, 2500)
    return () => window.clearInterval(interval)
  }, [job?.jobId, isRunning])

  const benchmark = useMemo(() => {
    const parsed = dimensions
      .split(/[x,]/i)
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0)

    return {
      referenceName: referenceName || file?.name,
      knownDimensionsMm:
        parsed.length > 0
          ? {
              width: parsed[0],
              height: parsed[1],
              depth: parsed[2],
            }
          : undefined,
    }
  }, [dimensions, file?.name, referenceName])

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
    setJob(null)
    setError(null)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) return

    setSubmitting(true)
    setError(null)
    try {
      const form = new FormData()
      form.set("image", file)
      form.set("prompt", prompt)
      form.set("benchmark", JSON.stringify(benchmark))

      const res = await fetch("/api/trellis/jobs", { method: "POST", body: form })
      const body = (await res.json()) as { job?: PublicTrellisJob; error?: string }
      if (!res.ok || !body.job) throw new Error(body.error || "Could not create job")
      setJob(body.job)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create job")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0d0f12] text-zinc-100">
      <header className="border-b border-zinc-800 bg-[#12151a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <Box className="h-8 w-8 text-cyan-300" aria-hidden="true" />
              <h1 className="text-2xl font-semibold tracking-normal text-white">TRELLIS Image-to-3D Lab</h1>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Upload a reference image, queue a GPU job, and inspect the generated GLB in the browser.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              outbound worker
            </span>
            <span className="inline-flex items-center gap-2 border border-zinc-700 px-3 py-2">
              <Timer className="h-4 w-4 text-amber-300" aria-hidden="true" />
              benchmark metadata
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <section className="space-y-4">
          <form onSubmit={onSubmit} className="border border-zinc-800 bg-[#151920] p-4">
            <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 border border-dashed border-zinc-700 bg-[#101318] p-5 text-center hover:border-cyan-400">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Upload preview" className="max-h-48 max-w-full object-contain" />
              ) : (
                <>
                  <ImageUp className="h-10 w-10 text-cyan-300" aria-hidden="true" />
                  <span className="text-sm text-zinc-300">Choose a PNG, JPEG, or WebP reference image</span>
                </>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} className="sr-only" />
            </label>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-zinc-300">
                Prompt
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={3}
                  className="mt-2 w-full border border-zinc-700 bg-[#0d0f12] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  placeholder="Optional: single object, clean background, preserve proportions"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-300">
                Benchmark reference
                <input
                  value={referenceName}
                  onChange={(event) => setReferenceName(event.target.value)}
                  className="mt-2 w-full border border-zinc-700 bg-[#0d0f12] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  placeholder="Blender stool v1"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-300">
                Known dimensions in mm
                <input
                  value={dimensions}
                  onChange={(event) => setDimensions(event.target.value)}
                  className="mt-2 w-full border border-zinc-700 bg-[#0d0f12] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  placeholder="800 x 400 x 1000"
                />
              </label>
            </div>

            {error ? <p className="mt-4 border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p> : null}

            <button
              type="submit"
              disabled={!file || submitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-cyan-300 px-4 py-3 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              Create generation job
            </button>
          </form>

          <section className="border border-zinc-800 bg-[#151920] p-4">
            <h2 className="text-base font-semibold text-white">Job status</h2>
            {job ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-zinc-400">Job</span>
                  <code className="truncate text-xs text-zinc-300">{job.jobId}</code>
                </div>
                <div className="h-2 bg-zinc-800">
                  <div className="h-full bg-cyan-300 transition-all" style={{ width: `${job.progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{job.status}</span>
                  <span className="text-zinc-400">{job.progress}%</span>
                </div>
                <p className="text-sm text-zinc-400">{job.progressMessage}</p>
                {job.inferenceSeconds ? <p className="text-sm text-zinc-400">Generation time: {job.inferenceSeconds.toFixed(1)}s</p> : null}
                {job.glbBytes ? <p className="text-sm text-zinc-400">GLB size: {(job.glbBytes / 1024 / 1024).toFixed(2)} MB</p> : null}
                {job.error ? <p className="text-sm text-red-200">{job.error}</p> : null}
                {job.downloadUrl ? (
                  <a
                    href={job.downloadUrl}
                    className="inline-flex w-full items-center justify-center gap-2 border border-cyan-300 px-4 py-3 font-semibold text-cyan-100 hover:bg-cyan-300 hover:text-zinc-950"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download GLB
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-zinc-400">No job yet. Upload a Blender render or product image to begin.</p>
            )}
          </section>
        </section>

        <section className="min-h-[520px]">
          <GlbPreview url={job?.artifactUrl} />
        </section>
      </div>
    </main>
  )
}
