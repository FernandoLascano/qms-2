# 🤖 Configuración de IA (Anthropic / Claude)

Las features de IA (Asistente QMS, "Analizar con IA" en consultas-chat y la
generación de artículos del blog) usan la API de Anthropic.

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Sí | La API key de Anthropic. Sin esto, todas las features de IA fallan. |
| `ANTHROPIC_MODEL` | ⬜ Opcional | El modelo a usar. Si no se define, usa `claude-sonnet-5` por defecto. |

## Por qué existe `ANTHROPIC_MODEL`

El modelo estaba hardcodeado en `lib/ai/anthropic.ts`. Cuando Anthropic retira
un modelo (les pasó con `claude-sonnet-4-20250514` en jun-2026 → devolvía 404 y
rompía todas las features de IA), había que tocar código.

Ahora el default es `claude-sonnet-5`, pero podés **cambiar de modelo sin tocar
código** definiendo `ANTHROPIC_MODEL` en las variables de entorno de Vercel.
Ejemplos válidos: `claude-sonnet-5`, `claude-opus-4-8`, `claude-haiku-4-5`.

> ⚠️ Los modelos actuales **rechazan el parámetro `temperature`** (400). El código
> ya no lo envía; no lo reintroduzcas.

## Cómo verificar que está andando

En el **Panel de Admin** hay un widget "Estado de servicios" con un puntito de
estado en vivo para IA (y para base de datos, MercadoPago, emails, almacenamiento,
Redis, analytics y S3). Verde = operativo, rojo = caído, gris = sin configurar.
El chequeo pega a `GET /v1/models` de Anthropic (no gasta tokens).
