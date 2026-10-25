/**
 * Guías paso a paso de Ciudadano Digital (CiDi) para clientes. Reemplazan a
 * las infografías en JPG (public/assets/img/CiudadanoDigital.jpeg e
 * InstructivoFirma.jpeg), que en el teléfono no se leían. Las capturas de cada
 * paso (public/assets/img/guias/*.webp) son pantallas reales con los datos
 * tapados, renderizadas con la composición «Captura» de ~/proyectos/qms-videos.
 *
 * Videos: propios, sin YouTube. El MP4 vive en el bucket público de Supabase
 * (assets-publicos/videos/guias) y el póster y los subtítulos en
 * public/videos/guias. Se arman con Remotion en ~/proyectos/qms-videos.
 * Si `video` es null, la sección del video no aparece.
 */

import type { VideoGuia } from '@/components/guias/ReproductorVideo'

const VIDEOS = 'https://zeufpoxrkfqykwelqvxb.supabase.co/storage/v1/object/public/assets-publicos/videos/guias'

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
  video: VideoGuia | null
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
  video: {
    src: `${VIDEOS}/ciudadano-digital-v1.mp4`,
    poster: '/videos/guias/ciudadano-digital-poster.jpg',
    subtitulos: '/videos/guias/ciudadano-digital.vtt',
    duracion: 88,
  },
  secciones: [
    {
      id: 'nivel-2',
      titulo: 'Obtener el nivel 2',
      pasos: [
        {
          titulo: 'Descargá la app',
          texto: 'Buscá «Ciudadano Digital Córdoba - CiDi» en App Store o Google Play e instalala en tu teléfono.',
          imagen: img('cidi-1-app.webp', 440, 845, 'La app Ciudadano Digital Córdoba en la tienda'),
        },
        {
          titulo: 'Registrate o iniciá sesión',
          texto: 'Abrí la app y completá tus datos personales para crear tu cuenta. Si ya tenés una, ingresá con tu CUIL y tu contraseña.',
          imagen: img('cidi-2-registro.webp', 440, 845, 'Pantalla de ingreso de Ciudadano Digital'),
        },
        {
          titulo: 'Validá tu identidad',
          texto: 'Para llegar al nivel 2, la app valida tu identidad: primero le sacás una foto a tu DNI y después te sacás una selfie, siguiendo las instrucciones de la pantalla.',
          imagen: img('cidi-3-validar.webp', 440, 845, 'Validación de identidad: selfie'),
        },
        {
          titulo: 'Listo: cuenta verificada nivel 2',
          texto: 'Cuando se valida tu identidad, la cuenta queda como «Nivel 2 – Cuenta verificada». Con eso ya podés firmar documentos digitalmente.',
          imagen: img('cidi-4-nivel2.webp', 440, 845, 'Cuenta verificada nivel 2'),
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
          imagen: img('pin-1-sesion.webp', 440, 845, 'Pantalla de ingreso'),
        },
        {
          titulo: 'Entrá a «Documentos»',
          texto: 'Una vez adentro, tocá la pestaña «Documentos» del menú de abajo.',
          imagen: img('pin-2-documentos.webp', 440, 845, 'Pestaña Documentos en el menú inferior'),
        },
        {
          titulo: 'Buscá tu credencial digital',
          texto: 'En la parte de arriba vas a ver tu credencial digital. Tocala para abrirla.',
          imagen: img('pin-3-credencial.webp', 440, 845, 'Credencial digital en la parte superior'),
        },
        {
          titulo: 'Anotá tu PIN',
          texto: 'Tocá la credencial para abrir la «Credencial virtual» y bajá hasta el campo «Pin»: son cuatro números. También aparecen en vertical a la derecha del carnet. Lo vas a necesitar para firmar.',
          imagen: img('pin-4-pin.webp', 440, 845, 'Campo Pin en la credencial virtual'),
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
  video: {
    src: `${VIDEOS}/firma-ciudadano-digital-v1.mp4`,
    poster: '/videos/guias/firma-ciudadano-digital-poster.jpg',
    subtitulos: '/videos/guias/firma-ciudadano-digital.vtt',
    duracion: 89,
  },
  secciones: [
    {
      id: 'firmar',
      titulo: 'Firmar el documento',
      pasos: [
        {
          titulo: 'Ingresá a Ciudadano Digital',
          texto: 'Desde una computadora, entrá a Ciudadano Digital (cidi.cba.gov.ar) con tu CUIL y tu contraseña.',
          imagen: img('firma-1-ingresar.webp', 1100, 768, 'Ingreso a Ciudadano Digital desde la computadora'),
        },
        {
          titulo: 'Entrá a «Firma CiDi»',
          texto: 'En el panel de la izquierda, hacé clic en la opción «Firma CiDi».',
          imagen: img('firma-2-menu.webp', 1100, 768, 'Opción Firma CiDi en el menú lateral'),
        },
        {
          titulo: 'Elegí «Nuevo Documento»',
          texto: 'Ya dentro de Firma CiDi, hacé clic en «Nuevo Documento».',
          imagen: img('firma-3-nuevo.webp', 1100, 768, 'Botón Nuevo Documento en Firma CiDi'),
        },
        {
          titulo: 'Completá y cargá el documento',
          texto: 'Completá los campos que te pide:',
          items: [
            'Nombre del documento: el mismo nombre que tiene el archivo.',
            'Contenido: arrastrá el PDF desde tu computadora (el que descargaste de tu panel).',
            'PIN CiDi: tus 4 números (si no lo sabés, mirá la guía de Ciudadano Digital).',
          ],
          imagen: img('firma-4-completar.webp', 1100, 768, 'Formulario para subir el documento a firmar'),
        },
        {
          titulo: 'Firma de otras personas',
          texto:
            'Si el documento lo tienen que firmar dos o más personas, cargá el CUIL o CUIT de cada una en «Solicitar firma a terceros». A cada una le llega un aviso para firmarlo desde su propia cuenta de Ciudadano Digital.',
          imagen: img('firma-5-terceros.webp', 1100, 768, 'Sección Solicitar firma a terceros'),
          opcional: true,
        },
        {
          titulo: 'Subí el documento y validá',
          texto: 'Hacé clic en «Subir documento» y confirmá. Tocá «Enviar código»: te llega un mensaje de texto al celular con seis números. Escribilos y hacé clic en «Validar código».',
          imagen: img('firma-6-codigo.webp', 1100, 768, 'Ingreso del código de seis dígitos recibido por SMS'),
        },
        {
          titulo: 'Descargá el PDF firmado',
          texto: 'Cuando termina el proceso, el documento firmado aparece en «Documentos creados por mí». Descargalo en PDF.',
          imagen: img('firma-7-descargar.webp', 1100, 768, 'Documento firmado en Documentos creados por mí'),
        },
      ],
    },
  ],
  cierre: 'Subí el PDF firmado en tu panel de QuieroMiSAS, en el documento que corresponde.',
}

export const GUIAS = [GUIA_CIUDADANO_DIGITAL, GUIA_FIRMA_CIDI]
