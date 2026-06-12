import type { GeneratedPlan, PlanWeek, Stage } from "./types"

/**
 * Base 6-week program for "Play & Sing with Alan".
 * The program is FIXED — the student's stage only changes the ENTRY POINT
 * and pacing, never the program itself.
 *
 * ALAN: replace exercise content below with real pedagogy.
 */
const BASE_PROGRAM: PlanWeek[] = [
  {
    week: 1,
    title: { en: "Rhythmic Foundations", es: "Fundamentos Rítmicos" },
    focus: {
      en: "Build a rock-solid internal pulse before touching chords.",
      es: "Construye un pulso interno sólido antes de tocar acordes.",
    },
    exercises: [
      {
        en: "ALAN: replace — Metronome clapping at 60-80 BPM, 4/4 downbeats",
        es: "ALAN: reemplazar — Palmas con metrónomo a 60-80 BPM, tiempos de 4/4",
      },
      {
        en: "ALAN: replace — Muted-string strumming pattern D-D-D-D",
        es: "ALAN: reemplazar — Rasgueo con cuerdas apagadas D-D-D-D",
      },
      {
        en: "ALAN: replace — Count out loud while strumming",
        es: "ALAN: reemplazar — Contar en voz alta mientras rasgueas",
      },
    ],
  },
  {
    week: 2,
    title: { en: "Chord Transitions", es: "Transiciones de Acordes" },
    focus: {
      en: "Smooth, automatic chord changes that never break the pulse.",
      es: "Cambios de acordes suaves y automáticos que nunca rompen el pulso.",
    },
    exercises: [
      {
        en: "ALAN: replace — One-minute changes drill: G ↔ C, G ↔ D",
        es: "ALAN: reemplazar — Cambios en un minuto: G ↔ C, G ↔ D",
      },
      {
        en: "ALAN: replace — Anchor-finger transitions practice",
        es: "ALAN: reemplazar — Práctica de transiciones con dedo ancla",
      },
      {
        en: "ALAN: replace — Strum-and-change loop at slow tempo",
        es: "ALAN: reemplazar — Bucle de rasgueo y cambio a tempo lento",
      },
    ],
  },
  {
    week: 3,
    title: { en: "Vocal Isolation", es: "Aislamiento Vocal" },
    focus: {
      en: "Train the voice on its own: pitch matching, phrasing, breath.",
      es: "Entrena la voz por separado: afinación, fraseo, respiración.",
    },
    exercises: [
      {
        en: "ALAN: replace — Sing melody over a backing track (no guitar)",
        es: "ALAN: reemplazar — Cantar la melodía sobre una pista (sin guitarra)",
      },
      {
        en: "ALAN: replace — Hum the melody while tapping the strum rhythm",
        es: "ALAN: reemplazar — Tararear la melodía marcando el ritmo del rasgueo",
      },
      {
        en: "ALAN: replace — Breath-mark the lyrics of one goal song",
        es: "ALAN: reemplazar — Marcar respiraciones en la letra de una canción meta",
      },
    ],
  },
  {
    week: 4,
    title: { en: "Jam Session", es: "Zapada" },
    focus: {
      en: "First full combination: play and sing together on the rhythmic grid.",
      es: "Primera combinación completa: tocar y cantar juntos sobre la cuadrícula rítmica.",
    },
    exercises: [
      {
        en: "ALAN: replace — Layer voice onto a single looping chord",
        es: "ALAN: reemplazar — Superponer la voz sobre un solo acorde en bucle",
      },
      {
        en: "ALAN: replace — Half-speed play-and-sing of song 1, verse only",
        es: "ALAN: reemplazar — Tocar y cantar a media velocidad la canción 1, solo estrofa",
      },
      {
        en: "ALAN: replace — Live jam with Alan covering the gaps",
        es: "ALAN: reemplazar — Zapada en vivo con Alan cubriendo los huecos",
      },
    ],
  },
  {
    week: 5,
    title: { en: "Adding Dynamics", es: "Dinámicas" },
    focus: {
      en: "Make it musical: volume, accents, and expression across full songs.",
      es: "Hazlo musical: volumen, acentos y expresión en canciones completas.",
    },
    exercises: [
      {
        en: "ALAN: replace — Soft verse / loud chorus contrast drill",
        es: "ALAN: reemplazar — Ejercicio de contraste estrofa suave / estribillo fuerte",
      },
      {
        en: "ALAN: replace — Accent pattern variations on songs 1-2",
        es: "ALAN: reemplazar — Variaciones de acentos en las canciones 1-2",
      },
      {
        en: "ALAN: replace — Full run-throughs with dynamic map",
        es: "ALAN: reemplazar — Pasadas completas con mapa de dinámicas",
      },
    ],
  },
  {
    week: 6,
    title: { en: "Record Your 3 Songs", es: "Graba Tus 3 Canciones" },
    focus: {
      en: "Perform and record all three goal songs, start to finish.",
      es: "Interpreta y graba tus tres canciones meta, de principio a fin.",
    },
    exercises: [
      {
        en: "ALAN: replace — Dress rehearsal: 3 songs back to back",
        es: "ALAN: reemplazar — Ensayo general: 3 canciones seguidas",
      },
      {
        en: "ALAN: replace — Recording session with Alan",
        es: "ALAN: reemplazar — Sesión de grabación con Alan",
      },
      {
        en: "ALAN: replace — Listen-back and celebrate",
        es: "ALAN: reemplazar — Escucha final y celebración",
      },
    ],
  },
]

/** Deep-clone the base program so dials never mutate the source. */
function cloneProgram(): PlanWeek[] {
  return JSON.parse(JSON.stringify(BASE_PROGRAM)) as PlanWeek[]
}

/**
 * Dial 1 — entry(stage): sets entry point and pacing.
 * S -> expand W1-3 (extra reinforcement), delay combination
 * L -> compress W1, core focus W2-4
 * P -> fast entry, core focus W4-6
 */
export function applyEntry(weeks: PlanWeek[], stage: Stage): PlanWeek[] {
  if (stage === "S") {
    for (const w of weeks) {
      if (w.week <= 3) {
        w.exercises.push({
          en: "ALAN: replace — Extra reinforcement drill (Stage S expanded pacing)",
          es: "ALAN: reemplazar — Ejercicio de refuerzo extra (ritmo ampliado Etapa S)",
        })
        w.focus = {
          en: `${w.focus.en} We take this week slowly and thoroughly — combination is delayed until each part is solid.`,
          es: `${w.focus.es} Tomamos esta semana con calma — la combinación se retrasa hasta que cada parte esté sólida.`,
        }
      }
    }
  } else if (stage === "L") {
    const w1 = weeks.find((w) => w.week === 1)
    if (w1) {
      w1.exercises = w1.exercises.slice(0, 1)
      w1.focus = {
        en: `${w1.focus.en} Compressed: you already have working parts, so this is a quick calibration week.`,
        es: `${w1.focus.es} Comprimida: tus partes ya funcionan, así que esta es una semana rápida de calibración.`,
      }
    }
    for (const w of weeks) {
      if (w.week >= 2 && w.week <= 4) {
        w.focus = {
          en: `${w.focus.en} (Core week for your Layer stage.)`,
          es: `${w.focus.es} (Semana central para tu etapa de Conexión.)`,
        }
      }
    }
  } else {
    // Stage P — fast entry, focus W4-6
    for (const w of weeks) {
      if (w.week <= 3) {
        w.exercises = w.exercises.slice(0, 1)
        w.focus = {
          en: `${w.focus.en} Fast pass: a quick check, then we move on.`,
          es: `${w.focus.es} Pasada rápida: una verificación breve y avanzamos.`,
        }
      } else {
        w.focus = {
          en: `${w.focus.en} (Core week for your Perform stage.)`,
          es: `${w.focus.es} (Semana central para tu etapa de Actuación.)`,
        }
      }
    }
  }
  return weeks
}

/** Dial 2 — repertoire(goalSongs): slot goal songs into weeks 4-6. */
export function applyRepertoire(weeks: PlanWeek[], goalSongs: string[]): PlanWeek[] {
  const songs = goalSongs.slice(0, 3)
  if (songs.length === 0) return weeks

  for (const w of weeks) {
    if (w.week === 4) w.songs = songs.slice(0, 1)
    if (w.week === 5) w.songs = songs.slice(0, Math.min(2, songs.length))
    if (w.week === 6) w.songs = songs
  }
  return weeks
}

/**
 * Dial 3 — load(practiceMins, practiceDays): scale exercises per week.
 * Total weekly practice < 60 min -> mark "light variant" and trim exercises.
 */
export function applyLoad(
  weeks: PlanWeek[],
  practiceMins: number,
  practiceDays: number,
): { weeks: PlanWeek[]; totalWeeklyMinutes: number; lightVariant: boolean } {
  const totalWeeklyMinutes = practiceMins * practiceDays
  const lightVariant = totalWeeklyMinutes < 60

  if (lightVariant) {
    for (const w of weeks) {
      w.exercises = w.exercises.slice(0, Math.max(1, Math.min(2, w.exercises.length)))
      w.lightVariant = true
    }
  } else if (totalWeeklyMinutes >= 180) {
    for (const w of weeks) {
      w.exercises.push({
        en: "ALAN: replace — Bonus stretch exercise (high practice load)",
        es: "ALAN: reemplazar — Ejercicio extra (alta carga de práctica)",
      })
    }
  }

  return { weeks, totalWeeklyMinutes, lightVariant }
}

/** Topic keywords used by the avoidance dial. Maps topic -> weeks where it lives. */
const TOPIC_KEYWORDS: { keywords: string[]; week: number }[] = [
  { keywords: ["rhythm", "ritmo", "timing", "metronome", "metrónomo", "beat"], week: 1 },
  { keywords: ["chord", "acorde", "transition", "transición", "fingers", "dedos"], week: 2 },
  { keywords: ["sing", "cantar", "voice", "voz", "vocal", "pitch", "afinación"], week: 3 },
]

/**
 * Dial 4 — avoidance(quitReason): if the quit reason names a topic covered
 * in weeks 1-3, add a note deferring intensive work on that topic past W3.
 */
export function applyAvoidance(weeks: PlanWeek[], quitReason: string | null): PlanWeek[] {
  if (!quitReason) return weeks
  const lower = quitReason.toLowerCase()

  for (const topic of TOPIC_KEYWORDS) {
    if (topic.keywords.some((k) => lower.includes(k))) {
      const w = weeks.find((x) => x.week === topic.week)
      if (w) {
        w.deferredNote = {
          en: "Because this topic was part of what made you quit before, we keep it gentle here and revisit it with fresh momentum after week 3.",
          es: "Como este tema fue parte de lo que te hizo abandonar antes, lo tomamos con suavidad aquí y lo retomamos con nuevo impulso después de la semana 3.",
        }
      }
    }
  }
  return weeks
}

export interface PlanInput {
  stage: Stage
  goalSongs: string[]
  practiceMins: number
  practiceDays: number
  quitReason: string | null
}

/** Generate the personalized plan by applying all four dials to the base program. */
export function generatePlan(input: PlanInput): GeneratedPlan {
  let weeks = cloneProgram()
  weeks = applyEntry(weeks, input.stage)
  weeks = applyRepertoire(weeks, input.goalSongs)
  const loaded = applyLoad(weeks, input.practiceMins, input.practiceDays)
  weeks = applyAvoidance(loaded.weeks, input.quitReason)

  return {
    stage: input.stage,
    weeks,
    totalWeeklyMinutes: loaded.totalWeeklyMinutes,
    lightVariant: loaded.lightVariant,
  }
}
