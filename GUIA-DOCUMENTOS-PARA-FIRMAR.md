# 📄 SISTEMA DE DOCUMENTOS PARA FIRMAR

## ✅ IMPLEMENTADO EXITOSAMENTE

---

## 🎯 OBJETIVO

Permitir que el **admin suba documentos** (estatutos, actas, etc.) para que el **cliente los descargue, firme y devuelva firmados**.

---

## 🔄 FLUJO COMPLETO

### **1. Admin Sube Documento** 📤

**Panel Admin → Trámite → "Enviar Documentos para Firmar"** (tarjeta morada)

#### **Pasos:**

1. **Seleccionar archivo** (PDF, DOC, DOCX)
2. **Nombre del documento**: "Estatuto Social para Firma"
3. **Descripción/Instrucciones**: "Firma en todas las páginas marcadas con X"
4. **Click "Enviar al Cliente"**

#### **Qué sucede:**
- ✅ Archivo se guarda en `public/uploads/documentos/`
- ✅ Se crea registro en la base de datos
- ✅ Cliente recibe **notificación** inmediata
- ✅ Se marca la etapa `documentosRevisados = true`

---

### **2. Cliente Recibe Notificación** 🔔

**El cliente ve:**

```
Dashboard:
  ⚠️ ACCIONES PENDIENTES (pulsando)
  └─ Requiere tu atención

Notificación:
  📄 Documentos Listos para Firmar
  Los documentos "Estatuto Social" están listos.
  Descargalos, firmalos y subí las versiones firmadas.
```

---

### **3. Cliente Ve los Documentos** 👁️

**Panel Cliente → Trámite → "Documentos para Firmar"** (tarjeta morada)

**El cliente ve:**

```
┌─────────────────────────────────────┐
│ ✍️ Documentos para Firmar           │
│                                     │
│ Estatuto Social                     │
│ Firma en todas las páginas con X    │
│                                     │
│ [1] Descargar documento             │
│     [Descargar] ↓                   │
│                                     │
│ [2] Firmar en páginas indicadas     │
│                                     │
│ [3] Subir documento firmado         │
│     [Subir Firmado] ↑               │
└─────────────────────────────────────┘
```

---

### **4. Cliente Descarga y Firma** ✍️

1. **Click "Descargar"** → Se abre el PDF
2. **Imprime** o firma digitalmente
3. **Firma** en todas las páginas necesarias
4. **Escanea** el documento firmado

---

### **5. Cliente Sube Firmado** 📤

**Click "Subir Firmado"** → Redirige a `/dashboard/documentos/subir`

Allí el cliente:
1. Selecciona el archivo firmado
2. Elige tipo: "Estatuto Firmado"
3. Sube el documento

---

### **6. Admin Revisa** ✅

**Panel Admin → Trámite → "Documentos Subidos"**

El admin ve el documento firmado y puede:
- ✅ **Aprobar** → Cliente recibe confirmación
- ❌ **Rechazar** → Cliente debe corregir y subir de nuevo

---

## 📍 UBICACIÓN EN LOS PANELES

### **Panel de Admin:**

```
┌─────────────────────────────────────┐
│  Información del Cliente            │
├─────────────────────────────────────┤
│  Gestión de Estado                  │
├─────────────────────────────────────┤
│  Examen Homonimia | Control Pagos   │
├─────────────────────────────────────┤
│  Honorarios MP | Enlaces Externos   │
├─────────────────────────────────────┤
│  🟣 Enviar Documentos para Firmar   │ ← NUEVO
│     [Seleccionar archivo]           │
│     [Nombre]                        │
│     [Instrucciones]                 │
│     [Enviar al Cliente]             │
├─────────────────────────────────────┤
│  Enviar Observación                 │
├─────────────────────────────────────┤
│  Control de Etapas                  │
└─────────────────────────────────────┘
```

### **Panel del Cliente:**

```
┌─────────────────────────────────────┐
│  Header (nombre + estado)           │
├─────────────────────────────────────┤
│  🚀 Próximos Pasos                  │
├─────────────────────────────────────┤
│  📊 Timeline de Progreso            │
├─────────────────────────────────────┤
│  💬 Mensajes del Equipo             │ ← NUEVO (muestra observaciones)
├─────────────────────────────────────┤
│  ✍️ Documentos para Firmar          │ ← NUEVO
│     [Proceso 3 pasos visual]        │
├─────────────────────────────────────┤
│  💳 Pagos Honorarios                │
├─────────────────────────────────────┤
│  🔗 Enlaces Tasas                   │
└─────────────────────────────────────┘
```

---

## 🎨 COMPONENTES CREADOS

### **1. Admin: `SubirDocumentosParaCliente.tsx`**

**Características:**
- ✅ Selector de archivo (drag & drop ready)
- ✅ Nombre automático basado en el archivo
- ✅ Campo para instrucciones
- ✅ Subida con feedback visual
- ✅ Validaciones
- ✅ Notificación automática al cliente

**Ubicación:** `components/admin/SubirDocumentosParaCliente.tsx`

---

### **2. Cliente: `DocumentosParaFirmar.tsx`**

**Características:**
- ✅ Lista de documentos pendientes
- ✅ **Proceso visual en 3 pasos:**
  1. 🔵 Descargar documento
  2. 🟣 Firmar en páginas indicadas
  3. 🟢 Subir documento firmado
- ✅ Botones directos para cada acción
- ✅ Instrucciones claras
- ✅ Solo muestra documentos `PENDIENTE`

**Ubicación:** `components/cliente/DocumentosParaFirmar.tsx`

---

### **3. Cliente: `MensajesDelEquipo.tsx`**

**Características:**
- ✅ Muestra observaciones/notificaciones del admin
- ✅ Colores según tipo de mensaje:
  - 🟠 Naranja - Acción requerida
  - 🟢 Verde - Éxito
  - 🔴 Rojo - Alerta
  - 🔵 Azul - Información
- ✅ Fecha y hora de cada mensaje
- ✅ Muestra últimas 5 notificaciones

**Ubicación:** `components/cliente/MensajesDelEquipo.tsx`

---

## 🔧 API CREADA

### **POST `/api/admin/documentos/subir-para-cliente`**

**Función:** Subir documento desde el admin para que el cliente firme

**Proceso:**
1. Valida que sea admin
2. Recibe archivo + metadata
3. Guarda archivo en `public/uploads/documentos/`
4. Crea registro en DB (tipo: `ESTATUTO`, estado: `PENDIENTE`)
5. Crea notificación al cliente
6. Marca etapa `documentosRevisados = true`

**Ubicación:** `app/api/admin/documentos/subir-para-cliente/route.ts`

---

## 💾 ALMACENAMIENTO

### **Archivos Físicos:**
```
public/
  └── uploads/
      └── documentos/
          ├── 1702512345-estatuto-social.pdf
          ├── 1702512678-acta-constitutiva.pdf
          └── ...
```

### **Gitignore:**
```gitignore
# uploads
/public/uploads
```
✅ Los archivos subidos **NO se suben a Git**

---

## 📊 ESTADO EN LA BASE DE DATOS

### **Tabla `Documento`:**
```typescript
{
  id: "doc_123",
  tramiteId: "tramite_456",
  userId: "user_789",
  tipo: "ESTATUTO",
  nombre: "Estatuto Social",
  descripcion: "Firma en todas las páginas con X",
  url: "/uploads/documentos/1702512345-estatuto.pdf",
  estado: "PENDIENTE", // PENDIENTE → APROBADO/RECHAZADO
  tamanio: 245678,
  mimeType: "application/pdf"
}
```

---

## 🎯 INTEGRACIÓN CON EL FLUJO

### **Etapa: Documentos Enviados**

**Cuándo marcarla:**
```
Admin sube documento
  ↓
Sistema marca: documentosRevisados = true
  ↓
En Timeline aparece: "5. Documentos Enviados" ✅
  ↓
Cliente ve en "Próximos Pasos":
  "✍️ Firmar y Subir Documentos"
```

### **Etapa: Documentos Firmados**

**Cuándo marcarla:**
```
Cliente sube documento firmado
  ↓
Admin revisa y aprueba
  ↓
Admin marca etapa: "Documentos Firmados" ✅
  ↓
Sistema marca: documentosFirmados = true
```

---

## 💬 OBSERVACIONES/MENSAJES

### **Cómo el Admin Envía Observaciones:**

**Ya existe:** `ObservacionesForm` en el panel de admin

**Ahora en el cliente se ven en:**
- 💬 **Tarjeta "Mensajes del Equipo"** (destacada, arriba)
- Sección de notificaciones

### **Ejemplo:**

**Admin envía:**
```
"Revisé tu documentación y está todo correcto. 
Ya podés proceder a firmar los documentos que 
te enviamos."
```

**Cliente ve:**
```
┌─────────────────────────────────────┐
│ 💬 Mensajes del Equipo              │
├─────────────────────────────────────┤
│ ℹ️ Actualización del Trámite        │
│                                     │
│ Revisé tu documentación y está      │
│ todo correcto. Ya podés proceder... │
│                                     │
│ 13 de diciembre, 2024 a las 20:15   │
└─────────────────────────────────────┘
```

---

## 🎨 DISEÑO VISUAL

### **Admin - Subir Documentos:**
```
┌─────────────────────────────────────┐
│ 🟣 Enviar Documentos para Firmar    │
│                                     │
│ Seleccionar Archivo *               │
│ [Arrastra archivo aquí]             │
│                                     │
│ Nombre del Documento *              │
│ [Estatuto Social para Firma]        │
│                                     │
│ Descripción / Instrucciones         │
│ ┌─────────────────────────────────┐ │
│ │ Firma en todas las páginas      │ │
│ │ marcadas con una X              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Enviar al Cliente]                 │
└─────────────────────────────────────┘
```

### **Cliente - Documentos para Firmar:**
```
┌─────────────────────────────────────┐
│ ✍️ Documentos para Firmar           │
│                                     │
│ 📄 Estatuto Social                  │
│ Firma en todas las páginas con X    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [1] Descargar documento         │ │
│ │     [Descargar ↓]               │ │
│ ├─────────────────────────────────┤ │
│ │ [2] Firmar en páginas indicadas │ │
│ ├─────────────────────────────────┤ │
│ │ [3] Subir documento firmado     │ │
│ │     [Subir Firmado ↑]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠️ Importante                        │
│ Una vez firmados, súbelos en        │
│ "Documentos" del menú.              │
└─────────────────────────────────────┘
```

---

## ✅ BENEFICIOS

### **Para el Admin:**
✅ **Subida rápida** de documentos  
✅ **Instrucciones claras** al cliente  
✅ **Notificación automática**  
✅ **Control del proceso**  

### **Para el Cliente:**
✅ **Proceso claro en 3 pasos**  
✅ **Descarga fácil** del documento  
✅ **Instrucciones visibles**  
✅ **Sabe exactamente qué hacer**  

---

## 📋 CHECKLIST DE USO

### **Como Admin:**

- [ ] Preparar documentos para firma
- [ ] Acceder a Panel Admin → Trámite
- [ ] Ir a "Enviar Documentos para Firmar"
- [ ] Seleccionar archivo (PDF/DOC)
- [ ] Ingresar nombre descriptivo
- [ ] Agregar instrucciones de firma
- [ ] Click "Enviar al Cliente"
- [ ] Cliente recibe notificación
- [ ] Esperar a que cliente suba firmados
- [ ] Revisar documentos firmados
- [ ] Aprobar o rechazar

### **Como Cliente:**

- [ ] Recibir notificación
- [ ] Ir a "Documentos para Firmar"
- [ ] Click "Descargar"
- [ ] Imprimir o abrir digitalmente
- [ ] Firmar en páginas indicadas
- [ ] Escanear documento firmado
- [ ] Ir a "Documentos" → "Subir"
- [ ] Seleccionar archivo firmado
- [ ] Subir documento
- [ ] Esperar aprobación del admin

---

## 🚀 EJEMPLO COMPLETO

### **Día 10 - Admin prepara documentos:**

1. Admin abre trámite en panel
2. Va a "Enviar Documentos para Firmar"
3. Sube `estatuto-social.pdf`
4. Nombre: "Estatuto Social para Firma"
5. Instrucciones: "Firma en páginas 5, 10 y 15"
6. Click "Enviar"

### **Cliente recibe:**

```
Notificación:
  📄 Documentos Listos para Firmar
  Los documentos "Estatuto Social" están listos.
  
Dashboard:
  ⚠️ ACCIONES PENDIENTES (pulsando)
  
Trámite:
  🚀 Próximos Pasos:
     "✍️ Firmar y Subir Documentos"
     [Ir a Documentos →]
```

### **Día 11 - Cliente firma:**

1. Descarga el PDF
2. Firma en páginas 5, 10 y 15
3. Escanea el documento
4. Sube en "Documentos"

### **Día 12 - Admin aprueba:**

1. Ve documento firmado
2. Revisa firmas
3. Click "Aprobar"
4. Marca etapa "Documentos Firmados" ✅

---

## 🎉 RESULTADO

**ANTES:**
- Admin enviaba docs por email
- Cliente no sabía qué firmar
- Proceso confuso
- Sin seguimiento

**DESPUÉS:**
- ✅ Todo dentro de la plataforma
- ✅ Proceso visual en 3 pasos
- ✅ Instrucciones claras
- ✅ Notificaciones automáticas
- ✅ Seguimiento completo

---

**¡EL SISTEMA DE DOCUMENTOS ESTÁ COMPLETO!** 📄✅

**Última actualización:** 13 de diciembre de 2024  
**Estado:** ✅ IMPLEMENTADO Y FUNCIONANDO

