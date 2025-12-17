# 📧 Configuración de Emails Automáticos con Resend

## 🚀 Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

**Plan Gratuito incluye:**
- ✅ 100 emails/día
- ✅ 3,000 emails/mes
- ✅ Perfecto para empezar

---

## 🔑 Paso 2: Obtener API Key

1. Inicia sesión en [https://resend.com/api-keys](https://resend.com/api-keys)
2. Haz clic en "Create API Key"
3. Dale un nombre (ej: "QuieroMiSAS Production")
4. Selecciona permisos: **Sending access**
5. Copia la API key (empieza con `re_...`)

---

## ⚙️ Paso 3: Configurar Variables de Entorno

Abre tu archivo `.env` y actualiza:

```env
# Resend (Emails)
RESEND_API_KEY="re_TU_API_KEY_AQUI"  # ← Pega tu API key aquí
RESEND_FROM_EMAIL="onboarding@resend.dev"  # ← Cambiar después de verificar dominio
RESEND_REPLY_TO="info@quieromisas.com"

# URL de la aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # ← En producción: tu dominio real
```

---

## 📨 Paso 4: Verificar tu Dominio (Opcional pero Recomendado)

Para enviar emails desde tu propio dominio (ej: `noreply@quieromisas.com`):

1. Ve a [https://resend.com/domains](https://resend.com/domains)
2. Haz clic en "Add Domain"
3. Ingresa tu dominio: `quieromisas.com`
4. Resend te dará registros DNS para agregar:
   - **SPF** (TXT)
   - **DKIM** (TXT)
   - **DMARC** (TXT)

5. Agrega estos registros en tu proveedor de DNS (ej: Cloudflare, GoDaddy, etc.)
6. Espera 24-48 horas para verificación
7. Una vez verificado, actualiza `.env`:

```env
RESEND_FROM_EMAIL="noreply@quieromisas.com"  # ← Tu dominio verificado
```

---

## ✅ Paso 5: Probar que Funciona

1. Reinicia el servidor de desarrollo:
```bash
npm run dev
```

2. Registra un nuevo usuario en la plataforma
3. Deberías recibir un email de bienvenida
4. Revisa la consola del servidor para ver logs de emails

---

## 📧 Emails Automáticos Configurados

El sistema enviará emails automáticamente en estos casos:

### **1. Bienvenida** 🎉
- **Cuándo:** Usuario se registra
- **Asunto:** "¡Bienvenido a QuieroMiSAS! 🎉"

### **2. Trámite Enviado** ✅
- **Cuándo:** Cliente completa y envía el formulario
- **Asunto:** "✅ Trámite recibido - [Denominación]"

### **3. Pago Pendiente** 💳
- **Cuándo:** Admin envía un enlace de pago o genera un pago de Mercado Pago
- **Asunto:** "💳 Pago requerido - [Concepto]"

### **4. Documento Rechazado** 📄
- **Cuándo:** Admin rechaza un documento con observaciones
- **Asunto:** "📄 Documento requiere corrección - [Nombre]"

### **5. Etapa Completada** 🎯
- **Cuándo:** Admin marca una etapa como completada
- **Asunto:** "🎯 Progreso en tu trámite - [Etapa]"

### **6. Sociedad Inscripta** 🎉
- **Cuándo:** Admin marca el trámite como completado
- **Asunto:** "🎉 ¡Felicitaciones! Tu sociedad está inscripta"

### **7. Notificación Genérica** 📬
- **Cuándo:** Admin envía una observación al cliente
- **Asunto:** [Título personalizado]

---

## 🔍 Debugging

### Ver logs de emails:
Los emails se logean en la consola del servidor:
```
📧 Enviando email: { to: 'user@example.com', subject: '...', template: '...' }
✅ Email enviado exitosamente
```

### Si los emails no se envían:
1. Verifica que `RESEND_API_KEY` esté configurada
2. Revisa la consola para errores
3. Verifica en [Resend Dashboard](https://resend.com/emails) el estado de los emails

### Modo de desarrollo sin Resend:
Si `RESEND_API_KEY` no está configurada, los emails se logean pero no se envían:
```
📧 Email NO enviado (Resend no configurado): { ... }
```

---

## 🎨 Personalizar Plantillas

Las plantillas están en: `lib/emails/templates.tsx`

Puedes modificar:
- Colores
- Textos
- Estructura HTML
- Agregar imágenes

---

## 📊 Monitoreo

En el dashboard de Resend puedes ver:
- ✅ Emails enviados
- ❌ Emails fallidos
- 📈 Tasa de apertura
- 🔗 Clicks en links
- 📧 Bounces y quejas

---

## 💰 Costos

**Plan Gratuito:**
- 100 emails/día
- 3,000 emails/mes
- $0

**Plan Pro ($20/mes):**
- 50,000 emails/mes
- Dominio personalizado
- Soporte prioritario

---

## ✅ Checklist de Configuración

- [x] Crear cuenta en Resend
- [x] Obtener API Key
- [x] Agregar `RESEND_API_KEY` al `.env`
- [x] Configurar `NEXT_PUBLIC_APP_URL`
- [x] Reiniciar servidor
- [x] Probar registrando un usuario ✅ (Probado exitosamente - ab.fernandojlascano@gmail.com)
- [ ] (Opcional) Verificar dominio propio - **Pendiente para producción**
- [ ] (Opcional) Actualizar `RESEND_FROM_EMAIL` - **Después de verificar dominio**

---

**¡Listo! Los emails automáticos ya están funcionando.** 🚀

