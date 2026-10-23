'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { TarjetaServicio, useConsultarServicio } from '@/components/cliente/ServiciosCatalogo'
import type { ServicioCard } from '@/lib/servicios'

/**
 * Servicios sugeridos en el panel del cliente. Antes los otros servicios sólo
 * aparecían si alguien entraba a «Servicios» desde el menú. El momento de
 * ofrecerlos es cuando la sociedad queda inscripta (contabilidad, marca,
 * libros); mientras tanto, lo que conviene adelantar.
 */
export function ServiciosSugeridos({
  servicios,
  inscripta,
  contratados,
}: {
  servicios: ServicioCard[]
  inscripta: boolean
  contratados: string[]
}) {
  const consulta = useConsultarServicio()
  if (servicios.length === 0) return null

  return (
    <section className="space-y-4">
      <SectionHeader
        title={inscripta ? 'Ahora que tu sociedad está inscripta' : 'Mientras avanzamos con tu trámite'}
        description={
          inscripta
            ? 'Lo que suelen necesitar las sociedades nuevas para empezar a operar.'
            : 'Cosas que podés ir adelantando para tu sociedad.'
        }
        as="h2"
        actions={
          <Button asChild variant="ghost" size="sm" className="h-10 sm:h-8">
            <Link href="/dashboard/servicios">
              Ver todos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {servicios.map((s) => (
          <TarjetaServicio key={s.id} servicio={s} contratado={contratados.includes(s.slug)} consulta={consulta} />
        ))}
      </div>
    </section>
  )
}
