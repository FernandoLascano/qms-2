// Validaciones de formato de los datos del trámite (DNI, CUIT/CUIL, CBU, email,
// teléfono, denominación). Son funciones puras: las usan el wizard del cliente
// (para no dejar avanzar de paso) y la API (para no guardar datos inválidos).
// Cada una devuelve null si el valor es válido o el mensaje de error si no.

// Saca puntos, guiones y espacios: el cliente suele pegar "20-12345678-9".
export function soloDigitos(valor: string | null | undefined): string {
  return String(valor ?? '').replace(/[.\-\s]/g, '')
}

export function validarDni(valor: string | null | undefined): string | null {
  const dni = soloDigitos(valor)
  if (!dni) return 'El DNI es obligatorio'
  if (!/^\d{7,8}$/.test(dni)) return 'El DNI tiene que tener 7 u 8 dígitos, sin puntos'
  return null
}

// CUIT/CUIL: 11 dígitos y el último es el verificador (módulo 11).
export function cuitValido(valor: string | null | undefined): boolean {
  const cuit = soloDigitos(valor)
  if (!/^\d{11}$/.test(cuit)) return false
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const suma = pesos.reduce((acc, peso, i) => acc + peso * Number(cuit[i]), 0)
  const resto = 11 - (suma % 11)
  const verificador = resto === 11 ? 0 : resto
  // Resto 10 no es un dígito: ese número no puede ser un CUIT válido
  if (verificador === 10) return false
  return verificador === Number(cuit[10])
}

export function validarCuit(valor: string | null | undefined): string | null {
  const cuit = soloDigitos(valor)
  if (!cuit) return 'El CUIT/CUIL es obligatorio'
  if (!/^\d{11}$/.test(cuit)) return 'El CUIT/CUIL tiene que tener 11 dígitos, sin guiones'
  if (!cuitValido(cuit)) return 'El CUIT/CUIL no es válido: revisá que esté bien escrito'
  return null
}

// CBU/CVU: 22 dígitos en dos bloques (8 + 14), cada uno con su dígito verificador.
function bloqueCbuValido(bloque: string, pesos: number[]): boolean {
  const cuerpo = bloque.slice(0, -1)
  const suma = cuerpo.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i % pesos.length], 0)
  const verificador = (10 - (suma % 10)) % 10
  return verificador === Number(bloque[bloque.length - 1])
}

export function cbuValido(valor: string | null | undefined): boolean {
  const cbu = soloDigitos(valor)
  if (!/^\d{22}$/.test(cbu)) return false
  // Todo ceros pasa la cuenta de los verificadores pero no es una cuenta real
  if (/^0+$/.test(cbu)) return false
  return (
    bloqueCbuValido(cbu.slice(0, 8), [7, 1, 3, 9]) &&
    bloqueCbuValido(cbu.slice(8), [3, 9, 7, 1])
  )
}

export function validarCbu(valor: string | null | undefined): string | null {
  const cbu = soloDigitos(valor)
  if (!cbu) return 'El CBU es obligatorio'
  if (!/^\d{22}$/.test(cbu)) return 'El CBU tiene que tener exactamente 22 dígitos'
  if (!cbuValido(cbu)) return 'El CBU no es válido: revisá que esté bien copiado'
  return null
}

export function validarEmail(valor: string | null | undefined): string | null {
  const email = String(valor ?? '').trim()
  if (!email) return 'El email es obligatorio'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Ingresá un email válido (por ejemplo, nombre@gmail.com)'
  return null
}

// Teléfono: se aceptan +, espacios, guiones y paréntesis; cuentan los dígitos.
export function validarTelefono(valor: string | null | undefined): string | null {
  const telefono = String(valor ?? '').trim()
  if (!telefono) return 'El teléfono es obligatorio'
  const digitos = telefono.replace(/\D/g, '')
  if (!/^[\d\s\-+()]+$/.test(telefono) || digitos.length < 8 || digitos.length > 15) {
    return 'Ingresá un teléfono válido, con código de área'
  }
  return null
}

export const DENOMINACION_MIN_CARACTERES = 3

export function validarDenominacion(valor: string | null | undefined): string | null {
  const denominacion = String(valor ?? '').trim()
  if (!denominacion) return 'La denominación es obligatoria'
  // Sin contar el "SAS" del final, tiene que quedar un nombre de verdad
  const nombre = denominacion.replace(/\s*S\.?\s*A\.?\s*S\.?\s*$/i, '').trim()
  if (nombre.replace(/[^\p{L}\p{N}]/gu, '').length < DENOMINACION_MIN_CARACTERES) {
    return `La denominación tiene que tener al menos ${DENOMINACION_MIN_CARACTERES} letras (sin contar «SAS»)`
  }
  return null
}

// Valida todo el formulario del trámite (el mismo cuerpo que manda el wizard)
// y devuelve la lista de errores de formato, con el campo al que corresponden.
// Los campos vacíos los controla aparte la validación de obligatorios.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function erroresFormatoTramite(data: any): string[] {
  const errores: string[] = []
  const agregar = (campo: string, error: string | null) => {
    if (error) errores.push(`${campo}: ${error}`)
  }
  const siHay = (valor: unknown) => String(valor ?? '').trim() !== ''

  if (siHay(data.dni)) agregar('DNI del solicitante', validarDni(data.dni))
  if (siHay(data.telefono)) agregar('Teléfono', validarTelefono(data.telefono))
  if (siHay(data.email)) agregar('Email', validarEmail(data.email))

  ;['denominacion1', 'denominacion2', 'denominacion3'].forEach((campo, i) => {
    if (siHay(data[campo])) agregar(`Denominación opción ${i + 1}`, validarDenominacion(data[campo]))
  })

  // "INFORMAR_LUEGO" es la opción de cargar los CBU más adelante
  ;['cbuPrincipal', 'cbuSecundario'].forEach((campo) => {
    const valor = data[campo]
    if (siHay(valor) && valor !== 'INFORMAR_LUEGO') {
      agregar(campo === 'cbuPrincipal' ? 'CBU principal' : 'CBU secundario', validarCbu(valor))
    }
  })

  const personas: Array<[string, unknown]> = [
    ['socio', data.socios],
    ['administrador', data.administradores],
  ]
  personas.forEach(([rol, lista]) => {
    if (!Array.isArray(lista)) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lista.forEach((p: any, i: number) => {
      if (siHay(p?.dni)) agregar(`DNI del ${rol} ${i + 1}`, validarDni(p.dni))
      if (siHay(p?.cuit)) agregar(`CUIT/CUIL del ${rol} ${i + 1}`, validarCuit(p.cuit))
    })
  })

  if (siHay(data.fechaCierre)) agregar('Fecha de cierre', validarFechaCierre(data.fechaCierre))

  // Con el objeto pre-aprobado igual pedimos a qué se va a dedicar la sociedad
  if (data.objetoSocial !== 'PERSONALIZADO') {
    agregar('Actividad principal', validarActividadPrincipal(data.actividadPrincipal))
  }

  return errores
}

// Con el objeto pre-aprobado (que abarca muchas actividades) el cliente igual
// tiene que contar a qué se va a dedicar la sociedad en concreto.
export const ACTIVIDAD_PRINCIPAL_MIN_CARACTERES = 30

export function validarActividadPrincipal(valor: string | null | undefined): string | null {
  const texto = String(valor ?? '').trim()
  if (!texto) return 'Contanos cuál va a ser la actividad principal de la sociedad'
  if (texto.length < ACTIVIDAD_PRINCIPAL_MIN_CARACTERES) {
    return `Contanos un poco más sobre la actividad principal (al menos ${ACTIVIDAD_PRINCIPAL_MIN_CARACTERES} caracteres)`
  }
  return null
}

// Fecha de cierre de ejercicio en formato dd-mm, con día y mes reales.
export function validarFechaCierre(valor: string | null | undefined): string | null {
  const fecha = String(valor ?? '').trim()
  if (!fecha) return 'La fecha de cierre de ejercicio es obligatoria'
  const m = /^(\d{1,2})[-/](\d{1,2})$/.exec(fecha)
  if (!m) return 'Usá el formato día-mes, por ejemplo 31-12'
  const dia = Number(m[1])
  const mes = Number(m[2])
  const diasPorMes = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (mes < 1 || mes > 12 || dia < 1 || dia > diasPorMes[mes - 1]) {
    return 'La fecha de cierre no existe: revisá el día y el mes'
  }
  return null
}
