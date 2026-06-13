"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, Headphones, MicOff, PhoneOff, Radio, Volume2, RotateCcw, X } from "lucide-react"
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
  // "waiting" = holding until the mentor finishes talking; "playing" = auto-
  // playing the A/B pair; "review" = clips done, replays available, mentor
  // held silent through the minimum listening window; "done" = released, the
  // mentor has been asked to pose the question and the mic is open.
  phase: "waiting" | "playing" | "review" | "done"
  sounding: "A" | "B" | null
  progress: number
  urls: { A: string; B: string } | null
}

const CLOSED_PANEL: ClipPanelState = { open: false, phase: "waiting", sounding: null, progress: 0, urls: null }

// Minimum time the clip exercise holds the mentor silent so it can't rush into
// the next task — gives the student room to listen and replay before answering.
const CLIP_SECTION_MIN_MS = 60000

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
    planReady: "Your personalized plan is ready!",
    planCta: "View your 6-week plan",
    micPaused: "Your mic is paused while the clips play.",
    closeHelper: "Close the clip player",
    stopClips: "Stop",
    clipsWaiting: "Get ready — the clips will play in a moment.",
    clipsReview: "Take your time — replay either clip. The mentor will ask you shortly.",
    imReady: "I'm ready",
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
    planReady: "¡Tu plan personalizado está listo!",
    planCta: "Ver tu plan de 6 semanas",
    micPaused: "Tu micrófono está en pausa mientras suenan los clips.",
    closeHelper: "Cerrar el reproductor de clips",
    stopClips: "Detener",
    clipsWaiting: "Prepárate — los clips sonarán en un momento.",
    clipsReview: "Tómate tu tiempo — repite los clips. El mentor te preguntará en breve.",
    imReady: "Estoy listo",
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
  // Set by the show_plan client tool; survives the end of the session so the
  // student can still reach their plan after hanging up.
  const [planUrl, setPlanUrl] = useState<string | null>(null)

  // A single Audio element is created during the user gesture (start click) so
  // iOS Safari permits playback for both clips later during the session.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Object URLs from the current pair, revoked when a new pair loads / on unmount.
  const objectUrlsRef = useRef<string[]>([])
  // Transport for the current attempt. WebRTC is tried first (lower latency);
  // if its media channels are blocked by the network we fall back to WebSocket.
  const transportRef = useRef<"webrtc" | "websocket">("webrtc")
  // Set by the render below once the session starter exists (avoids use-before-declaration).
  const retryWithWebsocketRef = useRef<() => void>(() => {})
  // Used to detect "the agent hung up immediately without ever talking" —
  // the signature of broken WebRTC media rather than a real end-of-conversation.
  const connectedAtRef = useRef(0)
  const agentActivityRef = useRef(false)
  // Stable per-session id, passed to the agent as the {{student_id}} dynamic
  // variable so every webhook tool call uses the same id.
  const studentIdRef = useRef("")
  // Bumping the run id abandons any in-flight clip sequence (close button,
  // disconnect, or a new pair starting). cancelPlaybackRef settles the
  // currently-pending playToCompletion promise so the sequence can notice.
  const playbackRunRef = useRef(0)
  const cancelPlaybackRef = useRef<(() => void) | null>(null)
  // Lifecycle of the whole clip exercise (auto-play + minimum listening
  // window). Bumped to abandon the section (disconnect, end, dismiss, new
  // pair). Kept separate from playbackRunRef so a replay can't abort it.
  const sectionRunRef = useRef(0)
  // Set by the active clip run; releases the minimum listening window early
  // when the student taps "I'm ready".
  const releaseSectionRef = useRef<(() => void) | null>(null)
  // Set by "Stop" to skip the rest of the auto-play and jump to the review
  // (replays available) without ending the minimum listening window.
  const clipStoppedRef = useRef(false)

  const conversation = useConversation({
    onConnect: (props) => {
      connectedAtRef.current = Date.now()
      agentActivityRef.current = false
      console.log("[v0] conversation connected via", transportRef.current, ":", JSON.stringify(props))
    },
    onMessage: () => {
      // Any message (agent transcript, etc.) proves media is actually flowing.
      agentActivityRef.current = true
    },
    onError: (message, context) => {
      console.log("[v0] conversation onError:", message, context ? JSON.stringify(context) : "")
      setErrored(true)
    },
    onDisconnect: (details) => {
      console.log("[v0] conversation onDisconnect, reason:", details?.reason, JSON.stringify(details))
      // Stop any clip audio and clear the panel regardless of why we disconnected.
      sectionRunRef.current++
      playbackRunRef.current++
      cancelPlaybackRef.current?.()
      releaseSectionRef.current = null
      if (audioRef.current) audioRef.current.pause()
      setClipPanel(CLOSED_PANEL)

      const elapsed = Date.now() - connectedAtRef.current
      const isErrorDrop = details?.reason === "error"
      // The agent "hanging up" within seconds of connecting, before any
      // message ever flowed, means WebRTC media never got established.
      const isSilentEarlyHangup = details?.reason === "agent" && !agentActivityRef.current && elapsed < 10000

      if (isErrorDrop || isSilentEarlyHangup) {
        if (transportRef.current === "webrtc") {
          console.log("[v0] webrtc media failed (", details?.reason, elapsed, "ms ) — falling back to websocket")
          retryWithWebsocketRef.current()
        } else {
          setDropped(true)
        }
      }
    },
  })
  const { status, isSpeaking, isListening, startSession, endSession, sendUserMessage, setMuted, setVolume } =
    conversation

  const isActive = status === "connected" || status === "connecting"

  // Mirror of isSpeaking readable inside async closures (so clip playback can
  // wait for the mentor to stop talking before starting, avoiding overlap).
  const isSpeakingRef = useRef(false)
  useEffect(() => {
    isSpeakingRef.current = isSpeaking
  }, [isSpeaking])

  // The SDK's setMuted / sendUserMessage throw "No active conversation" if
  // called when no session is live (e.g. before start, or after a disconnect
  // races an in-flight clip sequence). These wrappers make that a no-op.
  const safeSetMuted = useCallback(
    (muted: boolean) => {
      try {
        setMuted(muted)
      } catch {
        // No active conversation — nothing to mute.
      }
    },
    [setMuted],
  )
  const safeSendUserMessage = useCallback(
    (text: string) => {
      try {
        sendUserMessage(text)
      } catch {
        // No active conversation — drop the nudge.
      }
    },
    [sendUserMessage],
  )
  // Silences the mentor's TTS output locally (volume 0) while clips play, so
  // the agent's autonomous conversation turn can't be heard talking over the
  // clips. Restored to full volume when the exercise is released.
  const safeSetVolume = useCallback(
    (volume: number) => {
      try {
        setVolume({ volume })
      } catch {
        // No active conversation — nothing to adjust.
      }
    },
    [setVolume],
  )

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
        cancelPlaybackRef.current = null
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
      // Lets the close button settle this promise; callers detect the
      // abandoned run via playbackRunRef and stop quietly.
      cancelPlaybackRef.current = () => {
        cleanup()
        setClipPanel((p) => ({ ...p, sounding: null, progress: 0 }))
        resolve()
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
   * starts playback (A, 800ms pause, B) and returns IMMEDIATELY so the
   * agent's tool-call timeout can't expire while long clips play. When clip B
   * finishes we send a user message that prompts the agent to ask the
   * question. Afterwards the panel stays open with replay buttons that reuse
   * the preloaded URLs (no extra API calls).
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

        // Start in "waiting": hold playback until the mentor finishes its
        // intro sentence so the clips don't play over the agent's voice.
        setClipPanel({ open: true, phase: "waiting", sounding: null, progress: 0, urls })

        // Lock the conversation while clips play: the mic is muted so neither
        // the clips bleeding through speakers nor an eager early answer can
        // trigger the agent mid-exercise. Unmuted again before the nudge.
        safeSetMuted(true)
        const section = ++sectionRunRef.current
        ++playbackRunRef.current
        const sectionStart = Date.now()
        clipStoppedRef.current = false

        // Releases the exercise: opens the mic and nudges the mentor to ask the
        // question. Used both when the minimum window elapses and on manual
        // "I'm ready". Guarded by section so it fires at most once.
        const release = (message: string) => {
          if (sectionRunRef.current !== section) return
          releaseSectionRef.current = null
          setClipPanel((p) => (p.urls ? { ...p, phase: "done", sounding: null, progress: 0 } : CLOSED_PANEL))
          safeSetMuted(false)
          // Restore the mentor's voice before prompting the question.
          safeSetVolume(1)
          safeSendUserMessage(message)
        }
        releaseSectionRef.current = () =>
          release(
            "[system] I'm ready now. Ask me the comparison question for this exercise — I can still replay either clip if I need to.",
          )

        // Play in the background; hold the mentor until the minimum window.
        void (async () => {
          try {
            // Wait for the mentor to stop its current sentence before starting
            // (cap ~8s so we never hang if the speaking signal never clears).
            const deadline = Date.now() + 8000
            while (isSpeakingRef.current && Date.now() < deadline) {
              await new Promise((r) => setTimeout(r, 150))
              if (sectionRunRef.current !== section) return
            }
            // Silence the mentor's voice for the whole clip segment. The agent
            // will autonomously try to keep the conversation going (e.g. ask
            // "A or B?") right after the tool call — muting its output means
            // that turn can't be heard talking over the clips. Restored on
            // release, when we prompt it to ask the question for real.
            safeSetVolume(0)
            // Small breath after the agent finishes before clip A.
            await new Promise((r) => setTimeout(r, 350))
            if (sectionRunRef.current !== section) return

            setClipPanel((p) => (p.urls ? { ...p, phase: "playing" } : p))
            if (!clipStoppedRef.current) {
              await playToCompletion(urls.A, "A")
              if (sectionRunRef.current !== section) return
            }
            if (!clipStoppedRef.current) {
              await new Promise((r) => setTimeout(r, 800))
              if (sectionRunRef.current !== section) return
            }
            if (!clipStoppedRef.current) {
              await playToCompletion(urls.B, "B")
              if (sectionRunRef.current !== section) return
            }

            // Clips done: show replays and hold the mentor silent until the
            // minimum listening window elapses so it can't rush ahead.
            setClipPanel((p) => (p.urls ? { ...p, phase: "review", sounding: null, progress: 0 } : p))
            while (Date.now() - sectionStart < CLIP_SECTION_MIN_MS) {
              await new Promise((r) => setTimeout(r, 200))
              if (sectionRunRef.current !== section) return
            }
            release(
              "[system] The clips finished and the student has had time to listen. Now ask me the comparison question for this exercise.",
            )
          } catch {
            if (sectionRunRef.current !== section) return
            // Keep the panel open with replays available even on playback error.
            setClipPanel((p) => (p.urls ? { ...p, phase: "review", sounding: null, progress: 0 } : p))
            while (Date.now() - sectionStart < CLIP_SECTION_MIN_MS) {
              await new Promise((r) => setTimeout(r, 200))
              if (sectionRunRef.current !== section) return
            }
            release(
              "[system] Clip playback had trouble on my device, but I can replay the clips with the on-screen buttons. Ask me the comparison question.",
            )
          }
        })()

        return `The two clips are about to play on the student's screen. Your audio is muted for the student while they play, so do NOT try to talk or ask anything yet — anything you say now will not be heard. Wait for a [system] message telling you the student is ready; only then ask: "${data.promptToStudent}". The listening window lasts at least a minute and the student can replay either clip. The correct answer is clip ${data.correctAnswer} — never reveal it.`
      } catch {
        setClipPanel(CLOSED_PANEL)
        revokeObjectUrls()
        return "Clip playback failed — apologize and skip this assessment"
      }
    },
    // isSpeakingRef is a ref; intentionally excluded from deps.
    [playToCompletion, revokeObjectUrls, safeSendUserMessage, safeSetMuted, safeSetVolume],
  )

  /**
   * Client tool the agent calls after save-intake succeeds. Reveals a button
   * to the student's personalized plan page. Accepts either the planUrl
   * returned by save-intake or a studentId; falls back to this session's id.
   */
  const showPlan = useCallback(async ({ planUrl: url, studentId }: { planUrl?: string; studentId?: string }) => {
    const resolved = url || `/plan/${encodeURIComponent(studentId || studentIdRef.current)}`
    setPlanUrl(resolved)
    return "The plan button is now visible on the student's screen. Tell them to tap 'View your 6-week plan' below, congratulate them, and wrap up the conversation."
  }, [])

  /**
   * Replays one clip from the already-preloaded pair. Never calls the API.
   * Mutes the mic for the duration so the replay can't be heard as an answer.
   */
  const handleReplay = useCallback(
    (slot: "A" | "B") => {
      const urls = clipPanel.urls
      if (!urls || clipPanel.sounding) return
      const run = ++playbackRunRef.current
      safeSetMuted(true)
      playToCompletion(urls[slot], slot)
        .catch(() => {
          setClipPanel((p) => ({ ...p, sounding: null, progress: 0 }))
        })
        .finally(() => {
          if (playbackRunRef.current === run) safeSetMuted(false)
        })
    },
    [clipPanel.urls, clipPanel.sounding, playToCompletion, safeSetMuted],
  )

  /**
   * Stops the auto-play (e.g. to hear the mentor) WITHOUT losing the clips:
   * the panel drops into "review" so replays stay available and the mentor
   * stays held through the minimum window. Does not nudge the agent — the
   * running clip sequence still owns the release.
   */
  const handleStopClips = useCallback(() => {
    clipStoppedRef.current = true
    cancelPlaybackRef.current?.()
    if (audioRef.current) audioRef.current.pause()
    setClipPanel((p) => (p.urls ? { ...p, phase: "review", sounding: null, progress: 0 } : CLOSED_PANEL))
  }, [])

  /**
   * "I'm ready": release the minimum listening window early, open the mic, and
   * ask the mentor to pose the question. Replays remain available.
   */
  const handleReady = useCallback(() => {
    releaseSectionRef.current?.()
  }, [])

  /** Fully dismisses the (already finished) clip panel. */
  const handleDismissClips = useCallback(() => {
    sectionRunRef.current++
    playbackRunRef.current++
    cancelPlaybackRef.current?.()
    releaseSectionRef.current = null
    if (audioRef.current) audioRef.current.pause()
    safeSetVolume(1)
    setClipPanel(CLOSED_PANEL)
  }, [safeSetVolume])

  /**
   * Starts a session over the given transport. Mic permission must already be
   * granted. Asks our server for short-lived credentials first (conversation
   * token for WebRTC, signed URL for WebSocket) so this works for agents with
   * authentication enabled; if the server reports the agent is public we fall
   * back to connecting with the bare agent ID.
   */
  const beginSession = useCallback(
    async (transport: "webrtc" | "websocket") => {
      transportRef.current = transport
      const clientTools = { play_assessment_pair: playAssessmentPair, show_plan: showPlan }
      const dynamicVariables = { student_id: studentIdRef.current, language: lang }

      try {
        const res = await fetch(`/api/elevenlabs/auth?transport=${transport}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`auth route ${res.status}`)
        const auth = (await res.json()) as {
          conversationToken?: string
          signedUrl?: string
          public?: boolean
        }

        if (auth.conversationToken) {
          startSession({
            conversationToken: auth.conversationToken,
            connectionType: "webrtc",
            clientTools,
            dynamicVariables,
          })
        } else if (auth.signedUrl) {
          startSession({ signedUrl: auth.signedUrl, connectionType: "websocket", clientTools, dynamicVariables })
        } else if (auth.public && AGENT_ID) {
          startSession({ agentId: AGENT_ID, connectionType: transport, clientTools, dynamicVariables })
        } else {
          throw new Error("no usable credentials")
        }
      } catch (err) {
        console.log("[v0] beginSession failed:", err)
        setErrored(true)
      }
    },
    [playAssessmentPair, showPlan, startSession, lang],
  )

  // Keep the disconnect handler's fallback pointing at the latest starter.
  retryWithWebsocketRef.current = () => beginSession("websocket")

  const handleStart = useCallback(async () => {
    setMicDenied(false)
    setErrored(false)
    setDropped(false)
    setPlanUrl(null)
    studentIdRef.current = crypto.randomUUID()

    // Create/reuse the audio element inside the user gesture for iOS Safari.
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = "auto"
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Permission is all we needed — the SDK opens its own stream. Release
      // this one so the browser's mic indicator doesn't stay on forever.
      for (const track of stream.getTracks()) track.stop()
    } catch {
      setMicDenied(true)
      return
    }

    void beginSession("webrtc")
  }, [beginSession])

  const handleEnd = useCallback(() => {
    sectionRunRef.current++
    playbackRunRef.current++
    cancelPlaybackRef.current?.()
    releaseSectionRef.current = null
    // Restore agent volume in case we end mid-exercise (so a later session
    // doesn't inherit a muted mentor).
    safeSetVolume(1)
    try {
      endSession()
    } catch {
      // Already disconnected — nothing to end.
    }
    setClipPanel(CLOSED_PANEL)
    revokeObjectUrls()
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [endSession, revokeObjectUrls, safeSetVolume])

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
        {planUrl && (
          <div className="flex flex-col items-center gap-3">
            <p className="font-bold text-xl text-foreground">{c.planReady}</p>
            <RetroButton href={planUrl} variant="primary" className="!py-4 !px-10 !text-xl gap-2">
              {c.planCta}
            </RetroButton>
          </div>
        )}
        <RetroButton onClick={handleStart} variant={planUrl ? "accent" : "primary"} className="!py-5 !px-10 !text-2xl gap-3">
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
        <div className="relative w-full max-w-md flex flex-col items-center gap-4 px-5 py-4 rounded-2xl border-4 border-foreground bg-muted shadow-[4px_4px_0px_#2A0E45]">
          {clipPanel.phase === "done" ? (
            <button
              type="button"
              onClick={handleDismissClips}
              aria-label={c.closeHelper}
              className="absolute -top-3 -right-3 inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-foreground bg-background text-foreground shadow-[2px_2px_0px_#2A0E45] transition-transform hover:-translate-y-0.5"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : clipPanel.phase === "review" ? (
            <button
              type="button"
              onClick={handleReady}
              className="absolute -top-3 -right-3 inline-flex items-center gap-1.5 px-3 h-8 rounded-full border-2 border-foreground bg-accent-yellow text-foreground font-bold text-xs shadow-[2px_2px_0px_#2A0E45] transition-transform hover:-translate-y-0.5"
            >
              {c.imReady}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopClips}
              className="absolute -top-3 -right-3 inline-flex items-center gap-1.5 px-3 h-8 rounded-full border-2 border-foreground bg-background text-foreground font-bold text-xs shadow-[2px_2px_0px_#2A0E45] transition-transform hover:-translate-y-0.5"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              {c.stopClips}
            </button>
          )}

          <p className="font-medium text-sm text-foreground/70 text-pretty text-center" aria-live="polite">
            {clipPanel.phase === "done"
              ? clipText.done
              : clipPanel.phase === "waiting"
                ? c.clipsWaiting
                : clipPanel.phase === "review"
                  ? c.clipsReview
                  : clipText.listen}
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

                  {(clipPanel.phase === "review" || clipPanel.phase === "done") && (
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

          {(clipPanel.phase !== "done" || clipPanel.sounding) && (
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground/60" aria-live="polite">
              <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
              {c.micPaused}
            </p>
          )}
        </div>
      )}

      {planUrl && (
        <div className="flex flex-col items-center gap-3 w-full max-w-md px-5 py-4 rounded-2xl border-4 border-foreground bg-accent-yellow shadow-[4px_4px_0px_#2A0E45]">
          <p className="font-bold text-lg text-foreground text-center">{c.planReady}</p>
          <RetroButton href={planUrl} variant="primary" className="!py-3 !px-8 !text-lg gap-2">
            {c.planCta}
          </RetroButton>
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
