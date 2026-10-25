'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Upload, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { FileInput } from '@/components/ui/file-input'
import { subirConProgreso } from '@/lib/subir'

interface Tramite {
  id: string
  denominacionSocial1: string
  denominacionAprobada: string | null
}

export default function SubirDocumentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [listo, setListo] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  
  // Obtener tramiteId de la URL si existe
  const tramiteIdFromUrl = searchParams.get('tramiteId')
  
  const [formData, setFormData] = useState({
    tramiteId: tramiteIdFromUrl || '',
    tipo: 'DNI_SOCIO',
    nombre: '',
    descripcion: ''
  })

  useEffect(() => {
    // Cargar trámites del usuario. La API ya devuelve sólo los del cliente
    // logueado (filtra por sesión), así que no hay que filtrar acá: antes se
    // filtraba por t.userId, que la API no manda, y la lista quedaba vacía.
    setCargando(true)
    fetch('/api/tramites')
      .then(res => res.json())
      .then(data => {
        const lista: Tramite[] = Array.isArray(data.tramites) ? data.tramites : []
        setTramites(lista)

        // Preseleccionar el trámite de la URL sólo si es uno de los suyos
        if (tramiteIdFromUrl && !lista.some(t => t.id === tramiteIdFromUrl)) {
          setFormData(prev => ({ ...prev, tramiteId: '' }))
        }
      })
      .catch(err => console.error('Error al cargar trámites:', err))
      .finally(() => setCargando(false))
  }, [tramiteIdFromUrl])

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setArchivo(null)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar los 10MB')
      return
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG o PNG')
      return
    }
    setArchivo(file)
    if (!formData.nombre) {
      setFormData(prev => ({ ...prev, nombre: file.name }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!archivo) {
      toast.error('Tenés que seleccionar un archivo')
      return
    }

    if (!formData.tramiteId) {
      toast.error('Tenés que seleccionar un trámite')
      return
    }

    setSubiendo(true)

    try {
      // Crear FormData para enviar el archivo
      const data = new FormData()
      data.append('file', archivo)
      data.append('tramiteId', formData.tramiteId)
      data.append('tipo', formData.tipo)
      data.append('nombre', formData.nombre)
      data.append('descripcion', formData.descripcion)

      setProgreso(0)
      const response = await subirConProgreso('/api/documentos/upload', data, setProgreso)

      const result = await response.json()

      if (response.ok && result.success) {
        setListo(true)
        toast.success('Documento subido')
        // Un instante para que se vea el tilde antes de volver a la lista.
        setTimeout(() => router.push('/dashboard/documentos'), 700)
        return
      } else {
        toast.error(result.error || 'Error al subir el documento')
      }
    } catch (error) {
      console.error('Error al subir documento:', error)
      toast.error('Error al subir el documento')
    }
    setSubiendo(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" aria-label="Volver a Documentos">
            <Link href="/dashboard/documentos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          </Button>
        <div>
          <h2 className="text-display text-ink">Subir Documento</h2>
          <p className="text-ink-2 mt-1">
            Cargá los documentos necesarios para tu trámite
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Documento</CardTitle>
          <CardDescription>
            Completá los datos y seleccioná el archivo a subir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleccionar Trámite */}
            <div>
              <Label htmlFor="tramiteId">Trámite *</Label>
              <Select
                id="tramiteId"
                value={formData.tramiteId}
                onChange={(e) => setFormData(prev => ({ ...prev, tramiteId: e.target.value }))}
                required
                disabled={subiendo}
              >
                <option value="">Seleccionar trámite...</option>
                {tramites.map((tramite) => (
                  <option key={tramite.id} value={tramite.id}>
                    {tramite.denominacionAprobada || tramite.denominacionSocial1}
                  </option>
                ))}
              </Select>
              {!cargando && tramites.length === 0 && (
                <p className="text-body-sm text-ink-2 mt-1">
                  Todavía no tenés trámites.{' '}
                  <Link href="/tramite/nuevo" className="text-info hover:underline">
                    Crear uno ahora
                  </Link>
                </p>
              )}
            </div>

            {/* Tipo de Documento */}
            <div>
              <Label htmlFor="tipo">Tipo de Documento *</Label>
              <Select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                required
                disabled={subiendo}
              >
                <option value="DNI_SOCIO">DNI de Socio</option>
                <option value="CUIT_SOCIO">CUIT de Socio</option>
                <option value="COMPROBANTE_DOMICILIO">Comprobante de Domicilio</option>
                <option value="COMPROBANTE_DEPOSITO">Comprobante de Depósito</option>
                <option value="ESTATUTO_FIRMADO">Estatuto Firmado</option>
                <option value="ACTA_CONSTITUTIVA">Acta Constitutiva</option>
                <option value="CERTIFICACION_FIRMA">Certificación de Firma</option>
                <option value="OTROS">Otros</option>
              </Select>
            </div>

            {/* Nombre del Documento */}
            <div>
              <Label htmlFor="nombre">Nombre del Documento *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: DNI Juan Pérez - Frente"
                required
                disabled={subiendo}
              />
            </div>

            {/* Descripción */}
            <div>
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="flex w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-info-solid"
                rows={3}
                placeholder="Información adicional sobre el documento..."
                disabled={subiendo}
              />
            </div>

            {/* Seleccionar Archivo */}
            <div>
              <Label htmlFor="file">Archivo *</Label>
              <div className="mt-2">
                <FileInput
                  id="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  archivo={archivo}
                  onArchivo={handleFileChange}
                  disabled={subiendo || listo}
                  progreso={subiendo ? progreso : null}
                  listo={listo}
                  ayuda="PDF, JPG o PNG · hasta 10 MB"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <Button asChild
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={subiendo}
                >
            <Link href="/dashboard/documentos" className="flex-1">
                  Cancelar
                </Link>
          </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={subiendo || !archivo}
              >
                {subiendo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Subir Documento
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Información */}
      <Card className="border-info-line bg-info-soft">
        <CardHeader>
          <CardTitle className="text-info">Documentos Requeridos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-body-sm text-info">
            <li>• DNI de todos los socios (frente y dorso)</li>
            <li>• Constancia de CUIT de todos los socios</li>
            <li>• Comprobante de domicilio de la sociedad</li>
            <li>• Comprobante de depósito del 25% del capital social</li>
            <li>• Estatuto firmado (si ya lo tenés)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

