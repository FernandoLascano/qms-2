# 🔔 Sistema de Recordatorios Automáticos

## 📋 Descripción

El sistema de recordatorios automáticos envía emails a los clientes cuando detecta situaciones que requieren atención, sin necesidad de intervención manual del administrador.

---

## 🎯 Tipos de Recordatorios

### 1. **Pagos Pendientes** 💳
- **Cuándo se envía:** 3 días y 7 días después de que se genera un enlace de pago pendiente
- **A quién:** Cliente
- **Incluye:** Concepto del pago, monto, días transcurridos, enlace directo

### 2. **Documentos Rechazados** 📄
- **Cuándo se envía:** 7 días después de que un documento fue rechazado y no se ha resubido
- **A quién:** Cliente
- **Incluye:** Nombre del documento, observaciones originales, enlace para subir

### 3. **Trámites Estancados** ⏱️
- **Cuándo se envía:** 10 días sin actualización del trámite
- **A quién:** Cliente
- **Incluye:** Etapa actual, días estancados, sugerencias de acciones

### 4. **Denominación Próxima a Vencer** ⚠️
- **Cuándo se envía:** Cuando faltan 5 días o menos para que venza la reserva (asume 30 días de vigencia)
- **A quién:** Administradores
- **Incluye:** Denominación, días para vencer, enlace al trámite

---

## ⚙️ Configuración

### Paso 1: Agregar Variable de Entorno

Abre tu archivo `.env` y agrega:

```env
# Seguridad para Cron Jobs
CRON_SECRET="tu-token-secreto-aqui-muy-largo-y-seguro"
```

**⚠️ IMPORTANTE:** En producción (Vercel), agrega esta variable en:
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega `CRON_SECRET` con un valor seguro y aleatorio

### Paso 2: Verificar Configuración de Resend

Asegúrate de que tu API Key de Resend esté configurada (ver `CONFIGURAR_EMAILS.md`).

### Paso 3: Desplegar a Vercel

El archivo `vercel.json` ya está configurado con:

```json
{
  "crons": [
    {
      "path": "/api/cron/recordatorios",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Esto ejecutará los recordatorios **todos los días a las 9:00 AM**.

---

## 🧪 Probar en Desarrollo Local

Para probar manualmente el sistema de recordatorios:

```bash
# Windows PowerShell
$headers = @{ "Authorization" = "Bearer dev-secret-change-in-production" }
Invoke-WebRequest -Uri http://localhost:3000/api/cron/recordatorios -Headers $headers

# Linux/Mac
curl -X GET http://localhost:3000/api/cron/recordatorios \
  -H "Authorization: Bearer dev-secret-change-in-production"
```

**Respuesta esperada:**

```json
{
  "success": true,
  "mensaje": "Recordatorios procesados exitosamente",
  "resultados": {
    "pagosPendientes": 2,
    "documentosRechazados": 1,
    "tramitesEstancados": 0,
    "denominacionesPorVencer": 0,
    "errores": []
  }
}
```

---

## 📊 ¿Cómo Funciona?

### Flujo de Ejecución

1. **Vercel Cron** llama al endpoint `/api/cron/recordatorios` diariamente a las 9 AM
2. El endpoint **verifica** la base de datos buscando:
   - Enlaces de pago pendientes con más de 3 o 7 días
   - Pagos de Mercado Pago pendientes con más de 3 o 7 días
   - Documentos rechazados sin resubir después de 7 días
   - Trámites sin actualización por más de 10 días
   - Denominaciones reservadas próximas a vencer
3. Para cada caso encontrado, **envía un email** con la plantilla correspondiente
4. **Marca** en la base de datos que el recordatorio fue enviado (para no duplicar)

### Campos de Control

Los siguientes campos se usan para evitar enviar recordatorios duplicados:

**En `Tramite`:**
- `recordatorioEstancado`: Se marca `true` al enviar recordatorio de trámite estancado
- `alertaDenominacionEnviada`: Se marca `true` al enviar alerta de denominación

**En `Pago`:**
- `recordatorio3Dias`: Se marca `true` al enviar recordatorio de 3 días
- `recordatorio7Dias`: Se marca `true` al enviar recordatorio de 7 días

**En `EnlacePago`:**
- `recordatorio3Dias`: Se marca `true` al enviar recordatorio de 3 días
- `recordatorio7Dias`: Se marca `true` al enviar recordatorio de 7 días

**En `Documento`:**
- `recordatorioEnviado`: Se marca `true` al enviar recordatorio de documento rechazado

---

## 🎨 Personalizar Recordatorios

### Cambiar Frecuencia del Cron

Edita `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/recordatorios",
      "schedule": "0 */6 * * *"  // Cada 6 horas
    }
  ]
}
```

**Ejemplos de schedules (formato cron):**
- `0 9 * * *` - Todos los días a las 9 AM
- `0 */6 * * *` - Cada 6 horas
- `0 9,18 * * *` - A las 9 AM y 6 PM
- `0 9 * * 1-5` - A las 9 AM de lunes a viernes

### Cambiar Días para Recordatorios

Edita `app/api/cron/recordatorios/route.ts`:

```typescript
// Cambiar de 3 días a 5 días
const hace5Dias = new Date()
hace5Dias.setDate(hace5Dias.getDate() - 5)
```

### Personalizar Templates

Los templates de email están en `lib/emails/templates.tsx`:
- `emailRecordatorioPago`
- `emailRecordatorioDocumento`
- `emailRecordatorioTramiteEstancado`
- `emailAlertaDenominacion`

---

## 🔍 Monitoreo y Logs

### Ver Logs en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Click en "Functions"
3. Busca `/api/cron/recordatorios`
4. Verás cada ejecución con logs detallados

### Logs Esperados

```
🔔 Iniciando verificación de recordatorios automáticos...
📧 Enviando email: { to: 'cliente@example.com', subject: '⏰ Recordatorio...', template: '...' }
✅ Email enviado exitosamente
✅ Verificación de recordatorios completada: {
  pagosPendientes: 2,
  documentosRechazados: 1,
  tramitesEstancados: 0,
  denominacionesPorVencer: 0,
  errores: []
}
```

---

## ❓ FAQ

### ¿Los recordatorios se duplican?

No, cada recordatorio marca un campo en la base de datos para evitar duplicados.

### ¿Qué pasa si Resend no está configurado?

Los recordatorios se logean en consola pero no se envían. No genera errores.

### ¿Puedo desactivar recordatorios temporalmente?

Sí, simplemente comenta la configuración en `vercel.json` o elimina la variable `CRON_SECRET`.

### ¿Puedo resetear los recordatorios?

Sí, puedes ejecutar una query SQL para resetear los campos booleanos:

```sql
UPDATE "EnlacePago" SET "recordatorio3Dias" = false, "recordatorio7Dias" = false;
UPDATE "Pago" SET "recordatorio3Dias" = false, "recordatorio7Dias" = false;
UPDATE "Documento" SET "recordatorioEnviado" = false;
UPDATE "Tramite" SET "recordatorioEstancado" = false, "alertaDenominacionEnviada" = false;
```

### ¿Funciona en desarrollo local?

Sí, pero debes ejecutar el endpoint manualmente con `curl` o Postman. Vercel Cron solo funciona en producción.

---

## ✅ Checklist de Implementación

- [x] Plantillas de email creadas
- [x] Funciones de envío implementadas
- [x] Endpoint `/api/cron/recordatorios` creado
- [x] Schema de Prisma actualizado con campos de control
- [x] Migraciones aplicadas
- [x] Archivo `vercel.json` configurado
- [x] Variable `CRON_SECRET` agregada al `.env` ✅ (`Club_Atletico_Talleres_capo_1913`)
- [x] Endpoint probado localmente ✅ (funciona correctamente)
- [ ] Variable `CRON_SECRET` configurada en Vercel (producción)
- [ ] Proyecto desplegado en Vercel
- [ ] Primer recordatorio en producción verificado

---

## 🚀 Beneficios

✅ **Menos trabajo manual:** Los clientes reciben recordatorios sin que tengas que hacer nada

✅ **Mejor conversión:** Los clientes no olvidan completar pagos o subir documentos

✅ **Profesionalismo:** Sistema automatizado que funciona 24/7

✅ **Alertas proactivas:** Te avisa antes de que las denominaciones venzan

---

**¡Listo! El sistema de recordatorios ya está implementado y listo para usar.** 🎉

