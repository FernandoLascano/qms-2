'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, Check, Cloud, CloudOff, Loader2, User, Building2, Target, DollarSign, Users, Briefcase, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/ui/form-field'
import { useFormValidation, validators } from '@/hooks/useFormValidation'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAutoSave } from '@/hooks/useAutoSave'

const PASOS = [
  { id: 1, nombre: 'Datos', descripcion: 'Información personal y plan', icon: User },
  { id: 2, nombre: 'Nombre', descripcion: 'Marca de la sociedad', icon: Building2 },
  { id: 3, nombre: 'Objeto', descripcion: 'Actividad y domicilio', icon: Target },
  { id: 4, nombre: 'Capital', descripcion: 'Capital social y CBU', icon: DollarSign },
  { id: 5, nombre: 'Socios', descripcion: 'Accionistas', icon: Users },
  { id: 6, nombre: 'Administración', descripcion: 'Administradores', icon: Briefcase },
  { id: 7, nombre: 'Cierre', descripcion: 'Ejercicio económico', icon: Calendar },
]

// Ciudades y Departamentos de Córdoba
const DEPARTAMENTOS_CORDOBA = [
  'Capital', 'Colón', 'Río Cuarto', 'General Roca', 'San Justo', 'Tercero Arriba', 
  'Unión', 'Marcos Juárez', 'Minas', 'Pocho', 'Punilla', 'San Alberto', 'San Javier',
  'Santa María', 'Sobremonte', 'Tulumba', 'Totoral', 'Río Segundo', 'Río Primero',
  'Presidente Roque Sáenz Peña', 'Juárez Celman', 'Ischilín', 'General San Martín',
  'Cruz del Eje', 'Calamuchita'
]

const CIUDADES_CORDOBA = [
  'Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María', 'San Francisco', 
  'Villa Allende', 'Jesús María', 'La Calera', 'Arroyito', 'Marcos Juárez',
  'Bell Ville', 'Leones', 'Monte Cristo', 'Morteros', 'Villa Dolores', 'Cruz del Eje',
  'Deán Funes', 'Villa General Belgrano', 'La Falda', 'Cosquín',
  'Villa Giardino', 'Unquillo', 'Salsipuedes', 'Río Tercero', 'Villa Mercedes',
  'General Cabrera', 'Huinca Renancó', 'Laboulaye', 'Rufino', 'Villa Huidobro'
]

interface FormData {
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
  
  // Paso 3: Objeto
  objetoSocial: 'PREAPROBADO' | 'PERSONALIZADO'
  objetoPersonalizado: string
  sinDomicilio: boolean
  domicilio: string
  ciudad: string
  departamento: string
  provincia: string
  
  // Paso 4: Capital
  capitalSocial: string
  cbuPrincipal: string
  cbuSecundario: string
  
  // Paso 5: Socios
  numeroSocios: number
  socios: Array<{
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
    aporteCapital: string
    tipoAporte: 'MONTO' | 'PORCENTAJE'
    aportePorcentaje: string
  }>
  
  // Paso 6: Administradores
  numeroAdministradores: number
  administradores: Array<{
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
  }>
  
  // Paso 7: Cierre
  fechaCierre: string
  asesoramientoContable: boolean
}

export default function NuevoTramitePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [pasoActual, setPasoActual] = useState(1)
  const [guardando, setGuardando] = useState(false)
  const [cargandoBorrador, setCargandoBorrador] = useState(true)
  const [mostrarObjetoPreAprobado, setMostrarObjetoPreAprobado] = useState(false)
  const [smvm, setSmvm] = useState(317800) // Valor por defecto

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
    sinDomicilio: false,
    domicilio: '',
    ciudad: '',
    departamento: '',
    provincia: 'Córdoba',
    
    capitalSocial: String(2 * smvm),
    cbuPrincipal: '',
    cbuSecundario: '',
    
    numeroSocios: 1,
    socios: [{
      nombre: '',
      apellido: '',
      dni: '',
      cuit: '',
      domicilio: '',
      ciudad: '',
      departamento: '',
      provincia: '',
      estadoCivil: '',
      profesion: '',
      aporteCapital: '0',
      tipoAporte: 'MONTO',
      aportePorcentaje: '0'
    }],
    
    numeroAdministradores: 2,
    administradores: [
      { nombre: '', apellido: '', dni: '', cuit: '', domicilio: '', ciudad: '', departamento: '', provincia: '', estadoCivil: '', profesion: '' },
      { nombre: '', apellido: '', dni: '', cuit: '', domicilio: '', ciudad: '', departamento: '', provincia: '', estadoCivil: '', profesion: '' }
    ],
    
    fechaCierre: '31-12',
    asesoramientoContable: false
  })

  // Cargar configuración (SMVM)
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.smvm) {
          setSmvm(data.smvm)
          // Actualizar capital social si aún no fue modificado por el usuario
          setFormData(prev => ({
            ...prev,
            capitalSocial: String(2 * data.smvm)
          }))
        }
      })
      .catch(err => console.error('Error al cargar SMVM:', err))
  }, [])

  // Cargar borrador al iniciar - SOLO si es un borrador sin terminar
  useEffect(() => {
    if (status === 'authenticated') {
      // Verificar si hay un tramiteId en la URL (viene del dashboard)
      const urlParams = new URLSearchParams(window.location.search)
      const tramiteIdFromUrl = urlParams.get('tramiteId')
      
      // Si hay un tramiteId en la URL, cargar ese trámite específico
      if (tramiteIdFromUrl) {
        fetch(`/api/tramites/${tramiteIdFromUrl}`)
          .then(res => res.json())
          .then(data => {
            console.log('Respuesta del API para tramiteId:', tramiteIdFromUrl, {
              tieneTramite: !!data.tramite,
              formularioCompleto: data.tramite?.formularioCompleto,
              estadoGeneral: data.tramite?.estadoGeneral,
              tieneDatosUsuario: !!data.tramite?.datosUsuario,
              plan: data.tramite?.plan,
              jurisdiccion: data.tramite?.jurisdiccion,
              denominacion1: data.tramite?.denominacionSocial1,
              capitalSocial: data.tramite?.capitalSocial,
              tieneSocios: Array.isArray(data.tramite?.socios) && data.tramite.socios.length > 0
            })
            
            if (data.tramite && data.tramite.formularioCompleto === false && data.tramite.estadoGeneral === 'INICIADO') {
              const draft = data.tramite
              const socios = Array.isArray(draft.socios) ? draft.socios : []
              const administradores = Array.isArray(draft.administradores) ? draft.administradores : []
              
              // Detectar si es objeto pre-aprobado
              const esPreAprobado = draft.objetoSocial?.includes('Construcción de todo tipo de obras') || 
                                    draft.objetoSocial?.includes('La sociedad tiene por objeto realizar')
              
              // Cargar datos del usuario desde datosUsuario JSON
              // Si no está disponible, intentar cargar desde otros campos o usar valores por defecto
              let datosUsuario: any = {}
              if (draft.datosUsuario && typeof draft.datosUsuario === 'object') {
                datosUsuario = draft.datosUsuario as any
              } else {
                // Si datosUsuario no está disponible, usar valores por defecto de la sesión
                console.warn('datosUsuario no disponible en el trámite, usando valores por defecto')
                datosUsuario = {
                  nombre: session?.user?.name?.split(' ')[0] || '',
                  apellido: session?.user?.name?.split(' ').slice(1).join(' ') || '',
                  email: session?.user?.email || '',
                  telefono: '',
                  dni: '',
                  marcaRegistrada: false,
                  cbuPrincipal: '',
                  cbuSecundario: '',
                  fechaCierre: '31-12',
                  asesoramientoContable: false,
                  ciudad: '',
                  departamento: ''
                }
              }
              
              // Parsear domicilio legal
              let domicilioParsed = ''
              let ciudadParsed = ''
              let departamentoParsed = ''
              
              if (draft.domicilioLegal && draft.domicilioLegal !== 'A informar') {
                const partesDomicilio = draft.domicilioLegal.split(',').map((p: string) => p.trim())
                domicilioParsed = partesDomicilio[0] || ''
                ciudadParsed = datosUsuario.ciudad || partesDomicilio[1] || ''
                departamentoParsed = datosUsuario.departamento || partesDomicilio[2] || ''
              }
              
              console.log('Cargando datos del trámite:', {
                tieneDatosUsuario: !!draft.datosUsuario,
                datosUsuarioKeys: datosUsuario ? Object.keys(datosUsuario) : [],
                nombre: datosUsuario.nombre,
                apellido: datosUsuario.apellido,
                email: datosUsuario.email,
                plan: draft.plan,
                jurisdiccion: draft.jurisdiccion,
                denominacion1: draft.denominacionSocial1
              })
              
              // Construir el objeto completo de formData (no mezclar con prev para evitar problemas)
              const nuevoFormData: FormData = {
                // Datos del usuario (desde datosUsuario JSON guardado o valores por defecto)
                nombre: datosUsuario.nombre || session?.user?.name?.split(' ')[0] || '',
                apellido: datosUsuario.apellido || session?.user?.name?.split(' ').slice(1).join(' ') || '',
                dni: datosUsuario.dni || '',
                telefono: datosUsuario.telefono || '',
                email: datosUsuario.email || session?.user?.email || '',
                marcaRegistrada: datosUsuario.marcaRegistrada !== undefined ? datosUsuario.marcaRegistrada : false,
                // Datos del trámite (estos SÍ deberían estar guardados)
                plan: draft.plan || 'EMPRENDEDOR',
                jurisdiccion: draft.jurisdiccion || 'CORDOBA',
                denominacion1: draft.denominacionSocial1 || '',
                denominacion2: draft.denominacionSocial2 || '',
                denominacion3: draft.denominacionSocial3 || '',
                objetoSocial: esPreAprobado ? 'PREAPROBADO' : 'PERSONALIZADO',
                objetoPersonalizado: esPreAprobado ? '' : (draft.objetoSocial || ''),
                sinDomicilio: draft.domicilioLegal === 'A informar' || draft.domicilioLegal === '',
                domicilio: domicilioParsed,
                ciudad: ciudadParsed,
                departamento: departamentoParsed,
                provincia: draft.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'Ciudad Autónoma de Buenos Aires',
                capitalSocial: String(draft.capitalSocial || (2 * smvm)),
                cbuPrincipal: datosUsuario.cbuPrincipal || '',
                cbuSecundario: datosUsuario.cbuSecundario || '',
                fechaCierre: datosUsuario.fechaCierre || '31-12',
                asesoramientoContable: datosUsuario.asesoramientoContable !== undefined ? datosUsuario.asesoramientoContable : false,
                numeroSocios: socios.length || 1,
                socios: socios.length > 0 ? socios.map((s: any) => {
                  const capitalTotal = parseFloat(String(draft.capitalSocial || (2 * smvm)))
                  const aporteCapital = parseFloat(String(s.aporteCapital || '0'))
                  const porcentajeCalculado = capitalTotal > 0 ? ((aporteCapital / capitalTotal) * 100).toFixed(2) : '0'
                  
                  return {
                    nombre: s.nombre || '',
                    apellido: s.apellido || '',
                    dni: s.dni || '',
                    cuit: s.cuit || '',
                    domicilio: s.domicilio || '',
                    ciudad: s.ciudad || '',
                    departamento: s.departamento || '',
                    provincia: s.provincia || '',
                    estadoCivil: s.estadoCivil || '',
                    profesion: s.profesion || '',
                    aporteCapital: String(s.aporteCapital || '0'),
                    tipoAporte: s.tipoAporte || 'MONTO',
                    aportePorcentaje: s.aportePorcentaje || s.porcentaje || porcentajeCalculado
                  }
                }) : [{
                  nombre: '',
                  apellido: '',
                  dni: '',
                  cuit: '',
                  domicilio: '',
                  ciudad: '',
                  departamento: '',
                  provincia: '',
                  estadoCivil: '',
                  profesion: '',
                  aporteCapital: '0',
                  tipoAporte: 'MONTO',
                  aportePorcentaje: '0'
                }],
                numeroAdministradores: administradores.length || 2,
                administradores: administradores.length > 0 ? administradores.map((a: any) => ({
                  nombre: a.nombre || '',
                  apellido: a.apellido || '',
                  dni: a.dni || '',
                  cuit: a.cuit || '',
                  domicilio: a.domicilio || '',
                  ciudad: a.ciudad || '',
                  departamento: a.departamento || '',
                  provincia: a.provincia || '',
                  estadoCivil: a.estadoCivil || '',
                  profesion: a.profesion || ''
                })) : [
                  { nombre: '', apellido: '', dni: '', cuit: '', domicilio: '', ciudad: '', departamento: '', provincia: '', estadoCivil: '', profesion: '' },
                  { nombre: '', apellido: '', dni: '', cuit: '', domicilio: '', ciudad: '', departamento: '', provincia: '', estadoCivil: '', profesion: '' }
                ]
              }
              
              console.log('Datos que se van a cargar en el formulario:', {
                plan: nuevoFormData.plan,
                jurisdiccion: nuevoFormData.jurisdiccion,
                denominacion1: nuevoFormData.denominacion1,
                capitalSocial: nuevoFormData.capitalSocial,
                nombre: nuevoFormData.nombre,
                apellido: nuevoFormData.apellido,
                email: nuevoFormData.email,
                numeroSocios: nuevoFormData.numeroSocios,
                numeroAdministradores: nuevoFormData.numeroAdministradores
              })
              
              setFormData(nuevoFormData)
              toast.success('Trámite cargado para continuar')
            } else {
              toast.error('Este trámite ya está completado o no existe')
            }
            setCargandoBorrador(false)
          })
          .catch(err => {
            console.error('Error al cargar trámite:', err)
            toast.error('Error al cargar el trámite')
            setCargandoBorrador(false)
          })
      } else {
        // Si no hay tramiteId, NO cargar ningún borrador automáticamente
        // Solo se carga cuando el usuario hace clic en un trámite específico desde el dashboard
        // Esto asegura que un nuevo trámite empiece en blanco
        setCargandoBorrador(false)
      }
    } else if (status === 'unauthenticated') {
      setCargandoBorrador(false)
    }
  }, [status])

  // Auto-guardado
  const handleAutoSave = useCallback(async (data: FormData) => {
    if (status !== 'authenticated') return
    
    try {
      // Obtener tramiteId de la URL si está presente
      const urlParams = new URLSearchParams(window.location.search)
      let tramiteIdFromUrl = urlParams.get('tramiteId')
      
      // Incluir tramiteId en los datos si está presente
      const dataToSave = tramiteIdFromUrl 
        ? { ...data, tramiteId: tramiteIdFromUrl }
        : data
      
      const response = await fetch('/api/tramites/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })
      
      if (response.ok) {
        const result = await response.json()
        // Si se creó un nuevo trámite, actualizar la URL con el tramiteId
        if (result.tramiteId && !tramiteIdFromUrl) {
          tramiteIdFromUrl = result.tramiteId
          const newUrl = `${window.location.pathname}?tramiteId=${result.tramiteId}`
          window.history.replaceState({}, '', newUrl)
        }
      }
    } catch (error) {
      console.error('Error en auto-guardado:', error)
    }
  }, [status])

  const { isSaving, lastSaved } = useAutoSave({
    data: formData,
    onSave: handleAutoSave,
    delay: 5000, // 5 segundos
    enabled: status === 'authenticated' && pasoActual >= 1 // Habilitar desde el paso 1
  })

  // Validación en tiempo real para el paso 1
  const paso1Validation = useFormValidation({
    nombre: [validators.required('El nombre es obligatorio')],
    apellido: [validators.required('El apellido es obligatorio')],
    dni: [
      validators.required('El DNI es obligatorio'),
      validators.dni('El DNI debe tener 7 u 8 dígitos')
    ],
    telefono: [
      validators.required('El teléfono es obligatorio'),
      validators.phone('Ingresa un teléfono válido')
    ],
    email: [
      validators.required('El email es obligatorio'),
      validators.email('Ingresa un email válido')
    ]
  }, formData)

  // Validación en tiempo real para el paso 2
  const paso2Validation = useFormValidation({
    denominacion1: [
      validators.required('La primera opción de denominación es obligatoria'),
      validators.minLength(3, 'La denominación debe tener al menos 3 caracteres')
    ],
    denominacion2: [
      validators.required('La segunda opción de denominación es obligatoria'),
      validators.minLength(3, 'La denominación debe tener al menos 3 caracteres')
    ],
    denominacion3: [
      validators.required('La tercera opción de denominación es obligatoria'),
      validators.minLength(3, 'La denominación debe tener al menos 3 caracteres')
    ]
  }, formData)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Validar campos obligatorios por paso
  const validarPaso = (paso: number): boolean => {
    switch (paso) {
      case 1:
        if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.dni.trim() || 
            !formData.telefono.trim() || !formData.email.trim() || !formData.plan || !formData.jurisdiccion) {
          toast.error('Por favor completa todos los campos obligatorios')
          return false
        }
        return true
      case 2:
        if (!formData.denominacion1.trim() || !formData.denominacion2.trim() || !formData.denominacion3.trim()) {
          toast.error('Por favor completa las tres opciones de denominación')
          return false
        }
        return true
      case 3:
        if (!formData.objetoSocial) {
          toast.error('Por favor selecciona el tipo de objeto social')
          return false
        }
        if (formData.objetoSocial === 'PERSONALIZADO' && !formData.objetoPersonalizado.trim()) {
          toast.error('Por favor completa el objeto social personalizado')
          return false
        }
        if (!formData.sinDomicilio) {
          if (!formData.domicilio.trim() || !formData.ciudad.trim() || !formData.departamento.trim()) {
            toast.error('Por favor completa el domicilio completo (calle, ciudad y departamento)')
            return false
          }
        }
        return true
      case 4:
        const capitalMinimo = 2 * smvm // smvm * 2
        if (!formData.capitalSocial.trim() || parseFloat(formData.capitalSocial) < capitalMinimo) {
          toast.error(`El capital social mínimo es de $${capitalMinimo.toLocaleString('es-AR')} (2 SMVM = $${smvm.toLocaleString('es-AR')} cada uno)`)
          return false
        }
        if (formData.jurisdiccion === 'CORDOBA' && (!formData.cbuPrincipal.trim() || !formData.cbuSecundario.trim())) {
          toast.error('Por favor completa ambos CBU')
          return false
        }
        return true
      case 5:
        if (formData.socios.length === 0) {
          toast.error('Debe haber al menos un socio')
          return false
        }
        for (let i = 0; i < formData.socios.length; i++) {
          const socio = formData.socios[i]
          if (!socio.nombre.trim() || !socio.apellido.trim() || !socio.dni.trim() || 
              !socio.cuit.trim() || !socio.domicilio.trim() || !socio.ciudad.trim() || 
              !socio.departamento.trim() || !socio.provincia.trim() || !socio.estadoCivil || !socio.profesion.trim()) {
            toast.error(`Por favor completa todos los campos del Socio ${i + 1} (incluyendo ciudad, departamento y provincia)`)
            return false
          }
          // Validar que tenga aporte de capital
          if (!socio.aporteCapital || parseFloat(socio.aporteCapital || '0') <= 0) {
            toast.error(`El Socio ${i + 1} debe tener un aporte de capital mayor a 0`)
            return false
          }
        }
        // Validar que todo el capital esté asignado
        // Parsear capital social correctamente (remover puntos de miles)
        const capitalStr = String(formData.capitalSocial || '0').replace(/\./g, '').replace(',', '.')
        const capitalTotal = parseFloat(capitalStr) || 0
        
        // Calcular total de aportes correctamente, considerando si viene de porcentaje o monto
        const totalAportes = formData.socios.reduce((sum, s) => {
          if (s.tipoAporte === 'PORCENTAJE') {
            // Si es porcentaje, calcular desde el porcentaje
            const porcentaje = parseFloat(String(s.aportePorcentaje || '0').replace(',', '.')) || 0
            return sum + (capitalTotal * porcentaje / 100)
          } else {
            // Si es monto, parsear el monto
            const aporteStr = String(s.aporteCapital || '0').replace(/\./g, '').replace(',', '.')
            return sum + (parseFloat(aporteStr) || 0)
          }
        }, 0)
        const diferencia = Math.abs(capitalTotal - totalAportes)
        if (diferencia > 1) { // Permitir diferencia de hasta $1 por redondeo
          toast.error(`El total de aportes ($${Math.round(totalAportes).toLocaleString('es-AR')}) debe ser igual al capital social ($${capitalTotal.toLocaleString('es-AR')}). Falta asignar: $${Math.round(capitalTotal - totalAportes).toLocaleString('es-AR')}`)
          return false
        }
        return true
      case 6:
        if (formData.administradores.length < 2) {
          toast.error('Debe haber al menos 2 administradores')
          return false
        }
        for (let i = 0; i < formData.administradores.length; i++) {
          const admin = formData.administradores[i]
          if (!admin.nombre.trim() || !admin.apellido.trim() || !admin.dni.trim() ||
              !admin.cuit.trim() || !admin.domicilio.trim() || !admin.estadoCivil || !admin.profesion.trim()) {
            toast.error(`Por favor completa todos los campos del Administrador ${i + 1}`)
            return false
          }
        }
        // Validar que el Titular y Suplente no sean la misma persona
        if (formData.administradores[0].dni === formData.administradores[1].dni) {
          toast.error('El Administrador Titular y el Suplente deben ser personas diferentes (tienen el mismo DNI)')
          return false
        }
        // Validar que no haya DNIs duplicados entre todos los administradores
        const dnisAdmin = formData.administradores.map(a => a.dni.trim())
        const dnisUnicos = new Set(dnisAdmin)
        if (dnisUnicos.size !== dnisAdmin.length) {
          toast.error('Cada administrador debe ser una persona diferente. Hay DNIs duplicados.')
          return false
        }
        return true
      case 7:
        if (!formData.fechaCierre.trim()) {
          toast.error('Por favor completa la fecha de cierre de ejercicio')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleSiguiente = () => {
    if (!validarPaso(pasoActual)) {
      return
    }
    if (pasoActual < 7) {
      setPasoActual(pasoActual + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    // Validar TODOS los pasos antes de enviar
    for (let paso = 1; paso <= 7; paso++) {
      if (!validarPaso(paso)) {
        toast.error(`Por favor completa todos los campos requeridos en el paso ${paso}`)
        setPasoActual(paso) // Llevar al usuario al paso con error
        return
      }
    }

    setGuardando(true)

    try {
      const response = await fetch('/api/tramites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('¡Trámite creado exitosamente! Redirigiendo...')
        // Redirigir inmediatamente al dashboard
        router.push('/dashboard')
      } else {
        console.error('Error del servidor:', result)
        toast.error(result.details || 'Error al crear el trámite')
        setGuardando(false)
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
      toast.error('Error al enviar el formulario')
      setGuardando(false)
    }
    // No ponemos setGuardando(false) en el caso exitoso para evitar que el usuario pueda hacer click de nuevo
  }

  if (cargandoBorrador) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block text-brand-700 font-semibold text-sm tracking-wider uppercase mb-2">
              Nuevo Trámite
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Constituí tu <span className="text-brand-700">S.A.S.</span></h1>
            <p className="text-gray-500 mt-2 text-lg">Completa el formulario paso a paso</p>
          </div>
          {/* Auto-save indicator */}
          {status === 'authenticated' && pasoActual >= 2 && (
            <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                    <span className="text-gray-600">Guardando...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Cloud className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600">
                      Guardado {new Date(lastSaved).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                ) : (
                  <>
                    <CloudOff className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Sin guardar</span>
                  </>
                )}
              </div>
            )}
        </div>

        {/* Progress Steps */}
        <div className="mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
          {/* Barra de progreso superior */}
          <div className="mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Progreso del formulario</span>
              </div>
              <span className="text-lg font-bold text-brand-600">
                {Math.round((pasoActual / 7) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-brand-600 to-brand-700 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{ width: `${(pasoActual / 7) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Paso {pasoActual} de 7</span>
              <span>{Math.round((pasoActual / 7) * 100)}% completado</span>
            </div>
          </div>

          {/* Pasos */}
          <div className="flex items-start justify-between min-w-max md:min-w-0 overflow-x-auto pt-2">
            {PASOS.map((paso, index) => {
              const Icon = paso.icon
              const isCompleted = pasoActual > paso.id
              const isActive = pasoActual === paso.id
              const isPending = pasoActual < paso.id
              
              return (
                <div key={paso.id} className="flex items-start flex-1 min-w-0">
                  {/* Step Content */}
                  <div className="flex flex-col items-center w-full">
                    {/* Icon Container - Fixed position */}
                    <div className="relative mb-3 md:mb-4 h-12 md:h-14 flex items-center justify-center">
                      <div
                        className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                          isCompleted
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 md:scale-110'
                            : isActive
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-300 md:scale-110 ring-2 md:ring-4 ring-brand-100'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4 md:h-6 md:w-6" />
                        ) : (
                          <Icon className={`h-4 w-4 md:h-6 md:w-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        )}
                      </div>
                      {/* Step Number Badge */}
                      {!isCompleted && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold ${
                          isActive ? 'bg-brand-700 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {paso.id}
                        </div>
                      )}
                    </div>
                    
                    {/* Labels - Fixed height for alignment */}
                    <div className="text-center w-full h-8 md:h-10 flex items-center justify-center">
                      <p className={`text-xs md:text-sm font-semibold transition-colors ${
                        isActive ? 'text-brand-600' : isCompleted ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {paso.nombre}
                      </p>
                    </div>
                  </div>
                  
                  {/* Connector Line - Fixed width for symmetry */}
                  {index < PASOS.length - 1 && (
                    <div className="flex-shrink-0 mx-1 md:mx-2 relative" style={{ marginTop: '20px', alignSelf: 'flex-start' }}>
                      <div className={`w-6 md:w-8 lg:w-10 h-0.5 md:h-1 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-brand-600' : 'bg-gray-200'
                      }`} />
                      {/* Animated progress dot */}
                      {isActive && (
                        <div className="absolute top-1/2 left-0 w-2 h-2 md:w-3 md:h-3 bg-brand-600 rounded-full transform -translate-y-1/2 animate-pulse" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="shadow-lg border-2 border-gray-200 rounded-2xl">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Paso 1: Datos */}
            {pasoActual === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-14 w-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 font-black text-xl">1</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900">Datos Personales</h2>
                    <p className="text-gray-500 mt-1">Información del solicitante y plan elegido</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={(e) => {
                      handleInputChange(e)
                      paso1Validation.setFieldTouched('nombre')
                    }}
                    placeholder="Juan"
                    required
                    error={paso1Validation.errors.nombre || undefined}
                    validation={paso1Validation.getFieldValidation('nombre')}
                    helpText="Tu nombre de pila"
                  />
                  <FormField
                    label="Apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={(e) => {
                      handleInputChange(e)
                      paso1Validation.setFieldTouched('apellido')
                    }}
                    placeholder="Pérez"
                    required
                    error={paso1Validation.errors.apellido || undefined}
                    validation={paso1Validation.getFieldValidation('apellido')}
                    helpText="Tu apellido completo"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    label="DNI"
                    name="dni"
                    value={formData.dni}
                    onChange={(e) => {
                      handleInputChange(e)
                      paso1Validation.setFieldTouched('dni')
                    }}
                    placeholder="12345678"
                    required
                    error={paso1Validation.errors.dni || undefined}
                    validation={paso1Validation.getFieldValidation('dni')}
                    helpText="Sin puntos ni guiones, solo números"
                    maxLength={8}
                  />
                  <FormField
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={(e) => {
                      handleInputChange(e)
                      paso1Validation.setFieldTouched('telefono')
                    }}
                    placeholder="+54 9 11 1234-5678"
                    required
                    error={paso1Validation.errors.telefono || undefined}
                    validation={paso1Validation.getFieldValidation('telefono')}
                    helpText="Incluye código de área"
                    type="tel"
                  />
                  <div className="sm:col-span-2 lg:col-span-1">
                    <FormField
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => {
                        handleInputChange(e)
                        paso1Validation.setFieldTouched('email')
                      }}
                      placeholder="correo@ejemplo.com"
                      required
                      error={paso1Validation.errors.email || undefined}
                      validation={paso1Validation.getFieldValidation('email')}
                      helpText="Usaremos este email para notificarte"
                      type="email"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-brand-900">Selecciona tu Plan</h3>
                    <Link href="/#planes" target="_blank">
                      <Button variant="outline" size="sm" className="gap-2 text-brand-700 border-brand-300 hover:bg-brand-50">
                        Ver Comparativa
                      </Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: 'BASICO', nombre: 'Básico', precio: '$285.000 + gastos' },
                      { id: 'EMPRENDEDOR', nombre: 'Emprendedor', precio: '$320.000 + gastos', destacado: true },
                      { id: 'PREMIUM', nombre: 'Premium', precio: '$390.000 + gastos' }
                    ].map(plan => (
                      <div
                        key={plan.id}
                        onClick={() => setFormData(prev => ({ ...prev, plan: plan.id as any }))}
                        className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                          formData.plan === plan.id
                            ? 'border-brand-600 bg-brand-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg text-brand-900">{plan.nombre}</h4>
                          {formData.plan === plan.id && (
                            <Check className="h-6 w-6 text-brand-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-2xl font-bold text-brand-900 my-2">{plan.precio}</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>✓ Constitución de Sociedad</li>
                          <li>✓ Obtención de CUIT</li>
                          <li>✓ Guía de uso de Libros Digitales</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-black text-lg text-gray-900 mb-4">Jurisdicción *</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'CORDOBA', nombre: 'Córdoba (IPJ)' },
                      { id: 'CABA', nombre: 'CABA (IGJ)' }
                    ].map(jurisdiccion => (
                      <div
                        key={jurisdiccion.id}
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          jurisdiccion: jurisdiccion.id as any,
                          provincia: jurisdiccion.id === 'CORDOBA' ? 'Córdoba' : 'Ciudad Autónoma de Buenos Aires'
                        }))}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                          formData.jurisdiccion === jurisdiccion.id
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{jurisdiccion.nombre}</span>
                          {formData.jurisdiccion === jurisdiccion.id && (
                            <Check className="h-5 w-5 text-brand-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Nombre */}
            {pasoActual === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-14 w-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 font-black text-xl">2</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900">Denominación Social</h2>
                    <p className="text-gray-500 mt-1">Nombre de tu sociedad</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-lg text-gray-900 mb-2">Nombre de la Sociedad</h3>
                  <p className="text-gray-500 mb-4">
                    Proporciona 3 opciones de nombre para tu SAS
                  </p>
                  
                  <div className="bg-brand-50 border-2 border-brand-100 rounded-xl p-4 mb-4">
                    <p className="text-sm text-brand-800">
                      <span className="font-semibold">Importante:</span> Proporciona tres opciones en orden de preferencia. Luego de un examen de homonimia te informaremos cuál creemos que es la más viable para registrar.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      label="Opción 1 (Preferida)"
                      name="denominacion1"
                      value={formData.denominacion1}
                      onChange={(e) => {
                        handleInputChange(e)
                        paso2Validation.setFieldTouched('denominacion1')
                      }}
                      placeholder="Denominacion1 SAS"
                      required
                      error={paso2Validation.errors.denominacion1 || undefined}
                      validation={paso2Validation.getFieldValidation('denominacion1')}
                      helpText="Tu primera opción de nombre para la sociedad"
                    />
                    <FormField
                      label="Opción 2"
                      name="denominacion2"
                      value={formData.denominacion2}
                      onChange={(e) => {
                        handleInputChange(e)
                        paso2Validation.setFieldTouched('denominacion2')
                      }}
                      placeholder="Denominacion2 SAS"
                      required
                      error={paso2Validation.errors.denominacion2 || undefined}
                      validation={paso2Validation.getFieldValidation('denominacion2')}
                      helpText="Segunda opción en caso de que la primera no esté disponible"
                    />
                    <FormField
                      label="Opción 3"
                      name="denominacion3"
                      value={formData.denominacion3}
                      onChange={(e) => {
                        handleInputChange(e)
                        paso2Validation.setFieldTouched('denominacion3')
                      }}
                      placeholder="Denominacion3 SAS"
                      required
                      error={paso2Validation.errors.denominacion3 || undefined}
                      validation={paso2Validation.getFieldValidation('denominacion3')}
                      helpText="Tercera opción como respaldo"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="marcaRegistrada"
                        checked={formData.marcaRegistrada}
                        onChange={handleInputChange}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-900">La marca está registrada</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">
                      Si la marca está registrada en el INPI, tendrás prioridad en la aprobación del nombre.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: Objeto */}
            {pasoActual === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-14 w-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 font-black text-xl">3</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900">Objeto Social</h2>
                    <p className="text-gray-500 mt-1">Actividad y domicilio legal</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 mb-2">Objeto y Domicilio</h3>
                  <p className="text-gray-500 mb-4">Define el propósito de tu sociedad y su domicilio legal</p>
                  <div className="space-y-4">
                    <div>
                      <Label>Objeto Social *</Label>
                      <div className="space-y-3 mt-2">
                        <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-brand-300 transition">
                          <input type="radio" name="objetoSocial" value="PREAPROBADO" checked={formData.objetoSocial === 'PREAPROBADO'} onChange={handleInputChange} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-gray-900">Objeto pre-aprobado</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs text-brand-700 border-brand-300 hover:bg-brand-50"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setMostrarObjetoPreAprobado(true)
                                }}
                              >
                                Ver objeto
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600">Objeto social estándar que cubre la mayoría de las actividades comerciales</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-brand-300 transition">
                          <input type="radio" name="objetoSocial" value="PERSONALIZADO" checked={formData.objetoSocial === 'PERSONALIZADO'} onChange={handleInputChange} className="mt-1" />
                          <div>
                            <p className="font-medium text-gray-900">Objeto personalizado</p>
                            <p className="text-sm text-gray-600">Define actividades específicas para tu sociedad</p>
                          </div>
                        </label>
                      </div>
                    </div>
                    {formData.objetoSocial === 'PERSONALIZADO' && (
                      <div>
                        <Label htmlFor="objetoPersonalizado">Describe tu objeto social *</Label>
                        <textarea id="objetoPersonalizado" value={formData.objetoPersonalizado} onChange={(e) => setFormData(prev => ({ ...prev, objetoPersonalizado: e.target.value }))} className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent" rows={4} placeholder="Describe las actividades específicas..." />
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="font-black text-lg text-gray-900 mb-2">Domicilio Social</h3>
                  <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-brand-900">ℹ️ Jurisdicción: {formData.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'CABA'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="sinDomicilio" checked={formData.sinDomicilio} onChange={handleInputChange} className="rounded" />
                      <span className="text-sm font-medium text-gray-900">No dispongo de domicilio</span>
                    </label>
                    {formData.sinDomicilio && (
                      <div className="mt-2 ml-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-900">
                          💡 Por un costo extra anual (a determinar), Quiero Mi SAS puede proporcionarte un domicilio. En ese caso, se anula la carga del domicilio.
                        </p>
                      </div>
                    )}
                  </div>
                  {!formData.sinDomicilio && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="domicilio">Domicilio completo *</Label>
                        <p className="text-xs text-gray-500 mb-2">Se requiere que sea completo con indicación de piso, departamento, lote o manzana si correspondiera.</p>
                        <Input id="domicilio" name="domicilio" value={formData.domicilio} onChange={handleInputChange} placeholder="Av. Colón 123, Piso 2, Dpto. A" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="ciudad">Ciudad *</Label>
                          <Select id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleInputChange}>
                            <option value="">Seleccionar ciudad...</option>
                            {CIUDADES_CORDOBA.map(ciudad => (
                              <option key={ciudad} value={ciudad}>{ciudad}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="departamento">Departamento *</Label>
                          <Select id="departamento" name="departamento" value={formData.departamento} onChange={handleInputChange}>
                            <option value="">Seleccionar departamento...</option>
                            {DEPARTAMENTOS_CORDOBA.map(depto => (
                              <option key={depto} value={depto}>{depto}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="provincia">Provincia *</Label>
                          <Input 
                            id="provincia" 
                            name="provincia" 
                            value={formData.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'Ciudad Autónoma de Buenos Aires'} 
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PASO 4: Capital */}
            {pasoActual === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-14 w-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 font-black text-xl">4</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900">Capital Social</h2>
                    <p className="text-gray-500 mt-1">Monto del capital y datos bancarios</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 mb-2">Capital Social y CBU</h3>
                  <p className="text-gray-500 mb-4">Define el capital inicial de tu sociedad</p>
                  <div className="bg-brand-50 border-2 border-brand-100 rounded-xl p-4 mb-4">
                    <p className="text-sm text-brand-900 mb-2">ℹ️ El capital social mínimo es de 2 SMVM (Salario Mínimo, Vital y Móvil).</p>
                    <p className="text-sm font-bold text-brand-900">2 SMVM = ${(2 * smvm).toLocaleString('es-AR')}</p>
                    <p className="text-xs text-gray-600 mt-1">SMVM actual: ${smvm.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Capital Social *</Label>
                      <div className="space-y-3 mt-2">
                        <label className="flex items-center gap-3 p-3 border-2 border-brand-600 bg-brand-50 rounded-lg cursor-pointer">
                          <input type="radio" name="capitalSocialOpcion" checked={formData.capitalSocial === String(2 * smvm)} onChange={() => setFormData(prev => ({ ...prev, capitalSocial: String(2 * smvm) }))} />
                          <div>
                            <p className="font-medium text-gray-900">Capital Social Mínimo (2 SMVM: ${(2 * smvm).toLocaleString('es-AR')})</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:border-brand-300 transition">
                          <input type="radio" name="capitalSocialOpcion" checked={formData.capitalSocial !== String(2 * smvm)} onChange={() => setFormData(prev => ({ ...prev, capitalSocial: '' }))} />
                          <div>
                            <p className="font-medium text-gray-900">Otro monto</p>
                          </div>
                        </label>
                      </div>
                    </div>
                    {formData.capitalSocial !== String(2 * smvm) && (
                      <div>
                        <Label htmlFor="capitalSocialCustom">Capital Social *</Label>
                        <Input id="capitalSocialCustom" type="number" value={formData.capitalSocial} onChange={(e) => setFormData(prev => ({ ...prev, capitalSocial: e.target.value }))} placeholder={`Mínimo: ${(2 * smvm).toLocaleString('es-AR')}`} min={2 * smvm} />
                        {formData.capitalSocial && parseFloat(formData.capitalSocial) < (2 * smvm) && (
                          <p className="text-xs text-brand-600 mt-1">El capital mínimo es ${(2 * smvm).toLocaleString('es-AR')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="font-black text-lg text-gray-900 mb-2">Depósito del Capital (CBU)</h3>
                  <div className="bg-brand-50 border-2 border-brand-100 rounded-xl p-4 mb-4">
                    <p className="text-sm text-brand-900 mb-2">ℹ️ En Córdoba es obligatorio realizar un depósito inicial del 25% del capital social en una cuenta bancaria. Este dinero luego será reintegrado a los CBU informados.</p>
                    <p className="text-sm font-bold text-brand-900 mt-3">Requisitos de CBU:</p>
                    <ul className="text-xs text-gray-700 mt-2 space-y-1 ml-4">
                      <li>• El CBU Principal deberá ser del Administrador Titular</li>
                      <li>• El CBU Secundario deberá corresponder a otra cuenta del Administrador Titular o a otro Administrador</li>
                      <li>• Las cuentas NO pueden ser CVU (Clave Virtual Uniforme)</li>
                      <li>• Deben ser CBU (Clave Bancaria Uniforme)</li>
                    </ul>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.cbuPrincipal === 'INFORMAR_LUEGO'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, cbuPrincipal: 'INFORMAR_LUEGO', cbuSecundario: 'INFORMAR_LUEGO' }))
                          } else {
                            setFormData(prev => ({ ...prev, cbuPrincipal: '', cbuSecundario: '' }))
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Informar CBU más adelante</p>
                        <p className="text-sm text-gray-600">Podrás proporcionar el CBU en otro momento del proceso</p>
                      </div>
                    </label>
                  </div>

                      {formData.cbuPrincipal !== 'INFORMAR_LUEGO' && (
                    <div className="space-y-4">
                      <FormField
                        label="CBU Principal"
                        name="cbuPrincipal"
                        value={formData.cbuPrincipal}
                        onChange={(e) => {
                          handleInputChange(e)
                          if (formData.jurisdiccion === 'CORDOBA') {
                            // Validar CBU solo si es Córdoba
                            const value = e.target.value.replace(/[.\-]/g, '')
                            if (value.length === 22 && /^\d{22}$/.test(value)) {
                              // CBU válido
                            }
                          }
                        }}
                        placeholder="0000000000000000000000"
                        required={formData.jurisdiccion === 'CORDOBA'}
                        helpText="22 dígitos sin espacios ni guiones"
                        maxLength={22}
                        pattern="\d{22}"
                        className="font-mono"
                        error={
                          formData.jurisdiccion === 'CORDOBA' && formData.cbuPrincipal && 
                          formData.cbuPrincipal.replace(/[.\-]/g, '').length !== 22
                            ? 'El CBU debe tener exactamente 22 dígitos'
                            : undefined
                        }
                        validation={
                          formData.jurisdiccion === 'CORDOBA' && formData.cbuPrincipal
                            ? formData.cbuPrincipal.replace(/[.\-]/g, '').length === 22 && /^\d{22}$/.test(formData.cbuPrincipal.replace(/[.\-]/g, ''))
                              ? 'success'
                              : formData.cbuPrincipal.length > 0
                                ? 'error'
                                : 'none'
                            : 'none'
                        }
                      />
                      <FormField
                        label="CBU Secundario"
                        name="cbuSecundario"
                        value={formData.cbuSecundario}
                        onChange={(e) => {
                          handleInputChange(e)
                        }}
                        placeholder="0000000000000000000000"
                        required={formData.jurisdiccion === 'CORDOBA'}
                        helpText="22 dígitos sin espacios ni guiones"
                        maxLength={22}
                        pattern="\d{22}"
                        className="font-mono"
                        error={
                          formData.jurisdiccion === 'CORDOBA' && formData.cbuSecundario && 
                          formData.cbuSecundario.replace(/[.\-]/g, '').length !== 22
                            ? 'El CBU debe tener exactamente 22 dígitos'
                            : undefined
                        }
                        validation={
                          formData.jurisdiccion === 'CORDOBA' && formData.cbuSecundario
                            ? formData.cbuSecundario.replace(/[.\-]/g, '').length === 22 && /^\d{22}$/.test(formData.cbuSecundario.replace(/[.\-]/g, ''))
                              ? 'success'
                              : formData.cbuSecundario.length > 0
                                ? 'error'
                                : 'none'
                            : 'none'
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Paso 5: Socios */}
            {pasoActual === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-14 w-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 font-black text-xl">5</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900">Socios</h2>
                    <p className="text-gray-500 mt-1">Datos de los accionistas</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-lg text-gray-900 mb-2">Socios / Accionistas</h3>
                  <p className="text-gray-500 mb-4">
                    Define quiénes serán los socios y su participación en el capital
                  </p>

                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Número de socios:</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.numeroSocios > 1) {
                              setFormData(prev => ({
                                ...prev,
                                numeroSocios: prev.numeroSocios - 1,
                                socios: prev.socios.slice(0, -1)
                              }))
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-brand-600 text-white border-2 border-brand-600 hover:bg-brand-700 hover:border-brand-700 flex items-center justify-center font-bold text-lg shadow-sm transition-colors"
                        >
                          −
                        </button>
                        <span className="text-lg font-bold text-gray-900 w-8 text-center">{formData.numeroSocios}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              numeroSocios: prev.numeroSocios + 1,
                              socios: [...prev.socios, {
                                nombre: '',
                                apellido: '',
                                dni: '',
                                cuit: '',
                                domicilio: '',
                                ciudad: '',
                                departamento: '',
                                provincia: '',
                                estadoCivil: '',
                                profesion: '',
                                aporteCapital: '0',
                                tipoAporte: 'MONTO',
                                aportePorcentaje: '0'
                              }]
                            }))
                          }}
                          className="w-8 h-8 rounded-full bg-brand-600 text-white border-2 border-brand-600 hover:bg-brand-700 hover:border-brand-700 flex items-center justify-center font-bold text-lg shadow-sm transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-sm space-y-1">
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Capital Social:</span> ${parseFloat(formData.capitalSocial || '0').toLocaleString('es-AR')}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Total de Aportes:</span> $
                        {(() => {
                          // Parsear capital social correctamente (remover puntos de miles)
                          const capitalStr = String(formData.capitalSocial || '0').replace(/\./g, '').replace(',', '.')
                          const capitalTotal = parseFloat(capitalStr) || 0
                          // Calcular total de aportes correctamente, considerando si viene de porcentaje o monto
                          const totalAportes = formData.socios.reduce((sum, s) => {
                            if (s.tipoAporte === 'PORCENTAJE') {
                              // Si es porcentaje, calcular desde el porcentaje
                              const porcentaje = parseFloat(String(s.aportePorcentaje || '0').replace(',', '.')) || 0
                              return sum + (capitalTotal * porcentaje / 100)
                            } else {
                              // Si es monto, parsear el monto
                              const aporteStr = String(s.aporteCapital || '0').replace(/\./g, '').replace(',', '.')
                              return sum + (parseFloat(aporteStr) || 0)
                            }
                          }, 0)
                          return Math.round(totalAportes).toLocaleString('es-AR')
                        })()}
                      </p>
                      {(() => {
                        // Parsear capital social correctamente (remover puntos de miles)
                        const capitalStr = String(formData.capitalSocial || '0').replace(/\./g, '').replace(',', '.')
                        const capitalTotal = parseFloat(capitalStr) || 0
                        // Calcular total de aportes correctamente, considerando si viene de porcentaje o monto
                        const totalAportes = formData.socios.reduce((sum, s) => {
                          if (s.tipoAporte === 'PORCENTAJE') {
                            // Si es porcentaje, calcular desde el porcentaje
                            const porcentaje = parseFloat(String(s.aportePorcentaje || '0').replace(',', '.')) || 0
                            return sum + (capitalTotal * porcentaje / 100)
                          } else {
                            // Si es monto, parsear el monto
                            const aporteStr = String(s.aporteCapital || '0').replace(/\./g, '').replace(',', '.')
                            return sum + (parseFloat(aporteStr) || 0)
                          }
                        }, 0)
                        const faltaAsignar = capitalTotal - totalAportes
                        const diferencia = Math.abs(faltaAsignar)
                        return (
                          <p className={diferencia <= 1 ? 'text-green-600 font-medium' : 'text-brand-600 font-medium'}>
                            <span className="font-semibold">{diferencia <= 1 ? '✓ Capital completo' : 'Falta asignar'}:</span> $
                            {diferencia <= 1 ? '0' : Math.round(faltaAsignar).toLocaleString('es-AR')}
                          </p>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-brand-900">
                      💡 <strong>Requisitos importantes:</strong> Es fundamental que los accionistas designados tengan un domicilio fiscal registrado ante ARCA y su CUIT habilitado. En caso de no cumplir con estos requisitos, deberá regularizarse la situación para continuar con el trámite.
                    </p>
                  </div>

                  {formData.socios.map((socio, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-2xl p-6 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-black text-gray-900 text-lg mb-4">Socio {index + 1}</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Nombre *</Label>
                          <Input
                            value={socio.nombre}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].nombre = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Juan"
                          />
                        </div>
                        <div>
                          <Label>Apellido *</Label>
                          <Input
                            value={socio.apellido}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].apellido = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Pérez"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <FormField
                          label="DNI"
                          name={`socio-${index}-dni`}
                          value={socio.dni}
                          onChange={(e) => {
                            const newSocios = [...formData.socios]
                            newSocios[index].dni = e.target.value.replace(/[.\-]/g, '')
                            setFormData(prev => ({ ...prev, socios: newSocios }))
                          }}
                          placeholder="12345678"
                          required
                          helpText="Sin puntos ni guiones, solo números"
                          maxLength={8}
                          error={
                            socio.dni && !/^\d{7,8}$/.test(socio.dni)
                              ? 'El DNI debe tener 7 u 8 dígitos'
                              : undefined
                          }
                          validation={
                            socio.dni
                              ? /^\d{7,8}$/.test(socio.dni)
                                ? 'success'
                                : 'error'
                              : 'none'
                          }
                        />
                        <FormField
                          label="CUIT"
                          name={`socio-${index}-cuit`}
                          value={socio.cuit}
                          onChange={(e) => {
                            const newSocios = [...formData.socios]
                            newSocios[index].cuit = e.target.value.replace(/[.\-]/g, '')
                            setFormData(prev => ({ ...prev, socios: newSocios }))
                          }}
                          placeholder="20123456789"
                          required
                          helpText="11 dígitos sin guiones"
                          maxLength={11}
                          error={
                            socio.cuit && !/^\d{11}$/.test(socio.cuit)
                              ? 'El CUIT debe tener 11 dígitos'
                              : undefined
                          }
                          validation={
                            socio.cuit
                              ? /^\d{11}$/.test(socio.cuit)
                                ? 'success'
                                : 'error'
                              : 'none'
                          }
                        />
                      </div>

                      <div className="mb-4">
                        <Label>Domicilio completo *</Label>
                        <p className="text-xs text-gray-500 mb-2">Incluye calle, número, piso, departamento, lote o manzana si correspondiera</p>
                        <Input
                          value={socio.domicilio}
                          onChange={(e) => {
                            const newSocios = [...formData.socios]
                            newSocios[index].domicilio = e.target.value
                            setFormData(prev => ({ ...prev, socios: newSocios }))
                          }}
                          placeholder="Av. Córdoba 1234, Piso 2, Dpto. A"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Ciudad *</Label>
                          <Input
                            value={socio.ciudad}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].ciudad = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Córdoba"
                          />
                        </div>
                        <div>
                          <Label>Departamento *</Label>
                          <Input
                            value={socio.departamento}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].departamento = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Capital"
                          />
                        </div>
                        <div>
                          <Label>Provincia *</Label>
                          <Input
                            value={socio.provincia}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].provincia = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Córdoba"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Estado civil *</Label>
                          <Select
                            value={socio.estadoCivil}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].estadoCivil = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                          >
                            <option value="">Seleccionar</option>
                            <option value="Soltero/a">Soltero/a</option>
                            <option value="Casado/a">Casado/a</option>
                            <option value="Divorciado/a">Divorciado/a</option>
                            <option value="Viudo/a">Viudo/a</option>
                          </Select>
                        </div>
                        <div>
                          <Label>Profesión *</Label>
                          <Input
                            value={socio.profesion}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].profesion = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Comerciante"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Aporte de capital *</Label>
                        <div className="space-y-3">
                          {/* Selector de tipo */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newSocios = [...formData.socios]
                                newSocios[index].tipoAporte = 'MONTO'
                                setFormData(prev => ({ ...prev, socios: newSocios }))
                              }}
                              className={`px-3 py-1.5 text-sm rounded-lg border-2 transition ${
                                socio.tipoAporte === 'MONTO'
                                  ? 'border-brand-600 bg-brand-50 text-brand-900 font-medium'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              Monto ($)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newSocios = [...formData.socios]
                                newSocios[index].tipoAporte = 'PORCENTAJE'
                                setFormData(prev => ({ ...prev, socios: newSocios }))
                              }}
                              className={`px-3 py-1.5 text-sm rounded-lg border-2 transition ${
                                socio.tipoAporte === 'PORCENTAJE'
                                  ? 'border-brand-600 bg-brand-50 text-brand-900 font-medium'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              Porcentaje (%)
                            </button>
                          </div>
                          
                          {/* Input según el tipo */}
                          {socio.tipoAporte === 'MONTO' ? (
                            <div>
                              <Input
                                type="number"
                                value={socio.aporteCapital}
                                onChange={(e) => {
                                  const newSocios = [...formData.socios]
                                  const monto = parseFloat(e.target.value) || 0
                                  // Parsear capital social correctamente (remover puntos de miles)
                                  const capitalStr = String(formData.capitalSocial || '0').replace(/\./g, '').replace(',', '.')
                                  const capitalTotal = parseFloat(capitalStr) || 0
                                  const porcentaje = capitalTotal > 0 ? ((monto / capitalTotal) * 100).toFixed(2) : '0'
                                  newSocios[index].aporteCapital = e.target.value
                                  newSocios[index].aportePorcentaje = porcentaje
                                  setFormData(prev => ({ ...prev, socios: newSocios }))
                                }}
                                placeholder="0"
                                min="0"
                              />
                              {socio.aportePorcentaje && parseFloat(socio.aportePorcentaje) > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Equivale al {socio.aportePorcentaje}% del capital social
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <Input
                                type="number"
                                value={socio.aportePorcentaje}
                                onChange={(e) => {
                                  const newSocios = [...formData.socios]
                                  const porcentaje = parseFloat(e.target.value) || 0
                                  // Parsear capital social correctamente (remover puntos de miles)
                                  const capitalStr = String(formData.capitalSocial || '0').replace(/\./g, '').replace(',', '.')
                                  const capitalTotal = parseFloat(capitalStr) || 0
                                  const monto = (capitalTotal * porcentaje) / 100
                                  newSocios[index].aportePorcentaje = e.target.value
                                  // Guardar el monto sin decimales para evitar problemas de precisión
                                  newSocios[index].aporteCapital = Math.round(monto).toString()
                                  setFormData(prev => ({ ...prev, socios: newSocios }))
                                }}
                                placeholder="0"
                                min="0"
                                max="100"
                                step="0.01"
                              />
                              {socio.aporteCapital && parseFloat(socio.aporteCapital) > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Equivale a ${parseFloat(socio.aporteCapital).toLocaleString('es-AR')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paso 6: Administración */}
            {pasoActual === 6 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-14 w-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 font-black text-xl">6</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900">Administración</h2>
                    <p className="text-gray-500 mt-1">Órgano de administración</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-lg text-gray-900 mb-2">Órgano de Administración</h3>
                  <p className="text-gray-500 mb-4">
                    Define quiénes administrarán la sociedad
                  </p>

                  <div className="bg-brand-50 border-2 border-brand-100 rounded-xl p-4 mb-4">
                    <p className="text-sm text-brand-900">
                      ℹ️ <strong>Requisitos de administradores:</strong> Es obligatoria la designación de como mínimo un Administrador Titular y un Suplente. Los Administradores pueden o no ser socios de la Sociedad.
                    </p>
                  </div>

                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Número de administradores:</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.numeroAdministradores > 2) {
                              setFormData(prev => ({
                                ...prev,
                                numeroAdministradores: prev.numeroAdministradores - 1,
                                administradores: prev.administradores.slice(0, -1)
                              }))
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-white border-2 hover:bg-gray-50 flex items-center justify-center"
                          disabled={formData.numeroAdministradores <= 2}
                        >
                          −
                        </button>
                        <span className="text-lg font-bold text-gray-900 w-8 text-center">{formData.numeroAdministradores}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              numeroAdministradores: prev.numeroAdministradores + 1,
                              administradores: [...prev.administradores, {
                                nombre: '',
                                apellido: '',
                                dni: '',
                                cuit: '',
                                domicilio: '',
                                ciudad: '',
                                departamento: '',
                                provincia: '',
                                estadoCivil: '',
                                profesion: ''
                              }]
                            }))
                          }}
                          className="w-8 h-8 rounded-full bg-white border-2 hover:bg-gray-50 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-yellow-900">
                      💡 Puedes autocompletar los datos de un administrador seleccionando un socio existente
                    </p>
                  </div>

                  {formData.administradores.map((admin, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-2xl p-6 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-gray-900 text-lg">
                          {index === 0 ? 'Administrador Titular' : index === 1 ? 'Administrador Suplente' : `Administrador ${index + 1}`}
                        </h4>
                        
                        {formData.socios.length > 0 && (
                          <Select
                            value=""
                            onChange={(e) => {
                              const socioIndex = parseInt(e.target.value)
                              if (!isNaN(socioIndex)) {
                                const socio = formData.socios[socioIndex]
                                // Verificar si este DNI ya está siendo usado por otro administrador (Titular vs Suplente)
                                const dniYaUsado = formData.administradores.some((admin, adminIdx) =>
                                  adminIdx !== index &&
                                  admin.dni &&
                                  admin.dni === socio.dni
                                )
                                if (dniYaUsado) {
                                  alert('Este socio ya está seleccionado como otro administrador. El Administrador Titular y el Suplente deben ser personas diferentes.')
                                  return
                                }
                                const newAdmins = [...formData.administradores]
                                newAdmins[index] = {
                                  nombre: socio.nombre,
                                  apellido: socio.apellido,
                                  dni: socio.dni,
                                  cuit: socio.cuit,
                                  domicilio: socio.domicilio,
                                  ciudad: socio.ciudad,
                                  departamento: socio.departamento,
                                  provincia: socio.provincia,
                                  estadoCivil: socio.estadoCivil,
                                  profesion: socio.profesion
                                }
                                setFormData(prev => ({ ...prev, administradores: newAdmins }))
                              }
                            }}
                            className="text-sm max-w-xs"
                          >
                            <option value="">Autocompletar desde socio...</option>
                            {formData.socios.map((socio, idx) => {
                              // Deshabilitar si el socio ya está usado como otro administrador
                              const yaUsado = formData.administradores.some((admin, adminIdx) =>
                                adminIdx !== index &&
                                admin.dni &&
                                admin.dni === socio.dni
                              )
                              return (
                                <option
                                  key={idx}
                                  value={idx}
                                  disabled={yaUsado}
                                >
                                  {socio.nombre} {socio.apellido}{yaUsado ? ' (ya asignado)' : ''}
                                </option>
                              )
                            })}
                          </Select>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Nombre *</Label>
                          <Input
                            value={admin.nombre}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].nombre = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="Juan"
                          />
                        </div>
                        <div>
                          <Label>Apellido *</Label>
                          <Input
                            value={admin.apellido}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].apellido = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="Pérez"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <FormField
                          label="DNI"
                          name={`admin-${index}-dni`}
                          value={admin.dni}
                          onChange={(e) => {
                            const newAdmins = [...formData.administradores]
                            newAdmins[index].dni = e.target.value.replace(/[.\-]/g, '')
                            setFormData(prev => ({ ...prev, administradores: newAdmins }))
                          }}
                          placeholder="12345678"
                          required
                          helpText="Sin puntos ni guiones, solo números"
                          maxLength={8}
                          error={
                            admin.dni && !/^\d{7,8}$/.test(admin.dni)
                              ? 'El DNI debe tener 7 u 8 dígitos'
                              : undefined
                          }
                          validation={
                            admin.dni
                              ? /^\d{7,8}$/.test(admin.dni)
                                ? 'success'
                                : 'error'
                              : 'none'
                          }
                        />
                        <FormField
                          label="CUIT"
                          name={`admin-${index}-cuit`}
                          value={admin.cuit}
                          onChange={(e) => {
                            const newAdmins = [...formData.administradores]
                            newAdmins[index].cuit = e.target.value.replace(/[.\-]/g, '')
                            setFormData(prev => ({ ...prev, administradores: newAdmins }))
                          }}
                          placeholder="20123456789"
                          required
                          helpText="11 dígitos sin guiones"
                          maxLength={11}
                          error={
                            admin.cuit && !/^\d{11}$/.test(admin.cuit)
                              ? 'El CUIT debe tener 11 dígitos'
                              : undefined
                          }
                          validation={
                            admin.cuit
                              ? /^\d{11}$/.test(admin.cuit)
                                ? 'success'
                                : 'error'
                              : 'none'
                          }
                        />
                      </div>

                      <div className="mb-4">
                        <Label>Domicilio completo *</Label>
                        <p className="text-xs text-gray-500 mb-2">Incluye calle, número, piso, departamento, lote o manzana si correspondiera</p>
                        <Input
                          value={admin.domicilio}
                          onChange={(e) => {
                            const newAdmins = [...formData.administradores]
                            newAdmins[index].domicilio = e.target.value
                            setFormData(prev => ({ ...prev, administradores: newAdmins }))
                          }}
                          placeholder="Av. Córdoba 1234, Piso 2, Dpto. A"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Ciudad *</Label>
                          <Input
                            value={admin.ciudad}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].ciudad = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="Ej: Córdoba, Buenos Aires, Rosario..."
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Puede ser de cualquier provincia de Argentina</p>
                        </div>
                        <div>
                          <Label>Departamento *</Label>
                          <Input
                            value={admin.departamento}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].departamento = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="Ej: Capital, La Matanza, Rosario..."
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Puede ser de cualquier provincia de Argentina</p>
                        </div>
                        <div>
                          <Label>Provincia *</Label>
                          <Select
                            value={admin.provincia || ''}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].provincia = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            required
                          >
                            <option value="">Seleccionar provincia...</option>
                            <option value="Buenos Aires">Buenos Aires</option>
                            <option value="Catamarca">Catamarca</option>
                            <option value="Chaco">Chaco</option>
                            <option value="Chubut">Chubut</option>
                            <option value="Córdoba">Córdoba</option>
                            <option value="Corrientes">Corrientes</option>
                            <option value="Entre Ríos">Entre Ríos</option>
                            <option value="Formosa">Formosa</option>
                            <option value="Jujuy">Jujuy</option>
                            <option value="La Pampa">La Pampa</option>
                            <option value="La Rioja">La Rioja</option>
                            <option value="Mendoza">Mendoza</option>
                            <option value="Misiones">Misiones</option>
                            <option value="Neuquén">Neuquén</option>
                            <option value="Río Negro">Río Negro</option>
                            <option value="Salta">Salta</option>
                            <option value="San Juan">San Juan</option>
                            <option value="San Luis">San Luis</option>
                            <option value="Santa Cruz">Santa Cruz</option>
                            <option value="Santa Fe">Santa Fe</option>
                            <option value="Santiago del Estero">Santiago del Estero</option>
                            <option value="Tierra del Fuego">Tierra del Fuego</option>
                            <option value="Tucumán">Tucumán</option>
                            <option value="Ciudad Autónoma de Buenos Aires">Ciudad Autónoma de Buenos Aires</option>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Estado civil *</Label>
                          <Select
                            value={admin.estadoCivil}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].estadoCivil = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                          >
                            <option value="">Seleccionar</option>
                            <option value="Soltero/a">Soltero/a</option>
                            <option value="Casado/a">Casado/a</option>
                            <option value="Divorciado/a">Divorciado/a</option>
                            <option value="Viudo/a">Viudo/a</option>
                          </Select>
                        </div>
                        <div>
                          <Label>Profesión *</Label>
                          <Input
                            value={admin.profesion}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].profesion = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="Comerciante"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paso 7: Cierre */}
            {pasoActual === 7 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-14 w-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 font-black text-xl">7</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900">Cierre de Ejercicio</h2>
                    <p className="text-gray-500 mt-1">Fecha de cierre contable</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-lg text-gray-900 mb-2">Cierre de Ejercicio Económico</h3>
                  <p className="text-gray-500 mb-4">
                    Define la fecha de cierre del ejercicio económico
                  </p>

                  <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      El cierre de ejercicio es la fecha anual en la que se cierran los libros contables y se preparan los estados financieros. La fecha más común es el 31 de diciembre (31-12).
                    </p>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="fechaCierre">Fecha de cierre de ejercicio (día-mes) *</Label>
                    <Input
                      id="fechaCierre"
                      name="fechaCierre"
                      value={formData.fechaCierre}
                      onChange={handleInputChange}
                      placeholder="31-12"
                      pattern="\d{2}-\d{2}"
                      required
                      className="max-w-xs"
                    />
                    <p className="text-xs text-brand-600 mt-1">Este campo es obligatorio</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ingresa el día y mes de cierre (formato: dd-mm). Ejemplo: 31-12 para el 31 de diciembre
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        name="asesoramientoContable"
                        checked={formData.asesoramientoContable}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Deseo recibir asesoramiento contable adicional</p>
                        <p className="text-sm text-gray-600">
                          Recibe ayuda profesional con la gestión contable y fiscal de tu sociedad
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-2xl p-6">
                    <h4 className="font-black text-green-900 text-xl mb-3">¡Todo listo para enviar!</h4>
                    <p className="text-green-800 mb-4">
                      Has completado todos los pasos del formulario. Revisa la información y cuando estés listo, haz click en &quot;Enviar Formulario&quot; para iniciar tu trámite de constitución.
                    </p>
                    <div className="bg-white rounded-xl p-4 text-gray-700 space-y-2 border border-green-100">
                      <p><span className="font-semibold">Plan seleccionado:</span> {formData.plan}</p>
                      <p><span className="font-semibold">Jurisdicción:</span> {formData.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}</p>
                      <p><span className="font-semibold">Capital Social:</span> ${formData.capitalSocial}</p>
                      <p><span className="font-semibold">Socios:</span> {formData.numeroSocios}</p>
                      <p><span className="font-semibold">Administradores:</span> {formData.numeroAdministradores}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navegación */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleAnterior}
                disabled={pasoActual === 1}
                className="gap-2 w-full sm:w-auto rounded-xl h-12 px-6 font-semibold"
              >
                <ChevronLeft className="h-5 w-5" />
                Anterior
              </Button>

              {pasoActual < 7 ? (
                <Button onClick={handleSiguiente} className="gap-2 bg-brand-700 hover:bg-brand-800 w-full sm:w-auto rounded-xl shadow-lg shadow-brand-200 h-12 px-6 font-semibold">
                  Siguiente
                  <ChevronRight className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={guardando}
                  className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto rounded-xl shadow-lg shadow-green-200 h-12 px-8 font-semibold"
                >
                  {guardando ? 'Enviando...' : 'Enviar Formulario'}
                  <ChevronRight className="h-5 w-5" />
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
              <p className="text-sm text-gray-700 leading-relaxed">
                La sociedad tiene por objeto realizar por cuenta propia y/o de terceros, o asociadas a terceros en el país o en el extranjero, las siguientes actividades:
              </p>
              <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 leading-relaxed">
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