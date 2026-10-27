import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { BadgeCheck, Building2, FileSignature, Globe2, Landmark, MapPin, UserCheck } from 'lucide-react'
import { metadataDePagina } from '@/lib/seo/site'
import { prisma } from '@/lib/prisma'
import { getPublicConfig } from '@/lib/config'
import { esBot } from '@/lib/partners'
import PartnerLandingClient from '../[slug]/PartnerLandingClient'
import FormularioBase93 from './FormularioBase93'

/**
 * Landing propia de Base93 (red internacional de constitución de sociedades).
 * Le gana a /partners/[slug] por ser ruta estática. En inglés por defecto y en
 * español con ?lang=es. Los planes en pesos salen de la configuración; los
 * servicios para extranjeros están en dólares y los fijó Fernando (27/10/2026).
 * Sin plazos de constitución: Fernando no quiere prometer tiempos.
 */

const SLUG = 'base93'
const DESCUENTO = 10
const WHATSAPP = 'https://wa.me/5493512136212'

/** Honorarios en dólares sin descuento. */
const USD = { paquete: 2000, cdi: 450, busqueda: 300, domicilio: 350 }

type Idioma = 'en' | 'es'

const TEXTOS = {
  en: {
    insignia: 'Base93 partner offer',
    titulo: 'Incorporate your company in Argentina, fully online',
    bajada: `Base93 clients get ${DESCUENTO}% off every QuieroMiSAS fee. Local entrepreneurs and foreign investors, from the first form to a company with its tax ID.`,
    ctaCotizar: 'Request a quote',
    ctaEmpezar: 'Start online',
    datos: [
      { valor: `${DESCUENTO}%`, texto: 'off every QMS fee' },
      { valor: '100% online', texto: 'from the form to the tax ID' },
      { valor: 'Córdoba + Buenos Aires', texto: 'jurisdictions' },
    ],
    localesTitulo: 'For Argentine residents',
    localesBajada: 'S.A.S. incorporation plans. Fees plus VAT. Government fees (approx. USD 200) and the 25% share capital deposit, which is recoverable, are extra.',
    extranjerosTitulo: 'For foreign investors',
    extranjerosBajada: 'Fees in US dollars, plus VAT. Government fees (approx. USD 200) and the 25% share capital deposit, which is recoverable, are extra. Each case is quoted before work starts.',
    antes: 'Standard',
    elegir: 'Start with',
    planes: {
      BASICO: { nombre: 'Basic', items: ['Incorporation of the S.A.S.', 'CUIT (tax ID)', 'Guide to the digital corporate books'] },
      EMPRENDEDOR: { nombre: 'Entrepreneur', items: ['Everything in Basic', 'Ready to invoice'] },
      PREMIUM: { nombre: 'Premium', items: ['Everything in Entrepreneur', 'Digital corporate books set up', 'Monthly corporate advisory meeting'] },
    },
    servicios: {
      paquete: {
        nombre: 'Foreign-investor package',
        detalle: 'We incorporate the S.A.S., transfer the shares to the foreign shareholders, prepare documents that protect them in their relationship with the resident director, and advise on opening the bank account.',
      },
      cdi: {
        nombre: 'CDI tax ID, per shareholder',
        detalle: 'Every foreign shareholder needs a CDI from ARCA. In person in Argentina, or remotely with an apostilled and translated power of attorney. It can take up to 2 months.',
      },
      busqueda: {
        nombre: 'Resident-director search',
        detalle: 'Directors must reside in Argentina. We find a candidate; the director’s monthly fee is agreed in each case.',
      },
      domicilio: {
        nombre: 'Registered address in Córdoba',
        detalle: 'The company’s legal address at our office in Córdoba. Billed yearly.',
      },
    },
    porAnio: '/ year',
    comoTitulo: 'How it works for foreign investors',
    pasos: [
      { titulo: 'Quote', texto: 'Send us the shareholders, the business and the jurisdiction. We reply with a full quote.' },
      { titulo: 'CDI and power of attorney', texto: 'Each foreign shareholder applies for a CDI, in Argentina or remotely through an apostilled power of attorney.' },
      { titulo: 'Incorporation', texto: 'We incorporate the company while the CDI is in progress, so you don’t have to wait for it.' },
      { titulo: 'Share transfer', texto: 'Once the CDI is issued, we transfer the shares to the foreign shareholders.' },
    ],
    requisitosTitulo: 'What you need',
    requisitos: [
      'Passport of each foreign shareholder (Argentine ID for residents)',
      'Power of attorney, apostilled and translated into Spanish, if you don’t travel',
      'For corporate shareholders: incorporation and good-standing certificates, apostilled and translated',
      'Three name options, business purpose and share capital',
      'A director resident in Argentina, or our search service',
    ],
    nota: 'Prices as of October 2026, plus VAT. Government fees are approx. USD 200 and are passed through at cost. The 25% share capital deposit is recoverable. The minimum share capital is two national minimum wages.',
    contactoTitulo: 'Talk to us',
    contactoTexto: 'Mention Base93 and we apply the discount to your quote.',
    email: 'Email us',
    whatsapp: 'WhatsApp',
    asunto: 'Base93 referral – quote request',
  },
  es: {
    insignia: 'Beneficio para clientes de Base93',
    titulo: 'Constituí tu sociedad en Argentina, 100% online',
    bajada: `Los clientes de Base93 tienen un ${DESCUENTO}% de descuento en todos los honorarios de QuieroMiSAS. Para emprendedores locales e inversores del exterior, del primer formulario a la sociedad con CUIT.`,
    ctaCotizar: 'Pedir presupuesto',
    ctaEmpezar: 'Empezar online',
    datos: [
      { valor: `${DESCUENTO}%`, texto: 'en todos los honorarios' },
      { valor: '100% online', texto: 'del formulario al CUIT' },
      { valor: 'Córdoba + CABA', texto: 'jurisdicciones' },
    ],
    localesTitulo: 'Para residentes en Argentina',
    localesBajada: 'Planes de constitución de S.A.S. Honorarios más IVA. Aparte: las tasas (aprox. USD 200) y el depósito del 25% del capital social, que es recuperable.',
    extranjerosTitulo: 'Para inversores del exterior',
    extranjerosBajada: 'Honorarios en dólares, más IVA. Aparte: las tasas (aprox. USD 200) y el depósito del 25% del capital social, que es recuperable. Cada caso se presupuesta antes de empezar.',
    antes: 'Precio de lista',
    elegir: 'Empezar con',
    planes: {
      BASICO: { nombre: 'Básico', items: ['Constitución de la S.A.S.', 'CUIT', 'Guía de libros digitales'] },
      EMPRENDEDOR: { nombre: 'Emprendedor', items: ['Todo lo del plan Básico', 'Lista para facturar'] },
      PREMIUM: { nombre: 'Premium', items: ['Todo lo del plan Emprendedor', 'Alta de libros digitales', 'Reunión mensual de asesoría societaria'] },
    },
    servicios: {
      paquete: {
        nombre: 'Paquete para inversores del exterior',
        detalle: 'Constituimos la S.A.S., cedemos las acciones a los socios del exterior, preparamos la documentación que los protege frente al administrador y asesoramos en la apertura de la cuenta bancaria.',
      },
      cdi: {
        nombre: 'CDI ante ARCA, por socio',
        detalle: 'Cada socio extranjero necesita un CDI. Se tramita en Argentina o a distancia con un poder apostillado y traducido. Puede demorar hasta 2 meses.',
      },
      busqueda: {
        nombre: 'Búsqueda de administrador residente',
        detalle: 'El administrador tiene que residir en Argentina. Buscamos el candidato; su honorario mensual se acuerda en cada caso.',
      },
      domicilio: {
        nombre: 'Domicilio legal en Córdoba',
        detalle: 'El domicilio de la sociedad en nuestra oficina de Córdoba. Se abona por año.',
      },
    },
    porAnio: '/ año',
    comoTitulo: 'Cómo funciona para inversores del exterior',
    pasos: [
      { titulo: 'Presupuesto', texto: 'Contanos quiénes son los socios, la actividad y la jurisdicción. Te mandamos el presupuesto completo.' },
      { titulo: 'CDI y poder', texto: 'Cada socio del exterior tramita su CDI, en Argentina o a distancia con un poder apostillado.' },
      { titulo: 'Constitución', texto: 'Constituimos la sociedad mientras sale el CDI, sin esperarlo.' },
      { titulo: 'Cesión de acciones', texto: 'Con el CDI listo, cedemos las acciones a los socios del exterior.' },
    ],
    requisitosTitulo: 'Qué necesitás',
    requisitos: [
      'Pasaporte de cada socio del exterior (DNI para residentes)',
      'Poder apostillado y traducido al español, si no viajás',
      'Si el socio es una sociedad: certificado de constitución y de vigencia, apostillados y traducidos',
      'Tres opciones de nombre, objeto y capital social',
      'Un administrador residente en Argentina, o nuestro servicio de búsqueda',
    ],
    nota: 'Precios a octubre de 2026, más IVA. Las tasas rondan los USD 200 y se cobran al costo. El depósito del 25% del capital social es recuperable. El capital mínimo es de dos salarios mínimos.',
    contactoTitulo: 'Hablemos',
    contactoTexto: 'Decinos que venís de Base93 y aplicamos el descuento en tu presupuesto.',
    email: 'Escribinos',
    whatsapp: 'WhatsApp',
    asunto: 'Cliente de Base93: pedido de presupuesto',
  },
} as const

interface Props {
  searchParams: Promise<{ lang?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const idioma: Idioma = (await searchParams).lang === 'es' ? 'es' : 'en'
  return metadataDePagina({
    ruta: `/partners/${SLUG}`,
    titulo: idioma === 'es' ? 'Base93 | QuieroMiSAS' : 'Base93 · Incorporate in Argentina | QuieroMiSAS',
    descripcion: TEXTOS[idioma].bajada,
  })
}

export default async function Base93Page({ searchParams }: Props) {
  const idioma: Idioma = (await searchParams).lang === 'es' ? 'es' : 'en'
  const t = TEXTOS[idioma]
  const numero = (n: number) => n.toLocaleString(idioma === 'es' ? 'es-AR' : 'en-US')
  const conDescuento = (n: number) => Math.round(n * (1 - DESCUENTO / 100))

  const [partner, config] = await Promise.all([
    prisma.partner.findUnique({ where: { slug: SLUG }, select: { id: true } }),
    getPublicConfig(),
  ])
  if (!partner) notFound()

  const h = await headers()
  const userAgent = h.get('user-agent')
  if (!esBot(userAgent)) {
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const referrer = h.get('referer')
    after(() =>
      prisma.referralClick
        .create({ data: { partnerId: partner.id, ip, userAgent, referrer, landingPath: `/partners/${SLUG}` } })
        .catch(() => {}),
    )
  }

  const registro = `/registro?ref=${SLUG}`
  const mailto = `mailto:contacto@quieromisas.com?subject=${encodeURIComponent(t.asunto)}`
  const planes = (['BASICO', 'EMPRENDEDOR', 'PREMIUM'] as const).map((clave) => {
    const precio = {
      BASICO: config.precioPlanBasico,
      EMPRENDEDOR: config.precioPlanEmprendedor,
      PREMIUM: config.precioPlanPremium,
    }[clave]
    return { clave, ...t.planes[clave], precio, final: conDescuento(precio) }
  })
  const servicios = [
    { clave: 'paquete', icono: Building2, ...t.servicios.paquete, precio: USD.paquete, destacado: true },
    { clave: 'cdi', icono: FileSignature, ...t.servicios.cdi, precio: USD.cdi, destacado: false },
    { clave: 'busqueda', icono: UserCheck, ...t.servicios.busqueda, precio: USD.busqueda, destacado: false },
    { clave: 'domicilio', icono: MapPin, ...t.servicios.domicilio, precio: USD.domicilio, destacado: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-gray-50">
      <PartnerLandingClient slug={SLUG} />

      <header className="border-b border-line bg-surface">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/img/qms-logo-reg.png" alt="QuieroMiSAS" width={150} height={56} className="h-9 w-auto sm:h-11 md:h-12" />
            <span className="text-sm font-semibold text-gray-400" aria-hidden>×</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/img/partners/base93-logo.png" alt="Base93" width={800} height={141} className="h-5 w-auto md:h-6" />
          </Link>
          <nav aria-label={idioma === 'es' ? 'Idioma' : 'Language'} className="flex rounded-full border border-gray-200 p-1 text-sm font-semibold">
            {(['en', 'es'] as const).map((l) => (
              <Link
                key={l}
                href={l === 'en' ? `/partners/${SLUG}` : `/partners/${SLUG}?lang=es`}
                aria-current={l === idioma ? 'true' : undefined}
                hrefLang={l}
                className={`inline-flex min-h-9 min-w-11 items-center justify-center rounded-full px-3 transition ${l === idioma ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main lang={idioma} className="container mx-auto space-y-10 px-4 py-10 md:py-16">
        <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-gray-950 via-gray-900 to-brand-900 px-6 py-10 text-white shadow-[0_25px_80px_-40px_rgba(0,0,0,0.25)] md:px-12 md:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
            <Globe2 className="h-3.5 w-3.5" aria-hidden />
            {t.insignia}
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">{t.titulo}</h1>
          <p className="mt-5 max-w-2xl text-base text-white/80 md:text-lg">{t.bajada}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#caso" className="inline-flex items-center rounded-xl bg-white px-6 py-3 font-semibold text-brand-900 transition hover:bg-brand-50">
              {t.ctaCotizar}
            </a>
            <Link href={registro} className="inline-flex items-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
              {t.ctaEmpezar}
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
            {t.datos.map((d) => (
              <div key={d.texto} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-black">{d.valor}</div>
                <div className="mt-1 text-sm text-white/70">{d.texto}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:p-10">
          <h2 className="text-3xl font-black text-gray-900">{t.extranjerosTitulo}</h2>
          <p className="mt-2 max-w-3xl text-gray-600">{t.extranjerosBajada}</p>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-4">
            {servicios.map((s) => (
              <div key={s.clave} className={`flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${s.destacado ? 'border-brand-300 ring-2 ring-brand-100' : 'border-gray-200'}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <s.icono className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-4 text-xl font-black text-gray-900">{s.nombre}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">{s.detalle}</p>
                <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                  <div className="text-sm text-gray-500">
                    {t.antes} <span className="line-through">USD {numero(s.precio)}</span>
                  </div>
                  <div className="mt-1 text-3xl font-black text-gray-900">
                    USD {numero(conDescuento(s.precio))}
                    {s.clave === 'domicilio' && <span className="ml-1 text-base font-semibold text-gray-500">{t.porAnio}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black text-gray-900">{t.comoTitulo}</h2>
          <ol className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 lg:grid-cols-4">
            {t.pasos.map((p, i) => (
              <li key={p.titulo} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-black text-brand-700">0{i + 1}</div>
                <h3 className="mt-3 text-xl font-black text-gray-900">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:p-10">
          <h2 className="text-3xl font-black text-gray-900">{t.localesTitulo}</h2>
          <p className="mt-2 max-w-3xl text-gray-600">{t.localesBajada}</p>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
            {planes.map((p) => (
              <div key={p.clave} className={`flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${p.clave === 'EMPRENDEDOR' ? 'border-brand-300 ring-2 ring-brand-100' : 'border-gray-200'}`}>
                <h3 className="text-2xl font-black text-gray-900">{p.nombre}</h3>
                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  <div className="text-sm text-gray-500">
                    {t.antes} <span className="line-through">ARS {numero(p.precio)}</span>
                  </div>
                  <div className="mt-1 text-3xl font-black text-gray-900">ARS {numero(p.final)}</div>
                </div>
                <ul className="mt-5 flex-1 space-y-2">
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-700">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href={registro} className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white transition hover:bg-brand-800">
                  {t.elegir} {p.nombre}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:p-10">
            <h2 className="text-2xl font-black text-gray-900">{t.requisitosTitulo}</h2>
            <ul className="mt-5 space-y-3">
              {t.requisitos.map((r) => (
                <li key={r} className="flex gap-3 text-sm leading-6 text-gray-700">
                  <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-5 text-gray-500">{t.nota}</p>
          </div>
        </section>

        <section id="caso" className="mx-auto grid max-w-6xl scroll-mt-6 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:p-10">
            <FormularioBase93 idioma={idioma} />
          </div>
          <div className="flex flex-col justify-between rounded-[2rem] bg-gray-900 p-6 text-white md:p-10">
            <div>
              <h2 className="text-2xl font-black">{t.contactoTitulo}</h2>
              <p className="mt-2 text-white/75">{t.contactoTexto}</p>
              <p className="mt-4 text-sm text-white/60">contacto@quieromisas.com · +54 9 351 213 6212</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={mailto} className="inline-flex items-center rounded-xl bg-white px-5 py-3 font-semibold text-gray-900 transition hover:bg-brand-50">
                {t.email}
              </a>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10">
                {t.whatsapp}
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
