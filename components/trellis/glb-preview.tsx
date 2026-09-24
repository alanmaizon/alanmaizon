"use client"

import { useEffect, useRef, useState } from "react"
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color4 } from "@babylonjs/core"
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader"
import "@babylonjs/loaders/glTF"

export function GlbPreview({ url }: { url?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url || !canvasRef.current) return

    const canvas = canvasRef.current
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.04, 0.05, 0.06, 1)

    const camera = new ArcRotateCamera("camera", Math.PI / 3, Math.PI / 2.6, 3.5, Vector3.Zero(), scene)
    camera.attachControl(canvas, true)
    camera.wheelPrecision = 60

    new HemisphericLight("light", new Vector3(0.2, 1, 0.4), scene).intensity = 1.8

    SceneLoader.ImportMeshAsync("", url, "", scene)
      .then(({ meshes }) => {
        const visibleMeshes = meshes.filter((mesh) => mesh.getTotalVertices() > 0)
        if (visibleMeshes.length === 0) return

        let min = visibleMeshes[0].getBoundingInfo().boundingBox.minimumWorld.clone()
        let max = visibleMeshes[0].getBoundingInfo().boundingBox.maximumWorld.clone()
        for (const mesh of visibleMeshes.slice(1)) {
          const box = mesh.getBoundingInfo().boundingBox
          min = Vector3.Minimize(min, box.minimumWorld)
          max = Vector3.Maximize(max, box.maximumWorld)
        }
        const center = min.add(max).scale(0.5)
        const radius = Math.max(1, max.subtract(min).length() * 0.9)
        camera.target = center
        camera.radius = radius
      })
      .catch((err) => {
        console.error("[babylon] GLB load failed", err)
        setError("The GLB was generated, but the browser preview could not load it.")
      })

    engine.runRenderLoop(() => scene.render())
    const resize = () => engine.resize()
    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
      scene.dispose()
      engine.dispose()
    }
  }, [url])

  if (!url) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-500">
        Preview appears when a GLB is ready.
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[360px] overflow-hidden border border-zinc-800 bg-zinc-950">
      <canvas ref={canvasRef} className="h-full min-h-[360px] w-full touch-none" aria-label="Generated GLB preview" />
      {error ? (
        <div className="absolute inset-x-4 bottom-4 border border-red-500/40 bg-red-950/90 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
    </div>
  )
}
