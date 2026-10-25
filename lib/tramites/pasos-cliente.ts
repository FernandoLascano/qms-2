/**
 * Los pasos del trámite tal como los ve el cliente: la línea de tiempo del
 * trámite, el resumen del inicio y el email de «etapa completada» usan esta
 * misma lista, para que nunca muestren versiones distintas.
 *
 * Son 10 de los 14 pasos de ETAPAS_FLUJO: los internos de QMS (análisis de
 * homonimia, apertura de la cuenta) no se muestran, y el borrador (enviado +
 * aprobado) y la firma (enviados + firmados) cuentan como un solo paso.
 */

export type Responsable = 'cliente' | 'qms'

interface DefPaso {
  key: string
  campos: string[] // hecho cuando están todos
  label: string
  hecho: string
  pendiente: string
  responsable: Responsable
  fecha: string
}

const PASOS: DefPaso[] = [
  { key: 'formulario', campos: ['formularioCompleto'], label: 'Formulario', hecho: 'Datos de la sociedad cargados', pendiente: 'Completá el formulario', responsable: 'cliente', fecha: 'fechaFormularioCompleto' },
  { key: 'honorarios', campos: ['honorariosPagados'], label: 'Honorarios', hecho: 'Pago de honorarios confirmado', pendiente: 'Te contactamos para coordinar el pago', responsable: 'cliente', fecha: 'fechaHonorariosPagados' },
  { key: 'cidi', campos: ['ciudadanoDigitalOk'], label: 'Ciudadano Digital', hecho: 'Tenés Ciudadano Digital Nivel 2', pendiente: 'Obtené Ciudadano Digital Nivel 2 y avisanos', responsable: 'cliente', fecha: 'fechaCiudadanoDigitalOk' },
  { key: 'nombre', campos: ['denominacionReservada'], label: 'Nombre reservado', hecho: 'La denominación quedó reservada', pendiente: 'Estamos reservando el nombre de tu sociedad', responsable: 'qms', fecha: 'fechaDenominacionReservada' },
  { key: 'capital', campos: ['capitalDepositado'], label: 'Depósito del capital', hecho: '25% del capital depositado', pendiente: 'Depositá el 25% del capital', responsable: 'cliente', fecha: 'fechaCapitalDepositado' },
  { key: 'tasa', campos: ['tasaPagada'], label: 'Tasa', hecho: 'Tasa retributiva abonada', pendiente: 'Pagá la tasa del organismo', responsable: 'cliente', fecha: 'fechaTasaPagada' },
  { key: 'borrador', campos: ['borradorEnviado', 'borradorAprobadoCliente'], label: 'Borrador', hecho: 'Aprobaste el borrador', pendiente: 'Revisá y aprobá el borrador', responsable: 'cliente', fecha: 'fechaBorradorAprobadoCliente' },
  { key: 'firma', campos: ['documentosFirmados'], label: 'Firma', hecho: 'Documentos firmados', pendiente: 'Firmá los documentos con Ciudadano Digital', responsable: 'cliente', fecha: 'fechaDocumentosFirmados' },
  { key: 'ingreso', campos: ['tramiteIngresado'], label: 'Ingreso al organismo', hecho: 'Trámite presentado', pendiente: 'Estamos presentando el trámite', responsable: 'qms', fecha: 'fechaTramiteIngresado' },
  { key: 'inscripcion', campos: ['sociedadInscripta'], label: 'Sociedad inscripta', hecho: 'CUIT y matrícula asignados', pendiente: 'Esperamos la resolución (1 a 4 días hábiles)', responsable: 'qms', fecha: 'fechaSociedadInscripta' },
]

export interface PasoCliente {
  key: string
  label: string
  hecho: string
  pendiente: string
  responsable: Responsable
  completado: boolean
  actual: boolean
  fecha: Date | null
}

export interface AvanceCliente {
  pasos: PasoCliente[]
  completados: number
  total: number
  porcentaje: number
  /** -1 si ya está inscripta. */
  indiceActual: number
  inscripta: boolean
}

export function pasosCliente(tramite: Record<string, unknown>): AvanceCliente {
  const inscripta = Boolean(tramite.sociedadInscripta)
  const base = PASOS.map((p) => {
    const completado = inscripta || p.campos.every((c) => Boolean(tramite[c]))
    const valorFecha = tramite[p.fecha]
    // El borrador y la firma están del lado de QMS hasta que manda los archivos.
    let { pendiente, responsable } = p
    if (p.key === 'borrador' && !tramite.borradorEnviado) [pendiente, responsable] = ['Estamos preparando el borrador', 'qms']
    if (p.key === 'firma' && !tramite.documentosRevisados) [pendiente, responsable] = ['Estamos preparando los documentos para firmar', 'qms']
    return {
      key: p.key, label: p.label, hecho: p.hecho, pendiente, responsable, completado,
      fecha: valorFecha ? new Date(valorFecha as string) : null,
    }
  })
  const indiceActual = base.findIndex((p) => !p.completado)
  const pasos = base.map((p, i) => ({ ...p, actual: i === indiceActual }))
  const completados = pasos.filter((p) => p.completado).length
  return { pasos, completados, total: pasos.length, porcentaje: Math.round((completados / pasos.length) * 100), indiceActual, inscripta }
}
