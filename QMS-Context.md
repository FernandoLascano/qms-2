# 📋 DOCUMENTO DE CONTEXTO - QUIEROMISAS.COM
## Rediseño Completo desde Cero

**Última actualización:** 13 de diciembre de 2024  
**Desarrollador:** Fernando  
**Estado actual:** ✅ PLATAFORMA COMPLETA CON PANEL DE ADMIN - Listo para producción

---

## 🎯 OBJETIVO DEL PROYECTO

Rediseñar completamente **www.quieromisas.com** para convertirlo en una plataforma moderna y profesional de constitución de sociedades en Argentina (SAS), con:

- Sistema completo de usuarios (clientes y administradores)
- Formulario multi-paso inteligente con guardado automático
- Panel de cliente para seguimiento de trámites
- Panel administrativo para abogados
- Gestión de documentos y pagos
- Base de datos robusta

---

## 🛠️ STACK TECNOLÓGICO

### Frontend
- **Next.js 14** (App Router) - Framework React moderno
- **TypeScript** - JavaScript tipado
- **Tailwind CSS** - Estilos utility-first
- **Shadcn/ui** - Componentes UI profesionales

### Backend
- **Next.js API Routes** - Backend integrado
- **Prisma ORM** - Manejo de base de datos
- **PostgreSQL** (Supabase) - Base de datos

### Autenticación
- **NextAuth.js** - Sistema de login seguro

### Almacenamiento
- **Cloudinary/AWS S3** - Documentos y archivos

### Pagos
- **Mercado Pago** - Integración de pagos para Argentina

### Hosting
- **Vercel** - Deploy automático y gratuito

---

## 📁 ESTRUCTURA DEL PROYECTO

```
qms-v2/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── cliente/
│   │   └── admin/
│   ├── formulario/
│   │   └── page.tsx         ← ARCHIVO PRINCIPAL DEL FORMULARIO
│   ├── api/
│   │   └── auth/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                   ← Componentes Shadcn/ui
├── lib/
│   └── prisma.ts
├── prisma/
│   └── schema.prisma         ← ESQUEMA DE BASE DE DATOS
├── public/
├── .env                      ← Variables de entorno (NO SUBIR A GIT)
├── package.json
└── tsconfig.json
```

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### Credenciales Supabase
```env
DATABASE_URL="postgresql://postgres.zeufpoxrkfqykwelqvxb:Matadores13!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
```

### Esquema Principal (Prisma)

**Tablas principales:**
1. `Usuario` - Datos de usuarios (clientes y admins)
2. `Tramite` - Información de cada trámite de constitución
3. `Sociedad` - Datos de la sociedad a constituir
4. `RepresentanteLegal` - Representantes de la sociedad
5. `Socio` - Socios/accionistas
6. `Documento` - Archivos adjuntos (DNI, estatutos, etc.)
7. `Pago` - Registro de pagos
8. `Notificacion` - Sistema de notificaciones
9. `HistorialCambios` - Auditoría de cambios
10. `ConfiguracionSistema` - Configuración general
11. `PlanPrecio` - Planes y precios
12. `GastoJurisdiccion` - Gastos por provincia

### Comandos Prisma Importantes
```bash
# Generar cliente Prisma
npx prisma generate

# Crear/actualizar base de datos
npx prisma migrate dev --name nombre_migracion

# Abrir Prisma Studio (interfaz visual)
npx prisma studio

# Resetear base de datos (¡CUIDADO!)
npx prisma migrate reset
```

---

## 🎨 FORMULARIO MULTI-PASO

### Estado Actual (Diciembre 13, 2024)

**✅ FORMULARIO COMPLETO - 7 PASOS:**

**Paso 1: Datos Personales y Plan** ✅
- Información personal (nombre, apellido, DNI, teléfono, email)
- Selección de plan (Básico, Emprendedor, Premium)
- Selección de jurisdicción (Córdoba/CABA)

**Paso 2: Nombre de la Sociedad** ✅
- 3 opciones de denominación social
- Checkbox marca registrada
- Validaciones implementadas

**Paso 3: Objeto Social y Domicilio** ✅
- Objeto social preaprobado o personalizado
- Domicilio legal completo
- Opción "No dispongo de domicilio"

**Paso 4: Capital Social y CBU** ✅
- Capital social mínimo (2 SMVM = $635.600)
- CBU Principal y Secundario
- Opción "Informar CBU más adelante"

**Paso 5: Socios/Accionistas** ✅
- Agregar/eliminar socios dinámicamente
- Datos completos de cada socio
- Cálculo automático de aportes y porcentajes

**Paso 6: Administradores** ✅
- Mínimo 2 administradores (Titular y Suplente)
- Autocompletar desde socios
- Datos completos de cada administrador

**Paso 7: Cierre de Ejercicio** ✅
- Fecha de cierre económico
- Opción de asesoramiento contable
- Resumen final antes de enviar

**🎉 SISTEMA DE GUARDADO FUNCIONANDO:**

✅ **Guardado en base de datos** - Los datos se guardan correctamente en PostgreSQL
✅ **Creación de trámites** - Se crea el registro completo con todos los datos
✅ **Notificaciones** - Sistema de notificaciones funcionando
✅ **Historial de estados** - Se registra el historial de cambios
✅ **Toasts de feedback** - Mensajes de éxito/error implementados
✅ **Redirección automática** - Redirige al dashboard después de guardar

**🎉 NUEVAS FUNCIONALIDADES COMPLETADAS:**

✅ **Autenticación real** - Usuario autenticado en todo el sistema
✅ **Guardado automático** - Cada 5 segundos con indicador visual
✅ **Recuperación de progreso** - Carga borradores automáticamente
✅ **Sistema de documentos** - Upload, gestión y descarga completos
✅ **Protección de rutas** - Middleware de seguridad implementado
✅ **Páginas de trámites** - Lista y detalle completo
✅ **Notificaciones** - Sistema de toasts y notificaciones en BD

**🎉 ÚLTIMA IMPLEMENTACIÓN:**

✅ **Panel de Administración COMPLETO**
- Dashboard con estadísticas en tiempo real
- Gestión de todos los trámites
- Cambio de estados con notificaciones
- Aprobación/Rechazo de documentos
- Formulario de datos finales (CUIT, matrícula)
- Vista detallada de cada trámite
- Acceso protegido solo para ADMIN

**📋 PENDIENTES:**

- Integración de pagos con Mercado Pago
- Sistema de mensajería cliente-abogado
- Generación automática de documentos (PDFs)
- Envío de emails automáticos
- Búsqueda y filtros avanzados
- Exportación de reportes

### Archivos Principales

**Formulario:** `app/tramite/nuevo/page.tsx`
- Componente con 7 pasos completos
- Navegación entre pasos
- Validación de datos
- Envío a API

**API de Trámites:** `app/api/tramites/route.ts`
- POST: Crear nuevo trámite
- GET: Obtener lista de trámites
- Guardado en PostgreSQL vía Prisma
- Creación de notificaciones e historial

**Schema de Base de Datos:** `prisma/schema.prisma`
- Modelo `Tramite` con campos JSON para socios y administradores
- Relaciones con User, Documento, Pago, Notificacion
- Estados y seguimiento completo

---

## 🔐 VARIABLES DE ENTORNO (.env)

```env
# Base de datos
DATABASE_URL="postgresql://postgres.zeufpoxrkfqykwelqvxb:Matadores13!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="quieromisas-secret-2024-super-seguro-random-string-12345"

# UploadThing (configurar después)
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""
```

**⚠️ IMPORTANTE:** Este archivo NO se sube a Git (está en .gitignore)

---

## 🚀 COMANDOS ESENCIALES

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev
# Acceder: http://localhost:3000

# Compilar para producción
npm run build

# Iniciar en producción
npm start

# Linter
npm run lint
```

### Base de Datos
```bash
# Ver base de datos visualmente
npx prisma studio

# Generar cliente después de cambios en schema
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_descriptivo
```

### Instalación de Dependencias
```bash
# Si falta algún paquete
npm install nombre-del-paquete
```

---

## 📝 FUNCIONALIDADES PRINCIPALES

### 1. Sistema de Usuarios
- [ ] Registro de clientes
- [ ] Login con email/contraseña
- [ ] Roles: Cliente y Administrador
- [ ] Recuperación de contraseña

### 2. Formulario de Constitución
- [x] Paso 1: Tipo de sociedad
- [x] Paso 2: Datos básicos
- [x] Paso 3: Representantes legales
- [x] Paso 4: CBU
- [ ] Paso 5: Socios
- [ ] Paso 6: Documentos
- [ ] Paso 7: Plan y pago
- [ ] Paso 8: Confirmación

### 3. Panel de Cliente
- [ ] Ver estado de trámites
- [ ] Descargar documentos
- [ ] Historial de pagos
- [ ] Notificaciones

### 4. Panel de Administrador
- [ ] Gestión de trámites
- [ ] Actualización de estados
- [ ] Carga de documentos generados
- [ ] Gestión de usuarios
- [ ] Reportes y estadísticas

### 5. Sistema de Documentos
- [ ] Carga de DNI (frente y dorso)
- [ ] Carga de estatutos
- [ ] Generación de documentos automáticos
- [ ] Descarga de documentos finales

### 6. Sistema de Pagos
- [ ] Integración Mercado Pago
- [ ] Selección de planes
- [ ] Registro de pagos
- [ ] Facturas automáticas

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Implementar Autenticación Real**
   - Conectar formulario con NextAuth
   - Eliminar usuario temporal
   - Proteger rutas del formulario

2. **Guardado Automático durante el llenado**
   - Guardar progreso cada X segundos
   - Recuperar formularios incompletos
   - Agregar indicador de "guardado automático"

3. **Sistema de Carga de Documentos**
   - Implementar upload de archivos (DNI, estatutos)
   - Integración con Cloudinary/UploadThing
   - Validación de tipos y tamaños de archivo
   - Preview de documentos

4. **Panel de Cliente**
   - Ver estado de trámites
   - Descargar documentos
   - Historial de pagos
   - Sistema de mensajería

5. **Integración de Pagos**
   - Mercado Pago SDK
   - Generación de preferencias de pago
   - Webhooks para confirmación
   - Registro de pagos en BD

---

## 📚 RECURSOS Y DOCUMENTACIÓN

### Oficiales
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Supabase:** https://supabase.com/docs

### Tutoriales Útiles
- Autenticación con NextAuth: https://next-auth.js.org/getting-started/example
- Upload de archivos: https://uploadthing.com/docs
- Mercado Pago SDK: https://www.mercadopago.com.ar/developers

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Error: "Module not found"
```bash
npm install
```

### Error de Prisma Client
```bash
npx prisma generate
```

### Puerto 3000 en uso
```bash
# Cambiar puerto en package.json
"dev": "next dev -p 3001"
```

### Base de datos desincronizada
```bash
npx prisma migrate reset
npx prisma migrate dev
```

---

## 📞 INFORMACIÓN DE CONTACTO

**Desarrollador:** Fernando  
**Proyecto:** QuieroMiSAS.com  
**Ubicación:** Córdoba, Argentina  
**Fecha de inicio:** Diciembre 2024

---

## 🔄 HISTORIAL DE CAMBIOS

### 13 Diciembre 2024 - TARDE
- ✅ **ARREGLADO SISTEMA DE GUARDADO COMPLETO**
- ✅ Corregida API route para usar modelos correctos de Prisma
- ✅ Implementado guardado de socios y administradores como JSON
- ✅ Agregado sistema de notificaciones
- ✅ Implementado historial de estados
- ✅ Agregado Toaster (Sonner) para feedback visual
- ✅ Mejorado manejo de errores y respuestas
- ✅ Sincronizada base de datos con Prisma
- 📄 Creado documento ARREGLOS-GUARDADO.md con detalles técnicos

### 13 Diciembre 2024 - MAÑANA
- ✅ Completados los 7 pasos del formulario
- ✅ Implementado Paso 5: Socios/Accionistas
- ✅ Implementado Paso 6: Administradores
- ✅ Implementado Paso 7: Cierre de ejercicio
- ✅ Implementado checkbox "Informar CBU más adelante" en Paso 4
- ✅ Validación de formato CBU (22 dígitos)
- 📄 Creado este documento de contexto completo

### 12 Diciembre 2024
- ✅ Completado Paso 3: Objeto Social y Domicilio
- ✅ Completado Paso 2: Nombre de la Sociedad

### 11 Diciembre 2024
- ✅ Completado Paso 1: Datos Personales y Plan
- ✅ Configuración inicial del proyecto
- ✅ Setup de Prisma y Supabase

---

## 💡 NOTAS IMPORTANTES

1. **Siempre hacer backup antes de cambios grandes**
2. **Probar en local antes de hacer deploy**
3. **No subir el archivo .env a Git**
4. **Documentar cambios importantes**
5. **Usar commits descriptivos en Git**

---

**Este documento debe actualizarse cada vez que se complete un paso o funcionalidad importante.**

