/**
 * Lógica del formulario de nuevo trámite, sin React: tipos, listas, cálculo de
 * aportes y validación por paso. Está aparte para poder leerla (y probarla)
 * sin las 2000 líneas de pantalla alrededor.
 */
import { capitalMinimo } from '@/lib/precios'
import { parsearMonto } from '@/lib/montos'
import {
  validarActividadPrincipal,
  validarCbu,
  validarCuit,
  validarDenominacion,
  validarDni,
  validarEmail,
  validarFechaCierre,
  validarTelefono,
} from '@/lib/validaciones'

export interface Persona {
  nombre: string
  apellido: string
  dni: string
  cuit: string
  domicilio: string
  ciudad: string
  departamento: string
  provincia: string
  estadoCivil: string
  profesion: string
}

export interface Socio extends Persona {
  aporteCapital: string
  tipoAporte: 'MONTO' | 'PORCENTAJE'
  aportePorcentaje: string
}

export interface FormData {
  // Paso 1: Datos
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  plan: 'BASICO' | 'EMPRENDEDOR' | 'PREMIUM'
  jurisdiccion: 'CORDOBA' | 'CABA'
  // Paso 2: Nombre
  denominacion1: string
  denominacion2: string
  denominacion3: string
  marcaRegistrada: boolean
  // Paso 3: Objeto y sede
  objetoSocial: 'PREAPROBADO' | 'PERSONALIZADO'
  objetoPersonalizado: string
  actividadPrincipal: string
  sinDomicilio: boolean
  provinciaResidencia: string
  domicilio: string
  ciudad: string
  departamento: string
  provincia: string
  // Paso 4: Capital
  capitalSocial: string
  // Paso 5: Socios
  numeroSocios: number
  socios: Socio[]
  // Paso 6: Administración (el CBU del depósito va acá: es del titular)
  numeroAdministradores: number
  administradores: Persona[]
  cbuPrincipal: string
  cbuSecundario: string
  // Paso 7: Cierre
  fechaCierre: string
  asesoramientoContable: boolean
}

/** Errores por campo. La clave es la ruta del campo: `dni`, `socios.0.cuit`. */
export type Errores = Record<string, string>

export const TOTAL_PASOS = 7

/** Texto de relleno que el servidor guarda mientras el cliente no completó el campo. */
export const PENDIENTE = 'Pendiente de definir'

/** Un valor de relleno no es un dato del cliente: al retomar, el campo vuelve vacío. */
export function sinRelleno(valor: unknown): string {
  const texto = String(valor ?? '')
  return texto.trim() === PENDIENTE ? '' : texto
}

export function personaVacia(): Persona {
  return { nombre: '', apellido: '', dni: '', cuit: '', domicilio: '', ciudad: '', departamento: '', provincia: '', estadoCivil: '', profesion: '' }
}

export function socioVacio(): Socio {
  return { ...personaVacia(), aporteCapital: '0', tipoAporte: 'PORCENTAJE', aportePorcentaje: '0' }
}

export const ESTADOS_CIVILES = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a']

export const PROVINCIAS_AR = [
  'Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
]

/** Los 26 departamentos de Córdoba (faltaba Río Seco). */
export const DEPARTAMENTOS_CORDOBA = [
  'Calamuchita', 'Capital', 'Colón', 'Cruz del Eje', 'General Roca', 'General San Martín', 'Ischilín',
  'Juárez Celman', 'Marcos Juárez', 'Minas', 'Pocho', 'Presidente Roque Sáenz Peña', 'Punilla', 'Río Cuarto',
  'Río Primero', 'Río Seco', 'Río Segundo', 'San Alberto', 'San Javier', 'San Justo', 'Santa María',
  'Sobremonte', 'Tercero Arriba', 'Totoral', 'Tulumba', 'Unión',
]

/**
 * Ciudades de Córdoba con su departamento. Son sugerencias: la ciudad se
 * escribe libre (antes era una lista cerrada de 30 y quien vivía en Alta
 * Gracia o Río Ceballos no podía avanzar). Si coincide, se completa el
 * departamento solo.
 */
export const DEPARTAMENTO_DE_CIUDAD: Record<string, string> = {
  'Córdoba': 'Capital', 'Villa Carlos Paz': 'Punilla', 'Río Cuarto': 'Río Cuarto', 'Villa María': 'General San Martín',
  'San Francisco': 'San Justo', 'Alta Gracia': 'Santa María', 'Río Tercero': 'Tercero Arriba', 'Villa Allende': 'Colón',
  'Jesús María': 'Colón', 'La Calera': 'Colón', 'Río Ceballos': 'Colón', 'Mendiolaza': 'Colón', 'Unquillo': 'Colón',
  'Salsipuedes': 'Colón', 'Saldán': 'Colón', 'Malagueño': 'Santa María', 'Despeñaderos': 'Santa María',
  'Anisacate': 'Santa María', 'Villa Nueva': 'General San Martín', 'Oncativo': 'Río Segundo', 'Río Segundo': 'Río Segundo',
  'Pilar': 'Río Segundo', 'Villa del Rosario': 'Río Segundo', 'Oliva': 'Tercero Arriba', 'Hernando': 'Tercero Arriba',
  'Almafuerte': 'Tercero Arriba', 'Arroyito': 'San Justo', 'Las Varillas': 'San Justo', 'Morteros': 'San Justo',
  'Marcos Juárez': 'Marcos Juárez', 'Leones': 'Marcos Juárez', 'Corral de Bustos': 'Marcos Juárez', 'Cruz Alta': 'Marcos Juárez',
  'Bell Ville': 'Unión', 'Justiniano Posse': 'Unión', 'Monte Cristo': 'Río Primero', 'Villa Dolores': 'San Javier',
  'Cruz del Eje': 'Cruz del Eje', 'Deán Funes': 'Ischilín', 'Villa General Belgrano': 'Calamuchita',
  'Santa Rosa de Calamuchita': 'Calamuchita', 'Embalse': 'Calamuchita', 'La Falda': 'Punilla', 'Cosquín': 'Punilla',
  'Villa Giardino': 'Punilla', 'Capilla del Monte': 'Punilla', 'Tanti': 'Punilla', 'Bialet Massé': 'Punilla',
  'Huerta Grande': 'Punilla', 'Mina Clavero': 'San Alberto', 'Villa Cura Brochero': 'San Alberto',
  'General Cabrera': 'Juárez Celman', 'General Deheza': 'Juárez Celman', 'La Carlota': 'Juárez Celman',
  'Huinca Renancó': 'General Roca', 'Villa Huidobro': 'General Roca', 'Laboulaye': 'Presidente Roque Sáenz Peña',
  'Adelia María': 'Río Cuarto', 'Vicuña Mackenna': 'Río Cuarto',
}
export const CIUDADES_CORDOBA = Object.keys(DEPARTAMENTO_DE_CIUDAD).sort((a, b) => a.localeCompare(b, 'es'))

/** Departamento de una ciudad de Córdoba, sin importar mayúsculas ni tildes. */
export function departamentoDeCiudad(ciudad: string): string | undefined {
  const clave = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
  const buscada = clave(ciudad)
  const encontrada = Object.keys(DEPARTAMENTO_DE_CIUDAD).find((c) => clave(c) === buscada)
  return encontrada ? DEPARTAMENTO_DE_CIUDAD[encontrada] : undefined
}

// ── Aportes ────────────────────────────────────────────────────────────────

/** Lo que aporta un socio, calculado desde el campo que eligió completar. */
export function aporteDe(socio: Socio, capital: number): number {
  if (socio.tipoAporte === 'PORCENTAJE') {
    const pct = parseFloat(String(socio.aportePorcentaje || '0').replace(',', '.')) || 0
    return Math.round((capital * pct) / 100)
  }
  return parsearMonto(socio.aporteCapital)
}

export function totalAportes(socios: Socio[], capital: number): number {
  return socios.reduce((suma, s) => suma + aporteDe(s, capital), 0)
}

/**
 * Deja monto y porcentaje coherentes con el capital actual. Antes el monto de
 * un aporte en porcentaje se calculaba una sola vez: si después se cambiaba el
 * capital, se guardaban montos que ya no sumaban.
 */
export function normalizarSocios(socios: Socio[], capital: number): Socio[] {
  return socios.map((s) => {
    const monto = aporteDe(s, capital)
    const porcentaje = capital > 0 ? ((monto / capital) * 100).toFixed(2) : '0'
    return s.tipoAporte === 'PORCENTAJE'
      ? { ...s, aporteCapital: String(monto) }
      : { ...s, aporteCapital: String(monto), aportePorcentaje: porcentaje }
  })
}

/** Reparte el capital en partes iguales; el resto del redondeo va al primero. */
export function repartirEnPartesIguales(socios: Socio[], capital: number): Socio[] {
  const n = socios.length || 1
  const base = Math.floor(capital / n)
  return socios.map((s, i) => {
    const monto = i === 0 ? capital - base * (n - 1) : base
    return { ...s, tipoAporte: 'MONTO', aporteCapital: String(monto), aportePorcentaje: ((monto / capital) * 100).toFixed(2) }
  })
}

/** Lo que va al servidor (borrador o envío): montos limpios y aportes recalculados. */
export function datosParaGuardar(form: FormData): FormData {
  const capital = parsearMonto(form.capitalSocial)
  return {
    ...form,
    capitalSocial: String(capital),
    numeroSocios: form.socios.length,
    numeroAdministradores: form.administradores.length,
    socios: normalizarSocios(form.socios, capital),
  }
}

// ── Validación ─────────────────────────────────────────────────────────────

const requerido = (valor: unknown) => String(valor ?? '').trim() !== ''

function validarPersona(p: Persona, prefijo: string, errores: Errores) {
  const falta = (campo: keyof Persona, mensaje: string) => {
    if (!requerido(p[campo])) errores[`${prefijo}.${campo}`] = mensaje
  }
  falta('nombre', 'Completá el nombre')
  falta('apellido', 'Completá el apellido')
  const errDni = validarDni(p.dni)
  if (errDni) errores[`${prefijo}.dni`] = errDni
  const errCuit = validarCuit(p.cuit)
  if (errCuit) errores[`${prefijo}.cuit`] = errCuit
  falta('domicilio', 'Completá el domicilio')
  falta('ciudad', 'Completá la ciudad')
  falta('departamento', 'Completá el departamento')
  falta('provincia', 'Elegí la provincia')
  falta('estadoCivil', 'Elegí el estado civil')
  falta('profesion', 'Completá la profesión')
}

/** Errores de un paso. Vacío = se puede avanzar. */
export function erroresDelPaso(paso: number, f: FormData, smvm: number): Errores {
  const e: Errores = {}
  const poner = (campo: string, error: string | null | undefined) => {
    if (error) e[campo] = error
  }

  switch (paso) {
    case 1:
      if (!requerido(f.nombre)) e.nombre = 'Completá tu nombre'
      if (!requerido(f.apellido)) e.apellido = 'Completá tu apellido'
      poner('dni', validarDni(f.dni))
      poner('telefono', requerido(f.telefono) ? validarTelefono(f.telefono) : 'Completá tu teléfono')
      poner('email', requerido(f.email) ? validarEmail(f.email) : 'Completá tu email')
      break

    case 2: {
      const opciones = [f.denominacion1, f.denominacion2, f.denominacion3]
      opciones.forEach((valor, i) => {
        const campo = `denominacion${i + 1}`
        if (!requerido(valor)) {
          e[campo] = 'Completá esta opción'
          return
        }
        poner(campo, validarDenominacion(valor))
        // Tres opciones iguales no sirven de respaldo si la primera está tomada.
        const repetida = opciones.slice(0, i).findIndex((o) => o.trim().toLowerCase() === valor.trim().toLowerCase())
        if (!e[campo] && repetida >= 0) e[campo] = `Es igual a la opción ${repetida + 1}: proponé un nombre distinto`
      })
      break
    }

    case 3:
      if (f.objetoSocial === 'PERSONALIZADO') {
        if (!requerido(f.objetoPersonalizado)) e.objetoPersonalizado = 'Describí las actividades de la sociedad'
      } else {
        poner('actividadPrincipal', validarActividadPrincipal(f.actividadPrincipal))
      }
      if (!f.sinDomicilio) {
        if (!requerido(f.domicilio)) e.domicilio = 'Completá la dirección de la sede'
        if (!requerido(f.ciudad)) e.ciudad = 'Completá la ciudad'
        if (!requerido(f.departamento)) e.departamento = 'Elegí el departamento'
      }
      break

    case 4: {
      const minimo = capitalMinimo(smvm)
      if (parsearMonto(f.capitalSocial) < minimo) {
        e.capitalSocial = `El capital mínimo es ${minimo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}`
      }
      break
    }

    case 5: {
      const capital = parsearMonto(f.capitalSocial)
      f.socios.forEach((s, i) => {
        validarPersona(s, `socios.${i}`, e)
        if (aporteDe(s, capital) <= 0) e[`socios.${i}.aporte`] = 'Indicá cuánto aporta'
      })
      const dnis = f.socios.map((s) => s.dni.replace(/\D/g, ''))
      dnis.forEach((dni, i) => {
        if (dni && dnis.indexOf(dni) !== i && !e[`socios.${i}.dni`]) e[`socios.${i}.dni`] = `Es el mismo DNI que el socio ${dnis.indexOf(dni) + 1}`
      })
      const diferencia = capital - totalAportes(f.socios, capital)
      if (Math.abs(diferencia) > 1) {
        const monto = Math.abs(diferencia).toLocaleString('es-AR')
        e.aportes = diferencia > 0 ? `Falta asignar $ ${monto} del capital` : `Los aportes superan el capital en $ ${monto}`
      }
      break
    }

    case 6: {
      f.administradores.forEach((a, i) => validarPersona(a, `administradores.${i}`, e))
      const dnis = f.administradores.map((a) => a.dni.replace(/\D/g, ''))
      dnis.forEach((dni, i) => {
        if (dni && dnis.indexOf(dni) !== i && !e[`administradores.${i}.dni`]) {
          e[`administradores.${i}.dni`] = 'El titular y el suplente tienen que ser personas distintas'
        }
      })
      if (f.jurisdiccion === 'CORDOBA' && f.cbuPrincipal !== 'INFORMAR_LUEGO') {
        poner('cbuPrincipal', requerido(f.cbuPrincipal) ? validarCbu(f.cbuPrincipal) : 'Completá el CBU principal')
        poner('cbuSecundario', requerido(f.cbuSecundario) ? validarCbu(f.cbuSecundario) : 'Completá el CBU secundario')
        if (!e.cbuSecundario && requerido(f.cbuPrincipal) && f.cbuPrincipal.replace(/\D/g, '') === f.cbuSecundario.replace(/\D/g, '')) {
          e.cbuSecundario = 'Tiene que ser una cuenta distinta de la principal'
        }
      }
      break
    }

    case 7:
      poner('fechaCierre', validarFechaCierre(f.fechaCierre))
      break
  }
  return e
}

/** Primer paso con errores (para el envío final), o null si está todo bien. */
export function primerPasoConErrores(f: FormData, smvm: number): { paso: number; errores: Errores } | null {
  for (let paso = 1; paso <= TOTAL_PASOS; paso++) {
    const errores = erroresDelPaso(paso, f, smvm)
    if (Object.keys(errores).length > 0) return { paso, errores }
  }
  return null
}
