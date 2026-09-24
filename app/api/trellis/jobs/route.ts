import { NextResponse } from "next/server"
import { createTrellisJob } from "@/lib/trellis/store"
import { TRELLIS_MAX_UPLOAD_BYTES } from "@/lib/trellis/config"
import type { TrellisBenchmarkMetadata } from "@/lib/trellis/types"

export const runtime = "nodejs"

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

function parseBenchmark(value: FormDataEntryValue | null): TrellisBenchmarkMetadata | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined
  const parsed = JSON.parse(value) as TrellisBenchmarkMetadata
  return parsed
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get("image")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload an image file." }, { status: 400 })
    }

    if (!IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Use a PNG, JPEG, or WebP image." }, { status: 400 })
    }

    if (file.size > TRELLIS_MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `Image is too large. Limit is ${TRELLIS_MAX_UPLOAD_BYTES} bytes.` }, { status: 400 })
    }

    const prompt = typeof form.get("prompt") === "string" ? String(form.get("prompt")).trim() : undefined
    const benchmark = parseBenchmark(form.get("benchmark"))
    const bytes = Buffer.from(await file.arrayBuffer())

    const job = await createTrellisJob({
      image: bytes,
      filename: file.name || "reference.png",
      contentType: file.type,
      prompt: prompt || undefined,
      benchmark,
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (err) {
    console.error("[trellis jobs] create error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not create TRELLIS job." }, { status: 500 })
  }
}
