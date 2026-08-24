import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge no conoce las escalas propias del sistema, y eso rompía
 * estilos en silencio.
 *
 * Ejemplo real: `cn('text-hero tnum', alert ? 'text-warning' : 'text-ink')`.
 * Como `text-hero` no figura entre los tamaños que la librería conoce, lo
 * clasificaba como color de texto, veía dos colores en conflicto y se quedaba
 * con el último — el número de las métricas terminaba en 15px en vez de 40px,
 * sin ningún error que lo delatara.
 *
 * Registrando acá las escalas propias, `cn()` vuelve a distinguir tamaño de
 * color, radio de otra cosa, y sombra de otra.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['hero', 'display', 'title', 'heading', 'body', 'body-sm', 'label', 'metric'] },
      ],
      rounded: [{ rounded: ['chip', 'control', 'card', 'modal'] }],
      shadow: [{ shadow: ['raise', 'pop', 'modal', 'card', 'lift'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
