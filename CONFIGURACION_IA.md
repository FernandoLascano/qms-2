# 🤖 Configuración de IA (Anthropic / Claude)

Las features de IA (Asistente QMS, "Analizar con IA" en consultas-chat y la
generación de artículos del blog) usan la API de Anthropic.

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Sí | La API key de Anthropic. Sin esto, todas las features de IA fallan. |
| `ANTHROPIC_MODEL` | ⬜ Opcional | Modelo para el trabajo del equipo (revisar formularios, leer comprobantes, borradores, blog). Por defecto `claude-opus-5-5`. |
| `ANTHROPIC_MODEL_CHAT` | ⬜ Opcional | Modelo para los chats (asistente público y asistente del cliente). Por defecto `claude-haiku-5-5`, más rápido y barato. |
| `ANTHROPIC_ADMIN_KEY` | ⬜ Opcional | Clave de administración (`sk-ant-admin…`) de la consola de Anthropic. Sólo lee los reportes de uso y costo para la página **Consumo de IA** del admin; no genera nada. |

Los modelos se pueden cambiar desde las variables de entorno de Vercel sin tocar
código: cuando Anthropic retira un modelo (pasó con `claude-sonnet-4-20250514`
en jun-2026 → 404 en todas las features), alcanza con cambiar la variable.

> ⚠️ Los modelos actuales **rechazan el parámetro `temperature`** (400) y piensan
> antes de responder: ese razonamiento cuenta dentro de `max_tokens`, así que no
> conviene bajarlo demasiado. El código ya contempla las dos cosas.

## Qué hace la IA en el trámite

Todo vive en `lib/ai/` (`anthropic.ts` es la base, `tramite.ts` tiene los
prompts). Ninguna función decide ni envía nada: devuelven una lectura o un
borrador que una persona revisa.

| Dónde | Qué hace | Ruta |
|-------|----------|------|
| Admin › trámite › Gestión › Validación | Revisa el formulario y lista lo que hay que mirar | `POST /api/admin/tramites/[id]/ia` (`revisar-formulario`) |
| Admin › trámite › Pagos › Comprobantes | Lee el comprobante y lo compara con el pago esperado | `POST /api/admin/documentos/[id]/leer-comprobante` |
| Admin › trámite › Comunicación › Chat | Sugiere una respuesta al cliente | `POST /api/admin/tramites/[id]/ia` (`sugerir-chat`) |
| Admin › Emails › Responder | Sugiere una respuesta al mail | `POST /api/admin/emails/[id]/sugerir-respuesta` |
| Admin › trámite › Gestión › Observaciones del organismo | Explica la observación y redacta el mensaje al cliente | `POST /api/admin/tramites/[id]/ia` (`explicar-observacion`) |
| Cliente › su trámite | Asistente que conoce el estado de ese trámite | `POST /api/tramites/[id]/asistente` |

Las cuentas (dígitos verificadores, sumas de aportes, comparación de montos y
CBU) se hacen con código, no con IA. Lo que escribe un cliente entra al modelo
como dato, nunca como instrucción. El asistente del cliente recibe sólo lo que
el cliente ya ve en su panel (`lib/ai/contexto-tramite.ts`).

## Cómo verificar que está andando

En el **Panel de Admin** hay un widget "Estado de servicios" con un puntito de
estado en vivo para IA (y para base de datos, MercadoPago, emails, almacenamiento,
Redis, analytics y S3). Verde = operativo, rojo = caído, gris = sin configurar.
El chequeo pega a `GET /v1/models` de Anthropic (no gasta tokens).
