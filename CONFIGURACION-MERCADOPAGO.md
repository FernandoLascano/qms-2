# 🛠️ CONFIGURACIÓN DE MERCADO PAGO

Guía completa para integrar Mercado Pago en tu plataforma QuieroMiSAS.

---

## 📋 REQUISITOS PREVIOS

1. **Cuenta de Mercado Pago**
   - Crea una cuenta en [mercadopago.com.ar](https://www.mercadopago.com.ar/)
   - Completa la verificación de identidad
   - Activa tu cuenta para recibir pagos

2. **Aplicación en Mercado Pago Developers**
   - Ve a [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers/panel/app)
   - Crea una nueva aplicación
   - Selecciona "Pagos online" como tipo de integración

---

## 🔑 OBTENER ACCESS TOKEN

### **Paso 1: Acceder al Panel de Developers**

1. Ingresa a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación (o crea una nueva)
3. Ve a la sección **"Credenciales"**

### **Paso 2: Copiar Access Token**

Verás dos tipos de credenciales:

#### **🧪 Credenciales de Prueba (Testing)**
- Para desarrollo y pruebas
- No procesa pagos reales
- Puedes usar tarjetas de prueba

#### **🚀 Credenciales de Producción**
- Para pagos reales
- Requiere cuenta verificada
- Procesa pagos de clientes

**Copia el Access Token** que necesites (Prueba o Producción)

---

## ⚙️ CONFIGURAR EN TU PROYECTO

### **Paso 1: Agregar a Variables de Entorno**

Edita tu archivo `.env` (o `.env.local`):

```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="APP_USR-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
```

**⚠️ IMPORTANTE:**
- **NO** subas este archivo a GitHub
- El `.env` ya está en `.gitignore`
- Usa `.env.example` como plantilla

### **Paso 2: Reiniciar el Servidor**

```bash
# Detén el servidor (Ctrl+C)
# Vuelve a iniciarlo
npm run dev
```

---

## 🧪 MODO DE PRUEBA

### **Tarjetas de Prueba**

Para probar pagos sin usar dinero real:

| Tarjeta | Número | CVV | Vencimiento |
|---------|--------|-----|-------------|
| Visa | 4509 9535 6623 3704 | 123 | 11/25 |
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 |
| American Express | 3711 803032 57522 | 1234 | 11/25 |

**Datos del titular (cualquiera):**
- Nombre: APRO (para aprobar)
- DNI: 12345678
- Email: test@test.com

### **Estados de Prueba**

Usa estos nombres para simular diferentes estados:

- **APRO** → Pago aprobado
- **CONT** → Pago pendiente
- **CALL** → Rechazado, llamar para autorizar
- **FUND** → Rechazado por fondos insuficientes
- **SECU** → Rechazado por código de seguridad
- **EXPI** → Rechazado por fecha de expiración
- **FORM** → Rechazado por error en formulario

---

## 🔔 CONFIGURAR WEBHOOKS

Los webhooks permiten que Mercado Pago notifique a tu plataforma cuando un pago es confirmado.

### **Paso 1: URL del Webhook**

Tu URL de webhook es:

```
https://tudominio.com/api/webhooks/mercadopago
```

**Para desarrollo local (con ngrok):**

1. Instala ngrok: https://ngrok.com/
2. Ejecuta: `ngrok http 3000`
3. Copia la URL HTTPS que te da (ej: `https://abc123.ngrok.io`)
4. Tu webhook será: `https://abc123.ngrok.io/api/webhooks/mercadopago`

### **Paso 2: Configurar en Mercado Pago**

1. Ve a tu aplicación en el panel de developers
2. Sección **"Webhooks"** o **"Notificaciones IPN"**
3. Agrega la URL: `https://tudominio.com/api/webhooks/mercadopago`
4. Selecciona el evento: **"Pagos"** (payments)
5. Guarda

### **Paso 3: Verificar que Funciona**

1. Genera un link de pago desde el panel de admin
2. Realiza un pago de prueba
3. Verifica en la consola del servidor que llegó la notificación:

```
Pago confirmado: pago_id_123
```

---

## 💳 FLUJO DE PAGO COMPLETO

### **1. Admin genera link de pago**

```
Panel Admin → Trámite → Honorarios - Mercado Pago
→ Seleccionar concepto
→ Ingresar monto
→ "Generar Link de Mercado Pago"
```

### **2. Cliente recibe notificación**

- Notificación en el panel
- Email (si está configurado)
- Link de pago disponible

### **3. Cliente paga**

- Click en "Pagar con Mercado Pago"
- Redirige a checkout de Mercado Pago
- Ingresa datos de tarjeta
- Confirma pago

### **4. Mercado Pago procesa**

- Valida tarjeta
- Procesa pago
- Envía webhook a tu plataforma

### **5. Tu plataforma confirma**

- Recibe webhook
- Marca pago como PAGADO
- Notifica al cliente
- Notifica al admin

---

## 🎯 CONCEPTOS DE PAGO DISPONIBLES

En el panel de admin puedes generar links para:

1. **Honorarios 50% (Adelanto)**
   - Primer pago del cliente
   - Generalmente al inicio del trámite

2. **Honorarios 50% (Restante)**
   - Segundo pago
   - Al finalizar el trámite

3. **Honorarios Completo (100%)**
   - Pago único
   - Para clientes que prefieren pagar todo junto

---

## 💰 COMISIONES DE MERCADO PAGO

Mercado Pago cobra comisiones por cada transacción:

### **Tarjetas de Crédito**
- 1 pago: ~3.99% + $X por operación
- 3 cuotas: ~4.99%
- 6 cuotas: ~5.99%
- 12 cuotas: ~7.99%

### **Tarjetas de Débito**
- ~2.49% + $X por operación

### **Transferencia Bancaria**
- ~1.99% + $X por operación

**💡 Tip:** Puedes incluir estas comisiones en el monto que cobras al cliente.

---

## 🔒 SEGURIDAD

### **Buenas Prácticas**

1. **Nunca expongas tu Access Token**
   - Solo en variables de entorno
   - Nunca en el código frontend
   - Nunca en repositorios públicos

2. **Verifica los webhooks**
   - La API ya valida que vengan de Mercado Pago
   - Verifica el `external_reference` para asociar pagos

3. **Usa HTTPS en producción**
   - Mercado Pago requiere HTTPS para webhooks
   - Usa un certificado SSL válido

4. **Monitorea los pagos**
   - Revisa el panel de Mercado Pago regularmente
   - Verifica que los webhooks lleguen correctamente

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Error: "Mercado Pago no está configurado"**

**Causa:** No se encontró `MERCADOPAGO_ACCESS_TOKEN` en las variables de entorno.

**Solución:**
1. Verifica que el `.env` tenga la variable
2. Reinicia el servidor
3. Verifica que no haya espacios extra en el token

### **Los webhooks no llegan**

**Causa:** URL incorrecta o servidor no accesible.

**Solución:**
1. Verifica la URL en el panel de Mercado Pago
2. Si es local, usa ngrok
3. Verifica que la ruta `/api/webhooks/mercadopago` exista
4. Revisa los logs del servidor

### **Pago aprobado pero no se marca en la plataforma**

**Causa:** Webhook no procesado correctamente.

**Solución:**
1. Revisa los logs del servidor
2. Verifica que el `external_reference` sea correcto
3. Verifica que el pago exista en la base de datos
4. Prueba manualmente el webhook con Postman

### **Error al generar link de pago**

**Causa:** Access Token inválido o expirado.

**Solución:**
1. Verifica que el token sea correcto
2. Regenera el token en el panel de Mercado Pago
3. Actualiza el `.env`
4. Reinicia el servidor

---

## 📊 MONITOREO

### **Panel de Mercado Pago**

Accede a: https://www.mercadopago.com.ar/activities

Verás:
- Todos los pagos recibidos
- Estado de cada pago
- Comisiones cobradas
- Dinero disponible
- Retiros realizados

### **En tu Plataforma**

- Panel Admin → Ver trámite → Honorarios - Mercado Pago
- Verás todos los links generados
- Estado de cada pago (Pendiente/Pagado)
- Montos y fechas

---

## 🚀 PASAR A PRODUCCIÓN

### **Checklist**

- [ ] Cuenta de Mercado Pago verificada
- [ ] Aplicación creada en Developers Panel
- [ ] Access Token de **Producción** copiado
- [ ] Variable `MERCADOPAGO_ACCESS_TOKEN` actualizada en producción
- [ ] Webhook configurado con URL de producción (HTTPS)
- [ ] Servidor reiniciado
- [ ] Prueba de pago real realizada
- [ ] Webhook funcionando correctamente
- [ ] Notificaciones llegando a clientes y admins

---

## 📞 SOPORTE

### **Mercado Pago**
- Documentación: https://www.mercadopago.com.ar/developers/es/docs
- Soporte: https://www.mercadopago.com.ar/ayuda
- Comunidad: https://www.mercadopago.com.ar/developers/es/support

### **Tu Plataforma**
- Revisa los logs del servidor
- Verifica las notificaciones en la base de datos
- Contacta al desarrollador si persisten problemas

---

## ✅ RESUMEN RÁPIDO

1. **Crear cuenta en Mercado Pago** → Verificar identidad
2. **Crear aplicación** en Developers Panel
3. **Copiar Access Token** (Prueba o Producción)
4. **Agregar a `.env`**: `MERCADOPAGO_ACCESS_TOKEN="..."`
5. **Reiniciar servidor**: `npm run dev`
6. **Configurar webhook**: `https://tudominio.com/api/webhooks/mercadopago`
7. **Probar con tarjeta de prueba** (modo testing)
8. **Pasar a producción** con Access Token de producción

---

**¡Listo! Ya puedes recibir pagos de honorarios con Mercado Pago.** 💚

