/**
 * `prisma generate` con reintentos (Windows EPERM al renombrar el query engine).
 *
 * Sin --strict: si sigue fallando pero ya hay cliente generado, sale 0 (útil para `npm run build`
 * cuando otro proceso tiene bloqueado el .dll).
 * Con --strict (postinstall): debe generar bien o falla (instalación limpia).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const root = process.cwd()
const strict = process.argv.includes('--strict')

const engineWin = path.join(root, 'node_modules', '.prisma', 'client', 'query_engine-windows.dll.node')

function prismaClientLooksGenerated() {
  const a = path.join(root, 'node_modules', '.prisma', 'client', 'index.js')
  const b = path.join(root, 'node_modules', '@prisma', 'client', 'index.js')
  return fs.existsSync(a) || fs.existsSync(b)
}

function tryUnlinkEngine() {
  if (process.platform !== 'win32') return
  try {
    if (fs.existsSync(engineWin)) fs.unlinkSync(engineWin)
  } catch {
    // ignore
  }
}

async function runGenerate() {
  const max = strict ? 10 : 6
  for (let attempt = 1; attempt <= max; attempt++) {
    tryUnlinkEngine()
    const r = spawnSync('npx', ['prisma', 'generate'], {
      stdio: 'inherit',
      cwd: root,
      shell: true,
      env: process.env,
    })
    if (r.status === 0) return true
    console.warn(`[prisma-generate] intento ${attempt}/${max} falló (código ${r.status ?? 'n/a'})`)
    if (attempt < max) await delay(350 * attempt)
  }
  return false
}

async function main() {
  const ok = await runGenerate()
  if (ok) process.exit(0)

  if (!strict && prismaClientLooksGenerated()) {
    console.warn(
      '[prisma-generate] prisma generate falló (p. ej. EPERM: motor bloqueado por otro proceso). ' +
        'Se continúa el build porque ya existe un cliente Prisma. ' +
        'Cerrá `npm run dev` u otras herramientas que usen Prisma y ejecutá `npx prisma generate` si cambiaste el schema.'
    )
    process.exit(0)
  }

  console.error('[prisma-generate] prisma generate falló. En Windows: cerrá el dev server y reintentá, o ejecutá el terminal como administrador si el antivirus bloquea el motor.')
  process.exit(1)
}

main()
