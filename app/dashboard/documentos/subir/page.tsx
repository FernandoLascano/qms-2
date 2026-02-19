'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Upload, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Tramite {
  id: string
  denominacionSocial1: string
  denominacionAprobada: string | null
}

export default function SubirDocumentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [cargando, setCargando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
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
    // Cargar trámites del usuario
    fetch('/api/tramites')
      .then(res => res.json())
      .then(data => {
        if (data.tramites) {
          const tramitesUsuario = data.tramites.filter((t: any) => t.userId === session?.user?.id)
          setTramites(tramitesUsuario)
          
          // Si hay tramiteId en la URL y no está seleccionado, pre-seleccionarlo
          if (tramiteIdFromUrl && !formData.tramiteId && tramitesUsuario.length > 0) {
            const tramiteEncontrado = tramitesUsuario.find((t: Tramite) => t.id === tramiteIdFromUrl)
            if (tramiteEncontrado) {
              setFormData(prev => ({ ...prev, tramiteId: tramiteIdFromUrl }))
            }
          }
        }
      })
      .catch(err => console.error('Error al cargar trámites:', err))
  }, [session, tramiteIdFromUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede superar los 10MB')
        return
      }

      // Validar tipo
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!archivo) {
      toast.error('Debes seleccionar un archivo')
      return
    }

    if (!formData.tramiteId) {
      toast.error('Debes seleccionar un trámite')
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

      const response = await fetch('/api/documentos/upload', {
        method: 'POST',
        body: data
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Documento subido exitosamente')
        router.push('/dashboard/documentos')
      } else {
        toast.error(result.error || 'Error al subir el documento')
      }
    } catch (error) {
      console.error('Error al subir documento:', error)
      toast.error('Error al subir el documento')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documentos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-brand-900">Subir Documento</h2>
          <p className="text-gray-600 mt-1">
            Carga los documentos necesarios para tu trámite
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Documento</CardTitle>
          <CardDescription>
            Completa los datos y selecciona el archivo a subir
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
              {tramites.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No tienes trámites activos.{' '}
                  <Link href="/tramite/nuevo" className="text-blue-600 hover:underline">
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
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={3}
                placeholder="Información adicional sobre el documento..."
                disabled={subiendo}
              />
            </div>

            {/* Seleccionar Archivo */}
            <div>
              <Label htmlFor="file">Archivo *</Label>
              <div className="mt-2">
                <label
                  htmlFor="file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  {archivo ? (
                    <div className="text-center">
                      <FileText className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">{archivo.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(archivo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Click para subir</span> o arrastra el archivo
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG o PNG (máx. 10MB)
                      </p>
                    </div>
                  )}
                </label>
                <input
                  id="file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={subiendo}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <Link href="/dashboard/documentos" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={subiendo}
                >
                  Cancelar
                </Button>
              </Link>
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
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Documentos Requeridos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-900">
            <li>• DNI de todos los socios (frente y dorso)</li>
            <li>• Constancia de CUIT de todos los socios</li>
            <li>• Comprobante de domicilio de la sociedad</li>
            <li>• Comprobante de depósito del 25% del capital social</li>
            <li>• Estatuto firmado (si ya lo tienes)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

