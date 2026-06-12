"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import type { Language } from "@/lib/types"
import { getMessages, type Messages } from "@/lib/messages"

interface LanguageContextValue {
  lang: Language
  t: Messages
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode
  initialLang: Language
}) {
  const [lang, setLang] = useState<Language>(initialLang)

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "es" : "en"
      document.cookie = `ps_lang=${next}; path=/; max-age=31536000; samesite=lax`
      document.documentElement.lang = next
      return next
    })
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, t: getMessages(lang), toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}
