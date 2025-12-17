# 📋 Estado Actual de la Implementación - QuieroMiSAS

**Fecha:** $(date)
**Última sesión:** Implementación del Paso 3 - Honorarios Unificados

---

## ✅ COMPLETADO HOY

### **Paso 3: Honorarios Unificados con Opción de Transferencia** ✅

**Objetivo:** Unificar el pago de honorarios en un solo link, con opción de Mercado Pago o Transferencia Bancaria (con precio diferencial).

**Cambios Implementados:**

1. **Componente Admin** (`components/admin/HonorariosMercadoPago.tsx`):
   - ✅ Eliminadas opciones de "50% adelanto" y "50% restante"
   - ✅ Un solo formulario para generar link de pago
   - ✅ Campos para monto de Mercado Pago y monto de Transferencia (precio diferencial)
   - ✅ Formulario completo para datos bancarios (banco, CBU, alias, titular)
   - ✅ Visualización mejorada de pagos generados

2. **Componente Cliente** (`components/cliente/HonorariosPagoCliente.tsx`):
   - ✅ Muestra ambas opciones de pago lado a lado
   - ✅ Destaca el precio diferencial de transferencia
   - ✅ Muestra datos bancarios completos
   - ✅ Funcionalidad para subir comprobante de transferencia
   - ✅ Estados visuales: pendiente, procesando, aprobado

3. **API Endpoints:**
   - ✅ `app/api/admin/tramites/[id]/honorarios-mp/route.ts`: Actualizado para aceptar montoTransferencia y datosBancarios
   - ✅ `app/api/pagos/[id]/comprobante-transferencia/route.ts`: Nuevo endpoint para subir comprobante

4. **Base de Datos:**
   - ✅ Schema actualizado con campos:
     - `montoTransferencia` (Float, opcional)
     - `datosBancarios` (JSON, opcional)
     - `comprobanteTransferenciaId` (String, opcional)
   - ✅ Migración aplicada con `prisma db push`

**Funcionalidades:**
- ✅ Admin genera un solo link con ambas opciones
- ✅ Cliente ve ambas opciones en su panel
- ✅ Cliente puede pagar con Mercado Pago o subir comprobante de transferencia
- ✅ Admin recibe notificación cuando se sube comprobante
- ✅ Estado del pago cambia a `PROCESANDO` cuando se sube comprobante

---

## 📋 PRÓXIMOS PASOS (Según ANALISIS_FLUJO_PROCESO.md)

### **ALTA PRIORIDAD:**

#### **Paso 4: Factura Automática** ❌
**Estado:** No implementado

**Requisitos:**
- Generación automática de factura PDF cuando se confirma el pago
- Envío automático de factura por email al cliente
- Sistema de numeración de facturas (secuencial)
- Template de factura con datos del trámite y usuario

**Implementación sugerida:**
- Usar librería `pdfkit` o `jspdf` para generar PDFs
- Crear modelo `Factura` en Prisma
- Template de factura con branding de QMS
- Email automático con factura adjunta cuando se confirma pago (Mercado Pago o Transferencia)

---

#### **Paso 14: Sistema de Datos Bancarios para Depósito** ❌
**Estado:** No implementado

**Requisitos:**
- Sistema para que admin informe datos bancarios (CBU, Alias, Banco) para depósito de capital
- Notificación automática al cliente con datos bancarios
- Tracking de depósito de capital

**Implementación sugerida:**
- Crear modelo `CuentaBancaria` en Prisma
- Componente en admin: "Informar Datos Bancarios"
- Sección en panel cliente: "Datos para Depósito de Capital"
- Notificación automática cuando se informan datos

---

#### **Paso 16-17: Borradores de Documentos** ❌
**Estado:** No implementado

**Requisitos:**
- Generación de borradores de documentos (estatuto, acta, etc.)
- Envío de borrador al cliente para revisión
- Sistema de confirmación del cliente (confirmar o solicitar correcciones)

**Implementación sugerida:**
- Implementar generación de documentos (ver ROADMAP punto 2)
- Agregar tipo de documento: `BORRADOR_ESTATUTO`, `BORRADOR_ACTA`
- Componente admin: "Enviar Borrador para Revisión"
- Sección cliente: "Borradores para Revisar"
- Botones: "Confirmar - Todo Correcto" / "Solicitar Correcciones"

---

### **MEDIA PRIORIDAD:**

#### **Paso 2: Workflow de Validación Humana** ⚠️
**Estado:** Parcial

**Falta:**
- Estado específico para "En Validación" o "Pendiente de Revisión"
- Notificación automática al admin cuando llega un nuevo trámite
- Checklist de validación para el admin

---

#### **Paso 6: Solicitar Nuevas Opciones de Nombre** ⚠️
**Estado:** Parcial

**Falta:**
- Opción para que admin solicite otras opciones (si ninguna de las 3 es adecuada)
- Workflow para que usuario proponga nuevas opciones
- Estado específico: "Esperando nuevas opciones de nombre"

---

#### **Paso 9: Tracking del Estado de Reserva** ⚠️
**Estado:** Parcial

**Falta:**
- Campo `estadoReservaNombre`: PENDIENTE, INGRESADO, EN_PROCESO, APROBADO, RECHAZADO
- Botón "Marcar como Ingresado" cuando admin ingresa el trámite
- Notificación automática al cliente cuando se ingresa

---

#### **Paso 22: Notificaciones Separadas para CUIT y Resolución** ⚠️
**Estado:** Parcial

**Falta:**
- Separar en dos pasos:
  1. Ingresar CUIT → Notificación: "Tu sociedad tiene CUIT asignado: XX-XXXXXXXX-X"
  2. Ingresar Resolución → Notificación: "Tu sociedad está inscripta. Resolución N° XXX"
- O agregar campo `cuitAsignado: Boolean` para trackear si ya se notificó el CUIT

---

## 📝 NOTAS IMPORTANTES

### **Aclaraciones del Usuario:**
- **Paso 5 vs Paso 12:**
  - **Paso 5:** "Comienza formalmente" = Cuando el usuario abona los honorarios, se empieza a trabajar
  - **Paso 12:** "Inicio formal del trámite" = Inicio del trámite ante la IPJ (organismo oficial)

### **Archivos Modificados Hoy:**
1. `components/admin/HonorariosMercadoPago.tsx`
2. `components/cliente/HonorariosPagoCliente.tsx`
3. `app/api/admin/tramites/[id]/honorarios-mp/route.ts`
4. `app/api/pagos/[id]/comprobante-transferencia/route.ts` (nuevo)
5. `prisma/schema.prisma`
6. `ANALISIS_FLUJO_PROCESO.md` (creado)

### **Migraciones Aplicadas:**
- ✅ `prisma db push` - Agregados campos para transferencia bancaria

---

## 🎯 DECISIÓN PENDIENTE

**¿Qué implementar a continuación?**

Opciones sugeridas (en orden de prioridad):
1. **Paso 4: Factura Automática** (Alta prioridad, crítico para el flujo)
2. **Paso 14: Datos Bancarios para Depósito** (Alta prioridad, necesario para depósito de capital)
3. **Paso 16-17: Borradores de Documentos** (Alta prioridad, mejora UX significativa)

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

- `ANALISIS_FLUJO_PROCESO.md` - Análisis completo del flujo (23 pasos)
- `ROADMAP.md` - Roadmap general del proyecto
- `QMS-Context.md` - Contexto general del proyecto

---

**Cuando vuelvas, revisa este documento y decide qué paso implementar a continuación.**

