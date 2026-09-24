import type { Metadata } from "next"
import { TrellisApp } from "@/components/trellis/trellis-app"

export const metadata: Metadata = {
  title: "TRELLIS Image-to-3D Lab | Alan Maizon",
  description: "Generate and benchmark 3D models from reference images with Microsoft TRELLIS.",
}

export default function HomePage() {
  return <TrellisApp />
}
