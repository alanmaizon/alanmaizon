import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import type { ReactNode } from "react"
import { LanguageProvider } from "@/components/language-provider"
import type { Language } from "@/lib/types"
import "./globals.css"

export const metadata: Metadata = {
  title: "Play & Sing with Alan — Learn Guitar & Singing in 6 Weeks",
  description:
    "The ultimate 1-on-1 method for absolute beginners to learn to play guitar and sing at the same time. Take the 10-minute AI voice intake to find your stage and get a personalized 6-week plan.",
}

export const viewport: Viewport = {
  themeColor: "#FDF3E3",
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const saved = cookieStore.get("ps_lang")?.value
  const initialLang: Language = saved === "es" ? "es" : "en"

  return (
    <html lang={initialLang} className="bg-background">
      <body className="font-sans antialiased">
        <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>
      </body>
    </html>
  )
}
