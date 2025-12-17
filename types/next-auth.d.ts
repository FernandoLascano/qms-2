import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      rol: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    rol: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    rol: string
  }
}
```

---

### 2. Crear `lib/auth.ts`

En la carpeta `lib`, crea el archivo `auth.ts` y copia el contenido del artifact **"lib/auth.ts - Configuración de NextAuth"**

---

### 3. Crear las rutas de API

**a) Crear la ruta de NextAuth:**

1. Dentro de `app/api/auth/`, crea una carpeta llamada `[...nextauth]`
2. Dentro de esa carpeta, crea `route.ts`
3. Copia el contenido del artifact **"app/api/auth/[...nextauth]/route.ts"**

**b) Crear la ruta de registro:**

1. Dentro de `app/api/auth/`, crea una carpeta llamada `registro`
2. Dentro de esa carpeta, crea `route.ts`
3. Copia el contenido del artifact **"app/api/auth/registro/route.ts"**

---

### 4. Crear las páginas de Login y Registro

**a) Página de Login:**

1. Dentro de `app/(auth)/login/`, crea el archivo `page.tsx`
2. Copia el contenido del artifact **"app/(auth)/login/page.tsx"**

**b) Página de Registro:**

1. Dentro de `app/(auth)/registro/`, crea el archivo `page.tsx`
2. Copia el contenido del artifact **"app/(auth)/registro/page.tsx"**

---

## 📂 Estructura Final

Tu proyecto debería verse así:
```
qms-v2/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx ✅
│   │   └── registro/
│   │       └── page.tsx ✅
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/
│   │       │   └── route.ts ✅
│   │       └── registro/
│   │           └── route.ts ✅
│   └── page.tsx
├── lib/
│   ├── auth.ts ✅
│   ├── prisma.ts
│   └── utils.ts
├── types/
│   └── next-auth.d.ts ✅