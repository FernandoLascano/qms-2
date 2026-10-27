'use client'

import type { PublicConfig } from '@/lib/config'
import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  AlertCircle, Briefcase, Building2, Calendar, Check, ChevronLeft, ChevronRight, Cloud, CloudOff, Copy,
  DollarSign, ExternalLink, Loader2, Pencil, Plus, RotateCw, Target, Trash2, User, UserCheck, Users,
} from 'lucide-react'
import Link from 'next/link'
import { PrecioDual } from '@/components/PrecioDual'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/ui/form-field'
import { Aviso } from '@/components/ui/aviso'
import { useFormValidation, validators } from '@/hooks/useFormValidation'
import JurisdiccionSelector from '@/components/JurisdiccionSelector'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAutoSave } from '@/hooks/useAutoSave'
import { trackEvent } from '@/lib/analytics'
import { capitalMinimo } from '@/lib/precios'
import { parsearMonto } from '@/lib/montos'
import { esObjetoPreAprobado } from '@/lib/objeto-social'
import { ACTIVIDAD_PRINCIPAL_MIN_CARACTERES, soloDigitos, validarDenominacion } from '@/lib/validaciones'
import { pesos, nombreJurisdiccion, nombrePlan } from '@/lib/etiquetas'
import { EtiquetaCarga } from '@/components/ui/etiqueta-carga'
import { cn } from '@/lib/utils'
import {
  CIUDADES_CORDOBA,
  DEPARTAMENTOS_CORDOBA,
  TOTAL_PASOS,
  aporteDe,
  datosParaGuardar,
  departamentoDeCiudad,
  erroresDelPaso,
  personaVacia,
  primerPasoConErrores,
  repartirEnPartesIguales,
  sinRelleno,
  socioVacio,
  totalAportes,
  type Errores,
  type FormData,
  type Persona,
  type Socio,
} from './formulario'
import { CampoSelect, LISTA_CIUDADES, PersonaCampos, TarjetaPersona } from './PersonaCampos'
import { CampoMonto } from './CampoMonto'

// Dónde vive quien completa el formulario (paso 1): no es la sede.
const PROVINCIAS_RESIDENCIA = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'Otro país',
]

/** Atajos del aporte de cada socio (paso Socios). */
const PORCENTAJES_RAPIDOS = [10, 25, 50, 51, 100]

const PASOS = [
  { id: 1, nombre: 'Datos', icon: User },
  { id: 2, nombre: 'Nombre', icon: Building2 },
  { id: 3, nombre: 'Objeto', icon: Target },
  { id: 4, nombre: 'Capital', icon: DollarSign },
  { id: 5, nombre: 'Socios', icon: Users },
  { id: 6, nombre: 'Administración', icon: Briefcase },
  { id: 7, nombre: 'Cierre', icon: Calendar },
]

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS_POR_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// ¿El cliente ya escribió algo en el formulario? (los valores por defecto no cuentan)
function tieneDatosCargados(data: FormData): boolean {
  const campos = [
    data.dni, data.telefono, data.denominacion1, data.denominacion2, data.denominacion3,
    data.objetoPersonalizado, data.actividadPrincipal, data.domicilio, data.cbuPrincipal, data.cbuSecundario,
    ...data.socios.flatMap(s => [s.nombre, s.apellido, s.dni, s.cuit]),
    ...data.administradores.flatMap(a => [a.nombre, a.apellido, a.dni, a.cuit]),
  ]
  return campos.some(c => String(c || '').trim() !== '')
}

/** Mensaje de error bajo un campo que no es FormField (textareas, opciones). */
function ErrorDe({ mensaje, id }: { mensaje?: string; id?: string }) {
  return (
    <div className="mensaje-campo" data-visible={!!mensaje}>
      <div>
        <p id={id} className="pt-2 text-label text-danger flex items-center gap-1" aria-live="polite">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {mensaje}
        </p>
      </div>
    </div>
  )
}

/** Cabecera de cada paso: número, título y una línea de qué se pide. */
function CabeceraPaso({ numero, titulo, bajada }: { numero: number; titulo: string; bajada: string }) {
  return (
    <div className="flex items-center gap-4 pb-4 border-b border-line">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft ring-1 ring-primary-line">
        <span className="text-title text-primary">{numero}</span>
      </div>
      <div className="min-w-0">
        <h2 className="text-title text-ink">{titulo}</h2>
        <p className="mt-1 text-body text-ink-2">{bajada}</p>
      </div>
    </div>
  )
}

/** Opción elegible (radio o casilla) con título y descripción. */
function Opcion({
  activa,
  children,
  className,
}: {
  activa: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 rounded-control border p-4 transition-colors cursor-pointer',
        activa ? 'border-primary bg-primary-soft' : 'border-line hover:border-primary hover:bg-primary-soft/40',
        className,
      )}
    >
      {children}
    </label>
  )
}

/** Bloque del resumen final, con su botón para volver a editar. */
function BloqueResumen({ titulo, onEditar, children }: { titulo: string; onEditar: () => void; children: ReactNode }) {
  return (
    <section className="rounded-control border border-line p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-body-sm font-semibold text-ink">{titulo}</h4>
        <button type="button" onClick={onEditar} className="inline-flex min-h-8 items-center gap-1 text-label font-semibold text-primary hover:underline">
          <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
        </button>
      </div>
      <div className="space-y-1 text-body-sm text-ink-2">{children}</div>
    </section>
  )
}

const nombreCompleto = (p: { nombre: string; apellido: string }) => `${p.nombre} ${p.apellido}`.trim()

// Los precios y el SMVM llegan del server (page.tsx): antes se pedían a
// /api/config al montar y el formulario arrancaba con valores por defecto.
/** En CABA la ciudad y el departamento son la propia Ciudad: no se piden. */
const CIUDAD_CABA = 'Ciudad Autónoma de Buenos Aires'

export default function FormularioNuevoTramite({ config }: { config: PublicConfig }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [pasoActual, setPasoActual] = useState(1)
  // Hasta dónde llegó: los pasos ya visitados se pueden abrir desde el indicador.
  const [pasoMaximo, setPasoMaximo] = useState(1)
  // Hacia dónde se movió el formulario: el paso nuevo entra desde ese lado.
  const [direccion, setDireccion] = useState<'adelante' | 'atras'>('adelante')
  // El formulario se desplaza dentro del <main> del layout, no en la ventana:
  // window.scrollTo(0, 0) no hacía nada y el paso nuevo arrancaba fuera de la
  // vista, con el cliente mirando el final en vez del principio.
  const inicioRef = useRef<HTMLDivElement>(null)
  const [guardando, setGuardando] = useState(false)
  // Una vez enviado hay que cortar el auto-guardado: si sigue corriendo, el
  // borrador ya no existe (quedó marcado como completo) y crea un trámite duplicado.
  const [enviado, setEnviado] = useState(false)
  const [cargandoBorrador, setCargandoBorrador] = useState(true)
  // Si el borrador no se pudo cargar, no se guarda nada: el formulario quedaría
  // en blanco y el auto-guardado pisaría los datos reales con vacíos.
  const [cargaFallida, setCargaFallida] = useState(false)
  // Id del borrador que se está editando. Arranca con el de la URL (retomar) y,
  // si es un trámite nuevo, lo completa el primer auto-guardado. Todo guardado
  // posterior y el envío final usan este id: así nunca se pisa otro borrador.
  const tramiteIdRef = useRef<string | null>(null)
  // Guardado en curso: el siguiente espera a que termine para no crear dos
  // borradores si el primero todavía no devolvió el id.
  const guardadoEnCursoRef = useRef<Promise<void> | null>(null)
  const [mostrarObjetoPreAprobado, setMostrarObjetoPreAprobado] = useState(false)
  // Errores por campo (clave = ruta del campo). Se muestran al lado de cada
  // uno: antes eran sólo avisos flotantes que no decían qué campo faltaba.
  const [errores, setErrores] = useState<Errores>({})
  const smvm = config.smvm
  const precios = {
    precioPlanBasico: config.precioPlanBasico,
    precioPlanEmprendedor: config.precioPlanEmprendedor,
    precioPlanPremium: config.precioPlanPremium,
  }

  const [formData, setFormData] = useState<FormData>({
    nombre: session?.user?.name?.split(' ')[0] || '',
    apellido: session?.user?.name?.split(' ').slice(1).join(' ') || '',
    dni: '',
    telefono: '',
    email: session?.user?.email || '',
    plan: 'EMPRENDEDOR',
    jurisdiccion: 'CORDOBA',
    denominacion1: '',
    denominacion2: '',
    denominacion3: '',
    marcaRegistrada: false,
    objetoSocial: 'PREAPROBADO',
    objetoPersonalizado: '',
    actividadPrincipal: '',
    sinDomicilio: false,
    provinciaResidencia: '',
    domicilio: '',
    ciudad: '',
    departamento: '',
    provincia: 'Córdoba',
    capitalSocial: String(capitalMinimo(smvm)),
    numeroSocios: 1,
    socios: [socioVacio()],
    numeroAdministradores: 2,
    administradores: [personaVacia(), personaVacia()],
    cbuPrincipal: '',
    cbuSecundario: '',
    fechaCierre: '31-12',
    asesoramientoContable: false
  })

  // Precargar nombre, apellido y email desde la sesión. En el primer render la
  // sesión todavía está cargando, así que se completan cuando llega (ajuste de
  // estado durante el render, una vez por sesión); solo se llenan los campos
  // vacíos para no pisar lo que venga de un borrador.
  const nombreSesion = session?.user?.name || ''
  const emailSesion = session?.user?.email || ''
  const claveSesion = `${nombreSesion}|${emailSesion}`
  const [sesionPrecargada, setSesionPrecargada] = useState('|')
  if (claveSesion !== sesionPrecargada) {
    setSesionPrecargada(claveSesion)
    const [nombre = '', ...resto] = nombreSesion.trim().split(/\s+/)
    setFormData(prev => ({
      ...prev,
      nombre: prev.nombre || nombre,
      apellido: prev.apellido || resto.join(' '),
      email: prev.email || emailSesion,
    }))
  }

  // Cargar borrador al iniciar - SOLO si es un borrador sin terminar
  useEffect(() => {
    if (status === 'authenticated') {
      const tramiteIdFromUrl = new URLSearchParams(window.location.search).get('tramiteId')

      // Sin id en la URL el formulario empieza en blanco (un trámite nuevo).
      if (!tramiteIdFromUrl) {
        setCargandoBorrador(false)
        return
      }

      tramiteIdRef.current = tramiteIdFromUrl
      fetch(`/api/tramites/${tramiteIdFromUrl}`)
        .then(async res => {
          // Un error del servidor no es «el trámite no existe»: no hay que
          // soltar el id ni empezar uno nuevo encima.
          if (res.status >= 500) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          if (data.tramite && data.tramite.formularioCompleto === false && data.tramite.estadoGeneral === 'INICIADO') {
            const draft = data.tramite
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const crudos = (lista: unknown): any[] => (Array.isArray(lista) ? lista : [])
            const du: Record<string, unknown> =
              draft.datosUsuario && typeof draft.datosUsuario === 'object' ? draft.datosUsuario : {}
            const txt = (v: unknown) => (typeof v === 'string' ? v : '')

            // Objeto: se guarda la elección en datosUsuario. En borradores
            // anteriores se deduce comparando con el texto pre-aprobado (antes
            // se buscaba la frase de apertura, que también tiene un objeto propio).
            const elegido = du.objetoSocial === 'PERSONALIZADO' || du.objetoSocial === 'PREAPROBADO' ? du.objetoSocial : null
            const objetoSocial: FormData['objetoSocial'] =
              elegido ?? (esObjetoPreAprobado(draft.objetoSocial) ? 'PREAPROBADO' : 'PERSONALIZADO')
            const objetoPersonalizado = sinRelleno(
              txt(du.objetoPersonalizado) || (objetoSocial === 'PERSONALIZADO' ? txt(draft.objetoSocial) : ''),
            )

            // Sede: la dirección cruda está en datosUsuario. En borradores
            // anteriores sólo queda la combinada «calle, ciudad, depto, provincia»:
            // se le sacan las tres últimas partes en vez de quedarse con la
            // primera (que cortaba «Av. Colón 123, Piso 2, Dpto. A»).
            const domicilioLegal = txt(draft.domicilioLegal)
            const sinDomicilio = typeof du.sinDomicilio === 'boolean'
              ? du.sinDomicilio
              : domicilioLegal === 'A informar' || domicilioLegal === ''
            const partes = domicilioLegal.split(',').map(p => p.trim())
            const domicilio = txt(du.domicilio) || (sinDomicilio ? '' : partes.slice(0, Math.max(1, partes.length - 3)).join(', '))

            const capital = parsearMonto(draft.capitalSocial) || capitalMinimo(smvm)
            const socios: Socio[] = crudos(draft.socios).map((s) => ({
              ...personaVacia(),
              nombre: txt(s.nombre), apellido: txt(s.apellido), dni: txt(s.dni), cuit: txt(s.cuit),
              domicilio: txt(s.domicilio), ciudad: txt(s.ciudad), departamento: txt(s.departamento),
              provincia: txt(s.provincia), estadoCivil: txt(s.estadoCivil), profesion: txt(s.profesion),
              tipoAporte: s.tipoAporte === 'PORCENTAJE' ? 'PORCENTAJE' : 'MONTO',
              aporteCapital: String(parsearMonto(s.aporteCapital)),
              aportePorcentaje: String(s.aportePorcentaje || s.porcentaje || (capital > 0 ? ((parsearMonto(s.aporteCapital) / capital) * 100).toFixed(2) : '0')),
            }))
            const administradores: Persona[] = crudos(draft.administradores).map((a) => ({
              nombre: txt(a.nombre), apellido: txt(a.apellido), dni: txt(a.dni), cuit: txt(a.cuit),
              domicilio: txt(a.domicilio), ciudad: txt(a.ciudad), departamento: txt(a.departamento),
              provincia: txt(a.provincia), estadoCivil: txt(a.estadoCivil), profesion: txt(a.profesion),
            }))
            while (administradores.length < 2) administradores.push(personaVacia())

            setFormData({
              nombre: txt(du.nombre) || session?.user?.name?.split(' ')[0] || '',
              apellido: txt(du.apellido) || session?.user?.name?.split(' ').slice(1).join(' ') || '',
              dni: txt(du.dni),
              telefono: txt(du.telefono),
              email: txt(du.email) || session?.user?.email || '',
              marcaRegistrada: du.marcaRegistrada === true,
              plan: draft.plan || 'EMPRENDEDOR',
              jurisdiccion: draft.jurisdiccion || 'CORDOBA',
              // «Pendiente de definir» es relleno del servidor, no un nombre propuesto.
              denominacion1: sinRelleno(draft.denominacionSocial1),
              denominacion2: sinRelleno(draft.denominacionSocial2),
              denominacion3: sinRelleno(draft.denominacionSocial3),
              objetoSocial,
              objetoPersonalizado,
              actividadPrincipal: txt(du.actividadPrincipal),
              // En CABA no prestamos domicilio: un borrador viejo no puede quedar pidiéndolo.
              sinDomicilio: draft.jurisdiccion === 'CABA' ? false : sinDomicilio,
              provinciaResidencia: txt(du.provinciaResidencia),
              domicilio,
              ciudad: draft.jurisdiccion === 'CABA' ? CIUDAD_CABA : txt(du.ciudad) || (sinDomicilio ? '' : partes.at(-3) ?? ''),
              departamento: draft.jurisdiccion === 'CABA' ? CIUDAD_CABA : txt(du.departamento) || (sinDomicilio ? '' : partes.at(-2) ?? ''),
              provincia: draft.jurisdiccion === 'CABA' ? 'Ciudad Autónoma de Buenos Aires' : 'Córdoba',
              capitalSocial: String(capital),
              numeroSocios: socios.length || 1,
              socios: socios.length > 0 ? socios : [socioVacio()],
              numeroAdministradores: administradores.length,
              administradores,
              cbuPrincipal: txt(du.cbuPrincipal),
              cbuSecundario: txt(du.cbuSecundario),
              fechaCierre: txt(du.fechaCierre) || '31-12',
              asesoramientoContable: du.asesoramientoContable === true,
            })
            // Volver al paso donde había quedado (se guarda con el borrador)
            const pasoGuardado = Number(du.pasoActual)
            if (Number.isInteger(pasoGuardado) && pasoGuardado >= 1 && pasoGuardado <= TOTAL_PASOS) {
              setPasoActual(pasoGuardado)
              setPasoMaximo(pasoGuardado)
            }
            toast.success('Retomamos tu trámite donde lo dejaste')
          } else {
            // No es un borrador editable: no seguir guardando sobre ese id
            tramiteIdRef.current = null
            window.history.replaceState({}, '', window.location.pathname)
            toast.error('Este trámite ya fue enviado o no existe')
          }
          setCargandoBorrador(false)
        })
        .catch(() => {
          setCargaFallida(true)
          setCargandoBorrador(false)
        })
    } else if (status === 'unauthenticated') {
      setCargandoBorrador(false)
    }
    // Se carga una vez, cuando la sesión está lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Auto-guardado
  const guardarBorrador = useCallback(async (data: FormData & { pasoActual: number }) => {
    const tramiteId = tramiteIdRef.current
    // Un trámite nuevo recién se crea cuando el cliente cargó algo propio: abrir
    // el formulario y no tocar nada no deja un borrador vacío
    if (!tramiteId && !tieneDatosCargados(data)) return
    // Sin id el servidor crea un borrador nuevo; con id actualiza sólo ese
    const cuerpo = { ...datosParaGuardar(data), pasoActual: data.pasoActual }
    const dataToSave = tramiteId ? { ...cuerpo, tramiteId } : cuerpo

    const response = await fetch('/api/tramites/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave),
      // Que el guardado llegue aunque la pestaña se esté cerrando.
      keepalive: true,
    })

    // Un error tiene que llegar al indicador: antes se mostraba «Guardado» igual.
    if (!response.ok) throw new Error(`No se pudo guardar el borrador (HTTP ${response.status})`)
    const result = await response.json()
    // Si se creó un borrador nuevo, recordar su id y dejarlo en la URL
    // (así una recarga lo retoma en lugar de empezar otro)
    if (result.tramiteId && !tramiteIdRef.current) {
      tramiteIdRef.current = result.tramiteId
      window.history.replaceState({}, '', `${window.location.pathname}?tramiteId=${result.tramiteId}`)
    }
  }, [])

  const handleAutoSave = useCallback(async (data: FormData & { pasoActual: number }) => {
    if (status !== 'authenticated' || enviado) return
    // Esperar el guardado anterior (puede ser el que trae el id del borrador)
    if (guardadoEnCursoRef.current) await guardadoEnCursoRef.current.catch(() => {})
    const guardado = guardarBorrador(data)
    guardadoEnCursoRef.current = guardado
    await guardado
  }, [status, enviado, guardarBorrador])

  // Se guarda también el paso en el que está, para volver ahí al recargar
  const datosAutoGuardado = useMemo(() => ({ ...formData, pasoActual }), [formData, pasoActual])

  const { isSaving, lastSaved, error: errorGuardado, guardarAhora } = useAutoSave({
    data: datosAutoGuardado,
    onSave: handleAutoSave,
    delay: 5000,
    // No guardar mientras carga el borrador ni si la carga falló.
    enabled: status === 'authenticated' && !cargandoBorrador && !cargaFallida && !enviado,
  })

  // Al cambiar de paso, arriba de todo. El scroll suave (scrollIntoView) se
  // cortaba en iPhone porque el contenido cambia de alto mientras anima.
  const primerRender = useRef(true)
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    inicioRef.current?.closest('main')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [pasoActual])

  const irAPaso = (paso: number) => {
    setDireccion(paso < pasoActual ? 'atras' : 'adelante')
    setPasoActual(paso)
    setPasoMaximo((m) => Math.max(m, paso))
    // Al cambiar de paso se guarda ya, sin esperar los 5 segundos.
    void guardarAhora()
  }

  // Validación en vivo de los pasos 1 y 2 (después de tocar cada campo)
  const paso1Validation = useFormValidation({
    nombre: [validators.required('Completá tu nombre')],
    apellido: [validators.required('Completá tu apellido')],
    dni: [
      validators.required('El DNI es obligatorio'),
      validators.dni('El DNI tiene que tener 7 u 8 dígitos, sin puntos')
    ],
    telefono: [
      validators.required('Completá tu teléfono'),
      validators.phone('Ingresá un teléfono válido, con código de área')
    ],
    email: [
      validators.required('Completá tu email'),
      validators.email('Ingresá un email válido (por ejemplo, nombre@gmail.com)')
    ]
  }, formData)

  const reglaDenominacion = {
    validator: (value: string) => validarDenominacion(value) ?? true,
    message: 'La denominación no es válida'
  }
  const paso2Validation = useFormValidation({
    denominacion1: [validators.required('Completá esta opción'), reglaDenominacion],
    denominacion2: [validators.required('Completá esta opción'), reglaDenominacion],
    denominacion3: [validators.required('Completá esta opción'), reglaDenominacion]
  }, formData)

  /** Saca de la lista los errores de los campos que se acaban de cambiar. */
  const limpiarErrores = (claves: string[]) => {
    setErrores((prev) => {
      if (!claves.some((k) => k in prev)) return prev
      const sig = { ...prev }
      for (const k of claves) delete sig[k]
      return sig
    })
  }

  const actualizar = <K extends keyof FormData>(campo: K, valor: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }))
    limpiarErrores([campo as string])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    actualizar(name as keyof FormData, (type === 'checkbox' ? checked : value) as never)
  }

  const actualizarSocio = (i: number, cambios: Partial<Socio>) => {
    setFormData((prev) => ({ ...prev, socios: prev.socios.map((s, j) => (j === i ? { ...s, ...cambios } : s)) }))
    const claves = Object.keys(cambios).map((k) => `socios.${i}.${k}`)
    if ('aporteCapital' in cambios || 'aportePorcentaje' in cambios || 'tipoAporte' in cambios) claves.push(`socios.${i}.aporte`, 'aportes')
    limpiarErrores(claves)
  }

  const actualizarAdmin = (i: number, cambios: Partial<Persona>) => {
    setFormData((prev) => ({
      ...prev,
      administradores: prev.administradores.map((a, j) => (j === i ? { ...a, ...cambios } : a)),
    }))
    limpiarErrores(Object.keys(cambios).map((k) => `administradores.${i}.${k}`))
  }

  /** Lleva al primer campo con error: lo centra en pantalla y le pone el foco. */
  const enfocarCampo = (clave: string) => {
    setTimeout(() => {
      const el = document.getElementById(clave) ?? document.querySelector<HTMLElement>(`[data-campo="${clave}"]`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus?.({ preventScroll: true })
    }, 80)
  }

  const validarPaso = (paso: number): boolean => {
    const encontrados = erroresDelPaso(paso, formData, smvm)
    setErrores(encontrados)
    const claves = Object.keys(encontrados)
    if (claves.length === 0) return true
    toast.error(claves.length === 1 ? 'Revisá el campo marcado' : `Revisá los ${claves.length} campos marcados`)
    enfocarCampo(claves[0])
    return false
  }

  const handleSiguiente = () => {
    if (!validarPaso(pasoActual)) return
    if (pasoActual < TOTAL_PASOS) irAPaso(pasoActual + 1)
  }

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setErrores({})
      irAPaso(pasoActual - 1)
    }
  }

  const handleSubmit = async () => {
    // Validar TODOS los pasos antes de enviar y llevar al primero con errores
    const pendiente = primerPasoConErrores(formData, smvm)
    if (pendiente) {
      toast.error(`Falta revisar el paso ${pendiente.paso}`)
      irAPaso(pendiente.paso)
      setErrores(pendiente.errores)
      enfocarCampo(Object.keys(pendiente.errores)[0])
      return
    }

    setGuardando(true)

    try {
      // Si hay un auto-guardado en curso, esperarlo: puede ser el que crea el
      // borrador y trae su id
      if (guardadoEnCursoRef.current) await guardadoEnCursoRef.current.catch(() => {})

      const response = await fetch('/api/tramites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // El id del borrador hace que se complete ese mismo trámite (no se
        // busca por denominación, que el cliente pudo haber cambiado)
        body: JSON.stringify({ ...datosParaGuardar(formData), tramiteId: tramiteIdRef.current })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setEnviado(true)
        toast.success('¡Listo! Recibimos tu formulario. Te llevamos a tu panel para seguir el trámite.')
        trackEvent.enviarTramite({
          tramite_id: result.tramite?.id,
          plan: formData.plan,
          jurisdiccion: formData.jurisdiccion,
        })
        router.push('/dashboard')
      } else {
        toast.error(result.details || 'No pudimos enviar el formulario. Probá de nuevo.')
        setGuardando(false)
      }
    } catch {
      toast.error('No pudimos enviar el formulario. Revisá tu conexión y probá de nuevo.')
      setGuardando(false)
    }
    // No ponemos setGuardando(false) en el caso exitoso para evitar que el usuario pueda hacer click de nuevo
  }

  // ── Socios y administradores ─────────────────────────────────────────────

  const capital = parsearMonto(formData.capitalSocial)
  const asignado = totalAportes(formData.socios, capital)
  const faltaAsignar = capital - asignado

  const agregarSocio = () => {
    setFormData((prev) => ({ ...prev, socios: [...prev.socios, socioVacio()], numeroSocios: prev.socios.length + 1 }))
  }

  /** Quita un socio puntual (antes «−» borraba siempre el último) y deja deshacerlo. */
  const quitarSocio = (i: number) => {
    const quitado = formData.socios[i]
    setFormData((prev) => {
      const socios = prev.socios.filter((_, j) => j !== i)
      return { ...prev, socios, numeroSocios: socios.length }
    })
    setErrores((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith('socios.'))))
    toast(`Quitaste a ${nombreCompleto(quitado) || `el socio ${i + 1}`}`, {
      action: {
        label: 'Deshacer',
        onClick: () =>
          setFormData((prev) => {
            const socios = [...prev.socios.slice(0, i), quitado, ...prev.socios.slice(i)]
            return { ...prev, socios, numeroSocios: socios.length }
          }),
      },
    })
  }

  const agregarAdmin = () => {
    setFormData((prev) => ({
      ...prev,
      administradores: [...prev.administradores, personaVacia()],
      numeroAdministradores: prev.administradores.length + 1,
    }))
  }

  const quitarAdmin = (i: number) => {
    const quitado = formData.administradores[i]
    setFormData((prev) => {
      const administradores = prev.administradores.filter((_, j) => j !== i)
      return { ...prev, administradores, numeroAdministradores: administradores.length }
    })
    setErrores((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith('administradores.'))))
    toast(`Quitaste a ${nombreCompleto(quitado) || `el administrador ${i + 1}`}`, {
      action: {
        label: 'Deshacer',
        onClick: () =>
          setFormData((prev) => {
            const administradores = [...prev.administradores.slice(0, i), quitado, ...prev.administradores.slice(i)]
            return { ...prev, administradores, numeroAdministradores: administradores.length }
          }),
      },
    })
  }

  /** «Soy yo»: el socio 1 casi siempre es quien completa el formulario. */
  const socioSoyYo = () =>
    actualizarSocio(0, { nombre: formData.nombre, apellido: formData.apellido, dni: soloDigitos(formData.dni) })

  /** Copia los datos de un socio en un administrador (sin pisar el resto del formulario). */
  const copiarSocioEnAdmin = (adminIndex: number, socioIndex: number) => {
    const s = formData.socios[socioIndex]
    if (!s) return
    actualizarAdmin(adminIndex, {
      nombre: s.nombre, apellido: s.apellido, dni: s.dni, cuit: s.cuit, domicilio: s.domicilio,
      ciudad: s.ciudad, departamento: s.departamento, provincia: s.provincia, estadoCivil: s.estadoCivil, profesion: s.profesion,
    })
  }

  const titular = formData.administradores[0]
  const [diaCierre, mesCierre] = (() => {
    const m = /^(\d{1,2})-(\d{1,2})$/.exec(formData.fechaCierre.trim())
    return m ? [Number(m[1]), Number(m[2])] : [31, 12]
  })()
  const cambiarCierre = (dia: number, mes: number) => {
    const diaValido = Math.min(dia, DIAS_POR_MES[mes - 1])
    actualizar('fechaCierre', `${String(diaValido).padStart(2, '0')}-${String(mes).padStart(2, '0')}`)
  }
  // Para el resumen del último paso: qué falta revisar antes de enviar.
  const pendienteDeRevisar = pasoActual === TOTAL_PASOS ? primerPasoConErrores(formData, smvm) : null

  if (cargandoBorrador) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-ink-2">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  if (cargaFallida) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <CloudOff className="mx-auto h-10 w-10 text-ink-3" aria-hidden />
        <h1 className="text-title text-ink">No pudimos abrir tu trámite</h1>
        <p className="text-body text-ink-2">
          Tus datos están guardados. Puede ser la conexión: probá de nuevo en un momento.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RotateCw className="h-4 w-4" /> Reintentar
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Volver al panel</Button>
        </div>
      </div>
    )
  }

  const errorDe = (campo: string) => errores[campo]

  return (
    <div ref={inicioRef} className="mx-auto w-full max-w-4xl scroll-mt-6 space-y-6">
        {/* Sugerencias de ciudad (la ciudad se escribe libre). */}
        <datalist id={LISTA_CIUDADES}>
          {CIUDADES_CORDOBA.map((c) => <option key={c} value={c} />)}
        </datalist>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display text-ink">
              Constituí tu <span className="text-primary">S.A.S.</span>
            </h1>
            <p className="mt-2 max-w-2xl text-body text-ink-2">
              Son 7 pasos. Lo que cargás se guarda solo: podés seguir después.
            </p>
          </div>
          {/* Indicador de guardado */}
          {status === 'authenticated' && (lastSaved || isSaving || errorGuardado) && (
            <div
              className={cn(
                'flex items-center gap-2 text-body-sm bg-surface px-4 py-2 rounded-control border shadow-raise',
                errorGuardado ? 'border-warning-line' : 'border-line',
              )}
              aria-live="polite"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-ink-2">Guardando…</span>
                </>
              ) : errorGuardado ? (
                <>
                  <CloudOff className="h-4 w-4 text-warning" />
                  <span className="text-warning">No se pudo guardar</span>
                  <button type="button" onClick={() => void guardarAhora()} className="font-semibold text-primary hover:underline">
                    Reintentar
                  </button>
                </>
              ) : lastSaved ? (
                <>
                  <Cloud className="h-4 w-4 text-success" />
                  <span className="text-ink-2">
                    Guardado {new Date(lastSaved).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Pasos */}
        <div className="bg-surface p-4 md:p-6 rounded-card border border-line shadow-raise">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="text-body-sm font-semibold text-ink-2">
              Paso {pasoActual} de {TOTAL_PASOS} · {PASOS[pasoActual - 1].nombre}
            </span>
            <span className="text-label text-ink-3 tnum">
              {Math.round(((pasoActual - 1) / TOTAL_PASOS) * 100)}% completado
            </span>
          </div>
          <div className="mb-5 h-2 w-full rounded-full bg-n-200">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((pasoActual - 1) / TOTAL_PASOS) * 100}%` }}
            />
          </div>

          {/* En el teléfono entran los siete: sólo círculos (el nombre del paso
              actual ya está arriba). Antes la fila desbordaba y corría la página. */}
          <div>
            <ol className="grid grid-cols-7 items-start gap-1 md:flex md:justify-between md:gap-2">
              {PASOS.map((paso) => {
                const Icon = paso.icon
                const hecho = pasoActual > paso.id
                const activo = pasoActual === paso.id
                // Los pasos ya visitados se pueden abrir desde acá.
                const abrible = paso.id !== pasoActual && paso.id <= pasoMaximo
                const contenido = (
                  <>
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full transition-all md:h-10 md:w-10',
                        hecho ? 'bg-success-solid text-on-primary' : activo ? 'bg-primary text-on-primary ring-4 ring-primary-soft' : 'bg-surface-3 text-ink-3',
                      )}
                    >
                      {hecho ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className={cn('sr-only md:not-sr-only md:text-body-sm font-semibold', activo ? 'text-primary' : 'text-ink-2')}>
                      {paso.nombre}
                    </span>
                  </>
                )
                return (
                  <li key={paso.id} className="flex justify-center md:min-w-16 md:flex-1">
                    {abrible ? (
                      <button
                        type="button"
                        onClick={() => {
                          setErrores({})
                          irAPaso(paso.id)
                        }}
                        className="flex flex-col items-center gap-2 rounded-control p-1 hover:bg-surface-2"
                        aria-label={`Ir al paso ${paso.id}: ${paso.nombre}`}
                      >
                        {contenido}
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-1" aria-current={activo ? 'step' : undefined}>
                        {contenido}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        <Card>
          <CardContent padding="none" className="p-card sm:p-8">
            {/* El key reinicia la animación de entrada en cada cambio de paso. */}
            <div key={pasoActual} className={direccion === 'atras' ? 'paso-atras' : 'paso-adelante'}>

            {/* ── Paso 1: Datos ── */}
            {pasoActual === 1 && (
              <div className="space-y-6">
                <CabeceraPaso numero={1} titulo="Tus datos" bajada="Quién hace el trámite, el plan y la jurisdicción" />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={(e) => { handleInputChange(e); paso1Validation.setFieldTouched('nombre') }}
                    placeholder="Juan"
                    required
                    autoComplete="given-name"
                    error={errorDe('nombre') || paso1Validation.errors.nombre || undefined}
                    validation={paso1Validation.getFieldValidation('nombre')}
                  />
                  <FormField
                    label="Apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={(e) => { handleInputChange(e); paso1Validation.setFieldTouched('apellido') }}
                    placeholder="Pérez"
                    required
                    autoComplete="family-name"
                    error={errorDe('apellido') || paso1Validation.errors.apellido || undefined}
                    validation={paso1Validation.getFieldValidation('apellido')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    label="DNI"
                    name="dni"
                    value={formData.dni}
                    onChange={(e) => { actualizar('dni', soloDigitos(e.target.value)); paso1Validation.setFieldTouched('dni') }}
                    placeholder="12345678"
                    required
                    inputMode="numeric"
                    inputClassName="tnum"
                    error={errorDe('dni') || paso1Validation.errors.dni || undefined}
                    validation={paso1Validation.getFieldValidation('dni')}
                    helpText="Sin puntos"
                  />
                  <FormField
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={(e) => { handleInputChange(e); paso1Validation.setFieldTouched('telefono') }}
                    placeholder="351 123 4567"
                    required
                    type="tel"
                    autoComplete="tel"
                    error={errorDe('telefono') || paso1Validation.errors.telefono || undefined}
                    validation={paso1Validation.getFieldValidation('telefono')}
                    helpText="Con código de área"
                  />
                  <div className="sm:col-span-2 lg:col-span-1">
                    <FormField
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => { handleInputChange(e); paso1Validation.setFieldTouched('email') }}
                      placeholder="correo@ejemplo.com"
                      required
                      type="email"
                      autoComplete="email"
                      error={errorDe('email') || paso1Validation.errors.email || undefined}
                      validation={paso1Validation.getFieldValidation('email')}
                      helpText="Te avisamos las novedades acá"
                    />
                  </div>
                </div>

                {/* Dónde vive la persona, no dónde va la sede. Es opcional a
                    propósito: sirve para anticipar la conversación del
                    domicilio sin agregar una fricción más. */}
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="provinciaResidencia" className="block text-body-sm font-semibold">¿En qué provincia vivís?</Label>
                  <Select id="provinciaResidencia" name="provinciaResidencia" value={formData.provinciaResidencia} onChange={handleInputChange}>
                    <option value="">Prefiero no decirlo</option>
                    {PROVINCIAS_RESIDENCIA.map((prov) => <option key={prov} value={prov}>{prov}</option>)}
                  </Select>
                  <p className="text-label text-ink-2">
                    No hace falta vivir en Córdoba para constituir acá. Nos sirve para saber si vas a necesitar que te demos el domicilio.
                  </p>
                </div>

                <div className="border-t border-line pt-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-heading font-semibold text-ink">Elegí tu plan</h3>
                    <Link href="/#planes" target="_blank" className="text-body-sm font-semibold text-primary hover:underline">
                      Comparar planes
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {([
                      { id: 'BASICO', nombre: 'Básico', transferencia: precios.precioPlanBasico, features: ['Constitución de la sociedad', 'Obtención del CUIT', 'Guía de uso de Libros Digitales'] },
                      { id: 'EMPRENDEDOR', nombre: 'Emprendedor', transferencia: precios.precioPlanEmprendedor, features: ['Constitución de la sociedad', 'Obtención del CUIT', 'Guía de uso de Libros Digitales', 'Lista para facturar'] },
                      { id: 'PREMIUM', nombre: 'Premium', transferencia: precios.precioPlanPremium, features: ['Constitución de la sociedad', 'Obtención del CUIT', 'Guía de uso de Libros Digitales', 'Lista para facturar', 'Alta de Libros Digitales', 'Una reunión de asesoría societaria al mes'] },
                    ] as const).map(plan => (
                      <button
                        type="button"
                        key={plan.id}
                        onClick={() => actualizar('plan', plan.id)}
                        aria-pressed={formData.plan === plan.id}
                        className={cn(
                          'flex h-full flex-col rounded-card border p-card text-left transition-all',
                          formData.plan === plan.id ? 'border-primary bg-primary-soft shadow-raise' : 'border-line bg-surface hover:border-line-strong hover:shadow-raise',
                        )}
                      >
                        <span className="flex w-full items-center justify-between mb-2">
                          <span className="text-heading font-semibold text-ink">{plan.nombre}</span>
                          {formData.plan === plan.id && <Check className="h-5 w-5 text-primary shrink-0" />}
                        </span>
                        <span className="my-2 block">
                          <PrecioDual transferencia={plan.transferencia} precioClassName="text-title font-semibold text-primary" gastos />
                        </span>
                        <ul className="text-body-sm text-ink-2 space-y-1">
                          {plan.features.map(feature => (
                            <li key={feature} className="flex items-start gap-1.5">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden /> {feature}
                            </li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-line pt-6">
                  <h3 className="text-heading font-semibold text-ink mb-4">Jurisdicción</h3>
                  <JurisdiccionSelector
                    value={formData.jurisdiccion}
                    onChange={(id, provincia) =>
                      setFormData((prev) => {
                        // En CABA no prestamos domicilio: la sede tiene que ser una dirección propia,
                        // y ciudad y departamento son la propia Ciudad.
                        if (id === 'CABA') return { ...prev, jurisdiccion: 'CABA', provincia, sinDomicilio: false, ciudad: CIUDAD_CABA, departamento: CIUDAD_CABA }
                        const venia = prev.ciudad === CIUDAD_CABA
                        return { ...prev, jurisdiccion: id as FormData['jurisdiccion'], provincia, ...(venia && { ciudad: '', departamento: '' }) }
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* ── Paso 2: Nombre ── */}
            {pasoActual === 2 && (
              <div className="space-y-6">
                <CabeceraPaso numero={2} titulo="Nombre de la sociedad" bajada="Tres opciones, en orden de preferencia" />

                <Aviso>
                  Antes de presentar el trámite revisamos que el nombre no esté tomado (examen de homonimia) y te
                  decimos cuál de las tres es la más viable para registrar.
                </Aviso>

                <div className="space-y-4">
                  {([
                    ['denominacion1', 'Opción 1 (la que preferís)', 'Ej.: Lumen Servicios SAS'],
                    ['denominacion2', 'Opción 2', 'Ej.: Lumen Digital SAS'],
                    ['denominacion3', 'Opción 3', 'Ej.: Grupo Lumen SAS'],
                  ] as const).map(([campo, label, placeholder]) => (
                    <FormField
                      key={campo}
                      label={label}
                      name={campo}
                      value={formData[campo]}
                      onChange={(e) => { handleInputChange(e); paso2Validation.setFieldTouched(campo) }}
                      placeholder={placeholder}
                      required
                      error={errorDe(campo) || paso2Validation.errors[campo] || undefined}
                      validation={paso2Validation.getFieldValidation(campo)}
                    />
                  ))}
                </div>

                <Opcion activa={formData.marcaRegistrada}>
                  <input type="checkbox" name="marcaRegistrada" checked={formData.marcaRegistrada} onChange={handleInputChange} className="mt-1" />
                  <div>
                    <p className="font-medium text-ink">El nombre es una marca registrada en el INPI</p>
                    <p className="text-body-sm text-ink-2">Si la marca es tuya, tenés prioridad para que aprueben ese nombre.</p>
                  </div>
                </Opcion>
              </div>
            )}

            {/* ── Paso 3: Objeto y sede ── */}
            {pasoActual === 3 && (
              <div className="space-y-6">
                <CabeceraPaso numero={3} titulo="Actividad y sede" bajada="A qué se va a dedicar la sociedad y dónde tiene la sede" />

                <fieldset className="space-y-3">
                  <legend className="text-heading font-semibold text-ink mb-3">Objeto social</legend>
                  <Opcion activa={formData.objetoSocial === 'PREAPROBADO'}>
                    <input type="radio" name="objetoSocial" value="PREAPROBADO" checked={formData.objetoSocial === 'PREAPROBADO'} onChange={handleInputChange} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-ink">Objeto pre-aprobado</p>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMostrarObjetoPreAprobado(true) }}
                          className="inline-flex min-h-8 items-center gap-1 text-label font-semibold text-primary hover:underline"
                        >
                          Leer el texto <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-body-sm text-ink-2">El texto estándar, que cubre la mayoría de las actividades comerciales. Es el más rápido de aprobar.</p>
                    </div>
                  </Opcion>
                  <Opcion activa={formData.objetoSocial === 'PERSONALIZADO'}>
                    <input type="radio" name="objetoSocial" value="PERSONALIZADO" checked={formData.objetoSocial === 'PERSONALIZADO'} onChange={handleInputChange} className="mt-1" />
                    <div>
                      <p className="font-medium text-ink">Objeto a medida</p>
                      <p className="text-body-sm text-ink-2">Describís vos las actividades de la sociedad.</p>
                    </div>
                  </Opcion>

                  {formData.objetoSocial === 'PREAPROBADO' && (
                    <div className="pt-2 space-y-2">
                      <Label htmlFor="actividadPrincipal" className="block text-body-sm font-semibold">¿A qué se va a dedicar la sociedad? <span className="text-danger">*</span></Label>
                      <p className="text-body-sm text-ink-2">El objeto pre-aprobado abarca muchas actividades: contanos cuál es la principal.</p>
                      <textarea
                        id="actividadPrincipal"
                        value={formData.actividadPrincipal}
                        onChange={(e) => actualizar('actividadPrincipal', e.target.value)}
                        aria-invalid={!!errorDe('actividadPrincipal') || undefined}
                        className={cn(
                          'flex w-full rounded-control border bg-surface px-3 py-2 text-body text-ink focus:outline-none focus:ring-2 focus:ring-ring',
                          errorDe('actividadPrincipal') ? 'border-danger-solid' : 'border-line-strong',
                        )}
                        rows={3}
                        placeholder="Ej.: Desarrollo de software a medida y venta de licencias para comercios"
                      />
                      <p className={cn('text-label tnum', formData.actividadPrincipal.trim().length >= ACTIVIDAD_PRINCIPAL_MIN_CARACTERES ? 'text-ink-3' : 'text-ink-2')}>
                        {formData.actividadPrincipal.trim().length} de {ACTIVIDAD_PRINCIPAL_MIN_CARACTERES} caracteres como mínimo
                      </p>
                      <ErrorDe mensaje={errorDe('actividadPrincipal')} />
                    </div>
                  )}
                  {formData.objetoSocial === 'PERSONALIZADO' && (
                    <div className="pt-2 space-y-2">
                      <Label htmlFor="objetoPersonalizado" className="block text-body-sm font-semibold">Describí las actividades <span className="text-danger">*</span></Label>
                      <textarea
                        id="objetoPersonalizado"
                        value={formData.objetoPersonalizado}
                        onChange={(e) => actualizar('objetoPersonalizado', e.target.value)}
                        aria-invalid={!!errorDe('objetoPersonalizado') || undefined}
                        className={cn(
                          'flex w-full rounded-control border bg-surface px-3 py-2 text-body text-ink focus:outline-none focus:ring-2 focus:ring-ring',
                          errorDe('objetoPersonalizado') ? 'border-danger-solid' : 'border-line-strong',
                        )}
                        rows={4}
                        placeholder="Ej.: Comercialización de indumentaria, importación de textiles…"
                      />
                      <ErrorDe mensaje={errorDe('objetoPersonalizado')} />
                    </div>
                  )}
                </fieldset>

                <fieldset className="space-y-3 border-t border-line pt-6">
                  <legend className="sr-only">Sede social</legend>
                  <h3 className="text-heading font-semibold text-ink">Sede social</h3>
                  {/* La explicación va ANTES de pedir la dirección. Medido sobre
                      los borradores abandonados: de 8 personas que eligen
                      denominación, sólo 1 llega a cargar un domicilio, porque
                      quien es de otra provincia cree que el trámite no es para él. */}
                  {formData.jurisdiccion === 'CABA' ? (
                    <Aviso>
                      <p className="text-ink">
                        La sede tiene que estar en <span className="font-semibold">CABA</span>, en una dirección tuya o de alguien que te la preste.
                      </p>
                      <p>
                        En CABA <span className="font-semibold">no ofrecemos el servicio de domicilio</span>: si no tenés una dirección ahí, podés
                        constituir en Córdoba, donde sí te la damos. La sociedad después puede operar en todo el país.
                      </p>
                    </Aviso>
                  ) : (
                    <Aviso>
                      <p className="text-ink">
                        La sede tiene que estar en <span className="font-semibold">Córdoba</span>,
                        pero <span className="font-semibold">no hace falta que vivas ahí</span>.
                      </p>
                      <p>
                        Si no tenés una dirección para fijarla, te ofrecemos la nuestra con el servicio de domicilio, que tiene un costo
                        aparte. La sociedad después puede operar en todo el país.
                      </p>
                    </Aviso>
                  )}

                  {formData.jurisdiccion !== 'CABA' && (
                  <>
                  <p className="text-body-sm font-semibold text-ink-2 pt-1">¿Tenés una dirección para la sede?</p>
                  <Opcion activa={!formData.sinDomicilio}>
                    <input type="radio" name="sinDomicilio" checked={!formData.sinDomicilio} onChange={() => actualizar('sinDomicilio', false)} className="mt-1" />
                    <div>
                      <p className="font-medium text-ink">Sí, tengo una</p>
                      <p className="text-body-sm text-ink-2">La cargás acá abajo.</p>
                    </div>
                  </Opcion>
                  <Opcion activa={formData.sinDomicilio}>
                    <input type="radio" name="sinDomicilio" checked={formData.sinDomicilio} onChange={() => actualizar('sinDomicilio', true)} className="mt-1" />
                    <div>
                      <p className="font-medium text-ink">No, quiero que me la den ustedes</p>
                      <p className="text-body-sm text-ink-2">Es un servicio anual. Te decimos cuánto sale antes de cobrarte nada, y no te frena para terminar el formulario.</p>
                    </div>
                  </Opcion>
                  </>
                  )}

                  {!formData.sinDomicilio && (
                    <div className="space-y-4 pt-2">
                      <FormField
                        label="Dirección"
                        name="domicilio"
                        value={formData.domicilio}
                        onChange={handleInputChange}
                        required
                        placeholder="Av. Colón 123, piso 2, dpto. A"
                        helpText="Completa: con piso, departamento, lote o manzana si corresponde"
                        error={errorDe('domicilio')}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {formData.jurisdiccion !== 'CABA' && (
                        <>
                        <FormField
                          label="Ciudad"
                          name="ciudad"
                          value={formData.ciudad}
                          onChange={(e) => {
                            const ciudad = e.target.value
                            actualizar('ciudad', ciudad)
                            // Ciudad conocida: el departamento se completa solo.
                            const depto = departamentoDeCiudad(ciudad)
                            if (depto && !formData.departamento) actualizar('departamento', depto)
                          }}
                          required
                          list={LISTA_CIUDADES}
                          error={errorDe('ciudad')}
                        />
                        <CampoSelect
                          id="departamento"
                          label="Departamento"
                          value={formData.departamento}
                          onChange={(departamento) => actualizar('departamento', departamento)}
                          opciones={DEPARTAMENTOS_CORDOBA}
                          error={errorDe('departamento')}
                        />
                        </>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between"><Label htmlFor="provincia" className="text-body-sm font-semibold">Provincia</Label></div>
                          <Input id="provincia" value={formData.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'Ciudad Autónoma de Buenos Aires'} disabled className="bg-surface-3" />
                        </div>
                      </div>
                    </div>
                  )}
                </fieldset>
              </div>
            )}

            {/* ── Paso 4: Capital ── */}
            {pasoActual === 4 && (
              <div className="space-y-6">
                <CabeceraPaso numero={4} titulo="Capital social" bajada="Con cuánto capital arranca la sociedad" />
                {(() => {
                  const minimo = capitalMinimo(smvm)
                  const esMinimo = formData.capitalSocial === String(minimo)
                  return (
                    <fieldset className="space-y-3">
                      <legend className="text-body-sm text-ink-2 mb-3">
                        El mínimo legal es de 2 salarios mínimos (SMVM actual: <span className="tnum">{pesos(smvm)}</span>).
                      </legend>
                      <Opcion activa={esMinimo}>
                        <input type="radio" name="capitalSocialOpcion" checked={esMinimo} onChange={() => actualizar('capitalSocial', String(minimo))} className="mt-1" />
                        <div>
                          <p className="font-medium text-ink">Capital mínimo</p>
                          <p className="text-body-sm text-ink-2">
                            <span className="tnum font-semibold text-ink">{pesos(minimo)}</span> · 2 salarios mínimos
                          </p>
                        </div>
                      </Opcion>
                      <Opcion activa={!esMinimo}>
                        <input type="radio" name="capitalSocialOpcion" checked={!esMinimo} onChange={() => actualizar('capitalSocial', '')} className="mt-1" />
                        <div>
                          <p className="font-medium text-ink">Otro monto</p>
                          <p className="text-body-sm text-ink-2">Un capital mayor al mínimo</p>
                        </div>
                      </Opcion>
                      {!esMinimo && (
                        <div className="max-w-xs pt-1 space-y-2">
                          <Label htmlFor="capitalSocial" className="block text-body-sm font-semibold">Monto del capital <span className="text-danger">*</span></Label>
                          <CampoMonto
                            id="capitalSocial"
                            value={formData.capitalSocial}
                            onChange={(v) => actualizar('capitalSocial', v)}
                            placeholder={`Mínimo ${minimo.toLocaleString('es-AR')}`}
                            error={errorDe('capitalSocial')}
                          />
                        </div>
                      )}
                    </fieldset>
                  )
                })()}

                {formData.jurisdiccion === 'CORDOBA' && (
                  <Aviso titulo="Depósito del 25% en garantía">
                    En Córdoba se deposita el 25% del capital ({pesos(Math.round(capital * 0.25))}) en una cuenta del Banco de
                    Córdoba que se abre para el trámite. Cuando la sociedad queda inscripta, se te devuelve. Las cuentas para
                    el reintegro las cargás en el paso de Administración.
                  </Aviso>
                )}
              </div>
            )}

            {/* ── Paso 5: Socios ── */}
            {pasoActual === 5 && (
              <div className="space-y-6">
                <CabeceraPaso numero={5} titulo="Socios" bajada="Quiénes son los accionistas y cuánto aporta cada uno" />

                <Aviso tono="atencion" titulo="Antes de firmar, cada persona va a necesitar">
                  <ul className="list-disc space-y-1 pl-4">
                    {formData.jurisdiccion === 'CORDOBA' && (
                      <li>
                        <span className="font-semibold">Ciudadano Digital nivel 2</span> (socios y administradores).{' '}
                        <a href="/guias/ciudadano-digital" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">
                          Cómo obtenerlo
                        </a>
                      </li>
                    )}
                    <li>El <span className="font-semibold">CUIT habilitado</span> y el domicilio fiscal registrado en ARCA (ex AFIP).</li>
                  </ul>
                </Aviso>

                {/* Cuánto falta asignar, con atajos para los casos comunes. */}
                <div data-campo="aportes" tabIndex={-1} className={cn('rounded-control border p-4', errorDe('aportes') ? 'border-danger-line bg-danger-soft' : 'border-line bg-surface-2')}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-body-sm text-ink-2 space-y-0.5">
                      <p>Capital: <span className="tnum font-semibold text-ink">{pesos(capital)}</span> · Asignado: <span className="tnum font-semibold text-ink">{pesos(asignado)}</span></p>
                      <p className={cn('font-semibold', Math.abs(faltaAsignar) <= 1 ? 'text-success' : faltaAsignar > 0 ? 'text-ink' : 'text-danger')}>
                        {Math.abs(faltaAsignar) <= 1
                          ? '✓ Todo el capital está asignado'
                          : faltaAsignar > 0
                            ? `Falta asignar ${pesos(faltaAsignar)}`
                            : `Te pasaste por ${pesos(-faltaAsignar)}`}
                      </p>
                    </div>
                    {Math.abs(faltaAsignar) > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, socios: repartirEnPartesIguales(prev.socios, capital) }))
                          limpiarErrores(['aportes', ...formData.socios.map((_, i) => `socios.${i}.aporte`)])
                        }}
                      >
                        {formData.socios.length === 1 ? 'Asignar todo el capital' : 'Repartir en partes iguales'}
                      </Button>
                    )}
                  </div>
                  <ErrorDe mensaje={errorDe('aportes')} />
                </div>

                {formData.socios.map((socio, index) => {
                  const aporte = aporteDe(socio, capital)
                  const pct = capital > 0 ? (aporte / capital) * 100 : 0
                  return (
                    <TarjetaPersona
                      key={index}
                      titulo={`Socio ${index + 1}`}
                      acciones={
                        <>
                          {index === 0 && (
                            <Button type="button" variant="outline" size="sm" onClick={socioSoyYo} disabled={!formData.nombre.trim()} className="gap-1.5">
                              <UserCheck className="h-4 w-4" /> Soy yo
                            </Button>
                          )}
                          {formData.socios.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => quitarSocio(index)} className="gap-1.5 text-ink-2">
                              <Trash2 className="h-4 w-4" /> Quitar
                            </Button>
                          )}
                        </>
                      }
                    >
                      <PersonaCampos
                        persona={socio}
                        prefijo={`socios.${index}`}
                        errores={errores}
                        onCambio={(cambios) => actualizarSocio(index, cambios)}
                      />

                      <div className="mt-4 border-t border-line pt-4 space-y-3">
                        <p className="text-body-sm font-semibold text-ink">Aporte de capital <span className="text-danger">*</span></p>
                        {/* Siempre en porcentaje: el monto en pesos lo calcula el formulario. */}
                        <div className="flex flex-wrap gap-2" role="group" aria-label={`Porcentaje rápido del socio ${index + 1}`}>
                          {PORCENTAJES_RAPIDOS.map((p) => {
                            const activo = socio.tipoAporte === 'PORCENTAJE' ? parseFloat(socio.aportePorcentaje.replace(',', '.')) === p : Math.abs(pct - p) < 0.005
                            return (
                              <button
                                key={p}
                                type="button"
                                aria-pressed={activo}
                                onClick={() => actualizarSocio(index, { tipoAporte: 'PORCENTAJE', aportePorcentaje: String(p) })}
                                className={cn(
                                  'min-h-11 min-w-14 rounded-control border px-3 text-body-sm font-semibold tnum transition-colors md:min-h-9',
                                  activo ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2 hover:border-line-strong hover:text-ink',
                                )}
                              >
                                {p}%
                              </button>
                            )
                          })}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                          <div>
                            <div className="relative">
                              <Input
                                id={`socios.${index}.aporte`}
                                aria-label={`Aporte del socio ${index + 1} en porcentaje`}
                                inputMode="decimal"
                                // Un aporte cargado en pesos (borradores viejos, «partes iguales») se muestra en %.
                                value={
                                  socio.tipoAporte === 'PORCENTAJE'
                                    ? socio.aportePorcentaje === '0' ? '' : socio.aportePorcentaje
                                    : pct ? pct.toFixed(2).replace(/\.?0+$/, '') : ''
                                }
                                onChange={(e) => actualizarSocio(index, { tipoAporte: 'PORCENTAJE', aportePorcentaje: e.target.value.replace(/[^\d.,]/g, '') })}
                                placeholder="Otro porcentaje"
                                aria-invalid={!!errorDe(`socios.${index}.aporte`) || undefined}
                                className={cn('pr-8 tnum', errorDe(`socios.${index}.aporte`) && 'border-danger-solid')}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3">%</span>
                            </div>
                            <ErrorDe mensaje={errorDe(`socios.${index}.aporte`)} />
                          </div>
                          <p className="text-body-sm text-ink-2 sm:pt-2.5 tnum">
                            {aporte > 0 ? `Equivale a ${pesos(aporte)}` : ' '}
                          </p>
                        </div>
                      </div>
                    </TarjetaPersona>
                  )
                })}

                <Button type="button" variant="outline" onClick={agregarSocio} className="w-full gap-2 border-dashed">
                  <Plus className="h-4 w-4" /> Agregar otro socio
                </Button>
              </div>
            )}

            {/* ── Paso 6: Administración y CBU ── */}
            {pasoActual === 6 && (
              <div className="space-y-6">
                <CabeceraPaso numero={6} titulo="Administración" bajada="Quiénes administran la sociedad y la cuenta para el reintegro" />

                <Aviso>
                  Hace falta un administrador titular y uno suplente, que tienen que ser personas distintas. Pueden ser
                  socios o no.
                </Aviso>

                {formData.administradores.map((admin, index) => {
                  const sociosConNombre = formData.socios
                    .map((s, i) => ({ s, i }))
                    .filter(({ s }) => nombreCompleto(s))
                  return (
                    <TarjetaPersona
                      key={index}
                      titulo={index === 0 ? 'Administrador titular' : index === 1 ? 'Administrador suplente' : `Administrador ${index + 1}`}
                      acciones={
                        <>
                          {sociosConNombre.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Copy className="h-4 w-4 text-ink-3" aria-hidden />
                              <Select
                                size="sm"
                                value=""
                                aria-label={`Copiar datos de un socio en el administrador ${index + 1}`}
                                onChange={(e) => copiarSocioEnAdmin(index, Number(e.target.value))}
                                className="max-w-[14rem]"
                              >
                                <option value="">Copiar datos de un socio…</option>
                                {sociosConNombre.map(({ s, i }) => {
                                  // Titular y suplente tienen que ser personas distintas.
                                  const usado = s.dni && formData.administradores.some((a, j) => j !== index && a.dni === s.dni)
                                  return (
                                    <option key={i} value={i} disabled={!!usado}>
                                      {nombreCompleto(s)}{usado ? ' (ya es administrador)' : ''}
                                    </option>
                                  )
                                })}
                              </Select>
                            </div>
                          )}
                          {index >= 2 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => quitarAdmin(index)} className="gap-1.5 text-ink-2">
                              <Trash2 className="h-4 w-4" /> Quitar
                            </Button>
                          )}
                        </>
                      }
                    >
                      <PersonaCampos
                        persona={admin}
                        prefijo={`administradores.${index}`}
                        errores={errores}
                        onCambio={(cambios) => actualizarAdmin(index, cambios)}
                      />
                    </TarjetaPersona>
                  )
                })}

                <Button type="button" variant="outline" onClick={agregarAdmin} className="w-full gap-2 border-dashed">
                  <Plus className="h-4 w-4" /> Agregar otro administrador
                </Button>

                {/* El CBU va acá y no en Capital: tiene que ser del titular, que se elige en este paso. */}
                {formData.jurisdiccion === 'CORDOBA' && (
                  <div className="space-y-3 border-t border-line pt-6">
                    <h3 className="text-heading font-semibold text-ink">Cuentas para el reintegro del depósito</h3>
                    <Aviso>
                      <p>
                        Cuando la sociedad queda inscripta, el Banco de Córdoba devuelve el 25% del capital depositado
                        ({pesos(Math.round(capital * 0.25))}) a estas cuentas.
                      </p>
                      <ul className="list-disc space-y-1 pl-4">
                        <li>
                          La <span className="font-semibold">principal</span> tiene que ser del administrador titular
                          {nombreCompleto(titular) ? <>: <span className="font-semibold text-ink">{nombreCompleto(titular)}</span></> : ''}.
                        </li>
                        <li>La <span className="font-semibold">secundaria</span>, de otra cuenta del titular o de otro administrador.</li>
                        <li>Tienen que ser CBU de un banco: no se aceptan CVU de billeteras virtuales (Mercado Pago, Ualá, Brubank, etc.).</li>
                      </ul>
                    </Aviso>

                    <Opcion activa={formData.cbuPrincipal === 'INFORMAR_LUEGO'}>
                      <input
                        type="checkbox"
                        checked={formData.cbuPrincipal === 'INFORMAR_LUEGO'}
                        onChange={(e) => {
                          const valor = e.target.checked ? 'INFORMAR_LUEGO' : ''
                          setFormData(prev => ({ ...prev, cbuPrincipal: valor, cbuSecundario: valor }))
                          limpiarErrores(['cbuPrincipal', 'cbuSecundario'])
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-ink">Los cargo más adelante</p>
                        <p className="text-body-sm text-ink-2">Te los vamos a pedir antes de hacer el depósito.</p>
                      </div>
                    </Opcion>

                    {formData.cbuPrincipal !== 'INFORMAR_LUEGO' && (
                      <div className="grid grid-cols-1 gap-4 pt-1">
                        {([
                          ['cbuPrincipal', 'CBU principal (del titular)'],
                          ['cbuSecundario', 'CBU secundario'],
                        ] as const).map(([campo, etiqueta]) => (
                          <FormField
                            key={campo}
                            label={etiqueta}
                            name={campo}
                            value={formData[campo]}
                            onChange={(e) => actualizar(campo, soloDigitos(e.target.value))}
                            placeholder="22 dígitos"
                            required
                            inputMode="numeric"
                            helpText="Lo encontrás en la app o el homebanking de tu banco"
                            inputClassName="font-mono tnum"
                            error={errorDe(campo)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Paso 7: Cierre y resumen ── */}
            {pasoActual === 7 && (
              <div className="space-y-6">
                <CabeceraPaso numero={7} titulo="Cierre y revisión" bajada="La fecha de cierre del ejercicio y un repaso de todo antes de enviar" />

                <fieldset className="space-y-3">
                  <legend className="text-heading font-semibold text-ink mb-3">Cierre del ejercicio económico</legend>
                  <Aviso>
                    Es el día del año en que se cierran los libros contables y se preparan los balances. Lo más común es el
                    31 de diciembre.
                  </Aviso>
                  <div className="flex flex-wrap items-end gap-3" data-campo="fechaCierre">
                    <div className="space-y-2">
                      <Label htmlFor="fechaCierre-dia" className="block text-body-sm font-semibold">Día</Label>
                      <Select id="fechaCierre-dia" value={String(diaCierre)} onChange={(e) => cambiarCierre(Number(e.target.value), mesCierre)} className="w-24">
                        {Array.from({ length: DIAS_POR_MES[mesCierre - 1] ?? 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fechaCierre-mes" className="block text-body-sm font-semibold">Mes</Label>
                      <Select id="fechaCierre-mes" value={String(mesCierre)} onChange={(e) => cambiarCierre(diaCierre, Number(e.target.value))} className="w-40">
                        {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </Select>
                    </div>
                  </div>
                  <ErrorDe mensaje={errorDe('fechaCierre')} />
                </fieldset>

                <Opcion activa={formData.asesoramientoContable}>
                  <input type="checkbox" name="asesoramientoContable" checked={formData.asesoramientoContable} onChange={handleInputChange} className="mt-1" />
                  <div>
                    <p className="font-medium text-ink">Quiero asesoramiento contable para la sociedad</p>
                    <p className="text-body-sm text-ink-2">Te contactamos para ayudarte con la gestión contable e impositiva.</p>
                  </div>
                </Opcion>

                {/* Resumen: todo lo cargado, con «Editar» en cada parte. */}
                <div className="space-y-3 border-t border-line pt-6">
                  <h3 className="text-heading font-semibold text-ink">Revisá antes de enviar</h3>
                  {pendienteDeRevisar ? (
                    <Aviso tono="atencion" titulo={`Falta revisar el paso ${pendienteDeRevisar.paso}: ${PASOS[pendienteDeRevisar.paso - 1].nombre}`}>
                      <p>{Object.values(pendienteDeRevisar.errores)[0]}.</p>
                      <button
                        type="button"
                        onClick={() => {
                          irAPaso(pendienteDeRevisar.paso)
                          setErrores(pendienteDeRevisar.errores)
                          enfocarCampo(Object.keys(pendienteDeRevisar.errores)[0])
                        }}
                        className="font-semibold text-primary hover:underline"
                      >
                        Ir a corregirlo
                      </button>
                    </Aviso>
                  ) : (
                    <div className="flex items-start gap-3 rounded-control border border-success-line bg-success-soft p-4 text-body-sm text-success">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <p><span className="font-semibold">Está todo completo.</span> Si los datos están bien, enviá el formulario y empezamos.</p>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <BloqueResumen titulo="Tus datos" onEditar={() => irAPaso(1)}>
                      <p className="text-ink">{nombreCompleto(formData)}</p>
                      <p>DNI {formData.dni || '—'} · {formData.telefono || '—'}</p>
                      <p className="break-all">{formData.email}</p>
                      <p>Plan {nombrePlan(formData.plan)} · {nombreJurisdiccion(formData.jurisdiccion)}</p>
                    </BloqueResumen>
                    <BloqueResumen titulo="Nombre de la sociedad" onEditar={() => irAPaso(2)}>
                      {[formData.denominacion1, formData.denominacion2, formData.denominacion3].map((d, i) => (
                        <p key={i}><span className="text-ink-3">{i + 1}.</span> {d || '—'}</p>
                      ))}
                    </BloqueResumen>
                    <BloqueResumen titulo="Actividad y sede" onEditar={() => irAPaso(3)}>
                      <p>{formData.objetoSocial === 'PREAPROBADO' ? 'Objeto pre-aprobado' : 'Objeto a medida'}</p>
                      <p className="line-clamp-2">{formData.objetoSocial === 'PREAPROBADO' ? formData.actividadPrincipal : formData.objetoPersonalizado}</p>
                      <p>
                        {formData.sinDomicilio
                          ? 'Sede: la damos nosotros'
                          : `Sede: ${[formData.domicilio, formData.ciudad].filter(Boolean).join(', ') || '—'}`}
                      </p>
                    </BloqueResumen>
                    <BloqueResumen titulo="Capital" onEditar={() => irAPaso(4)}>
                      <p className="text-ink tnum">{pesos(capital)}</p>
                      {formData.jurisdiccion === 'CORDOBA' && <p className="tnum">Depósito del 25%: {pesos(Math.round(capital * 0.25))}</p>}
                    </BloqueResumen>
                    <BloqueResumen titulo={`Socios (${formData.socios.length})`} onEditar={() => irAPaso(5)}>
                      {formData.socios.map((s, i) => (
                        <p key={i} className="tnum">
                          {nombreCompleto(s) || `Socio ${i + 1}`} · {capital > 0 ? `${((aporteDe(s, capital) / capital) * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%` : '—'}
                        </p>
                      ))}
                    </BloqueResumen>
                    <BloqueResumen titulo="Administración" onEditar={() => irAPaso(6)}>
                      {formData.administradores.map((a, i) => (
                        <p key={i}>
                          <span className="text-ink-3">{i === 0 ? 'Titular' : i === 1 ? 'Suplente' : `Adm. ${i + 1}`}:</span> {nombreCompleto(a) || '—'}
                        </p>
                      ))}
                      {formData.jurisdiccion === 'CORDOBA' && (
                        <p>CBU: {formData.cbuPrincipal === 'INFORMAR_LUEGO' ? 'los cargás más adelante' : formData.cbuPrincipal ? `terminado en ${formData.cbuPrincipal.slice(-4)}` : '—'}</p>
                      )}
                    </BloqueResumen>
                  </div>
                </div>
              </div>
            )}

            </div>

            {/* Navegación */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-line">
              <Button
                variant="outline"
                onClick={handleAnterior}
                disabled={pasoActual === 1}
                className="gap-2 w-full sm:w-auto rounded-control h-12 px-6 font-semibold"
              >
                <ChevronLeft className="h-5 w-5" />
                Anterior
              </Button>

              {pasoActual < TOTAL_PASOS ? (
                <Button onClick={handleSiguiente} className="gap-2 w-full sm:w-auto rounded-control shadow-raise h-12 px-6 font-semibold">
                  Siguiente
                  <ChevronRight className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={guardando}
                  className="gap-2 bg-success-solid hover:bg-success-solid w-full sm:w-auto rounded-control shadow-raise h-12 px-8 font-semibold"
                >
                  <EtiquetaCarga cargando={guardando} textoCargando="Enviando...">
                    Enviar formulario
                    <ChevronRight className="h-5 w-5" />
                  </EtiquetaCarga>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal para mostrar objeto pre-aprobado */}
        <Dialog open={mostrarObjetoPreAprobado} onOpenChange={setMostrarObjetoPreAprobado}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Objeto Social Pre-Aprobado</DialogTitle>
              <DialogDescription>
                Este es el objeto social estándar que cubre la mayoría de las actividades comerciales
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-body-sm text-ink-2 leading-relaxed">
                La sociedad tiene por objeto realizar por cuenta propia y/o de terceros, o asociadas a terceros en el país o en el extranjero, las siguientes actividades:
              </p>
              <ol className="list-decimal list-inside space-y-3 text-body-sm text-ink-2 leading-relaxed">
                <li>Construcción de todo tipo de obras, públicas o privadas, edificios, viviendas, locales comerciales y plantas industriales; realizar refacciones, remodelaciones, instalaciones, trabajos de albañilería y/o cualquier trabajo de la construcción.</li>
                <li>Transporte nacional o internacional de cargas en general, ya sea por vía terrestre, aérea o marítima, con medios de transporte propios o de terceros, pudiendo realizar todo lo inherente a su logística.</li>
                <li>Compra, venta y permuta, explotación, arrendamientos y administración de bienes inmuebles, urbanos y rurales y la realización de operaciones de propiedad horizontal.</li>
                <li>Realizar toda clase de operaciones financieras por todos los medios autorizados por la legislación vigente. Se exceptúan las operaciones comprendidas en la Ley de Entidades Financiera.</li>
                <li>Realizar la explotación directa por sí o por terceros en establecimientos rurales, ganaderos, agrícolas, avícolas, frutícolas, vitivinícolas, forestales, cría, venta y cruza de ganado, explotación de tambos, cultivos, compra, venta y acopio de cereales.</li>
                <li>Elaboración, producción, transformación y comercialización de productos y subproductos alimenticios de todo tipo, expendio de todo tipo de bebidas, explotación de servicio de catering, de concesiones gastronómicas, bares, restoranes, comedores, organización y logística en eventos sociales.</li>
                <li>Creación, producción, elaboración, transformación, desarrollo, reparación, implementación, servicio técnico, consultoría, comercialización, distribución, importación y exportación de softwares, equipos informáticos, eléctricos y electrónicos.</li>
                <li>Producción, organización y explotación de espectáculos públicos y privados, teatrales, musicales, coreográficos, desfiles, exposiciones, ferias, conciertos musicales, recitales, y eventos sociales.</li>
                <li>Explotación de agencia de viajes y turismo, pudiendo realizar reservas y ventas de pasajes, terrestres, aéreos, marítimos, nacionales o internacionales; organización, reserva y ventas de excursiones, reservas de hotelería, reserva, organización y ventas de charters y traslados, dentro y fuera del país de contingentes.</li>
                <li>Organización, administración, gerenciamiento y explotación de centros médicos asistenciales, con atención polivalente e integral de medicina, atención clínica, terapéutica y quirúrgica, con o sin internación y demás actividades relacionadas a la salud y servicios de atención médica.</li>
                <li>Constituir, instalar y comercializar editoriales y gráficas en cualquier soporte.</li>
                <li>Instalación y explotación de establecimientos destinados a la industrialización, fabricación y elaboración de las materias primas, productos y subproductos relacionados directamente con su objeto social.</li>
                <li>Importación y exportación de bienes y servicios.</li>
                <li>Actuar como fiduciante, fiduciaria, beneficiaria, fideicomisaria, por cuenta propia o por cuenta de terceros y/o asociada a terceros, en todo tipo de emprendimientos.</li>
              </ol>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}