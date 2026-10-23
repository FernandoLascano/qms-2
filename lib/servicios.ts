/**
 * Presentación de los servicios para el cliente: categorías, color de cada
 * uno, lo que incluye y qué sugerir según dónde está. Los datos que cambian
 * (nombre, precio, si está activo) siguen en la base (ServicioCatalogo); esto
 * es lo que no se edita desde el panel. Un slug nuevo que no esté acá igual se
 * muestra, en «Otros servicios».
 */

export type Modalidad = 'UNICO' | 'MENSUAL' | 'ANUAL' | 'SIN_COSTO' | 'A_CONSULTAR'

export interface ServicioCard {
  id: string
  slug: string
  nombre: string
  descripcion: string
  icono: string
  modalidad: Modalidad
  precioDesde: number | null
  precioTexto: string | null
}

export type Acento = 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6'

/** Color de cada servicio: así las tarjetas no son todas iguales. */
export const ACENTO_DE_SLUG: Record<string, Acento> = {
  'contable-mensual': 'a2',
  'registro-marca': 'a5',
  'libros-digitales': 'a3',
  'cuenta-bancaria': 'a4',
  'domicilio-sede': 'a6',
  'acta-estados-contables': 'a2',
  contratos: 'a1',
  actas: 'a3',
  'reformas-estatuto': 'a1',
  autoridades: 'a4',
  'aumento-capital': 'a5',
  'cambio-sede': 'a6',
}

/** Lo que incluye cada servicio destacado (sale de su descripción, en viñetas). */
export const INCLUYE: Record<string, string[]> = {
  'contable-mensual': ['Liquidación de impuestos', 'Presentaciones mensuales', 'Acompañamiento mes a mes'],
  'registro-marca': ['Búsqueda de antecedentes', 'Presentación ante el INPI', 'Seguimiento del trámite'],
  'libros-digitales': ['Rúbrica de los libros', 'Libros societarios y contables', 'Alta en el sistema'],
}

export const CATEGORIAS: { id: string; titulo: string; bajada: string; slugs: string[] }[] = [
  {
    id: 'arrancar',
    titulo: 'Para arrancar a operar',
    bajada: 'Lo que casi toda sociedad necesita en sus primeros meses.',
    slugs: ['contable-mensual', 'registro-marca', 'libros-digitales', 'cuenta-bancaria', 'domicilio-sede'],
  },
  {
    id: 'cambios',
    titulo: 'Cuando la sociedad crece o cambia',
    bajada: 'Trámites ante el registro para mantener la sociedad al día.',
    slugs: ['reformas-estatuto', 'autoridades', 'aumento-capital', 'cambio-sede'],
  },
  {
    id: 'documentos',
    titulo: 'Documentación de la sociedad',
    bajada: 'Actas y contratos hechos por profesionales.',
    slugs: ['acta-estados-contables', 'actas', 'contratos'],
  },
]

/** Los dos que van arriba de todo, grandes. */
export const DESTACADOS = ['contable-mensual', 'registro-marca']

/**
 * Qué ofrecer en el panel según el momento. Con la sociedad inscripta lo que
 * sigue es operar: contabilidad, marca y libros. Mientras el trámite avanza,
 * proteger el nombre y preparar la cuenta del banco.
 */
export const SUGERIDOS_INSCRIPTA = ['contable-mensual', 'registro-marca', 'libros-digitales']
export const SUGERIDOS_EN_CURSO = ['registro-marca', 'contable-mensual', 'cuenta-bancaria']

/** Precio para mostrar. Sin precio cargado: «Consultar». */
export function precioVisible(s: Pick<ServicioCard, 'modalidad' | 'precioDesde' | 'precioTexto'>): string {
  if (s.modalidad === 'SIN_COSTO') return 'Sin cargo'
  if (s.precioDesde == null) return 'A consultar'
  const monto = `$ ${Math.round(s.precioDesde).toLocaleString('es-AR')}`
  const periodo = s.modalidad === 'MENSUAL' ? ' por mes' : s.modalidad === 'ANUAL' ? ' por año' : ''
  return `Desde ${monto}${periodo}${s.precioTexto ? ` ${s.precioTexto}` : ''}`
}

/** Clases del acento (fondo suave, texto y borde) para el ícono de la tarjeta. */
export const CLASES_ACENTO: Record<Acento, { icono: string; borde: string; fondo: string }> = {
  a1: { icono: 'bg-a1-soft text-a1 ring-a1-line', borde: 'border-a1-line', fondo: 'bg-a1-soft' },
  a2: { icono: 'bg-a2-soft text-a2 ring-a2-line', borde: 'border-a2-line', fondo: 'bg-a2-soft' },
  a3: { icono: 'bg-a3-soft text-a3 ring-a3-line', borde: 'border-a3-line', fondo: 'bg-a3-soft' },
  a4: { icono: 'bg-a4-soft text-a4 ring-a4-line', borde: 'border-a4-line', fondo: 'bg-a4-soft' },
  a5: { icono: 'bg-a5-soft text-a5 ring-a5-line', borde: 'border-a5-line', fondo: 'bg-a5-soft' },
  a6: { icono: 'bg-a6-soft text-a6 ring-a6-line', borde: 'border-a6-line', fondo: 'bg-a6-soft' },
}
