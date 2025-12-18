# Configuración de Emails con Resend

## Estado Actual
- ✅ API Key configurada: `re_PyRJHbWJ_7f4behrDeo5FuNx9vFTHKnA2`
- ⚠️ Email actual: `onboarding@resend.dev` (solo funciona en desarrollo)
- ❌ Dominio NO verificado: Los emails no funcionan en producción

## Problema
El email `onboarding@resend.dev` es un dominio de prueba que:
- Solo funciona en localhost
- No envía emails en producción (Vercel)
- Tiene límites muy restrictivos

## Solución: Verificar tu dominio

### Opción 1: Verificar dominio principal (quieromisas.com)

#### Paso 1: Agregar dominio en Resend
1. Ve a https://resend.com/domains
2. Haz clic en "Add Domain"
3. Ingresa: `quieromisas.com`
4. Haz clic en "Add"

#### Paso 2: Configurar registros DNS
Resend te mostrará los registros DNS que debes agregar. Típicamente son:

**Registros TXT (SPF)**
```
Tipo: TXT
Nombre: @
Valor: v=spf1 include:resend.com ~all
```

**Registros CNAME (DKIM)**
```
Tipo: CNAME
Nombre: resend._domainkey
Valor: [valor que te da Resend]

Tipo: CNAME
Nombre: resend2._domainkey
Valor: [valor que te da Resend]
```

**Registro CNAME (Return-Path)**
```
Tipo: CNAME
Nombre: resend
Valor: [valor que te da Resend]
```

#### Paso 3: Agregar registros en tu proveedor DNS
Dependiendo de dónde tengas tu dominio:

**GoDaddy:**
1. Ve a "My Products" → "DNS"
2. Selecciona "quieromisas.com"
3. Agrega los registros uno por uno

**Cloudflare:**
1. Ve a tu dominio
2. Haz clic en "DNS"
3. Agrega los registros
4. ⚠️ **IMPORTANTE**: Desactiva el proxy (nube gris) para los registros CNAME

**Namecheap:**
1. Ve a "Domain List" → "Manage"
2. Haz clic en "Advanced DNS"
3. Agrega los registros

#### Paso 4: Verificar en Resend
1. Vuelve a https://resend.com/domains
2. Haz clic en tu dominio
3. Haz clic en "Verify"
4. Si todo está bien, verás "Verified" ✅

**Nota**: La verificación puede tardar de 5 minutos a 48 horas dependiendo de la propagación DNS.

#### Paso 5: Actualizar variables de entorno

**Local (.env):**
```env
RESEND_FROM_EMAIL="noreply@quieromisas.com"
RESEND_REPLY_TO="contacto@quieromisas.com"
```

**Vercel:**
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Edita o agrega:
   - `RESEND_FROM_EMAIL` = `noreply@quieromisas.com`
   - `RESEND_REPLY_TO` = `contacto@quieromisas.com`
4. Haz un nuevo deploy para aplicar cambios

---

### Opción 2: Usar subdominio (más fácil si no tienes acceso al DNS principal)

Si no tienes acceso al DNS del dominio principal, puedes usar un subdominio como `mail.quieromisas.com`:

#### Paso 1: Crear subdominio
1. En tu proveedor DNS, crea un registro A para `mail.quieromisas.com`
2. Apúntalo a cualquier IP (o déjalo sin resolver)

#### Paso 2: Agregar en Resend
1. Ve a https://resend.com/domains
2. Agrega `mail.quieromisas.com` (no el dominio principal)
3. Sigue los mismos pasos de DNS pero para el subdominio

#### Paso 3: Variables de entorno
```env
RESEND_FROM_EMAIL="noreply@mail.quieromisas.com"
RESEND_REPLY_TO="contacto@quieromisas.com"
```

---

## Probar la configuración

### Endpoint de prueba
Una vez configurado, visita:
```
http://localhost:3000/api/test-email
```

Debería responder:
```json
{
  "success": true,
  "message": "Email enviado correctamente"
}
```

### Si hay errores
Revisa los logs en Vercel:
1. Ve a tu deployment
2. Haz clic en "Functions"
3. Busca errores de Resend

---

## Checklist de verificación

- [ ] Dominio agregado en Resend
- [ ] Registros DNS configurados (TXT SPF, CNAME DKIM)
- [ ] Dominio verificado en Resend (estado "Verified")
- [ ] Variables de entorno actualizadas en .env local
- [ ] Variables de entorno actualizadas en Vercel
- [ ] Nuevo deploy realizado en Vercel
- [ ] Endpoint `/api/test-email` funciona correctamente
- [ ] Email de prueba recibido en bandeja de entrada

---

## Troubleshooting

### Error: "Domain not verified"
- Espera 5-10 minutos para propagación DNS
- Verifica que los registros DNS estén correctos
- Usa herramientas como https://mxtoolbox.com/dkim.aspx para verificar

### Error: "Email bounced"
- El email de destino no existe
- El email está en la lista de spam
- Revisa los logs en Resend Dashboard

### Error: "Rate limit exceeded"
- Has enviado demasiados emails en poco tiempo
- Espera unos minutos
- Considera upgradear tu plan de Resend

### Emails van a spam
- Agrega registro DMARC:
  ```
  Tipo: TXT
  Nombre: _dmarc
  Valor: v=DMARC1; p=quarantine; rua=mailto:dmarc@quieromisas.com
  ```
- Espera unos días para que tu dominio gane reputación
- Evita palabras spam en el asunto

---

## Costos

Resend ofrece:
- **Plan Free**: 100 emails/día, 3,000 emails/mes
- **Plan Pro**: $20/mes por 50,000 emails/mes

Para QuieroMiSAS, el plan free debería ser suficiente inicialmente.

---

## Contacto Resend

Si tienes problemas:
- Email: support@resend.com
- Docs: https://resend.com/docs
- Discord: https://discord.gg/resend
