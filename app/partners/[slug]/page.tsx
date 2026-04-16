import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import PartnerLandingClient from './PartnerLandingClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const partner = await prisma.partner.findUnique({
    where: { slug, activo: true },
    select: { nombre: true, descuentoTipo: true, descuentoValor: true, aplicaDescuento: true },
  })

  if (!partner) {
    return { title: 'Partner no encontrado | QuieroMiSAS' }
  }

  return {
    title: `${partner.nombre} | QuieroMiSAS`,
    description: partner.aplicaDescuento && partner.descuentoValor
      ? `Conseguí beneficios exclusivos y ahorro en planes de constitución con ${partner.nombre}.`
      : `Beneficios exclusivos de ${partner.nombre} para constituir tu SAS.`,
  }
}

function formatPublicEconomicSummary(partner: {
  aplicaDescuento: boolean
  descuentoTipo: 'MONTO' | 'PORCENTAJE' | null
  descuentoValor: number | null
}) {
  const lines: string[] = []
  if (partner.aplicaDescuento && partner.descuentoValor) {
    if (partner.descuentoTipo === 'PORCENTAJE') {
      lines.push(`Descuento del ${partner.descuentoValor}% sobre valores actuales`)
    } else {
      lines.push(`Descuento fijo de $${partner.descuentoValor.toLocaleString('es-AR')}`)
    }
  }
  return lines
}

function applyDiscount(basePrice: number, partner: {
  aplicaDescuento: boolean
  descuentoTipo: 'MONTO' | 'PORCENTAJE' | null
  descuentoValor: number | null
}) {
  if (!partner.aplicaDescuento || !partner.descuentoValor) return basePrice
  if (partner.descuentoTipo === 'PORCENTAJE') {
    return Math.max(0, Math.round(basePrice * (1 - partner.descuentoValor / 100)))
  }
  return Math.max(0, Math.round(basePrice - partner.descuentoValor))
}

const PLAN_FEATURES = {
  BASICO: [
    'Constitución de sociedad',
    'Obtención de CUIT',
    'Guía de uso de libros digitales',
  ],
  EMPRENDEDOR: [
    'Todo lo del plan Básico',
    'Lista para facturar',
    'Acompañamiento para primera etapa operativa',
  ],
  PREMIUM: [
    'Todo lo del plan Emprendedor',
    'Alta de libros digitales',
    'Reunión de asesoría societaria mensual',
  ],
} as const

export default async function PartnerPage({ params }: Props) {
  const { slug } = await params

  const [partner, config] = await Promise.all([
    prisma.partner.findUnique({
      where: { slug, activo: true },
    }),
    prisma.config.findFirst({
      select: {
        precioPlanBasico: true,
        precioPlanEmprendedor: true,
        precioPlanPremium: true,
      },
    }),
  ])

  if (!partner) {
    notFound()
  }

  const headerStore = await headers()
  const forwardedFor = headerStore.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : null
  const userAgent = headerStore.get('user-agent')
  const referrer = headerStore.get('referer')

  prisma.referralClick.create({
    data: {
      partnerId: partner.id,
      ip,
      userAgent,
      referrer,
      landingPath: `/partners/${slug}`,
    },
  }).catch(() => {})

  const beneficios = Array.isArray(partner.beneficios) ? (partner.beneficios as string[]) : []
  const economicSummary = formatPublicEconomicSummary(partner)
  const basePrices = {
    BASICO: config?.precioPlanBasico ?? 285000,
    EMPRENDEDOR: config?.precioPlanEmprendedor ?? 320000,
    PREMIUM: config?.precioPlanPremium ?? 390000,
  }
  const plans = [
    {
      key: 'BASICO' as const,
      name: 'Basico',
      highlight: 'Para empezar rapido',
      description: 'Ideal si queres constituir tu SAS con un servicio claro, agil y costo eficiente.',
      accent: 'border-gray-200',
    },
    {
      key: 'EMPRENDEDOR' as const,
      name: 'Emprendedor',
      highlight: 'El mas elegido',
      description: 'Pensado para quienes quieren un extra de acompanamiento en la puesta en marcha.',
      accent: 'border-brand-300 ring-2 ring-brand-100',
    },
    {
      key: 'PREMIUM' as const,
      name: 'Premium',
      highlight: 'Cobertura ampliada',
      description: 'La opcion mas completa para quienes priorizan soporte y mayor alcance del servicio.',
      accent: 'border-gray-200',
    },
  ].map((plan) => {
    const original = basePrices[plan.key]
    const final = applyDiscount(original, partner)
    return {
      ...plan,
      original,
      final,
      savings: Math.max(0, original - final),
      features: PLAN_FEATURES[plan.key],
    }
  })
  const bestSavings = Math.max(...plans.map((plan) => plan.savings))

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-gray-50">
      <PartnerLandingClient slug={slug} />
      <Navbar hideAuthCtas />
      <main className="container mx-auto px-4 py-10 md:py-16 space-y-10">
        <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-[0_25px_80px_-40px_rgba(0,0,0,0.25)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-brand-900 px-8 py-10 text-white md:px-12 md:py-14">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                Convenio exclusivo
              </span>
              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight md:text-6xl">
                Constitui tu SAS con beneficios especiales de {partner.nombre}
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/80 md:text-lg">
                Accede a condiciones preferenciales, acompanamiento cercano y un proceso 100% digital para crear tu sociedad de forma simple y profesional.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/registro?ref=${encodeURIComponent(slug)}`}
                  className="inline-flex items-center rounded-xl bg-white px-6 py-3 font-semibold text-brand-900 hover:bg-brand-50 transition"
                >
                  Quiero empezar ahora
                </Link>
                <a
                  href="#planes-partner"
                  className="inline-flex items-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
                >
                  Ver precios con beneficio
                </a>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-black">{bestSavings > 0 ? `$${bestSavings.toLocaleString('es-AR')}` : '100%'}</div>
                  <div className="mt-1 text-sm text-white/70">{bestSavings > 0 ? 'Ahorro maximo estimado' : 'Proceso digital y guiado'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-black">3 planes</div>
                  <div className="mt-1 text-sm text-white/70">Con beneficio aplicado segun convenio</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-black">+ soporte</div>
                  <div className="mt-1 text-sm text-white/70">Te acompanamos de punta a punta</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-b from-brand-50 to-white px-8 py-10 md:px-10 md:py-14">
              {partner.logoUrl && (
                <img
                  src={partner.logoUrl}
                  alt={`Logo ${partner.nombre}`}
                  className="h-16 w-auto"
                />
              )}
              <div className="mt-6 rounded-3xl border border-white bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                  Beneficio visible para clientes
                </p>
                <h2 className="mt-2 text-2xl font-black text-gray-900">
                  Tu propuesta con {partner.nombre}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Estas condiciones se aplican al registrarte desde este link y avanzar con tu trámite.
                </p>
                {economicSummary.length > 0 ? (
                  <ul className="mt-5 space-y-3 text-sm text-gray-700">
                    {economicSummary.map((item) => (
                      <li key={item} className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 font-medium text-brand-900">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    Condiciones preferenciales sujetas al convenio vigente con este partner.
                  </div>
                )}
                <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Que incluye esta experiencia</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li>Proceso claro y acompanado</li>
                    <li>Beneficios aplicados sobre precios actuales</li>
                    <li>Inicio online en pocos minutos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-black text-brand-700">01</div>
            <h3 className="mt-3 text-xl font-black text-gray-900">Registrate con este convenio</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">Creá tu cuenta desde este link para que los beneficios queden asociados correctamente.</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-black text-brand-700">02</div>
            <h3 className="mt-3 text-xl font-black text-gray-900">Elegi el plan que mejor te calce</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">Vas a ver el valor estimado de cada plan con el beneficio ya reflejado de manera transparente.</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-black text-brand-700">03</div>
            <h3 className="mt-3 text-xl font-black text-gray-900">Avanzá con acompanamiento</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">Nuestro equipo te guia paso a paso para constituir tu SAS con el respaldo del convenio.</p>
          </div>
        </section>

        <section id="planes-partner" className="mx-auto max-w-6xl rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Planes con beneficio</p>
              <h2 className="mt-2 text-3xl font-black text-gray-900">Visualizá cuánto te puede salir cada opción</h2>
              <p className="mt-2 max-w-2xl text-gray-600">
                Mostramos el valor base vigente y el valor estimado con el beneficio de este convenio aplicado.
              </p>
            </div>
            {partner.aplicaDescuento && partner.descuentoValor ? (
              <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900">
                Beneficio aplicado automaticamente en esta simulacion
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                Precios estimados segun valores vigentes
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.key} className={`rounded-3xl border bg-white p-6 shadow-sm ${plan.accent}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">{plan.highlight}</p>
                    <h3 className="mt-2 text-2xl font-black text-gray-900">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{plan.description}</p>
                  </div>
                  {plan.savings > 0 && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      Ahorras ${plan.savings.toLocaleString('es-AR')}
                    </span>
                  )}
                </div>

                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  <div className="text-sm text-gray-500 line-through">
                    Desde ${plan.original.toLocaleString('es-AR')}
                  </div>
                  <div className="mt-1 text-4xl font-black text-gray-900">
                    ${plan.final.toLocaleString('es-AR')}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">No incluye tasas ni gastos de inscripcion segun jurisdiccion.</p>
                </div>

                <div className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-700">
                      {feature}
                    </div>
                  ))}
                </div>

                <Link
                  href={`/registro?ref=${encodeURIComponent(slug)}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800 transition"
                >
                  Elegir {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {beneficios.length > 0 && (
          <section className="mx-auto max-w-6xl rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm md:p-10">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Valor agregado</p>
                <h2 className="mt-2 text-3xl font-black text-gray-900">Beneficios incluidos en este convenio</h2>
              </div>
              <p className="max-w-xl text-sm text-gray-600">
                Ademas del beneficio economico, estas ventajas ayudan a que el proceso sea mas claro, rapido y acompanado.
              </p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {beneficios.map((item, index) => (
                <div key={item} className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">Beneficio {index + 1}</div>
                  <div className="mt-3 text-base font-semibold text-gray-900">{item}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/registro?ref=${encodeURIComponent(slug)}`}
                className="inline-flex items-center rounded-xl bg-brand-700 px-6 py-3 text-white font-semibold hover:bg-brand-800 transition"
              >
                Registrarme con este beneficio
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-gray-300 px-6 py-3 text-gray-700 font-semibold hover:border-brand-300 hover:text-brand-700 transition"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
