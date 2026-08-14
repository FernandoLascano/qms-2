import { Handshake } from 'lucide-react'
import ServiciosCatalogo from '@/components/cliente/ServiciosCatalogo'

export const metadata = {
  title: 'Servicios'
}

export default function ServiciosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Handshake className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-title font-semibold text-primary">Servicios para tu empresa</h1>
          <p className="text-body-sm text-ink-2">Constituir la sociedad es solo el comienzo. Estamos para acompañarte en lo que siga.</p>
        </div>
      </div>

      <ServiciosCatalogo />
    </div>
  )
}
