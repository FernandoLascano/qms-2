import { redirect } from 'next/navigation'

/**
 * La vista previa vivía acá, fuera del panel: se abría sin la navegación y sin
 * el control de acceso del dashboard. Ahora está en
 * /dashboard/admin/emails/preview; esta ruta queda como redirección para los
 * enlaces viejos.
 */
export default function PreviewMailsLegacy() {
  redirect('/dashboard/admin/emails/preview')
}
