import { getAssessmentClip, getClipFiles } from "@/lib/clips"
import type { EarConcept } from "@/lib/types"

export const metadata = {
  title: "Clips QA",
  robots: { index: false, follow: false },
}

const CONCEPTS: EarConcept[] = ["rhythm", "tonal", "coord"]

/**
 * Hidden QA page for eyeballing the assessment clips and A/B randomization.
 * Not linked from anywhere. Gated by ?secret=DASHBOARD_SECRET.
 */
export default async function ClipsCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>
}) {
  const { secret } = await searchParams
  const expected = process.env.DASHBOARD_SECRET

  if (!expected || secret !== expected) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-8">
        <p className="font-bold text-xl text-foreground">Unauthorized</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <header>
          <h1 className="font-['Shrikhand'] text-3xl text-foreground">Clips QA</h1>
          <p className="font-medium text-foreground/70 mt-1">
            Internal check: real files, pairs, and A/B randomization. Not linked anywhere.
          </p>
        </header>

        {CONCEPTS.map((concept) => {
          const files = getClipFiles(concept)
          const samples = Array.from({ length: 5 }, () => getAssessmentClip(concept))

          return (
            <section
              key={concept}
              className="border-4 border-foreground rounded-2xl bg-card p-6 shadow-[4px_4px_0px_#2A0E45] flex flex-col gap-4"
            >
              <h2 className="font-bold text-2xl text-foreground capitalize">{concept}</h2>
              <p className="font-medium text-sm text-foreground/70">{files.promptToStudent}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <p className="font-bold text-sm text-foreground">
                    Correct: <code className="font-mono text-accent-pink">{files.correctClip}</code>
                  </p>
                  <audio controls preload="none" src={files.correctClip} className="w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-bold text-sm text-foreground">
                    Other: <code className="font-mono text-accent-pink">{files.otherClip}</code>
                  </p>
                  <audio controls preload="none" src={files.otherClip} className="w-full" />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-foreground mb-2">5 sample API results (A/B randomization)</h3>
                <table className="w-full text-left text-sm font-mono border-collapse">
                  <thead>
                    <tr className="border-b-2 border-foreground text-foreground">
                      <th className="py-1 pr-3">#</th>
                      <th className="py-1 pr-3">clipAUrl</th>
                      <th className="py-1 pr-3">clipBUrl</th>
                      <th className="py-1">correctAnswer</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/80">
                    {samples.map((s, i) => (
                      <tr key={i} className="border-b border-foreground/20">
                        <td className="py-1 pr-3">{i + 1}</td>
                        <td className="py-1 pr-3">{s.clipAUrl.replace("/clips/", "")}</td>
                        <td className="py-1 pr-3">{s.clipBUrl.replace("/clips/", "")}</td>
                        <td className="py-1 font-bold">{s.correctAnswer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
