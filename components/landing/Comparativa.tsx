import { Check, X } from 'lucide-react'

export function Comparativa() {
  return (
    <section id="comparativa" className="py-seccion md:py-seccion-lg bg-gradient-to-b from-surface to-brand-50">
      <div className="container mx-auto px-4">
        <h2 className="text-display md:text-display-lg font-black text-center mb-4 text-ink">S.A.S. vs Otros Tipos Societarios</h2>
        <p className="text-center text-ink-2 mb-12 max-w-2xl mx-auto">
          Compará y entendé por qué la S.A.S. es la mejor opción para tu emprendimiento
        </p>

        <div className="max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full bg-surface rounded-card shadow-pop overflow-hidden">
            <thead>
              <tr className="bg-ink text-white">
                <th className="py-4 px-6 text-left font-semibold">Característica</th>
                <th className="py-4 px-6 text-center font-semibold bg-brand-700">S.A.S.</th>
                <th className="py-4 px-6 text-center font-semibold">S.R.L.</th>
                <th className="py-4 px-6 text-center font-semibold">S.A.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr className="hover:bg-surface-2 transition">
                <td className="py-4 px-6 font-medium text-ink">Cantidad mínima de socios</td>
                <td className="py-4 px-6 text-center bg-brand-50">
                  <div className="flex flex-col items-center">
                    <Check className="w-6 h-6 text-brand-700 mb-1" />
                    <span className="text-sm font-semibold text-brand-900">1 socio</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">2 socios mínimo</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">2 socios mínimo</span>
                </td>
              </tr>

              <tr className="hover:bg-surface-2 transition">
                <td className="py-4 px-6 font-medium text-ink">Tiempo de constitución</td>
                <td className="py-4 px-6 text-center bg-brand-50">
                  <div className="flex flex-col items-center">
                    <Check className="w-6 h-6 text-brand-700 mb-1" />
                    <span className="text-sm font-semibold text-brand-900">5 días</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">15-30 días</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">30-60 días</span>
                </td>
              </tr>

              <tr className="hover:bg-surface-2 transition">
                <td className="py-4 px-6 font-medium text-ink">Costo de constitución</td>
                <td className="py-4 px-6 text-center bg-brand-50">
                  <div className="flex flex-col items-center">
                    <Check className="w-6 h-6 text-brand-700 mb-1" />
                    <span className="text-sm font-semibold text-brand-900">Bajo</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">Medio-Alto</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">Alto</span>
                </td>
              </tr>

              <tr className="hover:bg-surface-2 transition">
                <td className="py-4 px-6 font-medium text-ink">Trámite 100% digital</td>
                <td className="py-4 px-6 text-center bg-brand-50">
                    <Check className="w-6 h-6 text-brand-700 mx-auto" />
                </td>
                <td className="py-4 px-6 text-center">
                  <X className="w-6 h-6 text-brand-500 mx-auto" />
                </td>
                <td className="py-4 px-6 text-center">
                  <X className="w-6 h-6 text-brand-500 mx-auto" />
                </td>
              </tr>

              <tr className="hover:bg-surface-2 transition">
                <td className="py-4 px-6 font-medium text-ink">Capital mínimo</td>
                <td className="py-4 px-6 text-center bg-brand-50">
                  <span className="text-sm font-semibold text-brand-900">2 SMVM (~$280K)</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">$100K (ley)</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">$200K (ley)</span>
                </td>
              </tr>

              <tr className="hover:bg-surface-2 transition">
                <td className="py-4 px-6 font-medium text-ink">Transferencia de participaciones</td>
                <td className="py-4 px-6 text-center bg-brand-50">
                  <div className="flex flex-col items-center">
                    <Check className="w-6 h-6 text-brand-700 mb-1" />
                    <span className="text-sm font-semibold text-brand-900">Muy simple</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">Complejo</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">Simple</span>
                </td>
              </tr>

              <tr className="hover:bg-surface-2 transition">
                <td className="py-4 px-6 font-medium text-ink">Fiscalización estatal</td>
                <td className="py-4 px-6 text-center bg-brand-50">
                  <span className="text-sm font-semibold text-brand-900">No</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">No</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">Sí (CNV)</span>
                </td>
              </tr>

              <tr className="hover:bg-surface-2 transition">
                <td className="py-4 px-6 font-medium text-ink">Modificación de estatuto</td>
                <td className="py-4 px-6 text-center bg-brand-50">
                  <div className="flex flex-col items-center">
                    <Check className="w-6 h-6 text-brand-700 mb-1" />
                    <span className="text-sm font-semibold text-brand-900">Ágil</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">Lento</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">Muy lento</span>
                </td>
              </tr>

              <tr className="hover:bg-surface-2 transition">
                <td className="py-4 px-6 font-medium text-ink">Ideal para</td>
                <td className="py-4 px-6 text-center bg-brand-50">
                  <span className="text-sm font-semibold text-brand-900">Startups, PyMEs, Emprendedores</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">PyMEs familiares</span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-sm text-ink">Grandes empresas</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center">
          <p className="text-ink-2 mb-6 max-w-3xl mx-auto">
            La S.A.S. combina lo mejor de ambos mundos: la flexibilidad de una S.R.L. con la simplicidad 
            operativa de una S.A., pero con costos reducidos y tiempos récord.
          </p>
            <a
              href="#planes"
              className="inline-block bg-brand-700 text-white px-8 py-3 rounded-chip hover:bg-brand-800 transition font-semibold"
            >
              Ver Planes y Empezar
            </a>
        </div>
      </div>
    </section>
  )
}

