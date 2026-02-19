# Guía de Paleta de Colores - Rebranding

## Cambiar el color de marca

Para cambiar toda la paleta de colores del sitio (ej: de rojo a verde, azul, etc.), editá **un solo archivo**:

**`app/globals.css`** — en la sección `:root`:

```css
:root {
  /* Brand (color principal) - Cambiá estos valores */
  --brand-50: #fef2f2;   /* Muy claro - fondos sutiles */
  --brand-100: #fee2e2;  /* Claro - badges, hover */
  --brand-200: #fecaca;  /* Bordes claros */
  --brand-300: #fca5a5;  /* Bordes focus */
  --brand-400: #f87171;  /* Acentos suaves */
  --brand-500: #dc3d42;  /* Intermedio */
  --brand-600: #b0242b;  /* Principal - botones, links */
  --brand-700: #991D23;  /* Logo - color principal */
  --brand-800: #7a181d;  /* Más oscuro */
  --brand-900: #7f1d1d;  /* Muy oscuro - títulos */
}
```

## Ejemplos de paletas

### Verde (ej: #059669)
```css
--brand-50: #ecfdf5;
--brand-100: #d1fae5;
--brand-200: #a7f3d0;
--brand-300: #6ee7b7;
--brand-400: #34d399;
--brand-500: #10b981;
--brand-600: #059669;
--brand-700: #047857;
--brand-800: #065f46;
--brand-900: #064e3b;
```

### Azul (ej: #2563eb)
```css
--brand-50: #eff6ff;
--brand-100: #dbeafe;
--brand-200: #bfdbfe;
--brand-300: #93c5fd;
--brand-400: #60a5fa;
--brand-500: #3b82f6;
--brand-600: #2563eb;
--brand-700: #1d4ed8;
--brand-800: #1e40af;
--brand-900: #1e3a8a;
```

### Naranja (ej: #ea580c)
```css
--brand-50: #fff7ed;
--brand-100: #ffedd5;
--brand-200: #fed7aa;
--brand-300: #fdba74;
--brand-400: #fb923c;
--brand-500: #f97316;
--brand-600: #ea580c;
--brand-700: #c2410c;
--brand-800: #9a3412;
--brand-900: #7c2d12;
```

## Uso en el código

El proyecto usa clases `brand-*` en lugar de `red-*`:

- `bg-brand-700` — fondos de botones
- `text-brand-700` — texto de acento
- `border-brand-200` — bordes
- `hover:bg-brand-800` — hover
- `focus:ring-brand-500` — focus

**No uses** `red-*` para colores de marca. Solo `brand-*` permite el rebranding centralizado.

## Emails (lib/emails/templates.tsx)

Los emails HTML no soportan CSS variables. Si cambiás la paleta en `globals.css`, actualizá también los valores hex en `lib/emails/templates.tsx` (primary, primaryDark, primaryLight, accent, error, errorBg) para mantener consistencia.

## Colores semánticos (sin cambios)

Estos colores se usan para estados y **no** cambian con el rebranding:

- **Verde** (`green-*`): éxito, checkmarks, completado
- **Naranja** (`orange-*`): alertas, advertencias
- **Gris** (`gray-*`): texto, fondos neutros
