'use client'

import { PASSWORD_MIN_CARACTERES } from '@/lib/validaciones'
import { cn } from '@/lib/utils'

/**
 * Fortaleza de la contraseña, tramo por tramo, con las reglas a la vista.
 *
 * Idea de interior.dev «password-strength» (MIT), rehecha en CSS y en
 * castellano. Es una guía: el único requisito sigue siendo el mínimo de
 * caracteres que valida el servidor (lib/validaciones.ts).
 */

// Las que más se prueban, más las obvias para este sitio.
const COMUNES = /^(?:contrase(?:n|ñ)a|password|passw0rd|qwerty|admin|123456|111111|123123|abc123|quieromisas|sas123)/i
const REPETIDA = /(.)\1{3,}/
const SECUENCIA = /(?:0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i

const REGLAS = [
  { id: 'largo', texto: '10 caracteres o más', cumple: (v: string) => v.length >= 10 },
  { id: 'mayus', texto: 'Mayúsculas y minúsculas', cumple: (v: string) => /[a-záéíóúñ]/.test(v) && /[A-ZÁÉÍÓÚÑ]/.test(v) },
  { id: 'numero', texto: 'Un número', cumple: (v: string) => /\d/.test(v) },
  { id: 'simbolo', texto: 'Un símbolo', cumple: (v: string) => /[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]/.test(v) },
] as const

const NIVELES = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'] as const

function evaluar(valor: string) {
  const reglas = REGLAS.map((r) => ({ ...r, ok: r.cumple(valor) }))
  const facil = valor.length > 0 && (COMUNES.test(valor) || REPETIDA.test(valor) || SECUENCIA.test(valor))
  const corta = valor.length < PASSWORD_MIN_CARACTERES
  const cumplidas = reglas.filter((r) => r.ok).length
  // Fácil de adivinar o por debajo del mínimo: nunca pasa de «Débil».
  const puntaje = valor.length === 0 ? 0 : facil || corta ? 1 : Math.max(1, cumplidas)
  return { reglas, facil, corta, puntaje }
}

const TONO = ['bg-n-300', 'bg-danger-solid', 'bg-warning-solid', 'bg-success-solid', 'bg-success-solid'] as const
const TONO_TEXTO = ['text-ink-3', 'text-danger', 'text-warning', 'text-success', 'text-success'] as const

export function PasswordStrength({ valor, className }: { valor: string; className?: string }) {
  const { reglas, facil, corta, puntaje } = evaluar(valor)
  const max = REGLAS.length

  return (
    <div className={cn('w-full', className)}>
      <div
        role="meter"
        aria-label="Fortaleza de la contraseña"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={puntaje}
        aria-valuetext={NIVELES[puntaje] || 'Vacía'}
        className="grid grid-cols-4 gap-1.5"
      >
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className="segmento-fortaleza relative h-1.5 overflow-hidden rounded-full bg-surface-3"
            data-lleno={i < puntaje}
          >
            <span className={cn('absolute inset-0 rounded-full', TONO[puntaje])} style={{ transitionDelay: i < puntaje ? `${i * 30}ms` : '0ms' }} />
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex h-5 items-center justify-between gap-3 text-label">
        <span className={cn('font-semibold transition-colors', TONO_TEXTO[puntaje])}>
          {corta ? `Mínimo ${PASSWORD_MIN_CARACTERES} caracteres` : NIVELES[puntaje]}
        </span>
        <span className={cn('text-warning transition-opacity', facil && !corta ? 'opacity-100' : 'opacity-0')} aria-hidden={!facil}>
          Muy fácil de adivinar
        </span>
      </div>

      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {reglas.map((r) => (
          <li key={r.id} className="flex items-center gap-1.5 text-label">
            <span
              className={cn(
                'grid size-3.5 shrink-0 place-items-center rounded-[4px] border transition-colors',
                r.ok ? 'border-success-solid bg-success-solid text-white' : 'border-line-strong text-transparent',
              )}
              aria-hidden
            >
              <svg viewBox="0 0 12 12" fill="none" className="tilde-dibujo size-2.5" data-activo={r.ok}>
                <path d="M2 6.2 4.7 8.9 10 3.3" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={cn('transition-colors', r.ok ? 'text-ink-2' : 'text-ink-3')}>{r.texto}</span>
            <span className="sr-only">{r.ok ? 'cumplido' : 'pendiente'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
