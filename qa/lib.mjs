// Helpers para que los agentes de QA naveguen la plataforma con sesión de admin o cliente.
// Uso: node --env-file=.env.local qa/<script>.mjs
import { chromium, devices } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

export const BASE = process.env.QA_BASE_URL || 'http://localhost:3000'
const DIR = path.resolve('qa')
export const SALIDA = path.join(DIR, 'salida')
const AUTH = path.join(DIR, '.auth')
fs.mkdirSync(SALIDA, { recursive: true })
fs.mkdirSync(AUTH, { recursive: true })

const CREDENCIALES = {
  admin: [process.env.QA_ADMIN_EMAIL, process.env.QA_ADMIN_PASSWORD],
  cliente: [process.env.QA_CLIENTE_EMAIL, process.env.QA_CLIENTE_PASSWORD],
}

// Nada de pagos reales: MercadoPago está con token de producción.
const BLOQUEADOS = /mercadopago|mercadolibre|mlstatic/i

export async function login(rol) {
  const [email, password] = CREDENCIALES[rol]
  if (!email || !password) throw new Error(`Faltan QA_${rol.toUpperCase()}_EMAIL/PASSWORD en .env.local`)
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`${BASE}/login`)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/, { timeout: 60000 })
  await context.storageState({ path: path.join(AUTH, `${rol}.json`) })
  await browser.close()
}

// Abre una sesión ya logueada. rol: 'admin' | 'cliente' | 'anonimo'. movil: true emula iPhone.
export async function abrirSesion(rol, { movil = false } = {}) {
  const estado = path.join(AUTH, `${rol}.json`)
  if (rol !== 'anonimo' && !fs.existsSync(estado)) await login(rol)
  const browser = await chromium.launch()
  const context = await browser.newContext({
    ...(movil ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } }),
    ...(rol !== 'anonimo' ? { storageState: estado } : {}),
    locale: 'es-AR',
  })
  await context.route(BLOQUEADOS, (r) => r.abort())
  const page = await context.newPage()
  const problemas = []
  page.on('console', (m) => { if (m.type() === 'error') problemas.push({ tipo: 'console', url: page.url(), texto: m.text().slice(0, 500) }) })
  page.on('pageerror', (e) => problemas.push({ tipo: 'pageerror', url: page.url(), texto: String(e).slice(0, 500) }))
  page.on('response', (r) => { if (r.status() >= 400 && !BLOQUEADOS.test(r.url())) problemas.push({ tipo: `http ${r.status()}`, url: r.url() }) })
  page.on('requestfailed', (r) => { if (!BLOQUEADOS.test(r.url())) problemas.push({ tipo: 'requestfailed', url: r.url(), texto: r.failure()?.errorText }) })
  return { browser, context, page, problemas }
}

// Navega, espera que cargue, mide tiempo y devuelve el texto visible.
export async function visitar(page, ruta) {
  const t0 = Date.now()
  await page.goto(ruta.startsWith('http') ? ruta : `${BASE}${ruta}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
  return { ms: Date.now() - t0, url: page.url(), texto: (await page.innerText('body').catch(() => '')).slice(0, 6000) }
}

export async function captura(page, nombre) {
  const archivo = path.join(SALIDA, `${nombre}.png`)
  await page.screenshot({ path: archivo, fullPage: true })
  return archivo
}
