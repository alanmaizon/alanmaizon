"use client"

import { useCallback, useRef, useState } from "react"
import { Mic, Headphones, MicOff, PhoneOff, Radio, Volume2 } from "lucide-react"
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
  label: string
  sounding: "A" | "B" | null
}

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
    unavailable: "The voice mentor is warming up. Check back soon!",
    clipA: "Clip A",
    clipB: "Clip B",
    nowPlaying: "Now playing",
    listenPanel: "Listen to both clips, then tell the mentor your answer.",
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
    unavailable: "El mentor de voz se está preparando. ¡Vuelve pronto!",
    clipA: "Clip A",
    clipB: "Clip B",
    nowPlaying: "Reproduciendo",
    listenPanel: "Escucha ambos clips y luego dile tu respuesta al mentor.",
  }
  return lang === "en" ? en : es
}

function IntakeMentorInner() {
  const { lang } = useLanguage()
  const c = copy(lang)

  const [micDenied, setMicDenied] = useState(false)
  const [errored, setErrored] = useState(false)

  const conversation = useConversation({
    onError: () => setErrored(true),
  })
  const { status, isSpeaking, isListening, startSession, endSession } = conversation
  const [clipPanel, setClipPanel] = useState<ClipPanelState>({ open: false, label: "", sounding: null })

  // A single Audio element is created during the user gesture (start click) so
  // iOS Safari permits playback for both clips later during the session.
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isActive = status === "connected" || status === "connecting"

  /** Plays a url through the shared Audio element, resolving when it finishes. */
  const playToCompletion = useCallback((url: string) => {
    return new Promise<void>((resolve, reject) => {
      const audio = audioRef.current
      if (!audio) {
        reject(new Error("No audio element"))
        return
      }
      const cleanup = () => {
        audio.removeEventListener("ended", onEnded)
        audio.removeEventListener("error", onError)
      }
      const onEnded = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error("Audio playback error"))
      }
      audio.addEventListener("ended", onEnded)
      audio.addEventListener("error", onError)
      audio.src = url
      audio.currentTime = 0
      audio.play().catch((err) => {
        cleanup()
        reject(err)
      })
    })
  }, [])

  /**
   * Client tool the agent calls. Fetches an A/B pair, plays both clips to
   * completion (A, 800ms pause, B), and returns guidance text to the agent.
   * Does NOT resolve until clip B finishes so the agent won't talk over audio.
   */
  const playAssessmentPair = useCallback(
    async ({ concept }: { concept: "rhythm" | "tonal" | "coord" }) => {
      try {
        const res = await fetch(`/api/tools/assessment-clip?concept=${encodeURIComponent(concept)}`)
        if (!res.ok) throw new Error(`assessment-clip ${res.status}`)
        const data = (await res.json()) as ClipResponse

        setClipPanel({ open: true, label: c.clipA, sounding: "A" })
        await playToCompletion(data.clipAUrl)

        setClipPanel({ open: true, label: "", sounding: null })
        await new Promise((r) => setTimeout(r, 800))

        setClipPanel({ open: true, label: c.clipB, sounding: "B" })
        await playToCompletion(data.clipBUrl)

        setClipPanel({ open: false, label: "", sounding: null })

        return `Clips played. The correct answer is clip ${data.correctAnswer}. Ask the student which clip answers: ${data.promptToStudent}. Do not reveal the correct answer.`
      } catch {
        setClipPanel({ open: false, label: "", sounding: null })
        return "Clip playback failed — apologize and skip this assessment"
      }
    },
    [c.clipA, c.clipB, playToCompletion],
  )

  const handleStart = useCallback(async () => {
    setMicDenied(false)
    setErrored(false)

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
    setClipPanel({ open: false, label: "", sounding: null })
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [endSession])

  if (!AGENT_ID) {
    return <p className="font-bold text-lg text-foreground/70">{c.unavailable}</p>
  }

  if (micDenied) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-accent-pink">
          <MicOff className="w-7 h-7" aria-hidden="true" />
          <span className="font-bold text-lg">{lang === "en" ? "Mic blocked" : "Micrófono bloqueado"}</span>
        </div>
        <p className="font-medium text-foreground/80 max-w-md text-pretty">{c.micDenied}</p>
        <RetroButton onClick={handleStart} variant="primary" className="!py-3 !px-8 !text-lg gap-2">
          <Mic className="w-5 h-5" aria-hidden="true" />
          {c.start}
        </RetroButton>
      </div>
    )
  }

  if (errored) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="font-medium text-foreground/80 max-w-md text-pretty">{c.error}</p>
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

      {/* Clip player panel (shown while a pair plays) */}
      {clipPanel.open && (
        <div className="w-full max-w-sm flex flex-col items-center gap-3 px-5 py-4 rounded-2xl border-4 border-foreground bg-muted shadow-[4px_4px_0px_#2A0E45]">
          <p className="font-medium text-sm text-foreground/70 text-pretty text-center">{c.listenPanel}</p>
          <div className="flex items-center gap-3">
            {(["A", "B"] as const).map((slot) => {
              const active = clipPanel.sounding === slot
              return (
                <span
                  key={slot}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-4 border-foreground font-bold transition-all ${
                    active
                      ? "bg-accent-yellow text-foreground shadow-[3px_3px_0px_#2A0E45] scale-105"
                      : "bg-background text-foreground/50"
                  }`}
                >
                  {active && <Volume2 className="w-4 h-4 motion-safe:animate-pulse" aria-hidden="true" />}
                  {slot === "A" ? c.clipA : c.clipB}
                </span>
              )
            })}
          </div>
          {clipPanel.sounding && (
            <p className="text-xs font-bold text-foreground/60" aria-live="polite">
              {c.nowPlaying}: {clipPanel.label}
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
