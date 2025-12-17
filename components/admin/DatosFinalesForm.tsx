'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Save, Upload, FileText, Building2 } from 'lucide-react'

interface DatosFinalesFormProps {
  tramiteId: string
  cuitActual: string | null
  matriculaActual: string | null
  numeroResolucionActual: string | null
  fechaInscripcionActual: string | null
}

export default function DatosFinalesForm({
  tramiteId,
  cuitActual,
  matriculaActual,
  numeroResolucionActual,
  fechaInscripcionActual
}: DatosFinalesFormProps) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const [archivoResolucion, setArchivoResolucion] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    cuit: cuitActual || '',
    matricula: matriculaActual || '',
    numeroResolucion: numeroResolucionActual || '',
    fechaInscripcion: fechaInscripcionActual || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que todos los campos estén completos
    if (!formData.cuit || !formData.matricula || !formData.numeroResolucion || !formData.fechaInscripcion) {
      toast.error('Debes completar CUIT, Matrícula, Resolución de Inscripción y Fecha de Inscripción')
      return
    }

    // Validar que se haya seleccionado el archivo de resolución
    if (!archivoResolucion) {
      toast.error('Debes subir el archivo de Resolución de Inscripción')
      return
    }

    setGuardando(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('cuit', formData.cuit)
      formDataToSend.append('matricula', formData.matricula)
      formDataToSend.append('numeroResolucion', formData.numeroResolucion)
      formDataToSend.append('fechaInscripcion', formData.fechaInscripcion)
      formDataToSend.append('archivoResolucion', archivoResolucion)

      const response = await fetch(`/api/admin/tramites/${tramiteId}/datos-finales`, {
        method: 'PATCH',
        body: formDataToSend
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Datos finales guardados. El trámite ha sido completado.')
        setArchivoResolucion(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Error al actualizar los datos')
      }
    } catch (error) {
      console.error('Error al guardar datos finales:', error)
      toast.error('Error al actualizar los datos')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <Building2 className="h-4 w-4 text-green-700" />
          </span>
          <span>Datos de la Sociedad Inscripta</span>
        </CardTitle>
        <CardDescription>
          Completa esta información cuando la sociedad esté inscripta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                value={formData.cuit}
                onChange={(e) => setFormData(prev => ({ ...prev, cuit: e.target.value }))}
                placeholder="30-12345678-9"
                disabled={guardando}
              />
            </div>
            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                placeholder="12345"
                disabled={guardando}
              />
            </div>
            <div>
              <Label htmlFor="numeroResolucion">Resolución de Inscripción</Label>
              <Input
                id="numeroResolucion"
                value={formData.numeroResolucion}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroResolucion: e.target.value }))}
                placeholder="RES-2024-12345"
                disabled={guardando}
              />
            </div>
            <div>
              <Label htmlFor="fechaInscripcion">Fecha de Inscripción</Label>
              <Input
                id="fechaInscripcion"
                type="date"
                value={formData.fechaInscripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaInscripcion: e.target.value }))}
                disabled={guardando}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="archivoResolucion" className="text-green-900 font-semibold">
              Archivo de Resolución de Inscripción
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="archivoResolucion"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setArchivoResolucion(e.target.files?.[0] || null)}
                disabled={guardando}
                className="flex-1"
              />
              {archivoResolucion && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <FileText className="h-4 w-4" />
                  <span>{archivoResolucion.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600">
              Sube el archivo PDF o imagen de la resolución de inscripción. Este documento será enviado al cliente.
            </p>
          </div>
          <Button
            type="submit"
            disabled={guardando}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {guardando ? 'Guardando...' : 'Guardar Datos Finales'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

