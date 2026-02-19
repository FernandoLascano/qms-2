'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, ReactNode } from 'react'

interface ParallaxCardProps {
  children: ReactNode
  className?: string
  /** Multiplicador de parallax: mayor = más movimiento. 0.1-0.3 suave, 0.3-0.5 más notable */
  intensity?: number
}

export function ParallaxCard({ children, className = '', intensity = 0.15 }: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [
    30 * intensity,
    0,
    0,
    -30 * intensity
  ])

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}
