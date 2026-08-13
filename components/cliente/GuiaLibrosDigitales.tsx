'use client'

import { useState, type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react'

// Contenido basado en el instructivo de QuieroMiSAS (fuente: IPJ Córdoba).

function Importante({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 my-3">
      <p className="text-xs font-bold text-amber-900 mb-1">IMPORTANTE</p>
      <div className="text-sm text-amber-900 space-y-1">{children}</div>
    </div>
  )
}

const PASOS: { titulo: string; contenido: ReactNode }[] = [
  {
    titulo: 'Marco normativo y obligatoriedad',
    contenido: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Los libros digitales son un sistema de asiento de actas a través de medios electrónicos, para que las entidades
          lleven el registro de sus libros sociales y contables de manera digital. Tienen la <strong>misma validez legal</strong> que
          un libro en papel.
        </p>
        <p>
          Permiten a los representantes legales acceder a los libros sociales desde cualquier dispositivo, en cualquier lugar,
          las 24 horas y de manera gratuita. Los libros de las entidades inscriptas en IPJ con sede en Córdoba se gestionan a
          través del <strong>Portal de Trámites de la Inspección de Personas Jurídicas</strong>.
        </p>
        <p>
          Para las <strong>Sociedades por Acciones Simplificadas (SAS)</strong>, los libros digitales son obligatorios desde el
          <strong> 28/08/2018</strong>, conforme lo establece la Ley 27.349, art. 58.
        </p>
      </div>
    )
  },
  {
    titulo: 'Acceso a los Libros Digitales',
    contenido: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          <strong>¿Quién puede acceder?</strong> Para iniciar los libros digitales, la máxima autoridad de la entidad —en las SAS,
          el <strong>Administrador Titular</strong>— debe vincularse como <strong>Representante Legal</strong> de la entidad en
          Ciudadano Digital (CiDi). Luego puede delegar ese servicio a un tercero si lo desea.
        </p>
        <p>
          <strong>¿Cómo designarme Representante Legal en CiDi?</strong> Descargá la aplicación móvil de Ciudadano Digital y
          completá el registro y la validación hasta obtener como mínimo <strong>Nivel 2 de seguridad</strong>. Después verificá
          que en la sección <em>“Mis Representados”</em> figure tu Sociedad.
        </p>
        <p>
          Si no aparece, mirá este video para hacer la vinculación:{' '}
          <a href="https://www.youtube.com/watch?v=O_63UQyEZIs" target="_blank" rel="noopener noreferrer" className="text-brand-700 font-medium underline">
            ver video de vinculación
          </a>.
        </p>
        <p>
          Como los libros sociales son privados, solo pueden acceder quienes estén vinculados como Representante Legal en CiDi, o
          un tercero con el servicio de IPJ delegado. <strong>Ni IPJ ni QuieroMiSAS tienen acceso a los libros sociales de tu
          Sociedad.</strong>
        </p>
        <p className="font-medium text-gray-900">Pasos en el Portal de Trámites (logueado con tu clave CiDi Nivel 2):</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Seleccioná la opción <strong>Registro Público</strong>.</li>
          <li>Seleccioná <strong>Libros Digitales</strong>.</li>
          <li>Presioná <strong>Iniciar</strong>.</li>
          <li>Identificá la Sociedad buscándola por <strong>CUIT</strong> y presioná <strong>Buscar</strong>.</li>
          <li>Seleccioná la Sociedad correcta con el botón <strong>Iniciar</strong>.</li>
        </ol>
      </div>
    )
  },
  {
    titulo: 'Carga de actas',
    contenido: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          <strong>Habilitación:</strong> cada libro queda habilitado cuando se adjunta el primer documento, y la fecha de
          habilitación será la de ese primer documento. Se recomienda adjuntar primero la <strong>resolución de inscripción</strong>
          para dejar cada libro habilitado. Para habilitar todos los libros, adjuntá un archivo a cada uno.
        </p>
        <p>
          La fecha del acta o asiento <strong>no puede ser anterior</strong> a la fecha de habilitación del libro. Si lo fuera, se
          considera un <em>“acta volante”</em> y no es válida para su fiscalización e inscripción en IPJ.
        </p>
        <Importante>
          <ul className="list-disc ml-4 space-y-1">
            <li>Todos los archivos deben adjuntarse en formato <strong>PDF</strong>.</li>
            <li>La redacción, numeración, diseño y periodicidad quedan a consideración de la entidad.</li>
            <li>Verificá las exigencias de firmas: las actas deben adjuntarse <strong>ya firmadas</strong>.</li>
            <li>Tamaño máximo por archivo: <strong>150 MB</strong>.</li>
            <li>El nombre del archivo no puede superar los <strong>20 caracteres</strong>.</li>
            <li>Los documentos deben estar <strong>escaneados</strong> (no fotos), prolijos y legibles, sin sombras, manchas ni objetos.</li>
          </ul>
        </Importante>
        <p>
          Dentro de los Libros de la Sociedad vas a ver una grilla con los libros obligatorios. La columna <strong>Nuevo</strong>
          muestra la cantidad de documentos subidos. El botón <strong>Agregar Libro</strong> permite crear un libro nuevo (con
          nombre único); <strong>Historial</strong> muestra los documentos ya cargados; y <strong>Adjuntar</strong> permite cargar un
          documento indicando su <strong>fecha de registro</strong> (la fecha en que fue emitido).
        </p>
        <p>
          Con <strong>Ver</strong> visualizás el documento y con <strong>Eliminar</strong> lo borrás — pero no se puede eliminar una
          vez finalizada la subida. Al presionar <strong>Finalizar</strong>, los documentos se asocian al CUIT de la sociedad y se
          cierra el portal.
        </p>
        <Importante>
          <p>Una vez finalizada la carga, no se podrá eliminar ni alterar el documento (queda vinculado al CUIT de la Sociedad). Para agregar otros documentos, deberás iniciar un nuevo trámite en el Portal.</p>
        </Importante>
      </div>
    )
  },
  {
    titulo: 'Consulta de Libros Digitales',
    contenido: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          La consulta permite <strong>descargar un comprobante</strong> de las actas o asientos ya adjuntados. Al descargar, el
          sistema genera un PDF llamado <strong>“Comprobante de Documentación Digital”</strong> que garantiza que el acta está
          correctamente inserta en el libro social. Se genera un comprobante por cada libro consultado, y podés generar los que
          necesites.
        </p>
        <Importante>
          <p>No imprimas, escanees ni alteres el comprobante: si se modifica, pierde validez y se imposibilita el estudio del acta que contiene.</p>
        </Importante>
        <p>
          <strong>¿Quién puede consultar?</strong> Solo el Representante Legal de la Sociedad o un tercero con el servicio de IPJ
          delegado en CiDi.
        </p>
        <p className="font-medium text-gray-900">Pasos:</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Ingresá al Portal de Trámites de IPJ y logueate con tu clave CiDi Nivel 2.</li>
          <li>Seleccioná <strong>Registro Público</strong> → <strong>Consulta Libros Digitales</strong> → <strong>Iniciar</strong>.</li>
          <li>Ingresá el <strong>CUIT</strong>, presioná <strong>Buscar</strong> y luego <strong>Iniciar</strong> en la sociedad.</li>
          <li>Entrá al libro con <strong>Historial</strong>, mirá los documentos con <strong>Ver</strong>, tildá los que quieras y presioná <strong>Descargar</strong>.</li>
        </ol>
        <p>
          Abrí el comprobante con <strong>Adobe Acrobat Reader de escritorio</strong> (no desde Google Chrome): en el margen vas a
          ver un ícono de <em>“clip”</em> donde podés consultar el documento adjunto.
        </p>
        <Importante>
          <p>Si el acta tiene órdenes del día de carácter registral, deberás gestionar su inscripción ante la IPJ. Desde QuieroMiSAS estamos para ayudarte y asesorarte al respecto.</p>
        </Importante>
      </div>
    )
  }
]

export default function GuiaLibrosDigitales() {
  const [abierto, setAbierto] = useState<number | null>(0)
  const [leidos, setLeidos] = useState<Record<number, boolean>>({})

  const toggle = (i: number) => {
    setAbierto((prev) => (prev === i ? null : i))
    setLeidos((prev) => ({ ...prev, [i]: true }))
  }

  const completados = Object.values(leidos).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-brand-50 border border-brand-100 p-3">
        <p className="text-sm text-brand-900">Guía paso a paso para usar los Libros Digitales de tu sociedad.</p>
        <span className="text-xs font-medium text-brand-700 whitespace-nowrap">{completados}/{PASOS.length} vistos</span>
      </div>

      <div className="space-y-2">
        {PASOS.map((paso, i) => {
          const estaAbierto = abierto === i
          return (
            <Card key={i} className="overflow-hidden">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition"
              >
                {leidos[i] ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                )}
                <span className="flex-1 font-medium text-gray-900">
                  <span className="text-brand-700 mr-2">{i + 1}.</span>
                  {paso.titulo}
                </span>
                {estaAbierto ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {estaAbierto && <div className="border-t border-gray-100 p-4 pt-3">{paso.contenido}</div>}
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 text-center pt-2">
        Fuente: Inspección de Personas Jurídicas de Córdoba (ipj.cba.gov.ar). Guía orientativa de QuieroMiSAS.
      </p>
    </div>
  )
}
