'use client'

import { motion } from 'framer-motion'

export function ArgentinaSilhouette() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden py-4">
      {/* Mapa de Argentina - usando una imagen con filtro para silueta blanca */}
      <motion.div
        className="relative w-full h-full max-h-[350px] flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/img/ar.svg"
          alt=""
          className="w-full h-full max-h-[350px] object-contain"
          style={{
            filter: 'brightness(0) invert(1) opacity(0.18)',
          }}
        />
      </motion.div>

      {/* Punto pulsante en Córdoba - basado en label_point cx=500.2 cy=279.7 sobre viewBox 1000x1000 = 50%, 28% */}
      <motion.div
        className="absolute"
        style={{ top: '38%', left: '50%' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5, type: 'spring', bounce: 0.5 }}
      >
        {/* Pulsos animados */}
        <motion.div
          className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20"
          animate={{ scale: [1, 3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30"
          animate={{ scale: [1, 2.5, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
        />

        {/* Pin central */}
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 rounded-full bg-white shadow-lg shadow-white/50" />
        </div>

        {/* Label */}
        <motion.div
          className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
            <p className="text-white font-bold text-sm">Córdoba</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
