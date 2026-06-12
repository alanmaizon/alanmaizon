"use client"

import { useState, type FormEvent } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Lock, Users, Ear, CalendarDays, ArrowRight, Sun, RefreshCw } from "lucide-react"

interface StudentSummary {
  studentId: string
  language: string
  stage: string
  earScore: number
  earFlag: boolean
  practiceMins: number
  practiceDays: number
  coordinationQuote: string
  createdAt: string
}

const STAGE_COLORS: Record<string, string> = {
  S: "bg-accent-yellow",
  L: "bg-accent-lime",
  P: "bg-accent-teal",
}

async function fetcher([url, secret]: [string, string]) {
  const res = await fetch(url, { headers: { "x-dashboard-secret": secret } })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<{ students: StudentSummary[] }>
}

function SecretGate({ onSubmit }: { onSubmit: (secret: string) => void }) {
  const [value, setValue] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border-4 border-foreground rounded-3xl bg-card p-8 flex flex-col gap-5 shadow-[8px_8px_0px_var(--color-accent-pink)]"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-8 h-8 text-primary" aria-hidden="true" />
          <h1 className="font-bold text-2xl text-card-foreground">Teacher Dashboard</h1>
        </div>
        <p className="text-muted-foreground leading-relaxed">Enter the dashboard secret to view student intakes.</p>
        <label className="sr-only" htmlFor="dashboard-secret">
          Dashboard secret
        </label>
        <input
          id="dashboard-secret"
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Secret"
          autoComplete="off"
          className="border-4 border-foreground rounded-full px-5 py-3 text-lg bg-background text-foreground focus:outline-none focus:ring-4 focus:ring-accent-pink"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 font-bold text-lg border-4 border-foreground rounded-full bg-primary text-primary-foreground shadow-[6px_6px_0px_var(--color-accent-pink)] transition-all motion-safe:hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-accent-pink"
        >
          Unlock
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}

function StudentCard({ student }: { student: StudentSummary }) {
  const stageColor = STAGE_COLORS[student.stage] ?? "bg-accent-yellow"
  const date = student.createdAt ? new Date(student.createdAt).toLocaleDateString() : ""

  return (
    <li className="border-4 border-foreground rounded-3xl bg-card p-6 flex flex-col gap-3 shadow-[6px_6px_0px_var(--color-accent-teal)]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="font-mono text-sm text-muted-foreground break-all">{student.studentId}</span>
        <span
          className={`${stageColor} text-foreground font-bold px-4 py-1 rounded-full border-2 border-foreground text-sm`}
        >
          Stage {student.stage}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-card-foreground">
        <span className="flex items-center gap-2">
          <Ear className="w-5 h-5 text-primary" aria-hidden="true" />
          Ear: {student.earScore}
          {student.earFlag && (
            <span className="bg-accent-pink text-background font-bold text-xs px-2 py-0.5 rounded-full">FLAG</span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" aria-hidden="true" />
          {student.practiceMins} min × {student.practiceDays} days
        </span>
        <span className="text-muted-foreground">{student.language === "es" ? "Español" : "English"}</span>
      </div>
      {student.coordinationQuote && (
        <blockquote className="text-muted-foreground italic leading-relaxed border-l-4 border-accent-yellow pl-3">
          {student.coordinationQuote}
        </blockquote>
      )}
      <div className="flex items-center justify-between gap-3 mt-1">
        <span className="text-sm text-muted-foreground">{date}</span>
        <Link
          href={`/plan/${student.studentId}`}
          className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
        >
          View plan
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </li>
  )
}

export function DashboardClient() {
  const [secret, setSecret] = useState<string | null>(null)
  const { data, error, isLoading, mutate } = useSWR(secret ? ["/api/students", secret] : null, fetcher)

  if (!secret) {
    return <SecretGate onSubmit={setSecret} />
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary border-b-4 border-foreground">
        <div className="max-w-5xl mx-auto px-4 py-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Sun className="w-10 h-10 text-primary-foreground motion-safe:animate-spin-slow" aria-hidden="true" />
            <h1 className="font-bold text-3xl text-primary-foreground">Teacher Dashboard</h1>
          </div>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 px-5 py-2 font-bold border-4 border-foreground rounded-full bg-background text-foreground transition-all motion-safe:hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-accent-pink"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {isLoading && <p className="text-lg text-muted-foreground animate-pulse">Loading students...</p>}

        {error && (
          <div className="border-4 border-foreground rounded-3xl bg-card p-6 flex flex-col gap-4 max-w-md">
            <p className="text-card-foreground font-bold">{error.message}</p>
            <button onClick={() => setSecret(null)} className="font-bold text-primary hover:underline self-start">
              Try a different secret
            </button>
          </div>
        )}

        {data && (
          <>
            <p className="flex items-center gap-2 text-lg text-foreground font-bold mb-6">
              <Users className="w-6 h-6 text-primary" aria-hidden="true" />
              {data.students.length} student{data.students.length === 1 ? "" : "s"}
            </p>
            {data.students.length === 0 ? (
              <p className="text-muted-foreground text-lg">No intakes yet. Share the home page with students!</p>
            ) : (
              <ul className="grid gap-6 md:grid-cols-2">
                {data.students.map((s) => (
                  <StudentCard key={s.studentId} student={s} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  )
}
