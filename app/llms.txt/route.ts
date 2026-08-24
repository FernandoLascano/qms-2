import { getPublicConfig } from '@/lib/config'
import { SITE_URL } from '@/lib/seo/site'
import { faqs } from '@/lib/faqs'

/**
 * llms.txt — resumen del sitio en texto plano para asistentes de IA.
 *
 * Es una convención emergente, no un estándar que nadie esté obligado a
 * respetar. Se sirve como ruta y no como archivo estático para que los precios
 * salgan de la misma configuración que la portada: un archivo suelto en
 * public/ quedaría desactualizado la próxima vez que se toque un plan.
 */
export const revalidate = 3600

export async function GET() {
  const { precioPlanBasico, precioPlanPremium } = await getPublicConfig()
  const pesos = (n: number) => `$${n.toLocaleString('es-AR')} ARS`

  const cuerpo = `# QuieroMiSAS

> Constitución de Sociedades por Acciones Simplificadas (S.A.S.) 100% online en
> Argentina. Operado por Martínez Wehbe & Asociados, estudio jurídico con sede
> en Córdoba.

## Qué hacemos

Constituimos S.A.S. de forma íntegramente remota: reserva de denominación,
redacción del estatuto, depósito del capital, firma digital e inscripción ante
el organismo de contralor. El cliente recibe el estatuto inscripto, el CUIT de
la sociedad y la matrícula.

## Datos concretos

- Jurisdicciones: Córdoba (IPJ) y Ciudad Autónoma de Buenos Aires (IGJ).
- Plazo: aproximadamente 5 días hábiles desde que está toda la documentación.
- Honorarios profesionales: desde ${pesos(precioPlanBasico)} (plan Básico) hasta
  ${pesos(precioPlanPremium)} (plan Premium). No incluyen las tasas del organismo,
  que varían por jurisdicción.
- Capital social mínimo: el equivalente a 2 salarios mínimos vitales y móviles;
  se integra el 25% al constituir y el resto dentro de los 2 años.
- Una S.A.S. puede constituirse con un solo socio (unipersonal).
- No requiere escribanía: la firma digital la reemplaza.
- Marco legal: Ley 27.349.
- Una vez inscripta, la sociedad puede operar en todo el territorio argentino,
  sin importar la jurisdicción donde se constituyó.

## Contacto

- Sitio: ${SITE_URL}
- Email: contacto@quieromisas.com
- Teléfono / WhatsApp: +54 9 351 213 6212
- Domicilio: Ituzaingó 87, 5to Piso, Córdoba (CP 5000), Argentina

## Páginas

- [Inicio](${SITE_URL}): planes, precios y el proceso paso a paso.
- [Blog](${SITE_URL}/blog): guías sobre constitución de sociedades, comparativas
  entre tipos societarios y costos actualizados.
- [Términos y condiciones](${SITE_URL}/terminos)
- [Política de privacidad](${SITE_URL}/privacidad)

## Preguntas frecuentes

${faqs.map((f) => `### ${f.pregunta}\n\n${f.respuesta}`).join('\n\n')}
`

  return new Response(cuerpo, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
