import type { Language, Stage } from "./types"

/**
 * Single source of truth for all student-facing strings, EN + ES.
 * Landing copy preserved from the original site — restructured, not redesigned.
 */
export const messages = {
  en: {
    nav: {
      home: "Home",
      method: "The Method",
      pricing: "Pricing",
      about: "About",
      book: "Book",
    },
    hero: {
      headline: "Learn to play guitar & sing your favourite songs in 6 weeks",
      subhead: "The ultimate 1-on-1 method for absolute beginners to master coordination.",
      bookTrial: "Book a free trial",
      watchMe: "Watch me play",
      findStage: "Find your stage",
      welcome: "Welcome to the groove!",
    },
    problem: {
      title: "Hands and Voice Coordination",
      desc: "Most people give up because trying to strum and sing at the same time feels impossible. We break it down so your brain can actually process it.",
      card1: { title: "Separate", text: "First, we master the hands. Then, we master the voice." },
      card2: { title: "Layer", text: "We slowly bring them together using our proven rhythmic grid." },
      card3: { title: "Perform", text: "By week 6, you'll flow through 3 full songs effortlessly." },
    },
    intake: {
      title: "Meet Your AI Intake Mentor",
      subtitle: "10 minutes by voice. Find your stage and get your personalized 6-week plan.",
      desc: "Talk to my AI mentor for a quick, friendly placement chat. It listens to where you are with your hands, your voice, and your coordination — then builds your personalized entry into the 6-week program.",
      micNote: "You'll need a microphone. Headphones recommended.",
      fallback: "Prefer to talk to a human first?",
      clips: {
        clipA: "Clip A",
        clipB: "Clip B",
        listen: "Listen to both clips, then tell the mentor your answer.",
        nowPlaying: "Now playing",
        replay: "Replay",
        done: "Both clips played — replay anytime, then answer out loud.",
      },
    },
    pricing: {
      title: "Pricing",
      beginner: { name: "Absolute Beginner", price: "from {{PRICE_BEGINNER}}", desc: "1-on-1 focus" },
      bundle: { name: "Intermediate Package", price: "from {{PRICE_BUNDLE}}", desc: "Bundle & Save" },
      fasttrack: {
        name: "Singer-Songwriter Fast-Track",
        price: "from {{PRICE_FASTTRACK}}",
        desc: "6-week proven program. Most popular!",
        features: ["6 weeks of 1-on-1", "Custom curriculum", "Final recording"],
        mostPopular: "Most Popular!",
      },
    },
    timeline: {
      title: "How it works",
      weeks: [
        "Week 1: Rhythmic Foundations",
        "Week 2: Chord Transitions",
        "Week 3: Vocal Isolation",
        "Week 4: Jam Session",
        "Week 5: Adding Dynamics",
        "Week 6: Record Your 3 Songs",
      ],
    },
    social: {
      title: "What students say",
      t1: '"I tried for years and couldn\'t do it. Alan fixed my timing in 2 weeks!"',
      t2: '"The best investment in my hobbies I\'ve ever made. The good vibes makes every lesson fun."',
      shareable: "At the end of your 6 weeks, you get a pro-mixed shareable recording of your songs!",
    },
    about: {
      title: "About Alan",
      text: "I'm a bilingual music instructor who loves teaching total beginners. I play, I sing, and I'll patiently help you find your groove.",
    },
    footerCTA: "Your first lesson is free",
    footerRights: "All rights reserved.",
    plan: {
      yourStage: "Your Stage",
      yourPlan: "Your Personalized 6-Week Plan",
      earTitle: "Your Ear Check",
      earSummary: (score: number) => `You got ${score} of 3 listening checks right.`,
      earFlagNote: "We'll spend a little extra time on ear training — totally normal, and it makes everything easier.",
      earGoodNote: "Your ears are in great shape for this program.",
      week: "Week",
      yourSongs: "Your songs this week:",
      lightVariant: "Light variant — sized to fit your practice schedule.",
      deferred: "Gentle pacing note",
      practiceLabel: (mins: number, days: number) => `Your plan is built around ${mins} minutes, ${days} days a week.`,
      fasttrackTitle: "You're a perfect fit for the Singer-Songwriter Fast-Track",
      fasttrackDesc: "The Layer stage is the heart of my method — and exactly what the Fast-Track program is built around. Six weeks of 1-on-1, a custom curriculum, and a final recording of your 3 songs.",
      fasttrackCta: "See the program",
      bookTrial: "Book your free trial",
      loading: "Loading your plan...",
      notFound: "We couldn't find that plan. Double-check your link, or do the voice intake again from the home page.",
      backHome: "Back to home",
      stages: {
        S: {
          name: "Separate",
          explain: "Right now, your hands or your voice still need their own dedicated time. That's exactly where everyone starts — first we master the hands, then we master the voice. Combination comes later, and it comes easier because of this.",
        },
        L: {
          name: "Layer",
          explain: "Each part works on its own, but things fall apart when you combine them. This is the core of my method: we slowly bring hands and voice together using our proven rhythmic grid.",
        },
        P: {
          name: "Perform",
          explain: "You can already combine playing and singing roughly — now we add dynamics, polish, and repertoire so you flow through full songs effortlessly.",
        },
      },
    },
  },
  es: {
    nav: {
      home: "Inicio",
      method: "El Método",
      pricing: "Precios",
      about: "Sobre Mí",
      book: "Reserva",
    },
    hero: {
      headline: "Aprende a tocar la guitarra y cantar tus canciones favoritas en 6 semanas",
      subhead: "El método definitivo 1 a 1 para que principiantes absolutos dominen la coordinación.",
      bookTrial: "Reserva tu clase gratis",
      watchMe: "Mírame tocar",
      findStage: "Descubre tu etapa",
      welcome: "¡Bienvenido al ritmo!",
    },
    problem: {
      title: "Coordinar Voz y Manos",
      desc: "La mayoría se rinde porque intentar rasguear y cantar al mismo tiempo parece imposible. Lo desglosamos para que tu cerebro pueda procesarlo.",
      card1: { title: "Separar", text: "Primero, dominamos las manos. Luego, dominamos la voz." },
      card2: { title: "Conectar", text: "Lentamente los unimos usando nuestra cuadrícula rítmica." },
      card3: { title: "Actuar", text: "Para la semana 6, tocarás 3 canciones completas sin esfuerzo." },
    },
    intake: {
      title: "Conoce a Tu Mentor de IA",
      subtitle: "10 minutos por voz. Descubre tu etapa y recibe tu plan personalizado de 6 semanas.",
      desc: "Habla con mi mentor de IA para una charla rápida y amigable de ubicación. Escucha dónde estás con tus manos, tu voz y tu coordinación — y construye tu entrada personalizada al programa de 6 semanas.",
      micNote: "Necesitarás un micrófono. Se recomiendan auriculares.",
      fallback: "¿Prefieres hablar primero con un humano?",
      clips: {
        clipA: "Clip A",
        clipB: "Clip B",
        listen: "Escucha ambos clips y luego dile tu respuesta al mentor.",
        nowPlaying: "Reproduciendo",
        replay: "Repetir",
        done: "Ambos clips sonaron — repítelos cuando quieras y responde en voz alta.",
      },
    },
    pricing: {
      title: "Precios",
      beginner: { name: "Principiante Absoluto", price: "desde {{PRICE_BEGINNER}}", desc: "Enfoque 1 a 1" },
      bundle: { name: "Paquete Intermedio", price: "desde {{PRICE_BUNDLE}}", desc: "Ahorra con el paquete" },
      fasttrack: {
        name: "Programa Acelerado Para Cantautores",
        price: "desde {{PRICE_FASTTRACK}}",
        desc: "Via Rápida de 6 semanas. ¡El más popular!",
        features: ["6 semanas 1 a 1", "Plan a tu medida", "Grabación final"],
        mostPopular: "¡El Más Popular!",
      },
    },
    timeline: {
      title: "Cómo funciona",
      weeks: [
        "Semana 1: Fundamentos Rítmicos",
        "Semana 2: Transiciones de Acordes",
        "Semana 3: Aislamiento Vocal",
        "Semana 4: Zapada",
        "Semana 5: Dinámicas",
        "Semana 6: Graba Tus 3 Canciones",
      ],
    },
    social: {
      title: "Lo que dicen los alumnos",
      t1: '"Intenté por años y no podía. ¡Alan arregló mi ritmo en 2 semanas!"',
      t2: '"La mejor inversión en mis hobbies. La buena onda hace cada clase divertida."',
      shareable: "¡Al final de las 6 semanas, obtienes una grabación profesional para compartir!",
    },
    about: {
      title: "Sobre Alan",
      text: "Soy un instructor bilingüe que ama enseñar a principiantes. Toco, canto y te ayudaré con paciencia a encontrar tu ritmo.",
    },
    footerCTA: "Tu primera clase es gratis",
    footerRights: "Todos los derechos reservados.",
    plan: {
      yourStage: "Tu Etapa",
      yourPlan: "Tu Plan Personalizado de 6 Semanas",
      earTitle: "Tu Chequeo de Oído",
      earSummary: (score: number) => `Acertaste ${score} de 3 pruebas de escucha.`,
      earFlagNote: "Dedicaremos un poco más de tiempo al entrenamiento auditivo — es totalmente normal, y hace que todo sea más fácil.",
      earGoodNote: "Tu oído está en excelente forma para este programa.",
      week: "Semana",
      yourSongs: "Tus canciones esta semana:",
      lightVariant: "Variante ligera — ajustada a tu horario de práctica.",
      deferred: "Nota de ritmo suave",
      practiceLabel: (mins: number, days: number) => `Tu plan está construido alrededor de ${mins} minutos, ${days} días por semana.`,
      fasttrackTitle: "Eres perfecto para el Programa Acelerado Para Cantautores",
      fasttrackDesc: "La etapa de Conexión es el corazón de mi método — y exactamente para lo que está construido el Programa Acelerado. Seis semanas 1 a 1, un plan a tu medida y una grabación final de tus 3 canciones.",
      fasttrackCta: "Ver el programa",
      bookTrial: "Reserva tu clase gratis",
      loading: "Cargando tu plan...",
      notFound: "No encontramos ese plan. Verifica tu enlace, o vuelve a hacer la entrevista de voz desde la página de inicio.",
      backHome: "Volver al inicio",
      stages: {
        S: {
          name: "Separar",
          explain: "Ahora mismo, tus manos o tu voz todavía necesitan su propio tiempo dedicado. Así empieza todo el mundo — primero dominamos las manos, luego dominamos la voz. La combinación viene después, y viene más fácil gracias a esto.",
        },
        L: {
          name: "Conectar",
          explain: "Cada parte funciona por su cuenta, pero todo se desarma cuando las combinas. Este es el corazón de mi método: unimos lentamente manos y voz usando nuestra cuadrícula rítmica probada.",
        },
        P: {
          name: "Actuar",
          explain: "Ya puedes combinar tocar y cantar de forma aproximada — ahora añadimos dinámicas, pulido y repertorio para que fluyas por canciones completas sin esfuerzo.",
        },
      },
    },
  },
} as const

export type Messages = typeof messages.en

export function getMessages(lang: Language): Messages {
  return (lang === "es" ? messages.es : messages.en) as unknown as Messages
}

export function stageName(stage: Stage, lang: Language): string {
  return getMessages(lang).plan.stages[stage].name
}

export const PLACEHOLDERS = {
  PRICE_BEGINNER: "€30/hr",
  PRICE_BUNDLE: "€150/mo",
  PRICE_FASTTRACK: "€299",
  DEMO_VIDEO_ID: "dQw4w9WgXcQ",
  SITE_URL: "https://alanmaizon.com",
}

export function renderPrice(text: string): string {
  return text
    .replace("{{PRICE_BEGINNER}}", PLACEHOLDERS.PRICE_BEGINNER)
    .replace("{{PRICE_BUNDLE}}", PLACEHOLDERS.PRICE_BUNDLE)
    .replace("{{PRICE_FASTTRACK}}", PLACEHOLDERS.PRICE_FASTTRACK)
}
