import type { MouseEventHandler, ReactNode } from "react"

interface RetroButtonProps {
  children: ReactNode
  href?: string
  variant?: "primary" | "secondary" | "accent"
  className?: string
  onClick?: MouseEventHandler
}

export function RetroButton({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
}: RetroButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center px-8 py-4 font-bold text-xl border-4 border-foreground rounded-full transition-all motion-safe:hover:-translate-y-1 motion-safe:hover:-translate-x-1 focus:outline-none focus:ring-4 focus:ring-accent-pink"

  const variants: Record<string, string> = {
    primary:
      "bg-primary text-foreground shadow-[6px_6px_0px_#FF2E9F] hover:shadow-[10px_10px_0px_#FF2E9F]",
    secondary:
      "bg-accent-lime text-foreground shadow-[6px_6px_0px_#7B2FF7] hover:shadow-[10px_10px_0px_#7B2FF7]",
    accent:
      "bg-accent-yellow text-foreground shadow-[6px_6px_0px_#00C2A8] hover:shadow-[10px_10px_0px_#00C2A8]",
  }

  if (href) {
    return (
      <a href={href} className={`${baseClasses} ${variants[variant]} ${className}`} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </button>
  )
}

export function WavyDividerBottom({ fill = "#FF6B35" }: { fill?: string }) {
  return (
    <svg className="w-full h-auto block -mb-1" viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,80C672,64,768,64,864,74.7C960,85,1056,107,1152,106.7C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
        fill={fill}
      ></path>
    </svg>
  )
}

export function WavyDividerTop({ fill = "#FF6B35" }: { fill?: string }) {
  return (
    <svg className="w-full h-auto block -mt-1" viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M0,64L48,53.3C96,43,192,21,288,26.7C384,32,480,64,576,80C672,96,768,96,864,85.3C960,75,1056,53,1152,48C1248,43,1344,53,1392,58.7L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
        fill={fill}
      ></path>
    </svg>
  )
}
