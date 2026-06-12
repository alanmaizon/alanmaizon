"use client"

import { useEffect, useState } from "react"
import { Mic, Headphones } from "lucide-react"
import { useLanguage } from "./language-provider"
import { RetroButton } from "./retro"

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || "https://calendly.com/maizonalan/30min"
const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "agent-id"?: string },
        HTMLElement
      >
    }
  }
}

export function IntakeMentor() {
  const { t, lang } = useLanguage()
  const [scriptReady, setScriptReady] = useState(false)
  const [scriptError, setScriptError] = useState(false)

  useEffect(() => {
    if (!AGENT_ID) return

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]',
    )
    if (existing) {
      setScriptReady(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed"
    script.async = true
    script.type = "text/javascript"
    script.onload = () => setScriptReady(true)
    script.onerror = () => setScriptError(true)
    document.body.appendChild(script)
  }, [])

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
          {!AGENT_ID ? (
            <p className="font-bold text-lg text-foreground/70">
              {lang === "en"
                ? "The voice mentor is warming up. Check back soon!"
                : "El mentor de voz se está preparando. ¡Vuelve pronto!"}
            </p>
          ) : scriptError ? (
            <p className="font-bold text-lg text-foreground/70">
              {lang === "en"
                ? "The voice mentor couldn't load. Please refresh the page or book a free trial below."
                : "El mentor de voz no pudo cargar. Actualiza la página o reserva una clase gratis abajo."}
            </p>
          ) : (
            <>
              {!scriptReady && (
                <p className="font-bold text-lg text-foreground/70 animate-pulse">
                  {lang === "en" ? "Loading the voice mentor..." : "Cargando el mentor de voz..."}
                </p>
              )}
              <elevenlabs-convai agent-id={AGENT_ID} />
            </>
          )}
          <p className="flex items-center gap-2 font-medium text-foreground/70">
            <Headphones className="w-5 h-5" aria-hidden="true" />
            {t.intake.micNote}
          </p>
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
