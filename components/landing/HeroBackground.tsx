'use client'

type Variant = 'dot-grid' | 'beams' | 'silk'

interface HeroBackgroundProps {
  variant?: Variant
}

export function HeroBackground({ variant = 'dot-grid' }: HeroBackgroundProps) {
  if (variant === 'dot-grid') {
    return <DotGridBackground />
  }
  if (variant === 'beams') {
    return <BeamsBackground />
  }
  if (variant === 'silk') {
    return <SilkBackground />
  }
  return null
}

// Dot Grid: patrón sutil de puntos, profesional
function DotGridBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(153 29 35 / 0.25) 1.5px, transparent 0)`,
        backgroundSize: '24px 24px'
      }}
    />
  )
}

// Beams: haces de luz diagonales animados con gradiente brand
function BeamsBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute h-[200%] w-32 -rotate-12"
          style={{
            left: `${i * 15 - 10}%`,
            top: '-50%',
            background: `linear-gradient(90deg, transparent 0%, rgb(254 226 226) 30%, rgb(254 202 202) 50%, rgb(254 226 226) 70%, transparent 100%)`,
            animation: `beam-pulse 4s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`
          }}
        />
      ))}
    </div>
  )
}

// Silk: efecto sutil tipo seda - gradiente suave en rotación
function SilkBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-[0.35]"
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, transparent, rgb(254 202 202), rgb(254 226 226), transparent, rgb(254 242 242), rgb(254 202 202), transparent)',
          animation: 'spin-slow 45s linear infinite'
        }}
      />
    </div>
  )
}
