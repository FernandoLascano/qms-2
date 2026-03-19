'use client'

import { motion } from 'framer-motion'

export function ArgentinaSilhouette() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 400 700"
        className="w-full h-full max-h-[400px] opacity-20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Silueta simplificada de Argentina */}
        <motion.path
          d="M220 30 L240 25 L260 35 L270 30 L280 40 L275 55 L285 60 L290 75 L280 85 L285 95 L275 105 L280 115 L270 120 L275 135 L265 145 L270 155 L260 165 L265 180 L255 190 L260 200 L250 215 L255 225 L245 240 L250 255 L240 265 L245 280 L235 290 L240 305 L230 315 L235 330 L225 340 L230 355 L220 365 L225 380 L215 395 L220 410 L210 425 L215 440 L205 455 L210 470 L195 485 L200 500 L185 515 L190 530 L175 545 L180 560 L165 575 L160 590 L150 600 L155 615 L145 625 L140 640 L130 650 L125 660 L115 665 L120 670 L110 675 L140 670 L145 660 L155 665 L160 655 L170 660 L175 650 L185 645 L190 635 L195 640 L200 625 L205 615 L210 620 L215 605 L220 595 L225 600 L230 585 L235 575 L240 580 L245 565 L250 555 L245 540 L250 525 L245 510 L250 495 L245 480 L250 465 L255 450 L250 435 L255 420 L260 405 L255 390 L260 375 L265 360 L260 345 L265 330 L270 315 L265 300 L270 285 L275 270 L270 255 L275 240 L280 225 L275 210 L280 195 L285 180 L280 165 L275 150 L270 140 L265 130 L260 120 L250 110 L245 95 L240 80 L235 65 L230 50 L225 40 Z"
          fill="white"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </svg>

      {/* Marcador pulsante en Córdoba */}
      <motion.div
        className="absolute"
        style={{ top: '42%', left: '42%' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5, type: 'spring', bounce: 0.5 }}
      >
        {/* Pulso */}
        <motion.div
          className="absolute inset-0 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30"
          animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40"
          animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
        />

        {/* Pin */}
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          <div className="w-5 h-5 rounded-full bg-white shadow-lg shadow-white/50 border-2 border-white/80" />
        </div>

        {/* Label */}
        <motion.div
          className="absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
            <p className="text-white font-bold text-xs">Córdoba</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
