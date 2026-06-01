import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  PlayCircle,
  Star,
  Music,
  Heart,
  Sun,
  ArrowRight,
  Check,
} from "lucide-react";
import { content } from "./content";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

const PLACEHOLDERS = {
  PRICE_BEGINNER: "€30/hr",
  PRICE_BUNDLE: "€150/mo",
  PRICE_FASTTRACK: "€299",
  ABOUT_TEXT_EN:
    "I'm a bilingual music instructor who loves teaching total beginners. I play, I sing, and I'll patiently help you find your groove.",
  ABOUT_TEXT_ES:
    "Soy un instructor bilingüe que ama enseñar a principiantes. Toco, canto y te ayudaré con paciencia a encontrar tu ritmo.",
  DEMO_VIDEO_ID: "dQw4w9WgXcQ",
  CALENDLY_URL: "https://calendly.com/maizonalan/30min",
  SITE_URL: "https://alanmaizon.com",
};

const renderText = (text: string, lang: "en" | "es") => {
  let mapped = text.replace(
    "{{PRICE_BEGINNER}}",
    PLACEHOLDERS.PRICE_BEGINNER,
  );
  mapped = mapped.replace(
    "{{PRICE_BUNDLE}}",
    PLACEHOLDERS.PRICE_BUNDLE,
  );
  mapped = mapped.replace(
    "{{PRICE_FASTTRACK}}",
    PLACEHOLDERS.PRICE_FASTTRACK,
  );
  mapped = mapped.replace(
    "{{ABOUT_TEXT}}",
    lang === "en"
      ? PLACEHOLDERS.ABOUT_TEXT_EN
      : PLACEHOLDERS.ABOUT_TEXT_ES,
  );
  return mapped;
};

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;
const ADSENSE_SLOT = import.meta.env.VITE_ADSENSE_SLOT;

const AdSenseBanner = () => {
  useEffect(() => {
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT) return;

    const scriptId = "adsense-script";
    let script = document.getElementById(
      scriptId,
    ) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    const pushAd = () => {
      try {
        (
          (
            window as Window & {
              adsbygoogle?: unknown[];
            }
          ).adsbygoogle ||= []
        ).push({});
      } catch {
        // Ignore duplicate ad push errors during hot reloads.
      }
    };

    if (script.getAttribute("data-loaded") === "true") {
      pushAd();
      return;
    }

    const onLoad = () => {
      script?.setAttribute("data-loaded", "true");
      pushAd();
    };

    script.addEventListener("load", onLoad, { once: true });

    return () => {
      script?.removeEventListener("load", onLoad);
    };
  }, []);

  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) {
    return null;
  }

  return (
    <section className="bg-[#FDF3E3] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto border-4 border-[#2A0E45] rounded-2xl p-4 bg-white/80 shadow-[6px_6px_0px_#00C2A8]">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </section>
  );
};

const Button = ({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
}: any) => {
  const baseClasses =
    "inline-flex items-center justify-center px-8 py-4 font-['Fredoka'] font-bold text-xl border-4 border-[#2A0E45] rounded-full transition-all motion-safe:hover:-translate-y-1 motion-safe:hover:-translate-x-1 focus:outline-none focus:ring-4 focus:ring-[#FF2E9F]";

  const variants: Record<string, string> = {
    primary:
      "bg-[#FF6B35] text-[#2A0E45] shadow-[6px_6px_0px_#FF2E9F] hover:shadow-[10px_10px_0px_#FF2E9F]",
    secondary:
      "bg-[#C4F000] text-[#2A0E45] shadow-[6px_6px_0px_#7B2FF7] hover:shadow-[10px_10px_0px_#7B2FF7]",
    accent:
      "bg-[#FFD23F] text-[#2A0E45] shadow-[6px_6px_0px_#00C2A8] hover:shadow-[10px_10px_0px_#00C2A8]",
  };

  if (href) {
    return (
      <a
        href={href}
        className={`${baseClasses} ${variants[variant]} ${className}`}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const WavyDividerBottom = ({ fill = "#FF6B35" }) => (
  <svg
    className="w-full h-auto block -mb-1"
    viewBox="0 0 1440 120"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,80C672,64,768,64,864,74.7C960,85,1056,107,1152,106.7C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
      fill={fill}
    ></path>
  </svg>
);

const WavyDividerTop = ({ fill = "#FF6B35" }) => (
  <svg
    className="w-full h-auto block -mt-1"
    viewBox="0 0 1440 120"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0,64L48,53.3C96,43,192,21,288,26.7C384,32,480,64,576,80C672,96,768,96,864,85.3C960,75,1056,53,1152,48C1248,43,1344,53,1392,58.7L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
      fill={fill}
    ></path>
  </svg>
);

export default function App() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ps_lang");
    if (saved === "en" || saved === "es") {
      setLang(saved);
    } else {
      const browserLang = navigator.language;
      if (browserLang.startsWith("es")) {
        setLang("es");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ps_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = content[lang];
  const toggleLang = () =>
    setLang((l) => (l === "en" ? "es" : "en"));

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FDF3E3] text-[#2A0E45] font-['Fredoka'] overflow-x-hidden selection:bg-[#C4F000] selection:text-[#2A0E45]">
      {/* 1. Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDF3E3]/90 backdrop-blur-md border-b-4 border-[#2A0E45] shadow-[0_4px_0px_#FF2E9F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand */}
            <div
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            >
              <Sun
                className="text-[#FF6B35] w-8 h-8 animate-spin-slow"
                strokeWidth={2.5}
              />
              <span className="font-['Pacifico'] text-2xl md:text-3xl text-[#2A0E45] mt-1">
                {lang === "en" ? "Alan Maizon" : "Alan Maizon"}
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollTo("method")}
                className="font-bold text-lg hover:text-[#FF2E9F] hover:underline decoration-wavy decoration-2 underline-offset-4 transition-all"
              >
                {t.nav.method}
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="font-bold text-lg hover:text-[#FF2E9F] hover:underline decoration-wavy decoration-2 underline-offset-4 transition-all"
              >
                {t.nav.pricing}
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="font-bold text-lg hover:text-[#FF2E9F] hover:underline decoration-wavy decoration-2 underline-offset-4 transition-all"
              >
                {t.nav.about}
              </button>

              <button
                onClick={toggleLang}
                className="font-bold text-lg bg-[#2A0E45] text-[#FDF3E3] px-3 py-1 rounded-full border-2 border-[#2A0E45] hover:bg-[#FDF3E3] hover:text-[#2A0E45] transition-colors"
                aria-label="Toggle language"
              >
                {lang === "en" ? "ES" : "EN"}
              </button>

              <Button
                href={PLACEHOLDERS.CALENDLY_URL}
                variant="secondary"
                className="!py-2 !px-6 !text-lg"
              >
                {t.nav.book}
              </Button>
            </nav>

            {/* Mobile Nav Toggle */}
            <div className="flex md:hidden items-center gap-4">
              <button
                onClick={toggleLang}
                className="font-bold bg-[#2A0E45] text-[#FDF3E3] px-3 py-1 rounded-full border-2 border-[#2A0E45]"
              >
                {lang === "en" ? "ES" : "EN"}
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-[#2A0E45]"
              >
                {menuOpen ? (
                  <X size={32} />
                ) : (
                  <Menu size={32} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#FDF3E3] border-b-4 border-[#2A0E45] shadow-[0_4px_0px_#FF2E9F]">
            <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col items-center">
              <button
                onClick={() => scrollTo("method")}
                className="font-bold text-xl block w-full text-center py-2"
              >
                {t.nav.method}
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="font-bold text-xl block w-full text-center py-2"
              >
                {t.nav.pricing}
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="font-bold text-xl block w-full text-center py-2"
              >
                {t.nav.about}
              </button>
              <Button
                href={PLACEHOLDERS.CALENDLY_URL}
                variant="secondary"
                className="w-full max-w-[250px]"
              >
                {t.nav.book}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Psychedelic Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#FF6B35] via-[#FFD23F] to-[#FF2E9F] rounded-full blur-3xl opacity-30 animate-spin-slow pointer-events-none -z-10"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C4F000] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00C2A8] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000 pointer-events-none -z-10"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 px-6 py-2 border-4 border-[#2A0E45] rounded-full bg-[#FDF3E3] shadow-[4px_4px_0px_#00C2A8] rotate-[-2deg]">
            <span className="font-['Pacifico'] text-xl md:text-2xl text-[#FF2E9F]">
              {lang === "en"
                ? "Welcome to the groove!"
                : "¡Bienvenido al ritmo!"}
            </span>
          </div>

          <h1 className="font-['Shrikhand'] text-5xl md:text-7xl lg:text-8xl leading-tight mb-8 text-[#2A0E45]">
            {t.hero.headline}
          </h1>

          <p className="font-bold text-xl md:text-3xl mb-12 text-[#2A0E45] max-w-2xl mx-auto opacity-90 leading-relaxed">
            {t.hero.subhead}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button
              href={PLACEHOLDERS.CALENDLY_URL}
              variant="primary"
              className="w-full sm:w-auto text-2xl !px-10 !py-5"
            >
              {t.hero.bookTrial}
            </Button>
            <Button
              onClick={() => scrollTo("demo")}
              variant="accent"
              className="w-full sm:w-auto gap-2"
            >
              <PlayCircle className="w-6 h-6" />
              {t.hero.watchMe}
            </Button>
          </div>
        </div>
      </section>

      <WavyDividerBottom fill="#FF2E9F" />

      {/* 3. Demo Video */}
      <section
        id="demo"
        className="bg-[#FF2E9F] py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto">
          <div className="aspect-video bg-[#2A0E45] rounded-[2rem] border-8 border-[#FDF3E3] shadow-[12px_12px_0px_#FFD23F] overflow-hidden relative group">
            <iframe
              src={`https://www.youtube.com/embed/${PLACEHOLDERS.DEMO_VIDEO_ID}?rel=0`}
              title="Demo Video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

      <WavyDividerTop fill="#FF2E9F" />

      {/* 4. The Problem We Solve */}
      <section
        id="method"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-['Monoton'] text-4xl md:text-5xl lg:text-6xl text-[#7B2FF7] mb-6 tracking-wide">
              {t.problem.title}
            </h2>
            <p className="font-bold text-2xl max-w-3xl mx-auto leading-relaxed">
              {t.problem.desc}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              t.problem.card1,
              t.problem.card2,
              t.problem.card3,
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-[#FDF3E3] border-4 border-[#2A0E45] rounded-[2rem] p-8 shadow-[8px_8px_0px_#00C2A8] hover:-translate-y-2 hover:shadow-[12px_12px_0px_#00C2A8] transition-all"
              >
                <div className="w-16 h-16 bg-[#C4F000] border-4 border-[#2A0E45] rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_#2A0E45]">
                  <span className="font-['Shrikhand'] text-2xl">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="font-['Shrikhand'] text-3xl mb-4 text-[#FF6B35]">
                  {card.title}
                </h3>
                <p className="font-medium text-xl leading-relaxed">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WavyDividerBottom fill="#FF6B35" />

      {/* 5. Pricing */}
      <section
        id="pricing"
        className="bg-[#FF6B35] py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="font-['Shrikhand'] text-5xl md:text-7xl text-center text-[#FDF3E3] mb-16 shadow-black drop-shadow-lg">
            {t.pricing.title}
          </h2>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Beginner */}
            <div className="bg-[#FDF3E3] border-4 border-[#2A0E45] rounded-[2rem] p-8 shadow-[8px_8px_0px_#2A0E45] rotate-[-1deg]">
              <h3 className="font-['Pacifico'] text-3xl text-[#7B2FF7] mb-2">
                {t.pricing.beginner.name}
              </h3>
              <p className="font-bold text-lg mb-6 text-gray-600">
                {t.pricing.beginner.desc}
              </p>
              <div className="font-['Shrikhand'] text-4xl mb-8 text-[#2A0E45]">
                {renderText(t.pricing.beginner.price, lang)}
              </div>
              <Button
                href={PLACEHOLDERS.CALENDLY_URL}
                variant="secondary"
                className="w-full"
              >
                {t.nav.book}
              </Button>
            </div>

            {/* Fast-Track (Highlighted) */}
            <div className="bg-[#FFD23F] border-4 border-[#2A0E45] rounded-[3rem] p-10 shadow-[12px_12px_0px_#2A0E45] transform md:-translate-y-4 z-10 relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FF2E9F] text-[#FDF3E3] font-['Shrikhand'] px-6 py-2 rounded-full border-4 border-[#2A0E45] whitespace-nowrap rotate-[2deg]">
                {lang === "en"
                  ? "Most Popular!"
                  : "¡El Más Popular!"}
              </div>
              <h3 className="font-['Pacifico'] text-4xl text-[#2A0E45] mb-2 mt-4">
                {t.pricing.fasttrack.name}
              </h3>
              <p className="font-bold text-xl mb-6 text-[#2A0E45]">
                {t.pricing.fasttrack.desc}
              </p>
              <div className="font-['Shrikhand'] text-5xl mb-8 text-[#FF2E9F]">
                {renderText(t.pricing.fasttrack.price, lang)}
              </div>
              <ul className="mb-8 space-y-4 font-bold text-lg">
                {t.pricing.fasttrack.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3"
                  >
                    <Check className="text-[#FF2E9F]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                href={PLACEHOLDERS.CALENDLY_URL}
                variant="primary"
                className="w-full !text-2xl !py-5"
              >
                {t.nav.book}
              </Button>
            </div>

            {/* Bundle */}
            <div className="bg-[#FDF3E3] border-4 border-[#2A0E45] rounded-[2rem] p-8 shadow-[8px_8px_0px_#2A0E45] rotate-[1deg]">
              <h3 className="font-['Pacifico'] text-3xl text-[#00C2A8] mb-2">
                {t.pricing.bundle.name}
              </h3>
              <p className="font-bold text-lg mb-6 text-gray-600">
                {t.pricing.bundle.desc}
              </p>
              <div className="font-['Shrikhand'] text-4xl mb-8 text-[#2A0E45]">
                {renderText(t.pricing.bundle.price, lang)}
              </div>
              <Button
                href={PLACEHOLDERS.CALENDLY_URL}
                variant="secondary"
                className="w-full"
              >
                {t.nav.book}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <WavyDividerTop fill="#FF6B35" />

      {/* 6. How it works (Timeline) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FDF3E3]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-['Shrikhand'] text-5xl md:text-6xl text-center text-[#2A0E45] mb-16">
            {t.timeline.title}
          </h2>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1.5 before:bg-[#7B2FF7]">
            {[
              t.timeline.w1,
              t.timeline.w2,
              t.timeline.w3,
              t.timeline.w4,
              t.timeline.w5,
              t.timeline.w6,
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-[#2A0E45] bg-[#C4F000] text-[#2A0E45] font-['Shrikhand'] text-2xl shadow-[4px_4px_0px_#FF2E9F] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto">
                  {idx + 1}
                </div>
                <div className="w-[calc(100%-5rem)] md:w-[calc(50%-4rem)] bg-white border-4 border-[#2A0E45] rounded-2xl p-6 shadow-[6px_6px_0px_#00C2A8] rotate-[-1deg] group-even:rotate-[1deg]">
                  <p className="font-bold text-xl md:text-2xl">
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WavyDividerBottom fill="#7B2FF7" />

      {/* 7. Social Proof */}
      <section className="bg-[#7B2FF7] py-24 px-4 sm:px-6 lg:px-8 text-[#FDF3E3]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-['Monoton'] text-4xl md:text-5xl mb-16 text-[#C4F000]">
            {t.social.title}
          </h2>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="bg-[#2A0E45] p-10 rounded-[3rem] border-4 border-[#C4F000] shadow-[12px_12px_0px_#FF2E9F]">
              <div className="flex justify-center gap-2 mb-6 text-[#FFD23F]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} fill="currentColor" size={32} />
                ))}
              </div>
              <p className="font-bold text-2xl leading-relaxed italic mb-6">
                {t.social.t1}
              </p>
              <span className="font-['Pacifico'] text-2xl text-[#C4F000]">
                - Sarah M.
              </span>
            </div>

            <div className="bg-[#2A0E45] p-10 rounded-[3rem] border-4 border-[#00C2A8] shadow-[12px_12px_0px_#FFD23F]">
              <div className="flex justify-center gap-2 mb-6 text-[#FFD23F]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} fill="currentColor" size={32} />
                ))}
              </div>
              <p className="font-bold text-2xl leading-relaxed italic mb-6">
                {t.social.t2}
              </p>
              <span className="font-['Pacifico'] text-2xl text-[#00C2A8]">
                - Diego R.
              </span>
            </div>
          </div>

          <div className="bg-[#FF2E9F] inline-block px-8 py-6 rounded-full border-4 border-[#FDF3E3] shadow-[8px_8px_0px_#2A0E45] rotate-[-2deg]">
            <p className="font-['Shrikhand'] text-2xl md:text-3xl tracking-wide">
              {t.social.shareable}
            </p>
          </div>
        </div>
      </section>

      <WavyDividerTop fill="#7B2FF7" />

      {/* 8. About Alan */}
      <section
        id="about"
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2 relative">
            <div className="absolute inset-0 bg-[#FFD23F] rounded-[3rem] rotate-[-6deg] shadow-[12px_12px_0px_#2A0E45]"></div>
            <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-[#2A0E45] z-10">
              <ImageWithFallback
                src="https://res.cloudinary.com/dnkrfdjzl/image/upload/v1780307819/IMG_7029_ovkaym.jpg"
                alt="Alan playing guitar"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative organic shapes */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[#FF2E9F] rounded-full border-4 border-[#2A0E45] flex items-center justify-center shadow-[4px_4px_0px_#00C2A8] z-20 animate-spin-slow">
              <Music className="text-[#FDF3E3]" size={40} />
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <h2 className="font-['Shrikhand'] text-5xl md:text-6xl text-[#FF6B35] mb-8">
              {t.about.title}
            </h2>
            <p className="font-bold text-2xl leading-relaxed text-gray-800 mb-8">
              {renderText(t.about.text, lang)}
            </p>
            <div className="flex gap-4 text-[#00C2A8]">
              <Heart size={48} fill="currentColor" />
              <Heart
                size={48}
                fill="currentColor"
                className="opacity-70"
              />
              <Heart
                size={48}
                fill="currentColor"
                className="opacity-40"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final CTA Band */}
      <section className="bg-[#C4F000] py-20 px-4 sm:px-6 lg:px-8 border-y-8 border-[#2A0E45]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-['Shrikhand'] text-4xl md:text-6xl text-[#2A0E45] mb-10">
            {t.footerCTA}
          </h2>
          <Button
            href={PLACEHOLDERS.CALENDLY_URL}
            variant="primary"
            className="text-3xl !px-12 !py-6"
          >
            {t.hero.bookTrial}{" "}
            <ArrowRight className="ml-4" size={36} />
          </Button>
        </div>
      </section>

      <AdSenseBanner />

      {/* 10. Footer */}
      <footer className="bg-[#2A0E45] text-[#FDF3E3] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-90">
            <Sun className="text-[#FFD23F] w-8 h-8" />
            <span className="font-['Pacifico'] text-2xl">
              {lang === "en" ? "Alan Maizon" : "Alan Maizon"}
            </span>
          </div>

          <div className="font-medium opacity-70">
            &copy; {new Date().getFullYear()} Play &amp; Sing with Alan. All
            rights reserved.
          </div>

          <button
            onClick={toggleLang}
            className="font-bold text-sm bg-transparent border-2 border-[#FDF3E3] px-4 py-2 rounded-full hover:bg-[#FDF3E3] hover:text-[#2A0E45] transition-colors"
          >
            Language: {lang === "en" ? "English" : "Español"}
          </button>
        </div>
      </footer>
    </div>
  );
}