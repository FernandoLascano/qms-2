# 📧 Emails Automáticos - Triggers Implementados

## ✅ **TODOS LOS EMAILS ESTÁN INTEGRADOS**

### **1. 🎉 Email de Bienvenida**
**Trigger:** Usuario se registra
**Archivo:** `app/api/auth/registro/route.ts`
**Cuándo se envía:** Inmediatamente después de crear la cuenta

```typescript
await enviarEmailBienvenida(user.email, user.name)
```

**Contenido:**
- Mensaje de bienvenida
- Explicación de la plataforma
- Botón "Iniciar mi Trámite"

---

### **2. ✅ Email de Trámite Enviado**
**Trigger:** Cliente completa el formulario de 7 pasos
**Archivo:** `app/api/tramites/route.ts`
**Cuándo se envía:** Después de crear el trámite en la base de datos

```typescript
await enviarEmailTramiteEnviado(
  usuario.email,
  usuario.name,
  tramite.id,
  data.denominacion1
)
```

**Contenido:**
- Confirmación de recepción
- Denominación social elegida
- Próximos pasos del proceso
- Botón "Ver Estado del Trámite"

---

### **3. 💳 Email de Pago Pendiente (Enlaces Externos)**
**Trigger:** Admin envía un enlace de pago externo (tasas provinciales)
**Archivo:** `app/api/admin/tramites/[id]/enlaces-pago/route.ts`
**Cuándo se envía:** Después de crear el enlace de pago

```typescript
await enviarEmailPagoPendiente(
  usuario.email,
  usuario.name,
  conceptoTexto,
  parseFloat(monto),
  id
)
```

**Contenido:**
- Concepto del pago (ej: Tasa de Reserva)
- Monto destacado en grande
- Instrucciones para adjuntar comprobante
- Botón "Realizar Pago"

---

### **4. 💳 Email de Pago Pendiente (Mercado Pago)**
**Trigger:** Admin genera un link de pago de honorarios con Mercado Pago
**Archivo:** `app/api/admin/tramites/[id]/honorarios-mp/route.ts`
**Cuándo se envía:** Después de crear la preferencia de Mercado Pago

```typescript
await enviarEmailPagoPendiente(
  tramite.user.email,
  tramite.user.name,
  conceptoTexto,
  parseFloat(monto),
  id
)
```

**Contenido:**
- Concepto del pago (ej: Honorarios Plan Básico)
- Monto destacado
- Link directo a Mercado Pago
- Botón "Realizar Pago"

---

### **5. 📄 Email de Documento Rechazado**
**Trigger:** Admin rechaza un documento con observaciones
**Archivo:** `app/api/admin/documentos/[id]/rechazar/route.ts`
**Cuándo se envía:** Después de marcar el documento como rechazado

```typescript
await enviarEmailDocumentoRechazado(
  usuario.email,
  usuario.name,
  documento.nombre,
  observaciones,
  documento.tramiteId
)
```

**Contenido:**
- Nombre del documento rechazado
- Observaciones del admin (motivo del rechazo)
- Instrucciones para corregir
- Botón "Subir Documento Corregido"

---

### **6. 🎯 Email de Etapa Completada**
**Trigger:** Admin marca una etapa importante como completada
**Archivo:** `app/api/admin/tramites/[id]/etapas/route.ts`
**Cuándo se envía:** Cuando se completan estas etapas:
- ✅ Denominación Reservada
- ✅ Capital Depositado
- ✅ Tasa Pagada
- ✅ Documentos Firmados
- ✅ Trámite Ingresado

```typescript
await enviarEmailEtapaCompletada(
  usuario.email,
  usuario.name,
  nombresEtapas[etapa],
  id
)
```

**Contenido:**
- Nombre de la etapa completada
- Mensaje de progreso
- Botón "Ver Progreso Completo"

---

### **7. 🎉 Email de Sociedad Inscripta**
**Trigger:** Admin marca la etapa "Sociedad Inscripta" como completada
**Archivo:** `app/api/admin/tramites/[id]/etapas/route.ts`
**Cuándo se envía:** Cuando `sociedadInscripta = true`

```typescript
await enviarEmailSociedadInscripta(
  usuario.email,
  usuario.name,
  tramite.denominacionAprobada || tramite.denominacionSocial1,
  tramite.cuit,
  tramite.matricula,
  id
)
```

**Contenido:**
- Mensaje de felicitaciones
- Datos oficiales: CUIT, Matrícula, Denominación
- Botón "Ver Documentos Oficiales"
- Mensaje de éxito

---

### **8. 📬 Email de Notificación Genérica**
**Trigger:** Admin envía una observación al cliente
**Archivo:** `app/api/admin/tramites/[id]/observacion/route.ts`
**Cuándo se envía:** Cuando el admin escribe un mensaje en "Observaciones"

```typescript
await enviarEmailNotificacion(
  usuario.email,
  usuario.name,
  'Nuevo mensaje del equipo',
  mensaje,
  id
)
```

**Contenido:**
- Título personalizado
- Mensaje del admin
- Botón "Ver Trámite"

---

## 🔄 **FLUJO COMPLETO DEL CLIENTE:**

### **Día 1: Registro**
📧 Email: "¡Bienvenido a QuieroMiSAS! 🎉"

### **Día 1: Completa formulario**
📧 Email: "✅ Trámite recibido - [Denominación]"

### **Día 2: Admin solicita pago**
📧 Email: "💳 Pago requerido - Tasa de Reserva"

### **Día 3: Admin reserva denominación**
📧 Email: "🎯 Progreso en tu trámite - Denominación Reservada"

### **Día 5: Admin solicita más pagos**
📧 Email: "💳 Pago requerido - Honorarios"

### **Día 7: Cliente sube documento incorrecto**
📧 Email: "📄 Documento requiere corrección - DNI de Socio"

### **Día 10: Admin ingresa trámite**
📧 Email: "🎯 Progreso en tu trámite - Trámite Ingresado"

### **Día 15: Sociedad inscripta**
📧 Email: "🎉 ¡Felicitaciones! Tu sociedad está inscripta"

---

## 🎨 **DISEÑO DE LOS EMAILS:**

Todos los emails tienen:
- ✅ Header con logo y gradiente rojo bordo
- ✅ Contenido bien estructurado
- ✅ Botones de acción destacados
- ✅ Footer con información de contacto
- ✅ Diseño responsive (se ve bien en móvil)
- ✅ Colores profesionales

---

## ⚙️ **CONFIGURACIÓN NECESARIA:**

Para que los emails se envíen realmente, necesitas:

1. **Crear cuenta en Resend** (gratis)
2. **Obtener API Key**
3. **Actualizar `.env`:**
```env
RESEND_API_KEY="re_TU_API_KEY_AQUI"
```
4. **Reiniciar el servidor**

**Sin configurar Resend:**
- Los emails se logean en consola pero NO se envían
- La plataforma funciona normalmente
- Útil para desarrollo

**Con Resend configurado:**
- Los emails se envían automáticamente
- El cliente recibe notificaciones por email
- Mejor experiencia de usuario

---

## 📊 **ESTADÍSTICAS:**

Con este sistema implementado:
- ✅ **8 tipos de emails** automáticos
- ✅ **7 plantillas** profesionales
- ✅ **100% integrado** en el flujo de trabajo
- ✅ **0 trabajo manual** para enviar emails

---

## 🔍 **LOGS EN CONSOLA:**

Cuando se envía un email verás:
```
📧 Enviando email: {
  to: 'cliente@example.com',
  subject: '✅ Trámite recibido - Mi Empresa SAS',
  template: 'emailTramiteEnviado'
}
✅ Email enviado exitosamente
```

O si no está configurado:
```
📧 Email NO enviado (Resend no configurado): { ... }
```

---

**¡Sistema de emails 100% implementado y funcionando!** 🎉

