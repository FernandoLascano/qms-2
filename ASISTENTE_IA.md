# 🤖 Asistente QMS

## Descripción

Agente de IA (Asistente QMS) que responde consultas sobre constitución de S.A.S. y el servicio QuieroMiSAS. Está limitado a solo responder sobre temas dentro de ese alcance.

---

## Configuración

### 1. Agregar API Key de OpenAI

En tu archivo `.env` o `.env.local`:

```env
OPENAI_API_KEY="sk-..."
```

Obtené tu clave en: https://platform.openai.com/api-keys

### 2. Reiniciar el servidor

```bash
npm run dev
```

---

## Cómo "entrenar" al asistente

El asistente usa la **base de conocimiento** en `lib/ai/knowledge-base.ts`.

### Agregar información nueva

1. Abrí `lib/ai/knowledge-base.ts`
2. Agregá texto en formato Markdown dentro de la variable `KNOWLEDGE_BASE`
3. Usá títulos con `##` para organizar
4. Guardá el archivo

**Ejemplo:** Si querés que sepa sobre "gastos de inscripción en Córdoba":

```
## GASTOS POR JURISDICCIÓN
- Córdoba: tasa reserva $X, tasa retributiva $Y
- CABA: tasa reserva $X, tasa retributiva $Y
```

### Ajustar el comportamiento

En `lib/ai/assistant.ts` podés modificar:

- **SYSTEM_PROMPT**: Instrucciones generales y reglas
- **ALCANCE PERMITIDO**: Temas sobre los que puede responder
- **REGLAS ESTRICTAS**: Qué debe hacer ante preguntas fuera de tema

---

## Límites de alcance

El asistente **solo responde** sobre:

- Constitución de S.A.S. en Argentina
- Servicio QuieroMiSAS, planes, costos
- Jurisdicciones (Córdoba, CABA)
- Documentos, trámites, plazos
- Diferencias S.A.S. vs S.R.L. vs S.A.
- Capital, objeto social, socios
- Libros digitales, estatutos

Para preguntas **fuera de tema** responde:

> "Solo puedo responder consultas sobre constitución de S.A.S. y nuestro servicio. ¿Tenés alguna pregunta sobre eso?"

---

## Ubicación

- **Botón flotante**: Esquina inferior derecha (icono de chat)
- **Visible en**: Landing page principal
- **API**: `POST /api/chat`

---

## Costos (OpenAI)

- Modelo usado: `gpt-4o-mini` (económico)
- Se envían solo los últimos 10 mensajes por conversación
- Sin API Key configurada: el chat devuelve error 503

---

## Archivos

| Archivo | Función |
|---------|---------|
| `lib/ai/knowledge-base.ts` | Base de conocimiento (entrenar) |
| `lib/ai/assistant.ts` | Lógica y prompt del asistente |
| `app/api/chat/route.ts` | Endpoint API |
| `components/landing/AsistenteChat.tsx` | UI del chat |
