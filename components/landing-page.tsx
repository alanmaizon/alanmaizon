"use client"

import { useState } from "react"
import { Menu, X, Star, Music, Heart, Sun, ArrowRight, Check, Mic } from "lucide-react"
import { useLanguage } from "./language-provider"
import { RetroButton, WavyDividerBottom, WavyDividerTop } from "./retro"
import { IntakeMentor } from "./intake-mentor"
import { renderPrice, PLACEHOLDERS } from "@/lib/messages"

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || "https://calendly.com/maizonalan/30min"

export function LandingPage() {
  const { lang, t, toggleLang } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent-lime selection:text-foreground">
      {/* 1. Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b-4 border-foreground shadow-[0_4px_0px_#FF2E9F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Sun className="text-primary w-8 h-8 animate-spin-slow" strokeWidth={2.5} aria-hidden="true" />
              <span className="font-['Pacifico'] text-2xl md:text-3xl text-foreground mt-1">Alan Maizon</span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollTo("method")}
                className="font-bold text-lg hover:text-accent-pink hover:underline decoration-wavy decoration-2 underline-offset-4 transition-all"
              >
                {t.nav.method}
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="font-bold text-lg hover:text-accent-pink hover:underline decoration-wavy decoration-2 underline-offset-4 transition-all"
              >
                {t.nav.pricing}
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="font-bold text-lg hover:text-accent-pink hover:underline decoration-wavy decoration-2 underline-offset-4 transition-all"
              >
                {t.nav.about}
              </button>

              <button
                onClick={toggleLang}
                className="font-bold text-lg bg-foreground text-background px-3 py-1 rounded-full border-2 border-foreground hover:bg-background hover:text-foreground transition-colors"
                aria-label="Toggle language"
              >
                {lang === "en" ? "ES" : "EN"}
              </button>

              <RetroButton href={BOOKING_URL} variant="secondary" className="!py-2 !px-6 !text-lg">
                {t.nav.book}
              </RetroButton>
            </nav>

            {/* Mobile Nav Toggle */}
            <div className="flex md:hidden items-center gap-4">
              <button
                onClick={toggleLang}
                className="font-bold bg-foreground text-background px-3 py-1 rounded-full border-2 border-foreground"
                aria-label="Toggle language"
              >
                {lang === "en" ? "ES" : "EN"}
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-foreground"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <X size={32} /> : <Menu size={32} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-background border-b-4 border-foreground shadow-[0_4px_0px_#FF2E9F]">
            <div className="px-4 pt-2 pb-6 flex flex-col items-center gap-4">
              <button onClick={() => scrollTo("method")} className="font-bold text-xl block w-full text-center py-2">
                {t.nav.method}
              </button>
              <button onClick={() => scrollTo("pricing")} className="font-bold text-xl block w-full text-center py-2">
                {t.nav.pricing}
              </button>
              <button onClick={() => scrollTo("about")} className="font-bold text-xl block w-full text-center py-2">
                {t.nav.about}
              </button>
              <RetroButton href={BOOKING_URL} variant="secondary" className="w-full max-w-[250px]">
                {t.nav.book}
              </RetroButton>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 2. Hero */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4 sm:px-6 lg:px-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-primary via-accent-yellow to-accent-pink rounded-full blur-3xl opacity-30 animate-spin-slow pointer-events-none -z-10"></div>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-lime rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob pointer-events-none -z-10"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-teal rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob pointer-events-none -z-10"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-block mb-6 px-6 py-2 border-4 border-foreground rounded-full bg-background shadow-[4px_4px_0px_#00C2A8] rotate-[-2deg]">
              <span className="font-['Pacifico'] text-xl md:text-2xl text-accent-pink">{t.hero.welcome}</span>
            </div>

            <h1 className="font-['Shrikhand'] text-5xl md:text-7xl lg:text-8xl leading-tight mb-8 text-foreground text-balance">
              {t.hero.headline}
            </h1>

            <p className="font-bold text-xl md:text-3xl mb-12 text-foreground max-w-2xl mx-auto opacity-90 leading-relaxed text-pretty">
              {t.hero.subhead}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <RetroButton
                onClick={() => scrollTo("intake")}
                variant="primary"
                className="w-full sm:w-auto text-2xl !px-10 !py-5 gap-3"
              >
                <Mic className="w-7 h-7" aria-hidden="true" />
                {t.hero.findStage}
              </RetroButton>
              <RetroButton href={BOOKING_URL} variant="accent" className="w-full sm:w-auto gap-2">
                {t.hero.bookTrial}
              </RetroButton>
            </div>
          </div>
        </section>

        <WavyDividerBottom fill="#FF2E9F" />

        {/* 3. Demo Video */}
        <section id="demo" className="bg-accent-pink py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="aspect-video bg-foreground rounded-[2rem] border-8 border-background shadow-[12px_12px_0px_#FFD23F] overflow-hidden relative group">
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

        {/* 4. The Method */}
        <section id="method" className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-['Monoton'] text-4xl md:text-5xl lg:text-6xl text-accent-purple mb-6 tracking-wide text-balance">
                {t.problem.title}
              </h2>
              <p className="font-bold text-2xl max-w-3xl mx-auto leading-relaxed text-pretty">{t.problem.desc}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[t.problem.card1, t.problem.card2, t.problem.card3].map((card, idx) => (
                <div
                  key={idx}
                  className="bg-background border-4 border-foreground rounded-[2rem] p-8 shadow-[8px_8px_0px_#00C2A8] hover:-translate-y-2 hover:shadow-[12px_12px_0px_#00C2A8] transition-all"
                >
                  <div className="w-16 h-16 bg-accent-lime border-4 border-foreground rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_#2A0E45]">
                    <span className="font-['Shrikhand'] text-2xl">{idx + 1}</span>
                  </div>
                  <h3 className="font-['Shrikhand'] text-3xl mb-4 text-primary">{card.title}</h3>
                  <p className="font-medium text-xl leading-relaxed">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. AI Intake Mentor */}
        <WavyDividerBottom fill="#00C2A8" />
        <IntakeMentor />
        <WavyDividerTop fill="#00C2A8" />

        {/* 6. Pricing */}
        <WavyDividerBottom fill="#FF6B35" />
        <section id="pricing" className="bg-primary py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-['Shrikhand'] text-5xl md:text-7xl text-center text-background mb-16 drop-shadow-lg">
              {t.pricing.title}
            </h2>

            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Beginner */}
              <div className="bg-background border-4 border-foreground rounded-[2rem] p-8 shadow-[8px_8px_0px_#2A0E45] rotate-[-1deg]">
                <h3 className="font-['Pacifico'] text-3xl text-accent-purple mb-2">{t.pricing.beginner.name}</h3>
                <p className="font-bold text-lg mb-6 text-foreground/60">{t.pricing.beginner.desc}</p>
                <div className="font-['Shrikhand'] text-4xl mb-8 text-foreground">
                  {renderPrice(t.pricing.beginner.price)}
                </div>
                <RetroButton href={BOOKING_URL} variant="secondary" className="w-full">
                  {t.nav.book}
                </RetroButton>
              </div>

              {/* Fast-Track (Highlighted) */}
              <div
                id="fasttrack"
                className="bg-accent-yellow border-4 border-foreground rounded-[3rem] p-10 shadow-[12px_12px_0px_#2A0E45] transform md:-translate-y-4 z-10 relative"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-accent-pink text-background font-['Shrikhand'] px-6 py-2 rounded-full border-4 border-foreground whitespace-nowrap rotate-[2deg]">
                  {t.pricing.fasttrack.mostPopular}
                </div>
                <h3 className="font-['Pacifico'] text-4xl text-foreground mb-2 mt-4">{t.pricing.fasttrack.name}</h3>
                <p className="font-bold text-xl mb-6 text-foreground">{t.pricing.fasttrack.desc}</p>
                <div className="font-['Shrikhand'] text-5xl mb-8 text-accent-pink">
                  {renderPrice(t.pricing.fasttrack.price)}
                </div>
                <ul className="mb-8 flex flex-col gap-4 font-bold text-lg">
                  {t.pricing.fasttrack.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="text-accent-pink" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <RetroButton href={BOOKING_URL} variant="primary" className="w-full !text-2xl !py-5">
                  {t.nav.book}
                </RetroButton>
              </div>

              {/* Bundle */}
              <div className="bg-background border-4 border-foreground rounded-[2rem] p-8 shadow-[8px_8px_0px_#2A0E45] rotate-[1deg]">
                <h3 className="font-['Pacifico'] text-3xl text-accent-teal mb-2">{t.pricing.bundle.name}</h3>
                <p className="font-bold text-lg mb-6 text-foreground/60">{t.pricing.bundle.desc}</p>
                <div className="font-['Shrikhand'] text-4xl mb-8 text-foreground">
                  {renderPrice(t.pricing.bundle.price)}
                </div>
                <RetroButton href={BOOKING_URL} variant="secondary" className="w-full">
                  {t.nav.book}
                </RetroButton>
              </div>
            </div>
          </div>
        </section>

        <WavyDividerTop fill="#FF6B35" />

        {/* 7. How it works (Timeline) */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-['Shrikhand'] text-5xl md:text-6xl text-center text-foreground mb-16">
              {t.timeline.title}
            </h2>

            <div className="flex flex-col gap-6 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1.5 before:bg-accent-purple">
              {t.timeline.weeks.map((step, idx) => (
                <div
                  key={idx}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-foreground bg-accent-lime text-foreground font-['Shrikhand'] text-2xl shadow-[4px_4px_0px_#FF2E9F] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto">
                    {idx + 1}
                  </div>
                  <div className="w-[calc(100%-5rem)] md:w-[calc(50%-4rem)] bg-white border-4 border-foreground rounded-2xl p-6 shadow-[6px_6px_0px_#00C2A8] rotate-[-1deg] group-even:rotate-[1deg]">
                    <p className="font-bold text-xl md:text-2xl">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WavyDividerBottom fill="#7B2FF7" />

        {/* 8. Social Proof */}
        <section className="bg-accent-purple py-24 px-4 sm:px-6 lg:px-8 text-background">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="font-['Monoton'] text-4xl md:text-5xl mb-16 text-accent-lime">{t.social.title}</h2>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="bg-foreground p-10 rounded-[3rem] border-4 border-accent-lime shadow-[12px_12px_0px_#FF2E9F]">
                <div className="flex justify-center gap-2 mb-6 text-accent-yellow">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} fill="currentColor" size={32} aria-hidden="true" />
                  ))}
                </div>
                <p className="font-bold text-2xl leading-relaxed italic mb-6">{t.social.t1}</p>
                <span className="font-['Pacifico'] text-2xl text-accent-lime">- Sarah M.</span>
              </div>

              <div className="bg-foreground p-10 rounded-[3rem] border-4 border-accent-teal shadow-[12px_12px_0px_#FFD23F]">
                <div className="flex justify-center gap-2 mb-6 text-accent-yellow">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} fill="currentColor" size={32} aria-hidden="true" />
                  ))}
                </div>
                <p className="font-bold text-2xl leading-relaxed italic mb-6">{t.social.t2}</p>
                <span className="font-['Pacifico'] text-2xl text-accent-teal">- Diego R.</span>
              </div>
            </div>

            <div className="bg-accent-pink inline-block px-8 py-6 rounded-full border-4 border-background shadow-[8px_8px_0px_#2A0E45] rotate-[-2deg]">
              <p className="font-['Shrikhand'] text-2xl md:text-3xl tracking-wide text-balance">{t.social.shareable}</p>
            </div>
          </div>
        </section>

        <WavyDividerTop fill="#7B2FF7" />

        {/* 9. About Alan */}
        <section id="about" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 relative">
              <div className="absolute inset-0 bg-accent-yellow rounded-[3rem] rotate-[-6deg] shadow-[12px_12px_0px_#2A0E45]"></div>
              <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-foreground z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/dnkrfdjzl/image/upload/v1780307819/IMG_7029_ovkaym.jpg"
                  alt="Alan playing guitar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-accent-pink rounded-full border-4 border-foreground flex items-center justify-center shadow-[4px_4px_0px_#00C2A8] z-20 animate-spin-slow">
                <Music className="text-background" size={40} aria-hidden="true" />
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <h2 className="font-['Shrikhand'] text-5xl md:text-6xl text-primary mb-8">{t.about.title}</h2>
              <p className="font-bold text-2xl leading-relaxed text-foreground/80 mb-8">{t.about.text}</p>
              <div className="flex gap-4 text-accent-teal" aria-hidden="true">
                <Heart size={48} fill="currentColor" />
                <Heart size={48} fill="currentColor" className="opacity-70" />
                <Heart size={48} fill="currentColor" className="opacity-40" />
              </div>
            </div>
          </div>
        </section>

        {/* 10. Final CTA Band */}
        <section className="bg-accent-lime py-20 px-4 sm:px-6 lg:px-8 border-y-8 border-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-['Shrikhand'] text-4xl md:text-6xl text-foreground mb-10 text-balance">
              {t.footerCTA}
            </h2>
            <RetroButton href={BOOKING_URL} variant="primary" className="text-3xl !px-12 !py-6">
              {t.hero.bookTrial} <ArrowRight className="ml-4" size={36} aria-hidden="true" />
            </RetroButton>
          </div>
        </section>
      </main>

      {/* 11. Footer */}
      <footer className="bg-foreground text-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-90">
            <Sun className="text-accent-yellow w-8 h-8" aria-hidden="true" />
            <span className="font-['Pacifico'] text-2xl">Alan Maizon</span>
          </div>

          <div className="font-medium opacity-70">
            &copy; {new Date().getFullYear()} Play &amp; Sing with Alan. {t.footerRights}
          </div>

          <button
            onClick={toggleLang}
            className="font-bold text-sm bg-transparent border-2 border-background px-4 py-2 rounded-full hover:bg-background hover:text-foreground transition-colors"
          >
            Language: {lang === "en" ? "English" : "Español"}
          </button>
        </div>
      </footer>
    </div>
  )
}
