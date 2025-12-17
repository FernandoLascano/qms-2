# 🎨 Actualización de Paleta de Colores - QuieroMiSAS

## ✅ Cambios Completados

Se actualizó toda la paleta de colores del sitio de azul a bordo/rojo.

### **Colores Principales:**

**ANTES (Azul):**
- `blue-50`: `#eff6ff`
- `blue-600`: `#2563eb`  
- `blue-700`: `#1d4ed8`
- `blue-800`: `#1e40af`

**DESPUÉS (Bordo/Rojo):**
- `red-50`: `#fef2f2`
- `red-700`: `#b91c1c` (similar al #DB1414 del logo)
- `red-800`: `#991b1b`
- `red-900`: `#7f1d1d`

---

## 📄 Archivos Actualizados:

### **Página Principal:**
- ✅ `app/page.tsx` - Hero, Beneficios, Pasos, CTAs, Footer

### **Componentes Landing:**
- ✅ `components/landing/FAQ.tsx` - Acordeones, botones
- ✅ `components/landing/Planes.tsx` - Cards de planes, destacados
- ✅ `components/landing/Testimonios.tsx` - Avatares, estadísticas
- ✅ `components/landing/QueEsSAS.tsx` - Iconos, banners
- ✅ `components/landing/Comparativa.tsx` - Tabla, highlights
- ✅ `components/landing/Notas.tsx` - Tags, links

---

## 🖼️ Recursos Gráficos Disponibles:

Hay 2 ilustraciones SVG listas para integrar:
- `public/assets/img/head2.svg` - Ilustración de contrato/documentos
- `public/assets/img/head3.svg` - (revisar contenido)

### **Sugerencias de Uso:**

1. **Hero Section:** Agregar ilustración a la derecha del texto principal
2. **Sección "¿Qué es una S.A.S.?":** Ilustración de apoyo
3. **Sección "Cómo Funciona":** Acompañar los pasos

---

## 🎨 Paleta de Colores Completa:

```css
/* Rojo Principal (del logo) */
--brand-red: #DB1414;

/* Tailwind Red Palette (usada en el sitio) */
--red-50: #fef2f2;
--red-100: #fee2e2;
--red-200: #fecaca;
--red-300: #fca5a5;
--red-400: #f87171;
--red-500: #ef4444;
--red-600: #dc2626;
--red-700: #b91c1c; /* ← Principal */
--red-800: #991b1b; /* ← Hover/Oscuro */
--red-900: #7f1d1d; /* ← Muy oscuro */

/* Colores de Soporte (sin cambios) */
--green-500: #10b981; /* Checkmarks, confianza */
--green-600: #059669;

--purple-50: #faf5ff;
--purple-600: #9333ea;

--orange-50: #fff7ed;
--orange-600: #ea580c;

--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-600: #4b5563;
--gray-900: #111827;
```

---

## 📝 Cambios Específicos por Sección:

### **Hero:**
- Fondo: `from-red-50`
- Título destacado: `text-red-700`
- CTA principal: `bg-red-700 hover:bg-red-800`
- CTA secundario: `border-red-700 text-red-700 hover:bg-red-50`

### **Beneficios:**
- Card 1 (Rápido): `bg-red-50` con icono `bg-red-700`
- Otros beneficios mantienen sus colores (verde, púrpura, naranja)

### **Pasos:**
- Números: `bg-red-700 text-white`
- Fondo sección: `from-white to-red-50`

### **Planes:**
- Destacado: `border-red-700`, badge `bg-red-700`
- Precio destacado: `text-red-700`
- Checks: `text-red-700`
- CTA: `bg-red-700 hover:bg-red-800`

### **FAQ:**
- Hover: `hover:bg-red-50`
- Borde hover: `hover:border-red-300`
- CTA: `bg-red-700 hover:bg-red-800`

### **Comparativa:**
- Header S.A.S.: `bg-red-700`
- Celdas S.A.S.: `bg-red-50`
- Checks: `text-red-700`

### **Testimonios:**
- Avatares: `bg-red-700`
- Empresa link: `text-red-700`
- Estadísticas: `text-red-700`

### **Notas:**
- Categoría tag: `text-red-700 bg-red-50`
- Hover título: `hover:text-red-700`
- Link: `text-red-700`
- CTA: `border-red-700 text-red-700 hover:bg-red-50`

### **CTA Final:**
- Fondo: `from-red-700 to-red-900`
- CTA principal: `bg-white text-red-700`
- CTA secundario: `border-white hover:text-red-700`

### **Footer:**
- Logo: `bg-red-700`

---

## ✅ Resultado:

**Consistencia de marca:** Ahora el sitio usa los colores corporativos (bordo/rojo) en lugar de azul.

**Coherencia visual:** Todas las secciones usan la misma paleta.

**Mejor identidad:** El sitio refleja los colores del logo QuieroMiSAS.

---

## 🚀 Próximos Pasos Opcionales:

1. **Integrar las ilustraciones SVG** en Hero y secciones clave
2. **Revisar otros componentes del dashboard** para consistencia
3. **Actualizar el favicon** para que use los colores bordo
4. **Crear una librería de componentes** con los colores definidos

---

**🎨 Paleta actualizada y lista!**

