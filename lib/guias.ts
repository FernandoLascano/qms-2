/**
 * Guías paso a paso de Ciudadano Digital (CiDi) para clientes. Reemplazan a
 * las infografías en JPG (public/assets/img/CiudadanoDigital.jpeg e
 * InstructivoFirma.jpeg), que en el teléfono no se leían. El contenido sale
 * de esas mismas infografías; las capturas de cada paso son recortes de ellas
 * (public/assets/img/guias/).
 *
 * Para sumar un video: poner el id de YouTube en `videoYoutube` (la parte
 * después de «v=» en el link). Si está vacío, la sección del video no aparece.
 */

export interface PasoGuia {
  titulo: string
  texto: string
  /** Detalle en viñetas (campos a completar, etc.). */
  items?: string[]
  imagen?: { src: string; ancho: number; alto: number; alt: string }
  opcional?: boolean
}

export interface SeccionGuia {
  id: string
  titulo: string
  pasos: PasoGuia[]
}

export interface Guia {
  slug: string
  titulo: string
  bajada: string
  videoYoutube: string | null
  secciones: SeccionGuia[]
  /** Qué hacer al terminar. */
  cierre: string
}

const img = (archivo: string, ancho: number, alto: number, alt: string) => ({
  src: `/assets/img/guias/${archivo}`,
  ancho,
  alto,
  alt,
})

export const GUIA_CIUDADANO_DIGITAL: Guia = {
  slug: 'ciudadano-digital',
  titulo: 'Cómo obtener Ciudadano Digital Nivel 2',
  bajada:
    'Con Ciudadano Digital (CiDi) Nivel 2 firmás los documentos de tu sociedad desde el teléfono o la computadora, estés donde estés. Lo necesita cada socio y cada administrador.',
  videoYoutube: null,
  secciones: [
    {
      id: 'nivel-2',
      titulo: 'Obtener el nivel 2',
      pasos: [
        {
          titulo: 'Descargá la app',
          texto: 'Buscá «Ciudadano Digital Córdoba - CiDi» en App Store o Google Play e instalala en tu teléfono.',
          imagen: img('cidi-1-app.jpg', 175, 200, 'La app Ciudadano Digital Córdoba en la tienda'),
        },
        {
          titulo: 'Registrate o iniciá sesión',
          texto: 'Abrí la app y completá tus datos personales para crear tu cuenta. Si ya tenés una, ingresá con tu CUIL y tu contraseña.',
          imagen: img('cidi-2-registro.jpg', 130, 200, 'Pantalla de ingreso de Ciudadano Digital'),
        },
        {
          titulo: 'Validá tu identidad',
          texto: 'Para llegar al nivel 2, la app valida tu identidad: primero le sacás una foto a tu DNI y después te sacás una selfie, siguiendo las instrucciones de la pantalla.',
          imagen: img('cidi-3-validar.jpg', 130, 200, 'Validación de identidad con foto del DNI y selfie'),
        },
        {
          titulo: 'Listo: cuenta verificada nivel 2',
          texto: 'Cuando se valida tu identidad, la cuenta queda como «Nivel 2 – Cuenta verificada». Con eso ya podés firmar documentos digitalmente.',
          imagen: img('cidi-4-nivel2.jpg', 130, 190, 'Cuenta verificada nivel 2'),
        },
      ],
    },
    {
      id: 'pin',
      titulo: 'Obtener tu PIN',
      pasos: [
        {
          titulo: 'Iniciá sesión',
          texto: 'Abrí la app Ciudadano Digital e ingresá con tu CUIL y tu contraseña.',
          imagen: img('pin-1-sesion.jpg', 110, 148, 'Pantalla de ingreso'),
        },
        {
          titulo: 'Entrá a «Documentos»',
          texto: 'Una vez adentro, tocá la pestaña «Documentos» del menú de abajo.',
          imagen: img('pin-2-documentos.jpg', 105, 142, 'Pestaña Documentos en el menú inferior'),
        },
        {
          titulo: 'Buscá tu credencial digital',
          texto: 'En la parte de arriba vas a ver tu credencial digital.',
          imagen: img('pin-3-credencial.jpg', 108, 142, 'Credencial digital en la parte superior'),
        },
        {
          titulo: 'Anotá tu PIN',
          texto: 'A la derecha del carnet hay cuatro números en vertical: ese es tu PIN. Lo vas a necesitar para firmar.',
          imagen: img('pin-4-pin.jpg', 130, 140, 'Los cuatro números del PIN a la derecha del carnet'),
        },
      ],
    },
  ],
  cierre: 'Cuando lo tengas, avisanos desde tu panel con el botón «Ya tengo Ciudadano Digital Nivel 2».',
}

export const GUIA_FIRMA_CIDI: Guia = {
  slug: 'firma-ciudadano-digital',
  titulo: 'Cómo firmar un documento con Ciudadano Digital',
  bajada:
    'El estatuto (y, si querés, la declaración jurada de ARCA) se firma con Firma CiDi. Se hace desde una computadora y lleva unos minutos.',
  videoYoutube: null,
  secciones: [
    {
      id: 'firmar',
      titulo: 'Firmar el documento',
      pasos: [
        {
          titulo: 'Ingresá a Ciudadano Digital',
          texto: 'Desde una computadora, entrá a Ciudadano Digital (cidi.cba.gov.ar) con tu CUIL y tu contraseña.',
          imagen: img('firma-1-ingresar.jpg', 328, 265, 'Ingreso a Ciudadano Digital desde la computadora'),
        },
        {
          titulo: 'Entrá a «Firma CiDi»',
          texto: 'En el panel de la izquierda, hacé clic en la opción «Firma CiDi».',
          imagen: img('firma-2-menu.jpg', 190, 332, 'Opción Firma CiDi en el menú lateral'),
        },
        {
          titulo: 'Elegí «Nuevo Documento»',
          texto: 'Ya dentro de Firma CiDi, hacé clic en «Nuevo Documento».',
          imagen: img('firma-3-nuevo.jpg', 400, 362, 'Botón Nuevo Documento en Firma CiDi'),
        },
        {
          titulo: 'Completá y cargá el documento',
          texto: 'Completá los campos que te pide:',
          items: [
            'Nombre del documento: el mismo nombre que tiene el archivo.',
            'Contenido: arrastrá el PDF desde tu computadora (el que descargaste de tu panel).',
            'PIN CiDi: tus 4 números (si no lo sabés, mirá la guía de Ciudadano Digital).',
          ],
          imagen: img('firma-4-completar.jpg', 365, 250, 'Formulario para subir el documento a firmar'),
        },
        {
          titulo: 'Firma de otras personas',
          texto:
            'Si el documento lo tienen que firmar dos o más personas, cargá el CUIL o CUIT de cada una en «Solicitar firma a terceros». A cada una le llega un aviso para firmarlo desde su propia cuenta de Ciudadano Digital.',
          opcional: true,
        },
        {
          titulo: 'Subí el documento y validá',
          texto: 'Hacé clic en «Subir documento». Te llega un mensaje de texto al celular con un código: escribilo para confirmar.',
          imagen: img('firma-6-codigo.jpg', 148, 200, 'Código de validación por mensaje de texto'),
        },
        {
          titulo: 'Descargá el PDF firmado',
          texto: 'Cuando termina el proceso, el documento firmado aparece en «Documentos creados por mí». Descargalo en PDF.',
          imagen: img('firma-7-descargar.jpg', 265, 128, 'Documento firmado en Documentos creados por mí'),
        },
      ],
    },
  ],
  cierre: 'Subí el PDF firmado en tu panel de QuieroMiSAS, en el documento que corresponde.',
}

export const GUIAS = [GUIA_CIUDADANO_DIGITAL, GUIA_FIRMA_CIDI]
