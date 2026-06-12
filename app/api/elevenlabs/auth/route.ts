import { NextResponse } from "next/server"

export const runtime = "nodejs"

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
const API_KEY = process.env.ELEVENLABS_API_KEY

/**
 * GET /api/elevenlabs/auth?transport=webrtc|websocket
 *
 * Exchanges the server-side ElevenLabs API key for short-lived session
 * credentials so the browser never needs the key:
 *   - webrtc    -> { conversationToken }
 *   - websocket -> { signedUrl }
 *
 * If no ELEVENLABS_API_KEY is configured we return { public: true } and the
 * client falls back to connecting with the bare agent ID, which only works
 * for agents with authentication disabled in the ElevenLabs dashboard.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const transport = searchParams.get("transport") === "websocket" ? "websocket" : "webrtc"

  if (!AGENT_ID) {
    return NextResponse.json({ error: "ELEVENLABS_AGENT_ID is not configured." }, { status: 500 })
  }

  if (!API_KEY) {
    return NextResponse.json({ public: true })
  }

  const endpoint =
    transport === "webrtc"
      ? `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(AGENT_ID)}`
      : `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(AGENT_ID)}`

  try {
    const res = await fetch(endpoint, {
      headers: { "xi-api-key": API_KEY },
      cache: "no-store",
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error(`[elevenlabs-auth] ${transport} credential request failed: ${res.status} ${detail}`)
      return NextResponse.json(
        { error: `ElevenLabs rejected the ${transport} credential request (status ${res.status}).` },
        { status: 502 },
      )
    }

    const body = (await res.json()) as { token?: string; signed_url?: string }

    if (transport === "webrtc" && body.token) {
      return NextResponse.json({ conversationToken: body.token })
    }
    if (transport === "websocket" && body.signed_url) {
      return NextResponse.json({ signedUrl: body.signed_url })
    }

    console.error("[elevenlabs-auth] unexpected response shape:", JSON.stringify(body))
    return NextResponse.json({ error: "Unexpected response from ElevenLabs." }, { status: 502 })
  } catch (err) {
    console.error("[elevenlabs-auth] credential request error:", err)
    return NextResponse.json({ error: "Could not reach ElevenLabs." }, { status: 502 })
  }
}
