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
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAutoSave } from '@/hooks/useAutoSave'

// Constante SMVM (Salario Mínimo, Vital y Móvil) - Variable configurable
const SMVM = 317800 // Este valor se puede cambiar fácilmente

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
  'Cruz del Eje', 'Calamuchita', 'Calamuchita', 'Calamuchita'
]

const CIUDADES_CORDOBA = [
  'Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María', 'San Francisco', 
  'Villa Allende', 'Jesús María', 'La Calera', 'Arroyito', 'Marcos Juárez',
  'Bell Ville', 'Leones', 'Monte Cristo', 'Morteros', 'Villa Dolores', 'Cruz del Eje',
  'Deán Funes', 'Jesús María', 'Villa General Belgrano', 'La Falda', 'Cosquín',
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
    
    capitalSocial: String(2 * SMVM),
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
                capitalSocial: String(draft.capitalSocial || (2 * SMVM)),
                cbuPrincipal: datosUsuario.cbuPrincipal || '',
                cbuSecundario: datosUsuario.cbuSecundario || '',
                fechaCierre: datosUsuario.fechaCierre || '31-12',
                asesoramientoContable: datosUsuario.asesoramientoContable !== undefined ? datosUsuario.asesoramientoContable : false,
                numeroSocios: socios.length || 1,
                socios: socios.length > 0 ? socios.map((s: any) => {
                  const capitalTotal = parseFloat(String(draft.capitalSocial || (2 * SMVM)))
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
        const capitalMinimo = 2 * SMVM // SMVM * 2
        if (!formData.capitalSocial.trim() || parseFloat(formData.capitalSocial) < capitalMinimo) {
          toast.error(`El capital social mínimo es de $${capitalMinimo.toLocaleString('es-AR')} (2 SMVM = $${SMVM.toLocaleString('es-AR')} cada uno)`)
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
        toast.success('¡Trámite creado exitosamente!')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        console.error('Error del servidor:', result)
        toast.error(result.details || 'Error al crear el trámite')
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
      toast.error('Error al enviar el formulario')
    } finally {
      setGuardando(false)
    }
  }

  if (cargandoBorrador) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
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
            <h1 className="text-3xl font-bold text-red-900">Nuevo Trámite</h1>
            <p className="text-gray-600 mt-1">Completa el formulario para constituir tu S.A.S.</p>
          </div>
          {/* Auto-save indicator */}
          {status === 'authenticated' && pasoActual >= 2 && (
            <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
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
        <div className="mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
          <div className="flex items-start justify-between min-w-max md:min-w-0">
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
                            ? 'bg-red-600 text-white shadow-lg shadow-red-200 md:scale-110'
                            : isActive
                            ? 'bg-red-600 text-white shadow-lg shadow-red-300 md:scale-110 ring-2 md:ring-4 ring-red-100'
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
                          isActive ? 'bg-red-700 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {paso.id}
                        </div>
                      )}
                    </div>
                    
                    {/* Labels - Fixed height for alignment */}
                    <div className="text-center w-full h-8 md:h-10 flex items-center justify-center">
                      <p className={`text-xs md:text-sm font-semibold transition-colors ${
                        isActive ? 'text-red-600' : isCompleted ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {paso.nombre}
                      </p>
                    </div>
                  </div>
                  
                  {/* Connector Line - Fixed width for symmetry */}
                  {index < PASOS.length - 1 && (
                    <div className="flex-shrink-0 mx-1 md:mx-2 relative" style={{ marginTop: '20px', alignSelf: 'flex-start' }}>
                      <div className={`w-6 md:w-8 lg:w-10 h-0.5 md:h-1 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-red-600' : 'bg-gray-200'
                      }`} />
                      {/* Animated progress dot */}
                      {isActive && (
                        <div className="absolute top-1/2 left-0 w-2 h-2 md:w-3 md:h-3 bg-red-600 rounded-full transform -translate-y-1/2 animate-pulse" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="shadow-lg border-gray-200">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Paso 1: Datos */}
            {pasoActual === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-base md:text-lg shadow-sm flex-shrink-0">
                    1
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900">Datos</h2>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Información personal y plan</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      placeholder="Pérez"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dni" className="text-gray-700">DNI *</Label>
                    <Input
                      id="dni"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      placeholder="12345678"
                      required
                      className="text-gray-900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono" className="text-gray-700">Teléfono *</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="+54 9 11 1234-5678"
                      required
                      className="text-gray-900"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="email" className="text-gray-700">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="correo@ejemplo.com"
                      required
                      className="text-gray-900"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-red-900">Selecciona tu Plan</h3>
                    <Link href="/#planes" target="_blank">
                      <Button variant="outline" size="sm" className="gap-2 text-red-700 border-red-300 hover:bg-red-50">
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
                            ? 'border-red-600 bg-red-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg text-red-900">{plan.nombre}</h4>
                          {formData.plan === plan.id && (
                            <Check className="h-6 w-6 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-2xl font-bold text-red-900 my-2">{plan.precio}</p>
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
                  <h3 className="font-bold text-lg mb-4 text-red-900">Jurisdicción *</h3>
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
                            ? 'border-red-600 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{jurisdiccion.nombre}</span>
                          {formData.jurisdiccion === jurisdiccion.id && (
                            <Check className="h-5 w-5 text-red-600" />
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
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-base md:text-lg shadow-sm flex-shrink-0">
                    2
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900">Nombre</h2>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Marca de la sociedad</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2 text-red-900">Nombre de la Sociedad</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Proporciona 3 opciones de nombre para tu SAS
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-900">
                      ℹ️ Proporciona tres opciones en orden de preferencia. Luego de un examen de homonimia te informaremos cuál creemos que es la más viable para registrar.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="denominacion1">Opción 1 *</Label>
                      <Input
                        id="denominacion1"
                        name="denominacion1"
                        value={formData.denominacion1}
                        onChange={handleInputChange}
                        placeholder="Mi Empresa SAS"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="denominacion2">Opción 2 *</Label>
                      <Input
                        id="denominacion2"
                        name="denominacion2"
                        value={formData.denominacion2}
                        onChange={handleInputChange}
                        placeholder="Empresa Innovadora SAS"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="denominacion3">Opción 3 *</Label>
                      <Input
                        id="denominacion3"
                        name="denominacion3"
                        value={formData.denominacion3}
                        onChange={handleInputChange}
                        placeholder="Soluciones Empresariales SAS"
                        required
                      />
                    </div>
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
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-base md:text-lg shadow-sm flex-shrink-0">3</div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900">Objeto</h2>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Actividad y domicilio</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-red-900">Objeto y Domicilio</h3>
                  <p className="text-sm text-gray-600 mb-4">Define el propósito de tu sociedad y su domicilio legal</p>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700">Objeto Social *</Label>
                      <div className="space-y-3 mt-2">
                        <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-red-300 transition">
                          <input type="radio" name="objetoSocial" value="PREAPROBADO" checked={formData.objetoSocial === 'PREAPROBADO'} onChange={handleInputChange} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-gray-900">Objeto pre-aprobado</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs text-red-700 border-red-300 hover:bg-red-50"
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
                        <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-red-300 transition">
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
                        <Label htmlFor="objetoPersonalizado" className="text-gray-700">Describe tu objeto social *</Label>
                        <textarea id="objetoPersonalizado" value={formData.objetoPersonalizado} onChange={(e) => setFormData(prev => ({ ...prev, objetoPersonalizado: e.target.value }))} className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600" rows={4} placeholder="Describe las actividades específicas..." />
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="font-bold text-lg mb-2 text-red-900">Domicilio Social</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-900">ℹ️ Jurisdicción: {formData.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'CABA'}</p>
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
                        <Label htmlFor="domicilio" className="text-gray-700">Domicilio completo *</Label>
                        <p className="text-xs text-gray-500 mb-2">Se requiere que sea completo con indicación de piso, departamento, lote o manzana si correspondiera.</p>
                        <Input id="domicilio" name="domicilio" value={formData.domicilio} onChange={handleInputChange} placeholder="Av. Colón 123, Piso 2, Dpto. A" className="text-gray-900" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="ciudad" className="text-gray-700">Ciudad *</Label>
                          <Select id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleInputChange} className="text-gray-900">
                            <option value="">Seleccionar ciudad...</option>
                            {CIUDADES_CORDOBA.map(ciudad => (
                              <option key={ciudad} value={ciudad}>{ciudad}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="departamento" className="text-gray-700">Departamento *</Label>
                          <Select id="departamento" name="departamento" value={formData.departamento} onChange={handleInputChange} className="text-gray-900">
                            <option value="">Seleccionar departamento...</option>
                            {DEPARTAMENTOS_CORDOBA.map(depto => (
                              <option key={depto} value={depto}>{depto}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="provincia" className="text-gray-700">Provincia *</Label>
                          <Input 
                            id="provincia" 
                            name="provincia" 
                            value={formData.jurisdiccion === 'CORDOBA' ? 'Córdoba' : 'Ciudad Autónoma de Buenos Aires'} 
                            disabled
                            className="text-gray-900 bg-gray-100"
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
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-base md:text-lg shadow-sm flex-shrink-0">4</div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900">Capital</h2>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Capital social y CBU</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-red-900">Capital Social y CBU</h3>
                  <p className="text-sm text-gray-600 mb-4">Define el capital inicial de tu sociedad</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-900 mb-2">ℹ️ El capital social mínimo es de 2 SMVM (Salario Mínimo, Vital y Móvil).</p>
                    <p className="text-sm font-bold text-red-900">2 SMVM = ${(2 * SMVM).toLocaleString('es-AR')}</p>
                    <p className="text-xs text-gray-600 mt-1">SMVM actual: ${SMVM.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700">Capital Social *</Label>
                      <div className="space-y-3 mt-2">
                        <label className="flex items-center gap-3 p-3 border-2 border-red-600 bg-red-50 rounded-lg cursor-pointer">
                          <input type="radio" name="capitalSocialOpcion" checked={formData.capitalSocial === String(2 * SMVM)} onChange={() => setFormData(prev => ({ ...prev, capitalSocial: String(2 * SMVM) }))} />
                          <div>
                            <p className="font-medium text-gray-900">Capital Social Mínimo (2 SMVM: ${(2 * SMVM).toLocaleString('es-AR')})</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:border-red-300 transition">
                          <input type="radio" name="capitalSocialOpcion" checked={formData.capitalSocial !== String(2 * SMVM)} onChange={() => setFormData(prev => ({ ...prev, capitalSocial: '' }))} />
                          <div>
                            <p className="font-medium text-gray-900">Otro monto</p>
                          </div>
                        </label>
                      </div>
                    </div>
                    {formData.capitalSocial !== String(2 * SMVM) && (
                      <div>
                        <Label htmlFor="capitalSocialCustom" className="text-gray-700">Capital Social *</Label>
                        <Input id="capitalSocialCustom" type="number" value={formData.capitalSocial} onChange={(e) => setFormData(prev => ({ ...prev, capitalSocial: e.target.value }))} placeholder={`Mínimo: ${(2 * SMVM).toLocaleString('es-AR')}`} min={2 * SMVM} className="text-gray-900" />
                        {formData.capitalSocial && parseFloat(formData.capitalSocial) < (2 * SMVM) && (
                          <p className="text-xs text-red-600 mt-1">El capital mínimo es ${(2 * SMVM).toLocaleString('es-AR')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="font-bold text-lg mb-2 text-red-900">Depósito del Capital (CBU)</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-900 mb-2">ℹ️ En Córdoba es obligatorio realizar un depósito inicial del 25% del capital social en una cuenta bancaria. Este dinero luego será reintegrado a los CBU informados.</p>
                    <p className="text-sm font-bold text-red-900 mt-3">Requisitos de CBU:</p>
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
                      <div>
                        <Label htmlFor="cbuPrincipal" className="text-gray-700">CBU Principal *</Label>
                        <Input 
                          id="cbuPrincipal" 
                          name="cbuPrincipal" 
                          value={formData.cbuPrincipal} 
                          onChange={handleInputChange} 
                          placeholder="0000000000000000000000" 
                          maxLength={22} 
                          className="text-gray-900 font-mono" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="cbuSecundario" className="text-gray-700">CBU Secundario *</Label>
                        <Input 
                          id="cbuSecundario" 
                          name="cbuSecundario" 
                          value={formData.cbuSecundario} 
                          onChange={handleInputChange} 
                          placeholder="0000000000000000000000" 
                          maxLength={22} 
                          className="text-gray-900 font-mono" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Paso 5: Socios */}
            {pasoActual === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-base md:text-lg shadow-sm flex-shrink-0">
                    5
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900">Socios</h2>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Accionistas</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2 text-red-900">Socios / Accionistas</h3>
                  <p className="text-sm text-gray-600 mb-4">
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
                          className="w-8 h-8 rounded-full bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 hover:border-red-700 flex items-center justify-center font-bold text-lg shadow-sm transition-colors"
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
                          className="w-8 h-8 rounded-full bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 hover:border-red-700 flex items-center justify-center font-bold text-lg shadow-sm transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-sm space-y-1">
                      <p className="text-gray-700">
                        <span className="font-semibold">Capital Social:</span> ${parseFloat(formData.capitalSocial || '0').toLocaleString('es-AR')}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Total de Aportes:</span> $
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
                          <p className={diferencia <= 1 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            <span className="font-semibold">{diferencia <= 1 ? '✓ Capital completo' : 'Falta asignar'}:</span> $
                            {diferencia <= 1 ? '0' : Math.round(faltaAsignar).toLocaleString('es-AR')}
                          </p>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-red-900">
                      💡 <strong>Requisitos importantes:</strong> Es fundamental que los accionistas designados tengan un domicilio fiscal registrado ante ARCA y su CUIT habilitado. En caso de no cumplir con estos requisitos, deberá regularizarse la situación para continuar con el trámite.
                    </p>
                  </div>

                  {formData.socios.map((socio, index) => (
                    <div key={index} className="border rounded-lg p-6 mb-4 bg-gray-50">
                      <h4 className="font-bold text-gray-900 mb-4">Socio {index + 1}</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-700">Nombre *</Label>
                          <Input
                            value={socio.nombre}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].nombre = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Juan"
                            className="text-gray-900"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700">Apellido *</Label>
                          <Input
                            value={socio.apellido}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].apellido = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Pérez"
                            className="text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-700">DNI *</Label>
                          <Input
                            value={socio.dni}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].dni = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="12345678"
                            className="text-gray-900"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700">CUIT *</Label>
                          <Input
                            value={socio.cuit}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].cuit = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="20123456789"
                            className="text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label className="text-gray-700">Domicilio completo *</Label>
                        <p className="text-xs text-gray-500 mb-2">Incluye calle, número, piso, departamento, lote o manzana si correspondiera</p>
                        <Input
                          value={socio.domicilio}
                          onChange={(e) => {
                            const newSocios = [...formData.socios]
                            newSocios[index].domicilio = e.target.value
                            setFormData(prev => ({ ...prev, socios: newSocios }))
                          }}
                          placeholder="Av. Córdoba 1234, Piso 2, Dpto. A"
                          className="text-gray-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-700">Ciudad *</Label>
                          <Input
                            value={socio.ciudad}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].ciudad = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Córdoba"
                            className="text-gray-900"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700">Departamento *</Label>
                          <Input
                            value={socio.departamento}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].departamento = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Capital"
                            className="text-gray-900"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700">Provincia *</Label>
                          <Input
                            value={socio.provincia}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].provincia = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Córdoba"
                            className="text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-700">Estado civil *</Label>
                          <Select
                            value={socio.estadoCivil}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].estadoCivil = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            className="text-gray-900"
                          >
                            <option value="">Seleccionar</option>
                            <option value="Soltero/a">Soltero/a</option>
                            <option value="Casado/a">Casado/a</option>
                            <option value="Divorciado/a">Divorciado/a</option>
                            <option value="Viudo/a">Viudo/a</option>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-700">Profesión *</Label>
                          <Input
                            value={socio.profesion}
                            onChange={(e) => {
                              const newSocios = [...formData.socios]
                              newSocios[index].profesion = e.target.value
                              setFormData(prev => ({ ...prev, socios: newSocios }))
                            }}
                            placeholder="Comerciante"
                            className="text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-700">Aporte de capital *</Label>
                        <div className="space-y-3">
                          {/* Selector de tipo */}
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newSocios = [...formData.socios]
                                newSocios[index].tipoAporte = 'MONTO'
                                setFormData(prev => ({ ...prev, socios: newSocios }))
                              }}
                              className={`px-4 py-2 rounded-lg border-2 transition ${
                                socio.tipoAporte === 'MONTO'
                                  ? 'border-red-600 bg-red-50 text-red-900 font-medium'
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
                              className={`px-4 py-2 rounded-lg border-2 transition ${
                                socio.tipoAporte === 'PORCENTAJE'
                                  ? 'border-red-600 bg-red-50 text-red-900 font-medium'
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
                                className="text-gray-900"
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
                                className="text-gray-900"
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
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-base md:text-lg shadow-sm flex-shrink-0">
                    6
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900">Administración</h2>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Administradores</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2 text-red-900">Órgano de Administración</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Define quiénes administrarán la sociedad
                  </p>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-900">
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
                    <div key={index} className="border rounded-lg p-6 mb-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900">
                          {index === 0 ? 'Administrador Titular' : index === 1 ? 'Administrador Suplente' : `Administrador ${index + 1}`}
                        </h4>
                        
                        {formData.socios.length > 0 && (
                          <Select
                            value=""
                            onChange={(e) => {
                              const socioIndex = parseInt(e.target.value)
                              if (!isNaN(socioIndex)) {
                                const socio = formData.socios[socioIndex]
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
                            {formData.socios.map((socio, idx) => (
                              <option key={idx} value={idx}>
                                {socio.nombre} {socio.apellido}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-700">Nombre *</Label>
                          <Input
                            value={admin.nombre}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].nombre = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="Juan"
                            className="text-gray-900"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700">Apellido *</Label>
                          <Input
                            value={admin.apellido}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].apellido = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="Pérez"
                            className="text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-700">DNI *</Label>
                          <Input
                            value={admin.dni}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].dni = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="12345678"
                            className="text-gray-900"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700">CUIT *</Label>
                          <Input
                            value={admin.cuit}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].cuit = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="20123456789"
                            className="text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label className="text-gray-700">Domicilio completo *</Label>
                        <p className="text-xs text-gray-500 mb-2">Incluye calle, número, piso, departamento, lote o manzana si correspondiera</p>
                        <Input
                          value={admin.domicilio}
                          onChange={(e) => {
                            const newAdmins = [...formData.administradores]
                            newAdmins[index].domicilio = e.target.value
                            setFormData(prev => ({ ...prev, administradores: newAdmins }))
                          }}
                          placeholder="Av. Córdoba 1234, Piso 2, Dpto. A"
                          className="text-gray-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-700">Ciudad *</Label>
                          <Select
                            value={admin.ciudad}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].ciudad = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            className="text-gray-900"
                          >
                            <option value="">Seleccionar...</option>
                            {CIUDADES_CORDOBA.map(ciudad => (
                              <option key={ciudad} value={ciudad}>{ciudad}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-700">Departamento *</Label>
                          <Select
                            value={admin.departamento}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].departamento = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            className="text-gray-900"
                          >
                            <option value="">Seleccionar...</option>
                            {DEPARTAMENTOS_CORDOBA.map(depto => (
                              <option key={depto} value={depto}>{depto}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-700">Provincia *</Label>
                          <Input
                            value={admin.provincia || 'Córdoba'}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].provincia = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="Córdoba"
                            className="text-gray-900"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-700">Estado civil *</Label>
                          <Select
                            value={admin.estadoCivil}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].estadoCivil = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            className="text-gray-900"
                          >
                            <option value="">Seleccionar</option>
                            <option value="Soltero/a">Soltero/a</option>
                            <option value="Casado/a">Casado/a</option>
                            <option value="Divorciado/a">Divorciado/a</option>
                            <option value="Viudo/a">Viudo/a</option>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-700">Profesión *</Label>
                          <Input
                            value={admin.profesion}
                            onChange={(e) => {
                              const newAdmins = [...formData.administradores]
                              newAdmins[index].profesion = e.target.value
                              setFormData(prev => ({ ...prev, administradores: newAdmins }))
                            }}
                            placeholder="Comerciante"
                            className="text-gray-900"
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
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-base md:text-lg shadow-sm flex-shrink-0">
                    7
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900">Cierre</h2>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Ejercicio económico</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2 text-red-900">Cierre de Ejercicio Económico</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Define la fecha de cierre del ejercicio económico
                  </p>

                  <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      El cierre de ejercicio es la fecha anual en la que se cierran los libros contables y se preparan los estados financieros. La fecha más común es el 31 de diciembre (31-12).
                    </p>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="fechaCierre" className="text-gray-700">Fecha de cierre de ejercicio (día-mes) *</Label>
                    <Input
                      id="fechaCierre"
                      name="fechaCierre"
                      value={formData.fechaCierre}
                      onChange={handleInputChange}
                      placeholder="31-12"
                      pattern="\d{2}-\d{2}"
                      required
                      className="text-gray-900 max-w-xs"
                    />
                    <p className="text-xs text-red-600 mt-1">Este campo es obligatorio</p>
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

                  <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h4 className="font-bold text-green-900 text-lg mb-3">¡Todo listo para enviar!</h4>
                    <p className="text-sm text-green-800 mb-4">
                      Has completado todos los pasos del formulario. Revisa la información y cuando estés listo, haz click en "Enviar Formulario" para iniciar tu trámite de constitución.
                    </p>
                    <div className="bg-white rounded p-4 text-sm text-gray-700 space-y-2">
                      <p><strong>Plan seleccionado:</strong> {formData.plan}</p>
                      <p><strong>Jurisdicción:</strong> {formData.jurisdiccion === 'CORDOBA' ? 'Córdoba (IPJ)' : 'CABA (IGJ)'}</p>
                      <p><strong>Capital Social:</strong> ${formData.capitalSocial}</p>
                      <p><strong>Socios:</strong> {formData.numeroSocios}</p>
                      <p><strong>Administradores:</strong> {formData.numeroAdministradores}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navegación */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleAnterior}
                disabled={pasoActual === 1}
                className="gap-2 w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {pasoActual < 7 ? (
                <Button onClick={handleSiguiente} className="gap-2 bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={guardando}
                  className="gap-2 bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                >
                  {guardando ? 'Enviando...' : 'Enviar Formulario'}
                  <ChevronRight className="h-4 w-4" />
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