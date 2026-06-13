import { Sun, Star, Music, Ear, CalendarDays, Sparkles, Feather } from "lucide-react"
import { RetroButton } from "@/components/retro"
import { PrintPlanButton } from "@/components/plan/print-button"
import type { EarItem, GeneratedPlan, StudentProfile } from "@/lib/types"

const STAGE_LABELS: Record<string, { en: string; es: string }> = {
  S: { en: "Stage S — Sound Foundations", es: "Etapa S — Fundamentos del Sonido" },
  L: { en: "Stage L — Linking Hands & Voice", es: "Etapa L — Conectando Manos y Voz" },
  P: { en: "Stage P — Performing Songs", es: "Etapa P — Interpretando Canciones" },
}

const COPY = {
  en: {
    yourPlan: "Your 6-Week Plan",
    hello: "Here's your personalized path",
    earTitle: "Ear Check Results",
    earScore: "Listening score",
    earFlagNote: "We'll spend extra time on listening games — your ear will catch up fast!",
    earGoodNote: "Great ears! We'll build on that strength every week.",
    weeklyTime: "Weekly practice",
    minutes: "min/day",
    days: "days/week",
    goals: "Your goal songs",
    week: "Week",
    exercises: "Exercises",
    songs: "Songs",
    lightNote: "This is a lighter plan that fits your schedule — small steps, steady wins.",
    cta: "Questions? Chat with Alan",
    backHome: "Back to home",
    print: "Print / Save PDF",
  },
  es: {
    yourPlan: "Tu Plan de 6 Semanas",
    hello: "Este es tu camino personalizado",
    earTitle: "Resultados del Oído",
    earScore: "Puntaje de escucha",
    earFlagNote: "Dedicaremos tiempo extra a juegos de escucha — ¡tu oído mejorará rápido!",
    earGoodNote: "¡Buen oído! Construiremos sobre esa fortaleza cada semana.",
    weeklyTime: "Práctica semanal",
    minutes: "min/día",
    days: "días/semana",
    goals: "Tus canciones meta",
    week: "Semana",
    exercises: "Ejercicios",
    songs: "Canciones",
    lightNote: "Este es un plan más ligero que se ajusta a tu horario — pasos pequeños, logros constantes.",
    cta: "¿Preguntas? Habla con Alan",
    backHome: "Volver al inicio",
    print: "Imprimir / Guardar PDF",
  },
}

interface PlanContentProps {
  profile: StudentProfile
  earItems: EarItem[]
  plan: GeneratedPlan
}

export function PlanContent({ profile, earItems, plan }: PlanContentProps) {
  const lang = profile.language === "es" ? "es" : "en"
  const t = COPY[lang]
  const stageLabel = STAGE_LABELS[plan.stage]?.[lang] ?? plan.stage
  const correctCount = earItems.filter((i) => i.correct).length

  return (
    <main className="min-h-screen bg-background plan-print-root">
      {/* Header */}
      <header className="bg-primary border-b-4 border-foreground">
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center gap-4 text-center">
          <Sun className="w-12 h-12 text-primary-foreground motion-safe:animate-spin-slow" aria-hidden="true" />
          <h1 className="font-bold text-4xl md:text-5xl text-primary-foreground text-balance">{t.yourPlan}</h1>
          <p className="text-xl text-primary-foreground/90">{t.hello}</p>
          <span className="inline-flex items-center gap-2 bg-background text-foreground font-bold px-6 py-2 rounded-full border-4 border-foreground">
            <Star className="w-5 h-5" aria-hidden="true" />
            {stageLabel}
          </span>
          <PrintPlanButton label={t.print} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">
        {/* Summary cards */}
        <section aria-label={t.earTitle} className="grid gap-6 md:grid-cols-2">
          <div className="border-4 border-foreground rounded-3xl bg-card p-6 flex flex-col gap-3 shadow-[6px_6px_0px_var(--color-accent-pink)]">
            <div className="flex items-center gap-3">
              <Ear className="w-8 h-8 text-primary" aria-hidden="true" />
              <h2 className="font-bold text-2xl text-card-foreground">{t.earTitle}</h2>
            </div>
            <p className="text-lg text-card-foreground">
              {t.earScore}: <strong>{correctCount > 0 || earItems.length > 0 ? `${correctCount}/${earItems.length}` : `${profile.earScore}`}</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              {profile.earFlag ? t.earFlagNote : t.earGoodNote}
            </p>
          </div>

          <div className="border-4 border-foreground rounded-3xl bg-card p-6 flex flex-col gap-3 shadow-[6px_6px_0px_var(--color-accent-teal)]">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-primary" aria-hidden="true" />
              <h2 className="font-bold text-2xl text-card-foreground">{t.weeklyTime}</h2>
            </div>
            <p className="text-lg text-card-foreground">
              <strong>{profile.practiceMins}</strong> {t.minutes} · <strong>{profile.practiceDays}</strong> {t.days}
            </p>
            {profile.goalSongs?.length > 0 && (
              <p className="text-muted-foreground leading-relaxed">
                {t.goals}: {profile.goalSongs.join(", ")}
              </p>
            )}
          </div>
        </section>

        {plan.lightVariant && (
          <p className="flex items-start gap-3 border-4 border-foreground rounded-3xl bg-secondary p-5 text-secondary-foreground leading-relaxed">
            <Feather className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
            {t.lightNote}
          </p>
        )}

        {/* Weeks */}
        <section className="flex flex-col gap-6" aria-label={t.yourPlan}>
          {plan.weeks.map((week) => (
            <article
              key={week.week}
              className="plan-week border-4 border-foreground rounded-3xl bg-card overflow-hidden shadow-[6px_6px_0px_var(--color-accent-yellow)]"
            >
              <div className="bg-primary px-6 py-3 flex items-center gap-3 border-b-4 border-foreground">
                <span className="bg-background text-foreground font-bold rounded-full w-10 h-10 flex items-center justify-center border-2 border-foreground">
                  {week.week}
                </span>
                <h3 className="font-bold text-xl text-primary-foreground text-balance">
                  {t.week} {week.week}: {week.title[lang]}
                </h3>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <p className="text-lg text-card-foreground leading-relaxed text-pretty">{week.focus[lang]}</p>
                <div>
                  <h4 className="font-bold text-card-foreground flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                    {t.exercises}
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {week.exercises.map((ex, i) => (
                      <li key={i} className="flex items-start gap-2 text-card-foreground leading-relaxed">
                        <Star className="w-4 h-4 text-primary shrink-0 mt-1.5" aria-hidden="true" />
                        {ex[lang]}
                      </li>
                    ))}
                  </ul>
                </div>
                {week.songs && week.songs.length > 0 && (
                  <p className="flex items-center gap-2 text-card-foreground">
                    <Music className="w-5 h-5 text-primary" aria-hidden="true" />
                    <strong>{t.songs}:</strong> {week.songs.join(", ")}
                  </p>
                )}
                {week.deferredNote && (
                  <p className="text-muted-foreground italic leading-relaxed text-pretty">{week.deferredNote[lang]}</p>
                )}
              </div>
            </article>
          ))}
        </section>

        <div className="no-print flex flex-col sm:flex-row items-center justify-center gap-4 pb-10">
          <RetroButton href="/#contact" variant="primary">
            {t.cta}
          </RetroButton>
          <RetroButton href="/" variant="accent">
            {t.backHome}
          </RetroButton>
        </div>
      </div>
    </main>
  )
}
