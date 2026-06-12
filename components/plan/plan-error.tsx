import { CloudRainWind } from "lucide-react"
import { RetroButton } from "@/components/retro"

export function PlanError({ kind }: { kind: "not-found" | "error" }) {
  const heading =
    kind === "not-found" ? "We couldn't find that plan / No encontramos ese plan" : "Something went wrong / Algo salió mal"
  const body =
    kind === "not-found"
      ? "Double-check your link, or chat with the mentor on the home page to create a new plan. / Revisa tu enlace, o habla con el mentor en la página de inicio para crear un plan nuevo."
      : "Please try again in a moment. / Por favor intenta de nuevo en un momento."

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4 text-center">
      <CloudRainWind className="w-16 h-16 text-primary" aria-hidden="true" />
      <h1 className="font-bold text-3xl text-foreground text-balance">{heading}</h1>
      <p className="text-lg text-muted-foreground max-w-md text-pretty">{body}</p>
      <RetroButton href="/" variant="primary">
        {"Back home / Volver al inicio"}
      </RetroButton>
    </main>
  )
}
