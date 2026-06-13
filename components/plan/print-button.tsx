"use client"

import { Printer } from "lucide-react"

/** Triggers the browser print dialog (Save as PDF) for the plan page. */
export function PrintPlanButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 bg-background text-foreground font-bold px-5 py-2 rounded-full border-4 border-foreground shadow-[3px_3px_0px_var(--color-accent-purple)] transition-transform hover:-translate-y-0.5"
    >
      <Printer className="w-5 h-5" aria-hidden="true" />
      {label}
    </button>
  )
}
