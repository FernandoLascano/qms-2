# 📋 Análisis del Flujo del Proceso - QuieroMiSAS

## Comparativa: Flujo Deseado vs. Estado Actual

### ✅ **PASO 0: Usuario se Registra**
**Estado:** ✅ **IMPLEMENTADO**
- Sistema de registro completo
- Email de bienvenida automático
- Autenticación con NextAuth

---

### ✅ **PASO 1: Usuario llena el Formulario**
**Estado:** ✅ **IMPLEMENTADO**
- Formulario multi-paso completo (7 pasos)
- Auto-guardado de borradores
- Validación de campos obligatorios
- Recuperación de formularios incompletos

---

### ⚠️ **PASO 2: QMS recibe el trámite y valida información**
**Estado:** ⚠️ **PARCIAL**
**Implementado:**
- El trámite aparece en el panel de admin cuando se completa el formulario
- Estado inicial: `INICIADO`

**Falta:**
- **Workflow de validación humana:** No hay un estado específico para "En Validación" o "Pendiente de Revisión"
- **Notificación al admin:** No hay alerta automática cuando llega un nuevo trámite
- **Checklist de validación:** No hay una lista de verificación para el admin

**Recomendación:**
- Agregar estado `EN_VALIDACION` o `PENDIENTE_REVISION`
- Notificación automática al admin cuando se completa un formulario
- Panel de "Trámites Pendientes de Validación"

---

### ⚠️ **PASO 3: Envío de pago de Honorarios (UN SOLO LINK)**
**Estado:** ⚠️ **NECESITA AJUSTE**
**Implementado:**
- Sistema de Mercado Pago integrado
- Generación de preferencias de pago
- Webhooks para confirmación

**Problema Actual:**
- El sistema está configurado para pagos en dos partes (según código encontrado)
- No hay opción de pago por transferencia con precio diferencial

**Ajustes Necesarios:**
1. **Unificar en un solo link de pago** de Mercado Pago
2. **Agregar opción de transferencia bancaria:**
   - Mostrar datos bancarios (CBU, Alias)
   - Precio diferencial (descuento por transferencia)
   - Campo para subir comprobante de transferencia
3. **Actualizar componente `HonorariosMercadoPago`:**
   - Un solo botón "Pagar Honorarios"
   - Opción toggle: "Pago con Mercado Pago" vs "Transferencia Bancaria"
   - Si transferencia: mostrar datos bancarios + upload de comprobante

---

### ⚠️ **PASO 4: Usuario abona → Imputación automática → Factura automática**
**Estado:** ⚠️ **PARCIAL**
**Implementado:**
- ✅ Imputación automática cuando se paga con Mercado Pago (vía webhook)
- ✅ Registro del pago en la base de datos
- ✅ Notificación al usuario

**Falta:**
- ❌ **Generación automática de factura PDF**
- ❌ **Envío automático de factura por email**
- ❌ **Sistema de numeración de facturas**

**Recomendación:**
- Implementar generación de factura PDF (usar librería como `pdfkit` o `jspdf`)
- Template de factura con datos del trámite y usuario
- Email automático con factura adjunta cuando se confirma el pago
- Modelo `Factura` en Prisma con numeración secuencial

---

### ⚠️ **PASO 5: Comienza formalmente el proceso**
**Estado:** ⚠️ **NECESITA DEFINICIÓN**
**Pregunta:** ¿Qué significa "comienza formalmente"?
- ¿Es cuando se valida el pago de honorarios?
- ¿Es un estado específico que debe marcarse?
- ¿Requiere alguna acción del admin?

**Recomendación:**
- Agregar estado `PROCESO_INICIADO` que se active automáticamente cuando:
  - Honorarios pagados ✅
  - Formulario validado por admin ✅
- O crear una acción manual del admin: "Iniciar Proceso Formal"

---

### ⚠️ **PASO 6: QMS analiza nombres y elige o solicita otro**
**Estado:** ⚠️ **PARCIAL**
**Implementado:**
- ✅ Admin puede ver las 3 opciones de denominación
- ✅ Admin puede seleccionar cuál usar (`denominacionAprobada`)
- ✅ Admin puede enviar observaciones al cliente

**Falta:**
- ❌ **Opción para solicitar otro nombre** (si ninguna de las 3 es adecuada)
- ❌ **Workflow para que el usuario proponga nuevas opciones**
- ❌ **Estado específico:** "Esperando nuevas opciones de nombre"

**Recomendación:**
- Agregar botón "Solicitar otras opciones" en el panel admin
- Estado `ESPERANDO_NUEVAS_DENOMINACIONES`
- Permitir al usuario agregar nuevas opciones desde su panel
- Notificación cuando el usuario envía nuevas opciones

---

### ✅ **PASO 7: QMS envía enlace de pago externo para tasa de reserva**
**Estado:** ✅ **IMPLEMENTADO**
- Sistema de `EnlacePago` para pagos externos
- Admin puede crear enlaces con URL, monto, descripción
- Cliente ve los enlaces pendientes en su panel

---

### ✅ **PASO 8: Usuario paga y envía comprobante**
**Estado:** ✅ **IMPLEMENTADO**
- Cliente puede subir comprobante de pago
- Sistema de documentos con Cloudinary
- Notificación al admin cuando se sube un documento

---

### ⚠️ **PASO 9: QMS valida pago e ingresa trámite de reserva**
**Estado:** ⚠️ **PARCIAL**
**Implementado:**
- ✅ Admin puede validar el comprobante (aprobar/rechazar)
- ✅ Admin puede registrar el pago manualmente

**Falta:**
- ❌ **Automatización del ingreso del trámite** (esto se hace fuera del sistema)
- ❌ **Tracking del estado del trámite de reserva** (pendiente, ingresado, en proceso)

**Recomendación:**
- Agregar campo `estadoReservaNombre`: `PENDIENTE`, `INGRESADO`, `EN_PROCESO`, `APROBADO`, `RECHAZADO`
- Botón "Marcar como Ingresado" cuando el admin ingresa el trámite
- Notificación automática al cliente cuando se ingresa

---

### ⚠️ **PASO 10: Notificación resultado reserva (1-2 días hábiles)**
**Estado:** ⚠️ **MANUAL**
**Implementado:**
- ✅ Admin puede marcar `denominacionReservada = true`
- ✅ Notificación automática al cliente
- ✅ Evento automático de vencimiento a 30 días

**Falta:**
- ❌ **Notificación automática de rechazo** (si el nombre no fue aprobado)
- ❌ **Tracking de días hábiles** desde el ingreso

**Recomendación:**
- Agregar campo `denominacionRechazada: Boolean`
- Email automático cuando se rechaza
- Opción para que el admin ingrese motivo de rechazo
- Contador de días hábiles desde el ingreso

---

### ✅ **PASO 11: Agendar vencimiento a 30 días si nombre aprobado**
**Estado:** ✅ **IMPLEMENTADO**
- Cuando `denominacionReservada = true`, se crea automáticamente un `Evento` de tipo `VENCIMIENTO_DENOMINACION` a 30 días
- Visible en el calendario del admin

---

### ⚠️ **PASO 12: Inicio formal del trámite por parte de QMS**
**Estado:** ⚠️ **NECESITA CLARIFICACIÓN**
**Pregunta:** ¿Es diferente del "Paso 5: Comienza formalmente"?
- ¿Es cuando se inicia el trámite en el organismo después de reservar el nombre?
- ¿Requiere alguna acción específica del admin?

**Recomendación:**
- Agregar estado `TRAMITE_INICIADO` o usar `tramiteIngresado = true`
- Botón "Iniciar Trámite Formal" en el panel admin
- Notificación al cliente

---

### ✅ **PASO 13: QMS envía enlace de pago externo para tasa IPJ**
**Estado:** ✅ **IMPLEMENTADO**
- Mismo sistema que Paso 7
- Admin puede crear enlace de pago externo

---

### ❌ **PASO 14: QMS informa datos de cuenta bancaria para depósito**
**Estado:** ❌ **NO IMPLEMENTADO**
**Falta:**
- ❌ **Sistema para informar datos bancarios** (CBU, Alias, Banco)
- ❌ **Notificación al cliente con datos bancarios**
- ❌ **Tracking de depósito de capital**

**Recomendación:**
- Agregar modelo `CuentaBancaria` en Prisma:
  ```prisma
  model CuentaBancaria {
    id        String   @id @default(cuid())
    tramiteId String
    tramite   Tramite  @relation(fields: [tramiteId], references: [id])
    
    banco     String
    cbu       String
    alias     String?
    tipo      String   // "DEPOSITO_CAPITAL"
    
    montoEsperado Float
    montoRecibido Float?
    
    fechaInformacion DateTime @default(now())
    fechaDeposito    DateTime?
    
    createdAt DateTime @default(now())
  }
  ```
- Componente en admin: "Informar Datos Bancarios"
- Notificación automática al cliente con datos
- Sección en panel cliente: "Datos para Depósito de Capital"

---

### ✅ **PASO 15: Usuario paga tasa y deposita, informa pagos**
**Estado:** ✅ **IMPLEMENTADO**
- Cliente puede confirmar pago de tasa
- Cliente puede subir comprobante de depósito
- Admin puede validar los pagos

---

### ❌ **PASO 16: QMS valida pagos y envía Borrador de documento**
**Estado:** ❌ **NO IMPLEMENTADO**
**Falta:**
- ❌ **Sistema de generación de borrador** (estatuto, acta, etc.)
- ❌ **Envío de borrador al cliente para revisión**
- ❌ **Estado:** "Borrador Enviado", "Borrador Revisado"

**Recomendación:**
- Implementar generación de documentos (ver ROADMAP punto 2)
- Agregar tipo de documento: `BORRADOR_ESTATUTO`, `BORRADOR_ACTA`
- Componente: "Enviar Borrador para Revisión"
- Sección en panel cliente: "Borradores para Revisar"
- Estado del trámite: `BORRADOR_ENVIADO`

---

### ❌ **PASO 17: Usuario confirma borrador**
**Estado:** ❌ **NO IMPLEMENTADO**
**Falta:**
- ❌ **Botón "Confirmar Borrador"** en panel cliente
- ❌ **Botón "Solicitar Correcciones"** con campo de observaciones
- ❌ **Tracking de confirmación**

**Recomendación:**
- Agregar campo `borradorConfirmado: Boolean` en `Tramite`
- Componente cliente: "Revisar Borrador" con opciones:
  - ✅ "Confirmar - Todo Correcto"
  - ❌ "Solicitar Correcciones" (con campo de texto)
- Notificación al admin cuando se confirma o se solicitan correcciones

---

### ✅ **PASO 18: QMS envía documentos para firmar**
**Estado:** ✅ **IMPLEMENTADO**
- Admin puede subir documentos para que el cliente firme
- Tipos: `ESTATUTO_PARA_FIRMAR`, `ACTA_PARA_FIRMAR`, `DOCUMENTO_PARA_FIRMAR`
- Cliente ve los documentos pendientes de firma

---

### ✅ **PASO 19: Usuario firma y envía documentos**
**Estado:** ✅ **IMPLEMENTADO**
- Cliente puede subir documentos firmados
- Sistema de documentos con estados: `PENDIENTE`, `EN_REVISION`, `APROBADO`, `RECHAZADO`

---

### ⚠️ **PASO 20: QMS valida documentos e ingresa trámite**
**Estado:** ⚠️ **PARCIAL**
**Implementado:**
- ✅ Admin puede aprobar/rechazar documentos
- ✅ Admin puede marcar `tramiteIngresado = true`
- ✅ Notificación automática al cliente

**Falta:**
- ❌ **Validación automática** (si todos los documentos están aprobados, sugerir ingresar)
- ❌ **Checklist:** "Todos los documentos aprobados antes de ingresar"

**Recomendación:**
- Validación: Solo permitir marcar `tramiteIngresado = true` si todos los documentos están aprobados
- Botón "Ingresar Trámite" que valide antes de marcar
- Evento automático: `FECHA_LIMITE_TRAMITE` a 45 días (ya implementado ✅)

---

### ⚠️ **PASO 21: Notificación de resolución (1-5 días hábiles)**
**Estado:** ⚠️ **MANUAL**
**Implementado:**
- ✅ Admin puede marcar `sociedadInscripta = true`
- ✅ Notificación automática al cliente

**Falta:**
- ❌ **Tracking de días hábiles** desde el ingreso
- ❌ **Notificación automática de rechazo** (si el trámite es rechazado)

**Recomendación:**
- Agregar campo `tramiteRechazado: Boolean`
- Email automático si se rechaza
- Contador de días hábiles desde `fechaIngresoTramite`

---

### ⚠️ **PASO 22: Informar CUIT y luego Resolución de Inscripción**
**Estado:** ⚠️ **PARCIAL**
**Implementado:**
- ✅ Admin puede ingresar `cuit`, `matricula`, `numeroResolucion`
- ✅ Formulario `DatosFinalesForm` en panel admin

**Falta:**
- ❌ **Notificaciones separadas:** Primero CUIT, luego Resolución
- ❌ **Workflow:** Ingresar CUIT → Notificar → Esperar → Ingresar Resolución → Notificar

**Recomendación:**
- Separar en dos pasos:
  1. Ingresar CUIT → Notificación automática: "Tu sociedad tiene CUIT asignado: XX-XXXXXXXX-X"
  2. Ingresar Resolución → Notificación automática: "Tu sociedad está inscripta. Resolución N° XXX"
- O agregar campo `cuitAsignado: Boolean` para trackear si ya se notificó el CUIT

---

### ⚠️ **PASO 23: Enviar documentos finales y guardar en legajo**
**Estado:** ⚠️ **PARCIAL**
**Implementado:**
- ✅ Sistema de documentos completo
- ✅ Cliente puede ver y descargar documentos

**Falta:**
- ❌ **Legajo permanente:** Los documentos deben quedar disponibles indefinidamente
- ❌ **Categorización:** Documentos finales vs. documentos del proceso
- ❌ **Archivo completo:** Todos los documentos de la sociedad constituida en un solo lugar

**Recomendación:**
- Agregar tipo de documento: `RESOLUCION_FINAL`, `ESTATUTO_FINAL`, `ACTA_FINAL`, `CONSTANCIA_CUIT`
- Sección en panel cliente: "Legajo de la Sociedad" (solo visible si `sociedadInscripta = true`)
- Exportar legajo completo en PDF (todos los documentos juntos)
- Los documentos del proceso deben quedar archivados permanentemente

---

## 📊 Resumen de Estado

| Paso | Estado | Prioridad |
|------|--------|-----------|
| 0. Registro | ✅ Completo | - |
| 1. Formulario | ✅ Completo | - |
| 2. Validación | ⚠️ Parcial | Media |
| 3. Honorarios (un link) | ⚠️ Necesita ajuste | **ALTA** |
| 4. Factura automática | ❌ Falta | **ALTA** |
| 5. Inicio formal | ⚠️ Necesita definición | Media |
| 6. Análisis nombres | ⚠️ Parcial | Media |
| 7. Pago tasa reserva | ✅ Completo | - |
| 8. Comprobante | ✅ Completo | - |
| 9. Validación e ingreso | ⚠️ Parcial | Media |
| 10. Notificación resultado | ⚠️ Manual | Baja |
| 11. Vencimiento 30 días | ✅ Completo | - |
| 12. Inicio trámite | ⚠️ Necesita clarificación | Media |
| 13. Pago tasa IPJ | ✅ Completo | - |
| 14. Datos bancarios | ❌ Falta | **ALTA** |
| 15. Pagos y depósitos | ✅ Completo | - |
| 16. Borrador documento | ❌ Falta | **ALTA** |
| 17. Confirmación borrador | ❌ Falta | **ALTA** |
| 18. Documentos para firmar | ✅ Completo | - |
| 19. Firma y envío | ✅ Completo | - |
| 20. Validación e ingreso | ⚠️ Parcial | Media |
| 21. Notificación resolución | ⚠️ Manual | Baja |
| 22. CUIT y Resolución | ⚠️ Parcial | Media |
| 23. Legajo permanente | ⚠️ Parcial | Media |

---

## 🎯 Prioridades de Implementación

### **ALTA PRIORIDAD:**
1. **Paso 3:** Unificar pago de honorarios en un solo link + opción transferencia
2. **Paso 4:** Generación y envío automático de facturas
3. **Paso 14:** Sistema para informar datos bancarios de depósito
4. **Paso 16:** Generación y envío de borradores de documentos
5. **Paso 17:** Sistema de confirmación de borradores por el cliente

### **MEDIA PRIORIDAD:**
6. **Paso 2:** Workflow de validación humana
7. **Paso 6:** Solicitar nuevas opciones de nombre
8. **Paso 9:** Tracking del estado de reserva de nombre
9. **Paso 22:** Notificaciones separadas para CUIT y Resolución

### **BAJA PRIORIDAD:**
10. **Paso 10 y 21:** Tracking automático de días hábiles
11. **Paso 23:** Mejoras en el legajo permanente

---

## 📝 Notas Adicionales

- El sistema actual tiene una buena base, pero necesita ajustes para seguir el flujo real del proceso
- Algunos pasos requieren clarificación sobre qué significa exactamente "iniciar formalmente"
- La automatización de facturas y borradores es crítica para mejorar la eficiencia
- El sistema de datos bancarios es necesario para el depósito de capital

