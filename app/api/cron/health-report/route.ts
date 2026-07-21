import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { runHealthChecks, type ServiceResult } from '@/lib/health/checks'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Destinatario del reporte (configurable por env, con default).
const REPORT_TO = process.env.HEALTH_REPORT_EMAIL || 'fernandolascano@martinezwehbe.com'

function verificarAutorizacion(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !authHeader) return false
  const token = authHeader.replace('Bearer ', '')
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))
  } catch {
    return false
  }
}

const STATUS_META: Record<ServiceResult['status'], { emoji: string; label: string; color: string }> = {
  ok: { emoji: '🟢', label: 'Operativo', color: '#16a34a' },
  down: { emoji: '🔴', label: 'CAÍDO', color: '#dc2626' },
  unconfigured: { emoji: '⚪', label: 'Sin configurar', color: '#9ca3af' },
}

function buildEmailHtml(services: ServiceResult[], checkedAt: string): string {
  const fecha = new Date(checkedAt).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'full',
    timeStyle: 'short',
  })

  const rows = services
    .map((s) => {
      const meta = STATUS_META[s.status]
      const extra = s.status === 'ok'
        ? (s.latencyMs != null ? `${s.latencyMs} ms` : '')
        : (s.detail || '')
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#111827;">${meta.emoji}&nbsp; ${s.label}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;font-weight:700;color:${meta.color};">${meta.label}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:12px;color:#6b7280;">${extra}</td>
        </tr>`
    })
    .join('')

  return `
  <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
    <p style="font-size:13px;color:#6b7280;margin:0 0 12px;">Reporte automático de estado — ${fecha}</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;text-transform:uppercase;">Servicio</th>
          <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;text-transform:uppercase;">Estado</th>
          <th style="text-align:left;padding:10px 12px;font-size:12px;color:#6b7280;text-transform:uppercase;">Detalle</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">
      Panel en vivo: https://www.quieromisas.com/dashboard/admin
    </p>
  </div>`
}

async function handle(request: Request) {
  if (!verificarAutorizacion(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const report = await runHealthChecks()
  const caidos = report.services.filter((s) => s.status === 'down')
  const asunto =
    caidos.length > 0
      ? `🔴 QMS — ${caidos.length} servicio${caidos.length !== 1 ? 's' : ''} caído${caidos.length !== 1 ? 's' : ''}: ${caidos.map((s) => s.label).join(', ')}`
      : '🟢 QMS — Todos los servicios operativos'

  await sendEmail({
    to: REPORT_TO,
    subject: asunto,
    html: buildEmailHtml(report.services, report.checkedAt),
  })

  return NextResponse.json({
    ok: true,
    overall: report.overall,
    caidos: caidos.map((s) => s.key),
    enviadoA: REPORT_TO,
  })
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
