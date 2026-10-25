# QuieroMiSAS (QMS)

Plataforma para constituir SAS online en Córdoba. Next.js 16 (App Router) en Vercel, Prisma sobre Supabase (Postgres), emails por SES, PDFs con Gotenberg en Cloud Run. Quien trabaja con Claude es **Fernando Lascano** (operador; no es desarrollador). Justiniano es socio, pero el email de git/sesión no identifica a quien escribe.

## Cómo trabajar

1. **Pensar antes de programar.** Decir los supuestos. Si un pedido se puede leer de dos maneras, mostrar las dos en vez de elegir una en silencio. Si hay una opción más simple, decirlo.
2. **Lo más simple que resuelva el pedido.** Nada especulativo: ni funciones que nadie pidió, ni abstracciones de un solo uso, ni manejo de errores para casos imposibles.
3. **Cambios quirúrgicos.** Tocar sólo lo que pide la tarea y seguir el estilo del archivo. El código muerto ajeno se menciona, no se borra.
4. **Objetivos verificables.** Convertir el pedido en algo comprobable (test, captura con Playwright, consulta) y no darlo por hecho hasta verificarlo.

- Lo técnico lo decide Claude y lo explica en una línea. A Fernando se le pregunta sólo lo que depende de él: negocio, textos legales, cuentas externas y el pase a producción.
- Cambios grandes: rama → preview de Vercel → ok de Fernando → merge a `main`. `main` se despliega solo a producción.
- Textos para clientes en **voseo** («podés», «tenés», «ingresá»). Nunca «Hemos recibido» ni «Debes».
- Logo vigente: `public/assets/img/qms-logo-reg.png` (y `qms-logo-white.png`). `logo.png` es viejo.

## Base de datos = producción

- `.env.local` apunta a la base de **producción** de Supabase. No hay base de desarrollo: todo script o migración local toca datos reales.
- Leer para analizar está bien. Una escritura masiva sobre datos de clientes pide confirmación.
- El build de Vercel no corre migraciones. Se aplican a mano, antes de que el código llegue a `main`:
  `node --env-file=.env.local node_modules/prisma/build/index.js migrate deploy`
- Migraciones aditivas (columna o tabla nueva, nullable o con default): aplicarlas sin preguntar. Si borran, renombran o transforman datos: pedir confirmación.
- Toda tabla nueva lleva `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;` en su migración.
- Las funciones corren en `gru1` (San Pablo), al lado de Supabase. Consultas en paralelo con `Promise.all`.

## Entorno

- `node` y `npm` están en `/opt/homebrew/bin`, fuera del PATH de la shell: usar `export PATH=/opt/homebrew/bin:$PATH`.
- `.env.local` tiene finales CRLF: quitar `\r` al leerlo desde la shell.
- `npx tsc --noEmit -p .` y `npx eslint <archivos>`. El repo tiene errores de lint viejos (`no-explicit-any`): no sumar nuevos.
- QA con Playwright: `qa/lib.mjs` (`abrirSesion('cliente' | 'admin' | 'anonimo', { movil })`), cuentas en `.env.local`. Nunca pagar: MercadoPago usa el token de producción. En el panel admin, sólo lectura.

## Privacidad

- Ninguna captura, video o texto que salga del repo puede mostrar datos personales (nombre, DNI, CUIL, PIN, celular, QR, documentos). Se tapan con un blur fuerte (sharp `blur(30–45)`), porque un blur suave se sigue leyendo.
- Las claves no se escriben en el código ni en mensajes.

## Dónde está cada cosa

- Emails transaccionales: `lib/emails/templates.tsx` y `lib/emails/send.ts`. Cada envío queda registrado por trámite.
- Estado y etapas del trámite: `lib/tramites/estado.ts`, `lib/tramites-etapas.ts`. Nombres legibles: `lib/etiquetas.ts`.
- Guías CiDi: `lib/guias.ts`, `components/guias/`. Los videos se arman con Remotion en `~/proyectos/qms-videos` (fuera de este repo). El MP4 va al bucket `assets-publicos/videos/guias` y el póster y los subtítulos a `public/videos/guias`.
- Metadatos por página: `metadataDePagina()` en `lib/seo/site.ts`.
