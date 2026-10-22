'use client'

import { useState, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { soloDigitos } from '@/lib/validaciones'
import { cn } from '@/lib/utils'
import {
  ESTADOS_CIVILES,
  PROVINCIAS_AR,
  departamentoDeCiudad,
  type Errores,
  type Persona,
} from './formulario'

/** Id del <datalist> de ciudades de Córdoba que la página renderiza una vez. */
export const LISTA_CIUDADES = 'ciudades-cordoba'

/** Select con la misma etiqueta y el mismo mensaje de error que FormField. */
export function CampoSelect({
  id,
  label,
  value,
  onChange,
  opciones,
  error,
  placeholder = 'Elegí una opción',
}: {
  id: string
  label: string
  value: string
  onChange: (valor: string) => void
  opciones: string[]
  error?: string
  placeholder?: string
}) {
  // El último error se sigue mostrando mientras el mensaje se cierra.
  const [ultimoError, setUltimoError] = useState(error)
  if (error && error !== ultimoError) setUltimoError(error)
  // Un valor viejo que no está en la lista (borradores anteriores, donde la
  // provincia era texto libre) se conserva como opción para no perderlo.
  const lista = value && !opciones.includes(value) ? [value, ...opciones] : opciones

  return (
    <div className="space-y-2">
      {/* Mismo envoltorio que la etiqueta de FormField, para que queden alineados. */}
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className={cn('text-body-sm font-semibold', error && 'text-danger')}>
          {label}
          <span className="text-danger ml-1">*</span>
        </Label>
      </div>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} invalid={!!error} className={cn(error && 'border-danger-solid')}>
        <option value="">{placeholder}</option>
        {lista.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
      <div className="mensaje-campo -mt-2" data-visible={!!error}>
        <div>
          <p className="pt-2 text-label text-danger flex items-center gap-1" aria-live="polite">
            <AlertCircle className="h-3 w-3" />
            {ultimoError}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Datos de una persona (socio o administrador). Antes eran dos copias de ~250
 * líneas que ya se habían desincronizado: la provincia era texto libre en una
 * y lista en la otra, y a los administradores no se les validaba la ubicación.
 */
export function PersonaCampos({
  persona,
  prefijo,
  errores,
  onCambio,
}: {
  persona: Persona
  /** Ruta de los campos en los errores y en los ids: `socios.0`. */
  prefijo: string
  errores: Errores
  onCambio: (cambios: Partial<Persona>) => void
}) {
  const id = (campo: keyof Persona) => `${prefijo}.${campo}`
  const error = (campo: keyof Persona) => errores[id(campo)]
  const texto = (campo: keyof Persona) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onCambio({ [campo]: e.target.value })
  // Se aceptan pegados con puntos o guiones: se limpian acá, sin un largo
  // máximo que corte el valor antes de limpiarlo.
  const digitos = (campo: 'dni' | 'cuit') => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onCambio({ [campo]: soloDigitos(e.target.value) })

  const cambiarCiudad = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const ciudad = e.target.value
    const cambios: Partial<Persona> = { ciudad }
    // Ciudad de Córdoba conocida: el departamento y la provincia se completan solos.
    const depto = departamentoDeCiudad(ciudad)
    if (depto && (!persona.provincia || persona.provincia === 'Córdoba')) {
      if (!persona.departamento) cambios.departamento = depto
      if (!persona.provincia) cambios.provincia = 'Córdoba'
    }
    onCambio(cambios)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nombre" name={id('nombre')} value={persona.nombre} onChange={texto('nombre')} error={error('nombre')} required autoComplete="off" />
        <FormField label="Apellido" name={id('apellido')} value={persona.apellido} onChange={texto('apellido')} error={error('apellido')} required autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="DNI"
          name={id('dni')}
          value={persona.dni}
          onChange={digitos('dni')}
          error={error('dni')}
          required
          inputMode="numeric"
          placeholder="Sin puntos"
          inputClassName="tnum"
        />
        <FormField
          label="CUIT o CUIL"
          name={id('cuit')}
          value={persona.cuit}
          onChange={digitos('cuit')}
          error={error('cuit')}
          required
          inputMode="numeric"
          placeholder="11 dígitos"
          helpText="Si no lo tenés a mano, figura en tu constancia de ARCA (ex AFIP)"
          inputClassName="tnum"
        />
      </div>

      <FormField
        label="Domicilio"
        name={id('domicilio')}
        value={persona.domicilio}
        onChange={texto('domicilio')}
        error={error('domicilio')}
        required
        placeholder="Calle, número, piso y departamento"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          label="Ciudad"
          name={id('ciudad')}
          value={persona.ciudad}
          onChange={cambiarCiudad}
          error={error('ciudad')}
          required
          list={LISTA_CIUDADES}
        />
        <FormField
          label="Departamento o partido"
          name={id('departamento')}
          value={persona.departamento}
          onChange={texto('departamento')}
          error={error('departamento')}
          required
          placeholder="Ej.: Capital, Colón"
        />
        <CampoSelect
          id={id('provincia')}
          label="Provincia"
          value={persona.provincia}
          onChange={(provincia) => onCambio({ provincia })}
          opciones={[...PROVINCIAS_AR, 'Otro país']}
          error={error('provincia')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CampoSelect
          id={id('estadoCivil')}
          label="Estado civil"
          value={persona.estadoCivil}
          onChange={(estadoCivil) => onCambio({ estadoCivil })}
          opciones={ESTADOS_CIVILES}
          error={error('estadoCivil')}
        />
        <FormField
          label="Profesión u ocupación"
          name={id('profesion')}
          value={persona.profesion}
          onChange={texto('profesion')}
          error={error('profesion')}
          required
          placeholder="Ej.: Comerciante"
        />
      </div>
    </div>
  )
}

/** Tarjeta de una persona: título, acciones a la derecha y contenido. */
export function TarjetaPersona({ titulo, acciones, children }: { titulo: string; acciones?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-6 shadow-raise">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-heading font-semibold text-ink">{titulo}</h3>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
      {children}
    </section>
  )
}
