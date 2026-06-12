"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, Headphones, MicOff, PhoneOff, Radio, Volume2, RotateCcw } from "lucide-react"
import { ConversationProvider, useConversation } from "@elevenlabs/react"
import { useLanguage } from "./language-provider"
import { RetroButton } from "./retro"

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || "https://calendly.com/maizonalan/30min"
const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

type ClipResponse = {
  promptToStudent: string
  clipAUrl: string
  clipBUrl: string
  correctAnswer: string
}

type ClipPanelState = {
  open: boolean
  phase: "playing" | "done"
  sounding: "A" | "B" | null
  progress: number
  urls: { A: string; B: string } | null
}

const CLOSED_PANEL: ClipPanelState = { open: false, phase: "playing", sounding: null, progress: 0, urls: null }

function copy(lang: "en" | "es") {
  const en = {
    start: "Start your intake",
    connecting: "Connecting…",
    live: "Live",
    listening: "Listening",
    speaking: "Mentor is talking",
    end: "End conversation",
    micHint: "We'll ask for microphone access. Headphones recommended.",
    micDenied:
      "We couldn't access your microphone. Allow mic permission in your browser, then try again — or book a free trial below.",
    error: "Something interrupted the voice mentor. Try again, or book a free trial below.",
    dropped: "The connection was lost — this is usually a network hiccup. Start again to pick up where you left off.",
    unavailable: "The voice mentor is warming up. Check back soon!",
    micBlocked: "Mic blocked",
  }
  const es = {
    start: "Comienza tu evaluación",
    connecting: "Conectando…",
    live: "En vivo",
    listening: "Escuchando",
    speaking: "El mentor está hablando",
    end: "Terminar conversación",
    micHint: "Te pediremos acceso al micrófono. Se recomiendan audífonos.",
    micDenied:
      "No pudimos acceder a tu micrófono. Permite el acceso en tu navegador e inténtalo de nuevo, o reserva una clase gratis abajo.",
    error: "Algo interrumpió al mentor de voz. Inténtalo de nuevo o reserva una clase gratis abajo.",
    dropped: "Se perdió la conexión — suele ser un problema de red. Comienza de nuevo para continuar.",
    unavailable: "El mentor de voz se está preparando. ¡Vuelve pronto!",
    micBlocked: "Micrófono bloqueado",
  }
  return lang === "en" ? en : es
}

/** Fetches a clip URL into an object URL so playback starts with no gap. */
async function preloadClip(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`preload failed: ${url}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

function IntakeMentorInner() {
  const { t, lang } = useLanguage()
  const c = copy(lang)
  const clipText = t.intake.clips

  const [micDenied, setMicDenied] = useState(false)
  const [errored, setErrored] = useState(false)
  const [dropped, setDropped] = useState(false)
  const [clipPanel, setClipPanel] = useState<ClipPanelState>(CLOSED_PANEL)

  // A single Audio element is created during the user gesture (start click) so
  // iOS Safari permits playback for both clips later during the session.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Object URLs from the current pair, revoked when a new pair loads / on unmount.
  const objectUrlsRef = useRef<string[]>([])

  const conversation = useConversation({
    onConnect: (props) => {
      console.log("[v0] conversation connected:", JSON.stringify(props))
    },
    onError: (message, context) => {
      console.log("[v0] conversation onError:", message, context ? JSON.stringify(context) : "")
      setErrored(true)
    },
    onDisconnect: (details) => {
      console.log("[v0] conversation onDisconnect, reason:", details?.reason, JSON.stringify(details))
      // Stop any clip audio and clear the panel regardless of why we disconnected.
      if (audioRef.current) audioRef.current.pause()
      setClipPanel(CLOSED_PANEL)
      // "error" = network drop / server-side failure (not user hangup, not agent ending the call).
      if (details?.reason === "error") setDropped(true)
    },
  })
  const { status, isSpeaking, isListening, startSession, endSession } = conversation

  const isActive = status === "connected" || status === "connecting"

  const revokeObjectUrls = useCallback(() => {
    for (const u of objectUrlsRef.current) URL.revokeObjectURL(u)
    objectUrlsRef.current = []
  }, [])

  useEffect(() => revokeObjectUrls, [revokeObjectUrls])

  /**
   * Plays a url through the shared Audio element, resolving when it finishes.
   * Updates the panel's sounding slot and per-clip progress while playing.
   */
  const playToCompletion = useCallback((url: string, slot: "A" | "B") => {
    return new Promise<void>((resolve, reject) => {
      const audio = audioRef.current
      if (!audio) {
        reject(new Error("No audio element"))
        return
      }
      const onTime = () => {
        const ratio = audio.duration > 0 ? audio.currentTime / audio.duration : 0
        setClipPanel((p) => (p.sounding === slot ? { ...p, progress: ratio } : p))
      }
      const cleanup = () => {
        audio.removeEventListener("ended", onEnded)
        audio.removeEventListener("error", onError)
        audio.removeEventListener("timeupdate", onTime)
      }
      const onEnded = () => {
        cleanup()
        setClipPanel((p) => ({ ...p, sounding: null, progress: 0 }))
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error("Audio playback error"))
      }
      audio.addEventListener("ended", onEnded)
      audio.addEventListener("error", onError)
      audio.addEventListener("timeupdate", onTime)
      setClipPanel((p) => ({ ...p, sounding: slot, progress: 0 }))
      audio.src = url
      audio.currentTime = 0
      audio.play().catch((err) => {
        cleanup()
        reject(err)
      })
    })
  }, [])

  /**
   * Client tool the agent calls. Fetches an A/B pair, preloads both files,
   * plays both clips to completion (A, 800ms pause, B), and returns guidance
   * text to the agent. Does NOT resolve until clip B first finishes so the
   * agent won't talk over audio. Afterwards the panel stays open with replay
   * buttons that reuse the preloaded URLs (no extra API calls).
   */
  const playAssessmentPair = useCallback(
    async ({ concept }: { concept: "rhythm" | "tonal" | "coord" }) => {
      try {
        const res = await fetch(`/api/tools/assessment-clip?concept=${encodeURIComponent(concept)}`)
        if (!res.ok) throw new Error(`assessment-clip ${res.status}`)
        const data = (await res.json()) as ClipResponse

        // Preload both files up front so playback starts without a gap.
        revokeObjectUrls()
        const [urlA, urlB] = await Promise.all([preloadClip(data.clipAUrl), preloadClip(data.clipBUrl)])
        objectUrlsRef.current = [urlA, urlB]
        const urls = { A: urlA, B: urlB }

        setClipPanel({ open: true, phase: "playing", sounding: null, progress: 0, urls })
        await playToCompletion(urls.A, "A")
        await new Promise((r) => setTimeout(r, 800))
        await playToCompletion(urls.B, "B")

        setClipPanel({ open: true, phase: "done", sounding: null, progress: 0, urls })

        return `Clips played. The correct answer is clip ${data.correctAnswer}. Ask the student which clip answers: ${data.promptToStudent}. Do not reveal the correct answer.`
      } catch {
        setClipPanel(CLOSED_PANEL)
        revokeObjectUrls()
        return "Clip playback failed — apologize and skip this assessment"
      }
    },
    [playToCompletion, revokeObjectUrls],
  )

  /** Replays one clip from the already-preloaded pair. Never calls the API. */
  const handleReplay = useCallback(
    (slot: "A" | "B") => {
      const urls = clipPanel.urls
      if (!urls || clipPanel.sounding) return
      playToCompletion(urls[slot], slot).catch(() => {
        setClipPanel((p) => ({ ...p, sounding: null, progress: 0 }))
      })
    },
    [clipPanel.urls, clipPanel.sounding, playToCompletion],
  )

  const handleStart = useCallback(async () => {
    setMicDenied(false)
    setErrored(false)
    setDropped(false)

    // Create/reuse the audio element inside the user gesture for iOS Safari.
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = "auto"
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setMicDenied(true)
      return
    }

    try {
      startSession({
        agentId: AGENT_ID as string,
        connectionType: "webrtc",
        clientTools: {
          play_assessment_pair: playAssessmentPair,
        },
      })
    } catch {
      setErrored(true)
    }
  }, [playAssessmentPair, startSession])

  const handleEnd = useCallback(() => {
    endSession()
    setClipPanel(CLOSED_PANEL)
    revokeObjectUrls()
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [endSession, revokeObjectUrls])

  if (!AGENT_ID) {
    return <p className="font-bold text-lg text-foreground/70">{c.unavailable}</p>
  }

  if (micDenied) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-accent-pink">
          <MicOff className="w-7 h-7" aria-hidden="true" />
          <span className="font-bold text-lg">{c.micBlocked}</span>
        </div>
        <p className="font-medium text-foreground/80 max-w-md text-pretty">{c.micDenied}</p>
        <RetroButton onClick={handleStart} variant="primary" className="!py-3 !px-8 !text-lg gap-2">
          <Mic className="w-5 h-5" aria-hidden="true" />
          {c.start}
        </RetroButton>
      </div>
    )
  }

  if (errored || dropped) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="font-medium text-foreground/80 max-w-md text-pretty">{dropped ? c.dropped : c.error}</p>
        <RetroButton onClick={handleStart} variant="primary" className="!py-3 !px-8 !text-lg gap-2">
          <Mic className="w-5 h-5" aria-hidden="true" />
          {c.start}
        </RetroButton>
      </div>
    )
  }

  if (!isActive) {
    return (
      <div className="flex flex-col items-center gap-5">
        <RetroButton onClick={handleStart} variant="primary" className="!py-5 !px-10 !text-2xl gap-3">
          <Mic className="w-7 h-7" aria-hidden="true" />
          {c.start}
        </RetroButton>
        <p className="flex items-center gap-2 font-medium text-foreground/70">
          <Headphones className="w-5 h-5" aria-hidden="true" />
          {c.micHint}
        </p>
      </div>
    )
  }

  // Active session UI
  const mentorTalking = isSpeaking
  const statusLabel = status === "connecting" ? c.connecting : mentorTalking ? c.speaking : c.listening

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-4 border-foreground bg-accent-pink text-background font-bold shadow-[3px_3px_0px_#2A0E45]">
          <Radio className="w-4 h-4 motion-safe:animate-pulse" aria-hidden="true" />
          {c.live}
        </span>
      </div>

      {/* Speaking / listening visualizer */}
      <div className="flex items-end justify-center gap-2 h-20" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`w-3 rounded-full border-2 border-foreground transition-all duration-200 ${
              mentorTalking ? "bg-accent-yellow" : isListening ? "bg-accent-teal" : "bg-muted"
            } ${status !== "connecting" && (mentorTalking || isListening) ? "motion-safe:animate-bounce" : ""}`}
            style={{
              height: mentorTalking || isListening ? `${30 + ((i * 13 + 17) % 45)}px` : "16px",
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>

      <p className="font-bold text-lg text-foreground" aria-live="polite">
        {statusLabel}
      </p>

      {/* Clip player panel */}
      {clipPanel.open && (
        <div className="w-full max-w-md flex flex-col items-center gap-4 px-5 py-4 rounded-2xl border-4 border-foreground bg-muted shadow-[4px_4px_0px_#2A0E45]">
          <p className="font-medium text-sm text-foreground/70 text-pretty text-center" aria-live="polite">
            {clipPanel.phase === "done" ? clipText.done : clipText.listen}
          </p>

          <div className="grid grid-cols-2 gap-3 w-full">
            {(["A", "B"] as const).map((slot) => {
              const active = clipPanel.sounding === slot
              const dimmed = clipPanel.sounding !== null && !active
              const label = slot === "A" ? clipText.clipA : clipText.clipB
              return (
                <div
                  key={slot}
                  className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border-4 border-foreground transition-all duration-200 ${
                    active
                      ? "bg-accent-yellow shadow-[3px_3px_0px_#2A0E45] scale-[1.03]"
                      : dimmed
                        ? "bg-background opacity-50"
                        : "bg-background"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-bold text-foreground">
                    {active && (
                      <Volume2 className="w-4 h-4 motion-safe:animate-pulse text-foreground" aria-hidden="true" />
                    )}
                    {label}
                  </span>

                  {/* Per-clip progress bar */}
                  <div
                    className="w-full h-2 rounded-full border-2 border-foreground bg-background overflow-hidden"
                    role="progressbar"
                    aria-label={label}
                    aria-valuenow={active ? Math.round(clipPanel.progress * 100) : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-accent-pink transition-[width] duration-200"
                      style={{ width: active ? `${Math.round(clipPanel.progress * 100)}%` : "0%" }}
                    />
                  </div>

                  {clipPanel.phase === "done" && (
                    <button
                      type="button"
                      onClick={() => handleReplay(slot)}
                      disabled={clipPanel.sounding !== null}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-foreground bg-accent-teal font-bold text-xs text-foreground shadow-[2px_2px_0px_#2A0E45] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      {clipText.replay}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {clipPanel.sounding && (
            <p className="text-xs font-bold text-foreground/60" aria-live="polite">
              {clipText.nowPlaying}: {clipPanel.sounding === "A" ? clipText.clipA : clipText.clipB}
            </p>
          )}
        </div>
      )}

      <RetroButton onClick={handleEnd} variant="accent" className="!py-3 !px-8 !text-lg gap-2">
        <PhoneOff className="w-5 h-5" aria-hidden="true" />
        {c.end}
      </RetroButton>
    </div>
  )
}

export function IntakeMentor() {
  const { t, lang } = useLanguage()

  return (
    <section id="intake" className="bg-accent-teal py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 border-4 border-foreground rounded-full bg-background shadow-[4px_4px_0px_#FF2E9F] rotate-[2deg]">
          <Mic className="w-6 h-6 text-accent-pink" aria-hidden="true" />
          <span className="font-['Pacifico'] text-xl md:text-2xl text-accent-pink">
            {lang === "en" ? "New!" : "¡Nuevo!"}
          </span>
        </div>

        <h2 className="font-['Shrikhand'] text-4xl md:text-6xl text-background mb-6 text-balance">
          {t.intake.title}
        </h2>

        <p className="font-bold text-2xl md:text-3xl text-foreground mb-6 max-w-2xl mx-auto leading-relaxed text-pretty">
          {t.intake.subtitle}
        </p>

        <p className="font-medium text-xl text-foreground/90 mb-10 max-w-2xl mx-auto leading-relaxed text-pretty">
          {t.intake.desc}
        </p>

        <div className="bg-background border-4 border-foreground rounded-[2rem] p-8 shadow-[8px_8px_0px_#2A0E45] mb-10 min-h-[180px] flex flex-col items-center justify-center gap-4">
          <ConversationProvider>
            <IntakeMentorInner />
          </ConversationProvider>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <span className="font-bold text-xl text-foreground">{t.intake.fallback}</span>
          <RetroButton href={BOOKING_URL} variant="accent" className="!py-3 !px-8 !text-lg">
            {t.hero.bookTrial}
          </RetroButton>
        </div>
      </div>
    </section>
  )
}
