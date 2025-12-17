# 💳 GUÍA DE SISTEMAS DE PAGO

Tu plataforma QuieroMiSAS tiene **DOS sistemas de pago diferentes** según el concepto.

---

## 🎯 RESUMEN RÁPIDO

| Concepto | Sistema | Dónde |
|----------|---------|-------|
| **Honorarios** | Mercado Pago (integrado) | Tarjeta verde |
| **Tasas (Reserva, Retributiva)** | Enlaces externos (Portal Córdoba) | Tarjeta naranja |
| **Publicaciones, Otros** | Enlaces externos | Tarjeta naranja |

---

## 💚 SISTEMA 1: HONORARIOS CON MERCADO PAGO

### **¿Qué es?**

Pagos de honorarios profesionales procesados directamente en la plataforma con Mercado Pago.

### **¿Cuándo usar?**

- Honorarios 50% (Adelanto)
- Honorarios 50% (Restante)
- Honorarios Completo (100%)

### **¿Cómo funciona?**

#### **Para el Admin:**

1. **Generar Link de Pago**

```
Panel Admin → Trámite → Honorarios - Mercado Pago (tarjeta verde)
→ Seleccionar concepto (ej: Honorarios 50% Adelanto)
→ Ingresar monto (ej: 160000)
→ Click en "Generar Link de Mercado Pago"
```

2. **El sistema automáticamente:**
   - Crea preferencia de pago en Mercado Pago
   - Genera link de pago
   - Guarda en la base de datos
   - Notifica al cliente

3. **Cuando el cliente paga:**
   - Mercado Pago envía webhook
   - El pago se marca como PAGADO automáticamente
   - Se notifica al admin y al cliente

#### **Para el Cliente:**

1. **Recibe notificación** en su panel
2. **Ve el link de pago** en "Pago de Honorarios"
3. **Click en "Pagar con Mercado Pago"**
4. **Paga con:**
   - Tarjeta de crédito
   - Tarjeta de débito
   - Efectivo (Rapipago, Pago Fácil)
   - Transferencia bancaria
5. **Confirmación automática**

### **Ventajas**

✅ **Automático** - El pago se confirma solo  
✅ **Seguro** - Procesado por Mercado Pago  
✅ **Múltiples medios** - Tarjetas, efectivo, transferencia  
✅ **Sin intervención** - No necesitas marcar como pagado  

### **Configuración Requerida**

- Access Token de Mercado Pago en `.env`
- Ver: `CONFIGURACION-MERCADOPAGO.md`

---

## 🧡 SISTEMA 2: ENLACES EXTERNOS (TASAS)

### **¿Qué es?**

Enlaces a portales de pago externos (ej: Portal de Pagos de Córdoba) que vencen después de un tiempo.

### **¿Cuándo usar?**

- Tasa de Reserva de Nombre
- Tasa Retributiva (Final)
- Publicación en Boletín
- Otros pagos gubernamentales

### **¿Cómo funciona?**

#### **Para el Admin:**

1. **Generar Enlace en el Portal Externo**
   - Ingresas al portal de pagos (ej: Córdoba)
   - Generas el enlace de pago
   - Copias la URL

2. **Enviar Enlace al Cliente**

```
Panel Admin → Trámite → Enlaces de Pago Externos (tarjeta naranja)
→ Seleccionar concepto (ej: Tasa Reserva de Nombre)
→ Ingresar monto (ej: 15000)
→ Pegar enlace del portal
→ (Opcional) Fecha de vencimiento
→ Click en "Enviar Enlace al Cliente"
```

3. **El sistema automáticamente:**
   - Guarda el enlace
   - Notifica al cliente
   - Muestra el enlace en el panel del cliente

4. **Cuando el cliente paga:**
   - El cliente te avisa o envía comprobante
   - **Tú marcas manualmente como pagado**
   - Click en "Marcar Pagado"
   - Se notifica al cliente

#### **Para el Cliente:**

1. **Recibe notificación** con el enlace
2. **Ve el enlace** en "Enlaces de Pago"
3. **Click en "Ir a Pagar"** (abre el portal externo)
4. **Paga en el portal** (según sus opciones)
5. **Si el enlace vence:**
   - Click en "Enlace Vencido"
   - Notifica al admin
   - Admin genera y envía uno nuevo

### **Ventajas**

✅ **Flexible** - Cualquier portal de pagos  
✅ **Control de vencimiento** - Cliente puede reportar si venció  
✅ **Notificaciones automáticas** - Cliente siempre informado  

### **Desventajas**

⚠️ **Manual** - Debes marcar como pagado  
⚠️ **Enlaces vencen** - Puede requerir generar nuevos  

---

## 📋 COMPARACIÓN LADO A LADO

| Característica | Mercado Pago | Enlaces Externos |
|----------------|--------------|------------------|
| **Confirmación** | Automática | Manual |
| **Medios de pago** | Múltiples | Según portal |
| **Vencimiento** | No vence | Puede vencer |
| **Integración** | Total | Parcial |
| **Seguridad** | Alta (Mercado Pago) | Según portal |
| **Comisiones** | Sí (~3-4%) | Según portal |
| **Mejor para** | Honorarios | Tasas gubernamentales |

---

## 🎨 UBICACIÓN EN EL PANEL

### **Panel de Admin - Gestión de Trámite**

```
┌─────────────────────────────────────────────────┐
│  Información del Cliente                        │
├─────────────────────────────────────────────────┤
│  Gestión de Estado                              │
├──────────────────────┬──────────────────────────┤
│  Examen Homonimia    │  Control de Pagos        │
│  (morado)            │  (registro manual)       │
└──────────────────────┴──────────────────────────┘
┌──────────────────────┬──────────────────────────┐
│  💚 Honorarios       │  🧡 Enlaces Externos     │
│  Mercado Pago        │  (Tasas)                 │
│                      │                          │
│  - Generar link MP   │  - Enviar enlace         │
│  - Automático        │  - Marcar pagado         │
└──────────────────────┴──────────────────────────┘
│  Enviar Observación                             │
├─────────────────────────────────────────────────┤
│  Control de Etapas                              │
└─────────────────────────────────────────────────┘
```

### **Panel del Cliente - Ver Trámite**

```
┌─────────────────────────────────────────────────┐
│  Información General                            │
├─────────────────────────────────────────────────┤
│  💚 Pago de Honorarios                          │
│                                                 │
│  Honorarios 50% (Adelanto)                      │
│  $160,000                                       │
│  [Pagar con Mercado Pago] →                    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  🧡 Enlaces de Pago                             │
│                                                 │
│  Tasa de Reserva de Nombre                      │
│  $15,000                                        │
│  [Ir a Pagar] → [Enlace Vencido]               │
└─────────────────────────────────────────────────┘
```

---

## 🔄 FLUJOS COMPLETOS

### **FLUJO 1: Pago de Honorarios (Mercado Pago)**

```
1. Admin genera link MP
   ↓
2. Cliente recibe notificación
   ↓
3. Cliente click "Pagar con Mercado Pago"
   ↓
4. Redirige a checkout de MP
   ↓
5. Cliente ingresa datos y paga
   ↓
6. MP procesa pago
   ↓
7. MP envía webhook a tu plataforma
   ↓
8. Sistema marca como PAGADO automáticamente
   ↓
9. Notifica a cliente y admin
   ✅ COMPLETADO
```

### **FLUJO 2: Pago de Tasa (Enlace Externo)**

```
1. Admin genera enlace en portal externo
   ↓
2. Admin pega enlace en la plataforma
   ↓
3. Cliente recibe notificación
   ↓
4. Cliente click "Ir a Pagar"
   ↓
5. Abre portal externo
   ↓
6. Cliente paga en el portal
   ↓
7. Cliente te avisa o envía comprobante
   ↓
8. Admin verifica pago
   ↓
9. Admin click "Marcar Pagado"
   ↓
10. Sistema notifica al cliente
    ✅ COMPLETADO
```

### **FLUJO 3: Enlace Vencido**

```
1. Cliente intenta pagar
   ↓
2. Enlace está vencido
   ↓
3. Cliente click "Enlace Vencido"
   ↓
4. Sistema notifica a todos los admins
   ↓
5. Admin genera nuevo enlace
   ↓
6. Admin lo envía por la plataforma
   ↓
7. Cliente recibe nuevo enlace
   ↓
8. Cliente paga
   ✅ COMPLETADO
```

---

## 💡 MEJORES PRÁCTICAS

### **Para Honorarios (Mercado Pago)**

✅ **Genera el link cuando:**
- El cliente confirma que procede con el trámite
- Validaste la información inicial
- Acordaste el monto

✅ **Monto recomendado:**
- 50% adelanto al inicio
- 50% restante al finalizar
- O 100% al inicio si el cliente prefiere

✅ **Seguimiento:**
- El sistema te notifica cuando pagan
- No necesitas hacer nada más
- El pago se marca automáticamente

### **Para Tasas (Enlaces Externos)**

✅ **Genera el enlace cuando:**
- El cliente ya pagó los honorarios
- Estás listo para ingresar el trámite
- Tienes todos los datos necesarios

✅ **Incluye fecha de vencimiento:**
- Ayuda al cliente a saber cuándo debe pagar
- Sistema puede alertar si está por vencer

✅ **Seguimiento:**
- Pide al cliente que te avise cuando pague
- O que envíe comprobante
- Marca como pagado apenas confirmes

✅ **Si vence el enlace:**
- Cliente puede reportarlo
- Recibirás notificación
- Genera uno nuevo rápidamente

---

## 🎯 CASOS DE USO REALES

### **Caso 1: Cliente Nuevo - Proceso Completo**

**Día 1:**
- Cliente llena formulario
- Admin revisa y valida
- **Admin genera:** Honorarios 50% Adelanto (MP) - $160,000
- Cliente paga con tarjeta
- ✅ Pago confirmado automáticamente

**Día 2:**
- Admin hace examen de homonimia
- Admin aprueba denominación
- **Admin genera:** Enlace Tasa Reserva - $15,000
- Cliente paga en portal de Córdoba
- Cliente avisa al admin
- Admin marca como pagado

**Día 5:**
- Nombre aprobado
- **Admin genera:** Enlace Tasa Retributiva - $XX,XXX
- Cliente paga
- Admin marca como pagado

**Día 20:**
- Sociedad inscripta
- **Admin genera:** Honorarios 50% Restante (MP) - $160,000
- Cliente paga
- ✅ Pago confirmado automáticamente

### **Caso 2: Enlace Vencido**

**Situación:**
- Admin envió enlace de tasa con vencimiento 5 días
- Cliente no pagó a tiempo
- Enlace venció

**Solución:**
1. Cliente entra a su panel
2. Ve el enlace con indicador de vencido
3. Click en "Enlace Vencido"
4. Admin recibe notificación
5. Admin genera nuevo enlace en el portal
6. Admin lo envía por la plataforma
7. Cliente paga con el nuevo enlace

---

## ❓ PREGUNTAS FRECUENTES

### **¿Puedo usar solo Mercado Pago para todo?**

No. Las tasas gubernamentales (reserva de nombre, tasa retributiva) deben pagarse en los portales oficiales (IPJ, IGJ). Mercado Pago es solo para tus honorarios.

### **¿Qué pasa si el cliente no paga los honorarios?**

El link de Mercado Pago no vence. Puedes enviárselo y esperar a que pague. Mientras tanto, puedes pausar el trámite o cambiar el estado a "Esperando Cliente".

### **¿Puedo cambiar el monto después de generar el link?**

No. Debes generar un nuevo link con el monto correcto. El anterior quedará como "Cancelado" o simplemente no se usará.

### **¿El cliente puede pagar en cuotas?**

Sí, si usas Mercado Pago. El cliente elige las cuotas al momento de pagar. Tú recibes el monto completo (menos comisiones).

### **¿Qué pasa si hay un problema con el webhook?**

Puedes verificar manualmente en el panel de Mercado Pago si el pago fue aprobado, y luego marcar el pago como pagado en tu base de datos si es necesario.

---

## ✅ CHECKLIST DE CONFIGURACIÓN

### **Mercado Pago (Honorarios)**

- [ ] Cuenta de Mercado Pago creada y verificada
- [ ] Aplicación creada en Developers Panel
- [ ] Access Token copiado
- [ ] Variable `MERCADOPAGO_ACCESS_TOKEN` en `.env`
- [ ] Servidor reiniciado
- [ ] Webhook configurado
- [ ] Prueba de pago realizada
- [ ] Pago se marcó como PAGADO automáticamente

### **Enlaces Externos (Tasas)**

- [ ] Acceso al portal de pagos (ej: Córdoba)
- [ ] Sabes cómo generar enlaces
- [ ] Conoces los montos de cada tasa
- [ ] Probaste enviar un enlace
- [ ] Probaste marcar como pagado
- [ ] Cliente recibió notificación

---

**¡Listo! Ya tienes dos sistemas de pago funcionando en tu plataforma.** 💚🧡

