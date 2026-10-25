import { getPublicConfig } from '@/lib/config'
import FormularioNuevoTramite from './FormularioNuevoTramite'

export default async function NuevoTramitePage() {
  return <FormularioNuevoTramite config={await getPublicConfig()} />
}
