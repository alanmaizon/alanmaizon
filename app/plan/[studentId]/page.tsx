import { Suspense } from "react"
import { Sun } from "lucide-react"
import { PlanContent } from "@/components/plan/plan-content"
import { PlanError } from "@/components/plan/plan-error"
import { getStudentData } from "@/lib/students"

export const metadata = {
  title: "Your 6-Week Plan — Play & Sing with Alan",
}

function PlanLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      <Sun className="text-primary w-16 h-16 animate-spin-slow" aria-hidden="true" />
      <p className="font-bold text-2xl text-foreground animate-pulse">Loading your plan... / Cargando tu plan...</p>
    </div>
  )
}

async function PlanLoader({ studentId }: { studentId: string }) {
  let data
  try {
    data = await getStudentData(studentId)
  } catch (err) {
    console.error("[plan] Failed to load student data:", err)
    return <PlanError kind="error" />
  }

  if (!data) {
    return <PlanError kind="not-found" />
  }

  return <PlanContent profile={data.profile} earItems={data.earItems} plan={data.plan} />
}

export default async function PlanPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params

  return (
    <Suspense fallback={<PlanLoading />}>
      <PlanLoader studentId={studentId} />
    </Suspense>
  )
}
