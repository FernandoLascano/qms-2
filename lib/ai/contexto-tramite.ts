/**
 * Arma el texto que se le pasa a la IA sobre un trámite.
 *
 * Hay dos audiencias y no son intercambiables: la del cliente lleva sólo lo que
 * el cliente ya ve en su panel; la del admin suma lo interno. Lo que entra acá
 * es una lista explícita de campos: nada del trámite pasa "por las dudas".
 */
import { calcularAcciones } from '@/lib/tramites/acciones'
import { ETAPAS_FLUJO, resumenProgreso } from '@/lib/tramites/estado'
import { esObjetoPreAprobado } from '@/lib/objeto-social'
import { erroresFormatoTramite } from '@/lib/validaciones'
import { NOMBRES_CONCEPTO, nombreJurisdiccion, nombrePlan, pesos } from '@/lib/etiquetas'
import { fechaCorta } from '@/lib/fechas'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type AudienciaIA = 'cliente' | 'admin'

export interface TramiteParaIA {
  tramite: any
  pagos?: any[]
  enlacesPago?: any[]
  documentos?: any[]
  notificaciones?: any[]
  cuentasBancarias?: any[]
}

const lista = (valor: unknown): any[] => (Array.isArray(valor) ? valor : [])
const concepto = (c: string) => NOMBRES_CONCEPTO[c] ?? c
const numero = (valor: unknown) => Number(String(valor ?? '').replace('%', '').replace(',', '.'))

/** Lo que el cliente cargó en el formulario, tal cual. */
export function datosFormulario(tramite: any) {
  const datos = (tramite.datosUsuario ?? {}) as Record<string, unknown>
  const preAprobado = esObjetoPreAprobado(tramite.objetoSocial)
  return {
    jurisdiccion: nombreJurisdiccion(tramite.jurisdiccion),
    plan: nombrePlan(tramite.plan),
    denominaciones: [
      tramite.denominacionSocial1,
      tramite.denominacionSocial2,
      tramite.denominacionSocial3,
    ].filter(Boolean),
    objetoSocial: preAprobado
      ? 'PRE-APROBADO (el estándar de 14 actividades de QMS; no hay que revisarlo)'
      : tramite.objetoSocial,
    actividadPrincipalDeclarada: datos.actividadPrincipal ?? null,
    capitalSocial: tramite.capitalSocial,
    porcentajeIntegracion: tramite.porcentajeIntegracion,
    domicilioLegal: tramite.domicilioLegal,
    usaDomicilioDeQMS: Boolean(datos.sinDomicilio),
    fechaCierreEjercicio: datos.fechaCierre ?? null,
    solicitante: {
      nombre: datos.nombre,
      apellido: datos.apellido,
      dni: datos.dni,
      email: datos.email,
      telefono: datos.telefono,
      provinciaResidencia: datos.provinciaResidencia,
    },
    cbuPrincipal: datos.cbuPrincipal ?? null,
    cbuSecundario: datos.cbuSecundario ?? null,
    marcaRegistrada: datos.marcaRegistrada ?? null,
    socios: lista(tramite.socios),
    administradores: lista(tramite.administradores),
  }
}

/**
 * Controles que se hacen con código y no con IA: dígitos verificadores, sumas
 * y duplicados. Un modelo de lenguaje se equivoca haciendo cuentas; estas van
 * resueltas y la IA sólo las explica.
 */
export function chequeosAutomaticos(tramite: any): string[] {
  const datos = (tramite.datosUsuario ?? {}) as Record<string, unknown>
  const socios = lista(tramite.socios)
  const administradores = lista(tramite.administradores)

  const hallazgos = erroresFormatoTramite({
    ...datos,
    denominacion1: tramite.denominacionSocial1,
    denominacion2: tramite.denominacionSocial2,
    denominacion3: tramite.denominacionSocial3,
    socios,
    administradores,
  })

  if (socios.length === 0) hallazgos.push('No hay socios cargados.')

  const porcentajes = socios.map((s) => numero(s.porcentaje ?? s.aportePorcentaje))
  if (socios.length > 0 && porcentajes.every(Number.isFinite)) {
    const suma = porcentajes.reduce((a, b) => a + b, 0)
    if (Math.abs(suma - 100) > 0.01) {
      hallazgos.push(`Las participaciones de los socios suman ${suma}% y no 100%.`)
    }
  }

  const aportes = socios.map((s) => Number(s.aporteCapital))
  if (socios.length > 0 && aportes.every(Number.isFinite)) {
    const suma = aportes.reduce((a, b) => a + b, 0)
    if (Math.abs(suma - Number(tramite.capitalSocial)) > 1) {
      hallazgos.push(
        `Los aportes de los socios suman ${pesos(suma)} y el capital social es ${pesos(tramite.capitalSocial)}.`,
      )
    }
  }

  const repetidos = (personas: any[], rol: string) => {
    const vistos = new Set<string>()
    for (const p of personas) {
      const dni = String(p?.dni ?? '').replace(/\D/g, '')
      if (!dni) continue
      if (vistos.has(dni)) hallazgos.push(`Hay dos ${rol} con el mismo DNI (${dni}).`)
      vistos.add(dni)
    }
  }
  repetidos(socios, 'socios')
  repetidos(administradores, 'administradores')

  const cargos = administradores.map((a) => String(a?.cargo ?? '').toLowerCase())
  if (administradores.length > 0 && !cargos.some((c) => c.includes('titular'))) {
    hallazgos.push('No hay ningún administrador titular.')
  }
  if (administradores.length > 0 && !cargos.some((c) => c.includes('suplente'))) {
    hallazgos.push('No hay administrador suplente (la S.A.S. sin sindicatura lo necesita).')
  }

  const nombres = [
    tramite.denominacionSocial1,
    tramite.denominacionSocial2,
    tramite.denominacionSocial3,
  ]
    .filter(Boolean)
    .map((n: string) => n.trim().toLowerCase())
  if (new Set(nombres).size < nombres.length) {
    hallazgos.push('Hay opciones de denominación repetidas.')
  }

  return hallazgos
}

/** Dónde está el trámite y qué le toca a cada uno, en texto. */
export function estadoTramiteParaIA(
  { tramite, pagos = [], enlacesPago = [], documentos = [], notificaciones = [], cuentasBancarias = [] }: TramiteParaIA,
  audiencia: AudienciaIA,
): string {
  const progreso = resumenProgreso(tramite)
  const acciones = calcularAcciones({ tramite, pagos, enlacesPago, documentos, notificaciones })
  const lineas: string[] = []

  lineas.push(`Sociedad: ${tramite.denominacionAprobada || tramite.denominacionSocial1}`)
  if (tramite.denominacionAprobada) lineas.push('El nombre ya está reservado.')
  lineas.push(`Jurisdicción: ${nombreJurisdiccion(tramite.jurisdiccion)} · Plan: ${nombrePlan(tramite.plan)}`)
  lineas.push(`Capital social: ${pesos(tramite.capitalSocial)} (se deposita el ${tramite.porcentajeIntegracion}%)`)
  lineas.push(`Iniciado el ${fechaCorta(tramite.createdAt)}. Avance: ${progreso.completadas} de ${progreso.total} pasos.`)

  lineas.push('', 'Pasos del trámite:')
  for (const paso of ETAPAS_FLUJO) {
    const hecho = Boolean(tramite[paso.campo]) || Boolean(tramite.sociedadInscripta)
    const quien = paso.responsable === 'cliente' ? 'lo hace el cliente' : 'lo hace QMS'
    lineas.push(`- [${hecho ? 'hecho' : 'pendiente'}] ${paso.label} (${quien})`)
  }

  lineas.push('', 'Qué sigue ahora (esto es lo que el cliente ve en «Próximos pasos»):')
  for (const a of acciones) {
    const quien =
      a.responsable === 'cliente' ? 'Pendiente del cliente' : a.responsable === 'qms' ? 'Pendiente de QMS' : 'Sin pendientes'
    lineas.push(`- ${a.titulo} — ${quien}. ${a.descripcion}`)
  }

  const pagosVisibles = pagos.filter((p) => p.estado !== 'REEMBOLSADO')
  if (pagosVisibles.length > 0) {
    lineas.push('', 'Pagos:')
    for (const p of pagosVisibles) {
      lineas.push(`- ${concepto(p.concepto)}: ${pesos(p.monto)} — ${String(p.estado).toLowerCase()}`)
    }
  }

  if (enlacesPago.length > 0) {
    lineas.push('', 'Tasas con enlace de pago:')
    for (const e of enlacesPago) {
      const vence = e.fechaVencimiento ? `, vence el ${fechaCorta(e.fechaVencimiento)}` : ''
      lineas.push(`- ${concepto(e.concepto)}: ${pesos(e.monto)} — ${String(e.estado).toLowerCase()}${vence}`)
    }
  }

  for (const c of cuentasBancarias) {
    lineas.push(
      '',
      `Cuenta para el depósito del capital: ${c.banco}, CBU ${c.cbu}${c.alias ? `, alias ${c.alias}` : ''}, titular ${c.titular}. Monto a depositar: ${pesos(c.montoEsperado)}.`,
    )
  }

  if (tramite.instruccionesFirma) {
    lineas.push('', `Instrucciones de firma: ${tramite.instruccionesFirma}`)
  }
  if (tramite.tramiteObservado && tramite.observacionesOrganismo) {
    lineas.push('', `El organismo observó el trámite: ${tramite.observacionesOrganismo}`)
  }
  if (tramite.sociedadInscripta) {
    lineas.push(
      '',
      `Sociedad inscripta. CUIT: ${tramite.cuit ?? 'sin cargar'}. Matrícula: ${tramite.matricula ?? 'sin cargar'}.`,
    )
  }

  if (audiencia === 'admin') {
    lineas.push('', `Validación del formulario: ${tramite.estadoValidacion}`)
    if (tramite.observacionesValidacion) {
      lineas.push(`Correcciones pedidas: ${tramite.observacionesValidacion}`)
    }
    const porRevisar = documentos.filter((d) => d.estado === 'PENDIENTE').length
    if (porRevisar > 0) lineas.push(`Documentos del cliente sin revisar: ${porRevisar}`)
  }

  return lineas.join('\n')
}
