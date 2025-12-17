# 📘 GUÍA DE USO - PANEL DE ADMINISTRACIÓN

**Tu Flujo de Trabajo Completo**

---

## 🎯 FLUJO REAL DEL PROCESO

### **ETAPA 1: Cliente llena formulario** ✅
- El cliente completa los 7 pasos
- Se crea el trámite automáticamente
- Estado: **INICIADO**

**En tu panel verás:**
- Nueva notificación de trámite creado
- Aparece en "Trámites Recientes"

---

### **ETAPA 2: Validación y Primer Pago (50% Honorarios)**

**Acciones en el panel:**

1. **Ve al trámite:** Dashboard Admin → Ver Todos los Trámites → Gestionar

2. **Revisa los datos:**
   - Información del cliente (nombre, email, teléfono)
   - Datos de la sociedad
   - Socios y administradores

3. **Envía observación si es necesario:**
   ```
   Sección: "Enviar Observación al Cliente" (tarjeta azul)
   
   Ejemplo:
   "Hola Juan, estamos revisando tu trámite. 
   Necesitamos que nos confirmes el domicilio legal de la sociedad."
   ```
   Click en "Enviar Observación"

4. **Registra el primer pago (50% honorarios):**
   ```
   Sección: "Control de Pagos" (tarjeta verde)
   
   - Concepto: "Honorarios 50% (Adelanto)"
   - Monto: 160000
   - Click en "Registrar Pago"
   ```

5. **Cambia el estado:**
   ```
   Sección: "Gestión de Estado" (arriba)
   
   Estado: INICIADO → EN_PROCESO
   Click en "Actualizar Estado"
   ```

---

### **ETAPA 3: Examen de Homonimia**

**Acciones en el panel:**

1. **Haces el examen de homonimia** (fuera del sistema)

2. **Marcas la denominación sugerida:**
   ```
   Sección: "Examen de Homonimia" (tarjeta morada)
   
   - Click en "Aprobar Esta" en la denominación que sugieres
   - El cliente recibe notificación automática
   ```

3. **Envías observación con info de pago:**
   ```
   "Hola Juan, después del examen de homonimia sugerimos 
   utilizar la denominación 'MI EMPRESA SAS'.
   
   Para continuar necesitamos que abones la tasa de reserva de nombre.
   
   Monto: $XX.XXX
   CBU: XXXX-XXXX-XXXX
   Alias: QUIEROMISAS
   
   Una vez realizado el pago, envíanos el comprobante."
   ```

---

### **ETAPA 4: Reserva de Nombre**

**Cuando el cliente paga la tasa:**

1. **Registra el pago:**
   ```
   Control de Pagos:
   - Concepto: "Tasa Reserva de Nombre"
   - Monto: (lo que corresponda)
   - Registrar
   ```

2. **Ingresas el trámite de reserva** (fuera del sistema)

3. **Cuando aprueban el nombre:**
   ```
   Control de Etapas:
   - Click en "2. Reserva de Nombre"
   - Se marca en verde ✅
   - Cliente recibe notificación
   ```

---

### **ETAPA 5: Tasa Final y Depósito de Capital**

**Acciones:**

1. **Envías observación:**
   ```
   "¡Excelente! Tu nombre fue aprobado y reservado.
   
   Ahora necesitamos:
   1. Pagar la tasa retributiva final: $XX.XXX
   2. Depositar el 25% del capital social: $XX.XXX
   
   CBU para depósito: ..."
   ```

2. **Cuando el cliente paga la tasa:**
   ```
   Control de Pagos:
   - Concepto: "Tasa Retributiva (Final)"
   - Monto: XX.XXX
   - Registrar
   ```

3. **Marca la etapa:**
   ```
   Control de Etapas:
   - Click en "4. Tasa Final Pagada" ✅
   ```

4. **Cuando deposita el capital:**
   ```
   Control de Etapas:
   - Click en "3. Capital Depositado (25%)" ✅
   ```

---

### **ETAPA 6: Documentos para Firma**

**Acciones:**

1. **Preparas los documentos** (fuera del sistema)

2. **Los envías al cliente y marcas:**
   ```
   Control de Etapas:
   - Click en "5. Documentos Enviados" ✅
   ```

3. **Envías observación:**
   ```
   "Te hemos enviado los siguientes documentos para firma:
   - Estatuto Social
   - Acta Constitutiva
   
   Por favor fírmalos y envíalos escaneados a través de la sección 
   'Documentos' de tu panel."
   ```

---

### **ETAPA 7: Control de Documentos Firmados**

**Cuando el cliente sube los docs escaneados:**

1. **Revisa los documentos:**
   ```
   Sección: "Documentos Subidos"
   
   Para cada documento:
   - Click en "Ver" → Se abre el PDF
   - Si está OK: Click en "Aprobar" ✅
   - Si tiene problema: Click en "Rechazar" ❌
     (Te pide el motivo, el cliente lo verá)
   ```

2. **Cuando todos estén OK:**
   ```
   Control de Etapas:
   - Click en "6. Documentos Firmados" ✅
   ```

---

### **ETAPA 8: Ingreso del Trámite**

**Acciones:**

1. **Ingresas el trámite en IPJ/IGJ** (fuera del sistema)

2. **Marcas la etapa:**
   ```
   Control de Etapas:
   - Click en "7. Trámite Ingresado" ✅
   ```

3. **Cambias el estado:**
   ```
   Gestión de Estado:
   EN_PROCESO → ESPERANDO_APROBACION
   ```

4. **Envías observación:**
   ```
   "Tu trámite ha sido ingresado en el IPJ/IGJ.
   Ahora debemos esperar la aprobación del organismo.
   Te mantendremos informado."
   ```

---

### **ETAPA 9: Sociedad Inscripta** 🎉

**Cuando tengas el CUIT:**

1. **Completas datos finales:**
   ```
   Sección: "Datos de la Sociedad Inscripta" (tarjeta verde)
   
   - CUIT: 30-12345678-9
   - Matrícula: 12345
   - Número Resolución: (si ya lo tienes)
   - Click en "Guardar Datos Finales"
   ```

2. **Marcas la etapa:**
   ```
   Control de Etapas:
   - Click en "8. Sociedad Inscripta" ✅
   ```

3. **Cambias el estado final:**
   ```
   Gestión de Estado:
   ESPERANDO_APROBACION → COMPLETADO ✅
   ```

4. **Cliente recibe notificación automática:**
   ```
   🎉 "¡Felicitaciones! Tu sociedad ha sido inscripta exitosamente.
   CUIT: 30-12345678-9"
   ```

---

## 🎨 LAYOUT DE LA PÁGINA DE GESTIÓN

**Orden de secciones (de arriba hacia abajo):**

1. 📊 **Información del Cliente**
2. 🔄 **Gestión de Estado** (cambiar estado general)
3. 💜 **Examen de Homonimia** + 💚 **Control de Pagos** (lado a lado)
4. 💬 **Enviar Observación al Cliente**
5. 📋 **Datos del Trámite** (fecha, jurisdicción, plan, capital)
6. 👥 **Socios**
7. 👤 **Administradores**
8. 📄 **Documentos Subidos** (aprobar/rechazar)
9. 🎯 **Control de Etapas** (8 etapas clickeables)
10. ✅ **Datos Finales** (CUIT, matrícula, resolución)

---

## ⚡ ACCIONES RÁPIDAS DISPONIBLES

### **1. Cambiar Estado General**
Estados: Iniciado → En Proceso → Esperando Cliente → Esperando Aprobación → Completado

### **2. Aprobar Denominación**
Click en "Aprobar Esta" en la opción elegida

### **3. Registrar Pagos**
- 50% Honorarios (Adelanto)
- 50% Honorarios (Restante)
- Tasa Reserva Nombre
- Tasa Retributiva Final

### **4. Enviar Observaciones**
Mensajes directos al cliente

### **5. Aprobar/Rechazar Documentos**
Con observaciones si hay problemas

### **6. Marcar Etapas**
Click en cada etapa para marcar/desmarcar

### **7. Completar Datos Finales**
CUIT, Matrícula, Resolución

---

## 📋 CHECKLIST POR TRÁMITE

Use esta lista para cada trámite:

- [ ] Revisar datos del cliente
- [ ] Registrar pago 50% honorarios
- [ ] Contactar cliente para validar info
- [ ] Hacer examen de homonimia
- [ ] Aprobar denominación sugerida
- [ ] Enviar info para pago tasa reserva
- [ ] Registrar pago tasa reserva
- [ ] Ingresar trámite de reserva
- [ ] Marcar "Reserva de Nombre" ✅
- [ ] Solicitar tasa final y depósito capital
- [ ] Registrar pago tasa final
- [ ] Marcar "Tasa Final Pagada" ✅
- [ ] Marcar "Capital Depositado" ✅
- [ ] Enviar documentos para firma
- [ ] Marcar "Documentos Enviados" ✅
- [ ] Revisar documentos firmados
- [ ] Aprobar/Rechazar documentos
- [ ] Marcar "Documentos Firmados" ✅
- [ ] Ingresar trámite en IPJ/IGJ
- [ ] Marcar "Trámite Ingresado" ✅
- [ ] Cambiar estado a "Esperando Aprobación"
- [ ] Cuando tengas CUIT → Completar datos finales
- [ ] Marcar "Sociedad Inscripta" ✅
- [ ] Cambiar estado a "Completado" ✅

---

## 🎯 TIPS Y MEJORES PRÁCTICAS

### **1. Usa las Observaciones**
- Comunica cada paso al cliente
- Sé específico con montos y CBUs
- Adjunta links de pago cuando sea posible

### **2. Marca las Etapas**
- Ayuda a visualizar el progreso
- El cliente ve la barra de progreso actualizada
- Se crean notificaciones automáticas

### **3. Registra Todos los Pagos**
- Mantén un registro completo
- Útil para control contable
- El cliente ve su historial de pagos

### **4. Aprovecha los Estados**
- "Esperando Cliente" cuando necesites algo de él
- "En Proceso" cuando estás trabajando
- "Esperando Aprobación" cuando está en el organismo

---

## 🚀 EJEMPLO REAL COMPLETO

**Cliente:** Juan Pérez - "MI EMPRESA SAS"

**Día 1:**
- ✅ Formulario completo
- Cambiar estado: → EN_PROCESO
- Registrar pago: Honorarios 50% - $160,000
- Observación: "Hola Juan, tu trámite está en proceso..."

**Día 2:**
- Examen de homonimia completado
- Aprobar denominación: "MI EMPRESA SAS" (opción 1)
- Observación: "Aprobamos la opción 1. Abona $XX.XXX para reserva..."

**Día 3:**
- Cliente paga tasa
- Registrar pago: Tasa Reserva Nombre - $15,000
- Ingresar trámite de reserva

**Día 5:**
- Nombre aprobado
- Marcar etapa: ✅ "Reserva de Nombre"
- Observación: "¡Nombre aprobado! Ahora necesitamos tasa final..."

**Día 7:**
- Cliente paga tasa final
- Registrar pago: Tasa Retributiva - $XX.XXX
- Marcar etapa: ✅ "Tasa Final Pagada"
- Cliente deposita capital
- Marcar etapa: ✅ "Capital Depositado"

**Día 8:**
- Enviar documentos
- Marcar etapa: ✅ "Documentos Enviados"
- Observación: "Te enviamos los docs para firma..."

**Día 10:**
- Cliente sube docs firmados
- Revisar documentos: Aprobar ✅
- Marcar etapa: ✅ "Documentos Firmados"

**Día 11:**
- Ingresar trámite en IPJ
- Marcar etapa: ✅ "Trámite Ingresado"
- Cambiar estado: → ESPERANDO_APROBACION

**Día 20:**
- CUIT asignado
- Completar datos finales: CUIT 30-12345678-9
- Marcar etapa: ✅ "Sociedad Inscripta"

**Día 22:**
- Resolución obtenida
- Completar: Número Resolución
- Cambiar estado: → COMPLETADO ✅
- Registrar pago: Honorarios 50% Restante - $160,000

---

## 📊 HERRAMIENTAS DEL PANEL

### 🟣 **Examen de Homonimia (Tarjeta Morada)**
- Ve las 3 opciones propuestas
- Click en "Aprobar Esta" en la que elijas
- Se marca en verde ✅
- Cliente recibe notificación

### 🟢 **Control de Pagos (Tarjeta Verde)**
- **Ver pagos registrados** (arriba)
- **Registrar nuevo pago** (abajo):
  - Concepto (dropdown)
  - Monto
  - Click Registrar

**Conceptos disponibles:**
- Honorarios 50% (Adelanto)
- Honorarios 50% Restante
- Tasa Reserva de Nombre
- Tasa Retributiva (Final)
- Publicación en Boletín
- Otros

### 🔵 **Enviar Observación (Tarjeta Azul)**
- Campo de texto grande
- Escribe el mensaje al cliente
- Click en "Enviar Observación"
- Cliente lo ve en su sección Notificaciones

### 📄 **Documentos Subidos**
Para cada documento:
- **Ver** - Abre en nueva pestaña
- **Aprobar** ✅ - Marca como aprobado
- **Rechazar** ❌ - Pide motivo

### 🎯 **Control de Etapas (8 Tarjetas Clickeables)**
- Gris = Sin completar
- Verde = Completado ✅
- Click para marcar/desmarcar
- Barra de progreso automática

### ✅ **Datos Finales (Tarjeta Verde)**
- CUIT
- Matrícula
- Número de Resolución
- Solo cuando esté inscripta

---

## 💡 TIPS IMPORTANTES

### **Orden Lógico de Trabajo:**
1. ✅ Siempre empieza revisando datos del cliente
2. 💰 Registra los pagos a medida que los recibes
3. 💬 Usa observaciones para cada comunicación importante
4. ✅ Marca etapas después de completar cada paso
5. 🔄 Actualiza el estado general según la fase

### **Comunicación con el Cliente:**
- Cada observación que envíes llega como notificación
- El cliente las ve en su panel (campana 🔔)
- Sé específico con montos, fechas y pasos a seguir

### **Control de Pagos:**
- Registra TODOS los pagos
- Útil para control contable
- El cliente ve su historial completo

### **Estados Generales:**
- **INICIADO** - Recién creado, sin revisar
- **EN_PROCESO** - Estás trabajando activamente
- **ESPERANDO_CLIENTE** - Necesitas algo del cliente
- **ESPERANDO_APROBACION** - En el organismo
- **COMPLETADO** - Todo finalizado ✅
- **CANCELADO** - No procede

---

## 🎨 COLORES Y ORGANIZACIÓN

**Tarjetas por Función:**
- 🟣 Morado - Examen de Homonimia
- 🟢 Verde - Pagos
- 🔵 Azul - Observaciones
- 🟠 Naranja - Documentos
- ⚪ Blanco - Info general

**Estados de Etapas:**
- ⚪ Gris - Pendiente
- 🟢 Verde - Completado

---

## ✅ RESULTADO

Con este panel puedes:

✅ **Gestionar todo el proceso** desde un solo lugar  
✅ **Comunicarte con el cliente** de forma efectiva  
✅ **Llevar control de pagos** completo  
✅ **Aprobar/Rechazar documentos** con feedback  
✅ **Ver el progreso visual** de cada trámite  
✅ **Notificar automáticamente** al cliente en cada paso  

---

**¡El panel está listo para gestionar tu flujo de trabajo completo!** 🚀

¿Alguna función adicional que necesites?

