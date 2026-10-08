import { useState, useCallback, useEffect, useRef } from 'react'
import { cbuValido, cuitValido, validarDni, validarEmail, validarTelefono } from '@/lib/validaciones'

interface ValidationRule {
  validator: (value: any, formData?: any) => boolean | string
  message: string
}

interface FieldValidation {
  [key: string]: ValidationRule[]
}

interface ValidationErrors {
  [key: string]: string | null
}

export function useFormValidation(rules: FieldValidation, formData: any) {
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const formDataRef = useRef(formData)

  // Mantener formData actualizado en el ref
  useEffect(() => {
    formDataRef.current = formData
  }, [formData])

  // Validar un campo específico
  const validateField = useCallback((fieldName: string, value?: any) => {
    const fieldRules = rules[fieldName]
    if (!fieldRules) return null

    const currentFormData = formDataRef.current
    const fieldValue = value !== undefined ? value : currentFormData[fieldName]

    for (const rule of fieldRules) {
      const result = rule.validator(fieldValue, currentFormData)
      if (result !== true) {
        return typeof result === 'string' ? result : rule.message
      }
    }
    return null
  }, [rules])

  // Validar todos los campos
  const validateAll = useCallback(() => {
    const newErrors: ValidationErrors = {}
    Object.keys(rules).forEach(fieldName => {
      const value = formData[fieldName]
      const error = validateField(fieldName, value)
      if (error) {
        newErrors[fieldName] = error
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [rules, formData, validateField])

  // Marcar campo como tocado
  const setFieldTouched = useCallback((fieldName: string) => {
    setTouched(prev => new Set(prev).add(fieldName))
  }, [])

  // Validar campo cuando se toca o cuando cambia su valor
  useEffect(() => {
    if (touched.size === 0) return

    const currentFormData = formDataRef.current
    const newErrors: ValidationErrors = {}

    touched.forEach(fieldName => {
      const value = currentFormData[fieldName]
      const fieldRules = rules[fieldName]
      if (!fieldRules) return

      let error: string | null = null
      for (const rule of fieldRules) {
        const result = rule.validator(value, currentFormData)
        if (result !== true) {
          error = typeof result === 'string' ? result : rule.message
          break
        }
      }
      newErrors[fieldName] = error
    })

    // Solo actualizar si hay cambios reales usando función de actualización
    setErrors(prev => {
      const hasChanges = Object.keys(newErrors).some(
        key => prev[key] !== newErrors[key]
      )
      if (!hasChanges) return prev
      return { ...prev, ...newErrors }
    })
  }, [touched, rules]) // Removemos errors de las dependencias para evitar bucle infinito

  // Obtener estado de validación de un campo
  const getFieldValidation = useCallback((fieldName: string): 'success' | 'error' | 'none' => {
    if (!touched.has(fieldName)) return 'none'
    if (errors[fieldName]) return 'error'
    if (formData[fieldName]) return 'success'
    return 'none'
  }, [touched, errors, formData])

  return {
    errors,
    validateField,
    validateAll,
    setFieldTouched,
    getFieldValidation,
    isFieldValid: (fieldName: string) => !errors[fieldName],
    hasErrors: Object.keys(errors).length > 0
  }
}

// Validadores comunes
export const validators = {
  required: (message = 'Este campo es obligatorio'): ValidationRule => ({
    validator: (value) => {
      if (typeof value === 'string') {
        return value.trim().length > 0 || message
      }
      return value != null && value !== '' || message
    },
    message
  }),

  email: (message = 'Ingresá un email válido'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true // Si está vacío, required se encarga
      return validarEmail(value) === null || message
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value) => {
      if (!value) return true
      return value.length >= min || (message || `Mínimo ${min} caracteres`)
    },
    message: message || `Mínimo ${min} caracteres`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value) => {
      if (!value) return true
      return value.length <= max || (message || `Máximo ${max} caracteres`)
    },
    message: message || `Máximo ${max} caracteres`
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validator: (value) => {
      if (!value) return true
      return regex.test(value) || message
    },
    message
  }),

  dni: (message = 'El DNI debe tener 7 u 8 dígitos'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true
      return validarDni(value) === null || message
    },
    message
  }),

  // Además de los 11 dígitos controla el dígito verificador
  cuit: (message = 'El CUIT/CUIL no es válido'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true
      return cuitValido(value) || message
    },
    message
  }),

  // Además de los 22 dígitos controla los dígitos verificadores
  cbu: (message = 'El CBU no es válido'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true
      return cbuValido(value) || message
    },
    message
  }),

  minValue: (min: number, message?: string): ValidationRule => ({
    validator: (value) => {
      if (!value) return true
      const num = parseFloat(String(value).replace(/\./g, '').replace(',', '.'))
      return !isNaN(num) && num >= min || (message || `El valor mínimo es ${min}`)
    },
    message: message || `El valor mínimo es ${min}`
  }),

  phone: (message = 'Ingresá un teléfono válido'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true
      return validarTelefono(value) === null || message
    },
    message
  })
}

