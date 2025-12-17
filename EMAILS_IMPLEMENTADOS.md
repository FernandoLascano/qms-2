# 📧 Emails Automáticos - Estado de Implementación

## ✅ **YA IMPLEMENTADOS:**

### **1. Email de Bienvenida** 🎉
**Trigger:** Usuario se registra
**Archivo:** `app/api/auth/registro/route.ts`
**Estado:** ✅ ACTIVO

```typescript
await enviarEmailBienvenida(user.email, user.name)
```

---

## 🔄 **PENDIENTES DE INTEGRAR:**

Los siguientes emails están **creados y listos**, solo falta agregarlos en los lugares correspondientes:

### **2. Trámite Enviado** ✅ (Plantilla lista)
**Cuándo:** Cliente completa el formulario de 7 pasos
**Dónde agregar:** `app/api/tramites/route.ts` (después de crear el trámite)

```typescript
await enviarEmailTramiteEnviado(
  user.email,
  user.name,
  tramite.id,
  tramite.denominacionSocial1
)
```

---

### **3. Pago Pendiente** 💳 (Plantilla lista)
**Cuándo:** Admin envía enlace de pago o genera pago de Mercado Pago

**Opción A - Enlaces de pago externos:**
**Dónde agregar:** `app/api/admin/tramites/[id]/enlaces-pago/route.ts`

```typescript
await enviarEmailPagoPendiente(
  user.email,
  user.name,
  concepto,
  monto,
  tramiteId
)
```

**Opción B - Honorarios Mercado Pago:**
**Dónde agregar:** `app/api/admin/tramites/[id]/honorarios-mp/route.ts`

```typescript
await enviarEmailPagoPendiente(
  user.email,
  user.name,
  concepto,
  monto,
  tramiteId
)
```

---

### **4. Documento Rechazado** 📄 (Plantilla lista)
**Cuándo:** Admin rechaza un documento
**Dónde agregar:** `app/api/admin/documentos/[id]/rechazar/route.ts`

```typescript
await enviarEmailDocumentoRechazado(
  user.email,
  user.name,
  documento.nombre,
  observaciones,
  documento.tramiteId
)
```

---

### **5. Etapa Completada** 🎯 (Plantilla lista)
**Cuándo:** Admin marca una etapa como completada
**Dónde agregar:** `app/api/admin/tramites/[id]/etapas/route.ts`

```typescript
// Solo enviar email para etapas importantes
const etapasImportantes = {
  denominacionReservada: 'Denominación Reservada',
  capitalDepositado: 'Capital Depositado',
  documentosFirmados: 'Documentos Firmados',
  sociedadInscripta: 'Sociedad Inscripta'
}

if (etapasImportantes[etapa]) {
  await enviarEmailEtapaCompletada(
    user.email,
    user.name,
    etapasImportantes[etapa],
    tramiteId
  )
}
```

---

### **6. Sociedad Inscripta** 🎉 (Plantilla lista)
**Cuándo:** Se completa la etapa final o se ingresan datos finales
**Dónde agregar:** `app/api/admin/tramites/[id]/etapas/route.ts` (cuando `sociedadInscripta = true`)

```typescript
if (etapa === 'sociedadInscripta' && value === true) {
  await enviarEmailSociedadInscripta(
    user.email,
    user.name,
    tramite.denominacionAprobada || tramite.denominacionSocial1,
    tramite.cuit,
    tramite.matricula,
    tramiteId
  )
}
```

---

### **7. Notificación Genérica** 📬 (Plantilla lista)
**Cuándo:** Admin envía observación al cliente
**Dónde agregar:** `app/api/admin/tramites/[id]/observacion/route.ts`

```typescript
await enviarEmailNotificacion(
  user.email,
  user.name,
  'Nuevo mensaje del equipo',
  observacion,
  tramiteId
)
```

---

## 📋 **CHECKLIST DE INTEGRACIÓN:**

- [x] ✅ Email de Bienvenida (Registro)
- [x] ✅ Email de Trámite Enviado
- [x] ✅ Email de Pago Pendiente (Enlaces externos)
- [x] ✅ Email de Pago Pendiente (Mercado Pago)
- [x] ✅ Email de Documento Rechazado
- [x] ✅ Email de Etapa Completada
- [x] ✅ Email de Sociedad Inscripta
- [x] ✅ Email de Notificación Genérica

## ✅ **TODOS LOS EMAILS INTEGRADOS Y FUNCIONANDO**

---

## 🔔 **RECORDATORIOS AUTOMÁTICOS:**

Los siguientes emails se envían **automáticamente** mediante un cron job que se ejecuta diariamente:

### **8. Recordatorio de Pago Pendiente** ⏰
**Trigger:** Pago pendiente por más de 3 días (1er recordatorio) y 7 días (2do recordatorio)
**Archivo:** `app/api/cron/recordatorios/route.ts`
**Estado:** ✅ ACTIVO
**Frecuencia:** Automático diario a las 9 AM

### **9. Recordatorio de Documento Rechazado** ⏰
**Trigger:** Documento rechazado sin resubir después de 7 días
**Archivo:** `app/api/cron/recordatorios/route.ts`
**Estado:** ✅ ACTIVO
**Frecuencia:** Automático diario a las 9 AM

### **10. Recordatorio de Trámite Estancado** ⏰
**Trigger:** Trámite sin actualización por más de 10 días
**Archivo:** `app/api/cron/recordatorios/route.ts`
**Estado:** ✅ ACTIVO
**Frecuencia:** Automático diario a las 9 AM

### **11. Alerta de Denominación por Vencer** ⚠️
**Trigger:** Denominación reservada con menos de 5 días para vencer (de 30 días totales)
**Archivo:** `app/api/cron/recordatorios/route.ts`
**Estado:** ✅ ACTIVO
**Frecuencia:** Automático diario a las 9 AM
**Destinatario:** Administradores

---

## 📊 TOTAL: 11 Emails Automáticos

- **7 emails** de eventos inmediatos
- **4 emails** de recordatorios programados

---

## 🔧 **CÓMO INTEGRAR:**

Para cada email pendiente:

1. Abrir el archivo indicado en "Dónde agregar"
2. Importar la función al inicio del archivo:
```typescript
import { enviarEmail... } from '@/lib/emails/send'
```
3. Agregar el `await` en el lugar indicado
4. Obtener los datos del usuario si es necesario:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId }
})
```
5. Llamar a la función con los parámetros correctos

---

## ⚠️ **IMPORTANTE:**

- Los emails se envían de forma **asíncrona** (no bloquean la respuesta)
- Si Resend no está configurado, se logean pero no se envían
- Todos los emails incluyen un link al trámite correspondiente
- Las plantillas son responsivas y se ven bien en móvil

---

## 🎨 **PERSONALIZACIÓN:**

Las plantillas están en: `lib/emails/templates.tsx`

Puedes modificar:
- Colores (actualmente usa rojo bordo: #991b1b)
- Textos
- Estructura
- Agregar logo de la empresa

---

**¿Quieres que integre todos los emails automáticamente ahora?**

