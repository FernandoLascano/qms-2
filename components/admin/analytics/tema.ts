/**
 * Colores de los gráficos de Analytics: los mismos del reporte mensual en PDF.
 * Gris para el contexto, rojo para lo que importa (el mes actual, el último
 * paso). El gris está validado: contraste ≥ 3:1 sobre el fondo y bien
 * distinto del rojo también con daltonismo.
 */
export const TEMA = {
  rojo: '#a51c1c',
  gris: '#8f8a86',
  grilla: '#ece8e5',
  ejes: '#6b6b6b',
  fuente: 12,
}

export const tooltipEstilo = {
  contentStyle: {
    backgroundColor: '#fff',
    border: '1px solid #e3dfdc',
    borderRadius: 8,
    fontSize: 13,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  labelStyle: { color: '#1c1c1c', fontWeight: 600 },
  itemStyle: { color: '#2b2b2b' },
  cursor: { fill: 'rgba(28,28,28,0.04)' },
}

export const pesos = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`
export const pesosCorto = (n: number) =>
  n >= 1_000_000 ? `$ ${(n / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M` : n >= 1_000 ? `$ ${Math.round(n / 1_000)} k` : `$ ${n}`
