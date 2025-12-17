# 📊 Google Analytics - Configuración Completa

## ✅ **YA IMPLEMENTADO**

Google Analytics está configurado y listo para usar. Solo falta agregar tu ID de medición.

---

## 🚀 **Cómo Obtener tu Google Analytics ID**

### **Paso 1: Crear Cuenta de Google Analytics**

1. Ir a: https://analytics.google.com/
2. Hacer clic en **"Empezar a medir"**
3. Crear una **Cuenta** (nombre: "QuieroMiSAS")
4. Crear una **Propiedad** (nombre: "QuieroMiSAS Web")
5. Seleccionar **"Web"** como plataforma
6. Ingresar la URL: `https://www.quieromisas.com`
7. **Copiar el ID de medición** que aparece (formato: `G-XXXXXXXXXX`)

---

## 🔧 **Paso 2: Configurar en tu Proyecto**

### **Agregar a `.env.local`:**

```bash
# Crear o editar el archivo .env.local
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

**⚠️ Importante:**
- Reemplazar `G-XXXXXXXXXX` con tu ID real
- El prefijo `NEXT_PUBLIC_` es necesario para que funcione en el cliente
- **Reiniciar el servidor** después de agregar la variable

---

## 📈 **Qué Se Está Tracking**

### **Automático (ya configurado):**
- ✅ Visitas a páginas
- ✅ Tiempo en sitio
- ✅ Fuentes de tráfico
- ✅ Dispositivos (desktop/mobile/tablet)
- ✅ Ubicación geográfica
- ✅ Navegadores y sistemas operativos

### **Eventos Personalizados (implementados en `lib/analytics.ts`):**

#### **Landing Page:**
- `view_planes` - Usuario vio sección de planes
- `click_cta` - Click en llamados a la acción

#### **Autenticación:**
- `registro` - Nuevo usuario registrado
- `login` - Usuario inició sesión

#### **Trámites:**
- `iniciar_tramite` - Nuevo trámite iniciado
- `completar_paso` - Paso del formulario completado
- `enviar_tramite` - Trámite enviado para revisión

#### **Pagos:**
- `iniciar_pago` - Proceso de pago iniciado
- `completar_pago` - Pago completado exitosamente

#### **Documentos:**
- `subir_documento` - Documento subido

#### **Navegación:**
- `ver_dashboard` - Acceso al dashboard

#### **Ayuda:**
- `expandir_faq` - Pregunta de FAQ expandida
- `click_contacto` - Click en opciones de contacto

---

## 💻 **Cómo Usar los Eventos Personalizados**

### **Ejemplo en un Componente:**

```typescript
import { trackEvent } from '@/lib/analytics'

// En tu componente
const handleRegistro = async () => {
  // ... lógica de registro ...
  
  // Trackear evento
  trackEvent.registro('email')
}

// O para trackear un CTA
<Link 
  href="/registro"
  onClick={() => trackEvent.clickCTA('Hero Section')}
>
  Registrarse
</Link>
```

### **Ejemplo en el Formulario de Trámite:**

```typescript
// Al avanzar de paso
const siguientePaso = () => {
  setPaso(paso + 1)
  trackEvent.completarPaso(paso + 1)
}

// Al enviar el trámite
const enviarTramite = async () => {
  // ... enviar ...
  trackEvent.enviarTramite()
}
```

### **Ejemplo en Pagos:**

```typescript
// Al iniciar pago
const iniciarPago = (monto: number, concepto: string) => {
  trackEvent.iniciarPago(monto, concepto)
  // ... abrir Mercado Pago ...
}

// Al confirmar pago (webhook)
trackEvent.completarPago(monto, concepto)
```

---

## 📊 **Métricas que Podrás Ver en Google Analytics**

### **1. Adquisición:**
- ¿De dónde vienen tus visitantes?
  - Google Search
  - Redes sociales
  - Referencias directas
  - Campañas de ads

### **2. Comportamiento:**
- ¿Qué hacen en tu sitio?
  - Páginas más visitadas
  - Tiempo promedio en cada página
  - Tasa de rebote
  - Flujo de usuarios

### **3. Conversiones:**
- ¿Cuántos se convierten?
  - Registros completados
  - Trámites iniciados
  - Trámites enviados
  - Pagos completados

### **4. Eventos Personalizados:**
- ¿Qué acciones toman?
  - Ver planes: X veces
  - Expandir FAQ: X veces
  - Completar paso 1,2,3...
  - Iniciar pagos: $X total

---

## 🎯 **Embudos de Conversión Sugeridos**

### **Embudo 1: De Visitante a Usuario**
```
Landing Page → Ver Planes → Registro → Dashboard
```

### **Embudo 2: De Usuario a Cliente**
```
Dashboard → Iniciar Trámite → Completar Formulario → Enviar Trámite
```

### **Embudo 3: De Trámite a Pago**
```
Trámite Enviado → Iniciar Pago → Completar Pago
```

---

## 🔍 **Verificar que Funciona**

### **Método 1: Tiempo Real**
1. Abrir Google Analytics
2. Ir a: **Informes > Tiempo Real > Descripción general**
3. Abrir tu sitio en otra pestaña
4. Deberías ver **1 usuario activo**

### **Método 2: Extensión de Chrome**
1. Instalar: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/)
2. Activar la extensión
3. Abrir la consola del navegador (F12)
4. Navegar por tu sitio
5. Ver los eventos en la consola

### **Método 3: Network Tab**
1. Abrir DevTools (F12)
2. Ir a la pestaña **Network**
3. Filtrar por: `google-analytics.com/g/collect`
4. Navegar por el sitio
5. Ver las peticiones que se envían

---

## 📝 **Ejemplo de Configuración Completa**

### **Tu `.env.local` debería tener:**

```bash
# Google Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Otros...
DATABASE_URL="..."
NEXTAUTH_URL="..."
# etc.
```

### **Reiniciar el servidor:**

```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
npm run dev
```

---

## ✅ **Checklist de Implementación**

- [ ] Crear cuenta de Google Analytics
- [ ] Obtener ID de medición (G-XXXXXXXXXX)
- [ ] Agregar `NEXT_PUBLIC_GA_ID` a `.env.local`
- [ ] Reiniciar el servidor Next.js
- [ ] Verificar en Google Analytics > Tiempo Real
- [ ] (Opcional) Agregar eventos personalizados en componentes clave

---

## 🎨 **Eventos Ya Listos para Usar**

```typescript
// Importar
import { trackEvent } from '@/lib/analytics'

// Usar
trackEvent.viewPlanes()
trackEvent.clickCTA('ubicación')
trackEvent.registro('email')
trackEvent.login('email')
trackEvent.iniciarTramite()
trackEvent.completarPaso(1)
trackEvent.enviarTramite()
trackEvent.iniciarPago(120000, 'Honorarios Plan Profesional')
trackEvent.completarPago(120000, 'Honorarios Plan Profesional')
trackEvent.subirDocumento('DNI')
trackEvent.verDashboard()
trackEvent.expandirFAQ('¿Cuánto tarda?')
trackEvent.clickContacto('email')
```

---

## 🚀 **Próximos Pasos Opcionales**

1. **Google Tag Manager**: Para gestionar múltiples tags
2. **Google Ads**: Integrar para conversiones de ads
3. **Meta Pixel**: Para Facebook/Instagram ads
4. **Hotjar**: Para heatmaps y grabaciones

---

## 📞 **Soporte**

Si tenés problemas:
1. Verificar que el ID empiece con `G-`
2. Verificar que el prefijo sea `NEXT_PUBLIC_`
3. Reiniciar el servidor
4. Checkear la consola del navegador (F12)
5. Ver la documentación oficial: https://analytics.google.com/analytics/web/

---

**🎉 Google Analytics Configurado y Listo!**

Solo falta agregar tu ID de medición y empezarás a recibir datos.

