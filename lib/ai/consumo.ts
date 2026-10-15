/**
 * Lo que gasta la IA, leído de los reportes de uso y costo de Anthropic.
 *
 * Usa ANTHROPIC_ADMIN_KEY, una clave de administración que sólo consulta: no
 * genera nada ni gasta tokens. Los reportes cubren toda la organización de
 * Anthropic, así que el desglose por clave separa a esta plataforma de otros
 * proyectos que usen la misma cuenta.
 */

const API = 'https://api.anthropic.com/v1/organizations'

interface Bucket<T> {
  starting_at: string
  results: T[]
}

interface FilaCosto {
  amount: string
  model: string | null
  description: string
  token_type: string | null
}

interface FilaUso {
  api_key_id: string | null
  model: string | null
  uncached_input_tokens: number
  cache_read_input_tokens: number
  cache_creation: { ephemeral_5m_input_tokens: number; ephemeral_1h_input_tokens: number }
  output_tokens: number
}

interface ClaveApi {
  id: string
  name: string
  partial_key_hint: string | null
  status: string
}

export class ErrorConsumo extends Error {}

async function pedir<T>(ruta: string): Promise<T> {
  const clave = process.env.ANTHROPIC_ADMIN_KEY
  if (!clave) throw new ErrorConsumo('Falta ANTHROPIC_ADMIN_KEY.')
  const res = await fetch(`${API}/${ruta}`, {
    headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
    // Los datos aparecen unos 5 minutos después de cada pedido: no vale la pena
    // consultarlos más seguido.
    next: { revalidate: 300 },
  })
  if (res.status === 401 || res.status === 403) {
    throw new ErrorConsumo('La clave de administración no es válida o no tiene permiso.')
  }
  if (!res.ok) throw new ErrorConsumo(`Anthropic respondió ${res.status}.`)
  return res.json() as Promise<T>
}

/** Todos los días de un reporte, siguiendo las páginas. */
async function reporte<T>(ruta: string, params: string): Promise<Bucket<T>[]> {
  const dias: Bucket<T>[] = []
  let pagina: string | null = null
  do {
    const r: { data: Bucket<T>[]; has_more: boolean; next_page: string | null } = await pedir(
      `${ruta}?${params}${pagina ? `&page=${encodeURIComponent(pagina)}` : ''}`,
    )
    dias.push(...r.data)
    pagina = r.has_more ? r.next_page : null
  } while (pagina)
  return dias
}

// Los importes vienen en centavos de dólar, como texto decimal.
const dolares = (filas: FilaCosto[]) => filas.reduce((s, f) => s + Number(f.amount) / 100, 0)

/** «claude-opus-4-8» → «Opus 4.8». */
export function nombreModelo(m: string | null): string {
  if (!m) return 'Otros'
  const [familia, ...version] = m.replace(/^claude-/, '').split('-')
  return `${familia.charAt(0).toUpperCase()}${familia.slice(1)} ${version.join('.')}`.trim()
}

/** Si la clave del reporte es la que usa esta plataforma (por su pista visible). */
function esEstaPlataforma(hint: string | null): boolean {
  const propia = process.env.ANTHROPIC_API_KEY
  if (!propia || !hint) return false
  const [inicio, fin] = hint.split('...')
  return Boolean(inicio && fin && propia.startsWith(inicio) && propia.endsWith(fin))
}

export interface ConsumoIA {
  mes: { total: number; porDia: { dia: number; valor: number }[]; porModelo: { modelo: string; valor: number }[] }
  mesAnterior: number
  porClave: { nombre: string; propia: boolean; tokens: number }[]
  actualizado: string
}

export async function consumoIA(ahora = new Date()): Promise<ConsumoIA> {
  const inicioMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1))
  const inicioAnterior = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 1, 1))
  const desde = (d: Date) => `starting_at=${d.toISOString()}`

  const [costos, anterior, uso, claves] = await Promise.all([
    reporte<FilaCosto>('cost_report', `${desde(inicioMes)}&group_by[]=description&limit=31`),
    reporte<FilaCosto>(
      'cost_report',
      `${desde(inicioAnterior)}&ending_at=${inicioMes.toISOString()}&group_by[]=description&limit=31`,
    ),
    reporte<FilaUso>(
      'usage_report/messages',
      `${desde(inicioMes)}&bucket_width=1d&group_by[]=api_key_id&limit=31`,
    ),
    pedir<{ data: ClaveApi[] }>('api_keys?limit=100'),
  ])

  const porModelo = new Map<string, number>()
  for (const dia of costos) {
    for (const f of dia.results) {
      const m = nombreModelo(f.model)
      porModelo.set(m, (porModelo.get(m) ?? 0) + Number(f.amount) / 100)
    }
  }

  const nombres = new Map(claves.data.map((c) => [c.id, c]))
  const porClave = new Map<string, number>()
  for (const dia of uso) {
    for (const f of dia.results) {
      const id = f.api_key_id ?? 'consola'
      const escritura = f.cache_creation.ephemeral_5m_input_tokens + f.cache_creation.ephemeral_1h_input_tokens
      const tokens = f.uncached_input_tokens + f.cache_read_input_tokens + escritura + f.output_tokens
      porClave.set(id, (porClave.get(id) ?? 0) + tokens)
    }
  }

  return {
    mes: {
      total: costos.reduce((s, d) => s + dolares(d.results), 0),
      porDia: costos.map((d) => ({ dia: new Date(d.starting_at).getUTCDate(), valor: dolares(d.results) })),
      porModelo: [...porModelo].map(([modelo, valor]) => ({ modelo, valor })).sort((a, b) => b.valor - a.valor),
    },
    mesAnterior: anterior.reduce((s, d) => s + dolares(d.results), 0),
    porClave: [...porClave]
      .map(([id, tokens]) => {
        const c = nombres.get(id)
        return {
          nombre: c?.name ?? (id === 'consola' ? 'Consola (pruebas)' : id),
          propia: esEstaPlataforma(c?.partial_key_hint ?? null),
          tokens,
        }
      })
      .sort((a, b) => b.tokens - a.tokens),
    actualizado: new Date().toISOString(),
  }
}
