import { login } from './lib.mjs'
for (const rol of ['admin', 'cliente']) { await login(rol); console.log(`sesión ${rol} guardada`) }
