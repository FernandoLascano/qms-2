# ☁️ CONFIGURACIÓN DE CLOUDINARY

## 🎯 PASO A PASO

---

### **1. Crear Cuenta en Cloudinary (Gratis)**

1. Ve a: **https://cloudinary.com/users/register_free**
2. Completa el formulario:
   - Email
   - Contraseña
   - Nombre de tu "cloud" (ej: `quieromisas`)
3. Verifica tu email
4. Inicia sesión

---

### **2. Obtener Credenciales**

Una vez dentro del dashboard de Cloudinary:

1. **En la página principal** verás un cuadro que dice "**Account Details**"
2. Copia estos tres valores:

```
Cloud Name: tu_cloud_name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz123
```

---

### **3. Agregar a tu `.env`**

Abre tu archivo `.env` y agrega estas líneas:

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz123"
```

**⚠️ IMPORTANTE:** Reemplaza los valores con tus credenciales reales.

---

### **4. Reiniciar el Servidor**

```bash
# Detén el servidor (Ctrl+C)
# Vuelve a iniciarlo
npm run dev
```

---

### **5. ¡Listo para Probar!**

Ahora intenta subir el documento de nuevo. Se subirá a Cloudinary en lugar del sistema de archivos local.

---

## ✅ VENTAJAS DE CLOUDINARY

✅ **No hay problemas de permisos**  
✅ **Funciona en cualquier servidor**  
✅ **Optimización automática de imágenes**  
✅ **CDN global (carga rápida)**  
✅ **Backups automáticos**  
✅ **Plan gratuito generoso:**
   - 25 GB de almacenamiento
   - 25 GB de ancho de banda/mes
   - Suficiente para empezar

---

## 📸 SCREENSHOT DE DÓNDE ESTÁN LAS CREDENCIALES

Cuando entres a Cloudinary verás algo así:

```
┌─────────────────────────────────────┐
│ Dashboard                           │
├─────────────────────────────────────┤
│ Account Details                     │
│                                     │
│ Cloud name: quieromisas             │
│ API Key: 123456789012345            │
│ API Secret: ************* [Show]    │
│                                     │
│ [Copy] [Reset]                      │
└─────────────────────────────────────┘
```

Click en **"Show"** al lado de API Secret para verlo completo.

---

## 🔒 SEGURIDAD

- ✅ El archivo `.env` ya está en `.gitignore`
- ✅ Nunca compartas tu API Secret
- ✅ Las credenciales solo están en el servidor (nunca en el frontend)

---

## 📁 ESTRUCTURA DE ARCHIVOS EN CLOUDINARY

Los documentos se guardan en:

```
cloudinary.com/quieromisas/
  └── qms-documentos/
      ├── tramite-123-1702512345-estatuto.pdf
      ├── tramite-456-1702512678-acta.pdf
      └── ...
```

---

## 🎉 RESULTADO

**ANTES (Sistema de archivos local):**
- ❌ Problemas de permisos
- ❌ No funciona en Vercel/hosting
- ❌ Sin CDN
- ❌ Sin optimización

**DESPUÉS (Cloudinary):**
- ✅ Siempre funciona
- ✅ URLs públicas permanentes
- ✅ CDN global
- ✅ Optimización automática
- ✅ Backups incluidos

---

**¡Ahora sí, configura tus credenciales y prueba!** 🚀

