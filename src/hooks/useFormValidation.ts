import { useState, useCallback, useRef, RefObject } from "react"

interface ValidationError {
  field: string
  message: string
}

interface FieldRef {
  element: HTMLElement | null
  validate: () => boolean
  message: string
}

interface UseFormValidationReturn {
  errors: ValidationError[]
  setFieldRef: (fieldName: string, element: HTMLElement | null, validate: () => boolean, message: string) => void
  validateAll: () => boolean
  clearErrors: () => void
  getFieldError: (fieldName: string) => string | undefined
  hasError: (fieldName: string) => boolean
  scrollToFirstError: () => void
}

export function useFormValidation(): UseFormValidationReturn {
  const [errors, setErrors] = useState<ValidationError[]>([])
  const fieldRefs = useRef<Map<string, FieldRef>>(new Map())

  const setFieldRef = useCallback((
    fieldName: string,
    element: HTMLElement | null,
    validate: () => boolean,
    message: string
  ) => {
    if (element) {
      fieldRefs.current.set(fieldName, { element, validate, message })
    } else {
      fieldRefs.current.delete(fieldName)
    }
  }, [])

  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationError[] = []

    fieldRefs.current.forEach((field, fieldName) => {
      if (!field.validate()) {
        newErrors.push({ field: fieldName, message: field.message })
      }
    })

    setErrors(newErrors)

    if (newErrors.length > 0) {
      // Scroll to first error
      const firstErrorField = newErrors[0].field
      const firstField = fieldRefs.current.get(firstErrorField)
      if (firstField?.element) {
        firstField.element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
        // Focus the element if it's focusable
        if (firstField.element instanceof HTMLInputElement ||
            firstField.element instanceof HTMLTextAreaElement ||
            firstField.element instanceof HTMLSelectElement) {
          setTimeout(() => {
            firstField.element?.focus()
          }, 300)
        }
      }
      return false
    }

    return true
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return errors.find(e => e.field === fieldName)?.message
  }, [errors])

  const hasError = useCallback((fieldName: string): boolean => {
    return errors.some(e => e.field === fieldName)
  }, [errors])

  const scrollToFirstError = useCallback(() => {
    if (errors.length > 0) {
      const firstErrorField = errors[0].field
      const firstField = fieldRefs.current.get(firstErrorField)
      if (firstField?.element) {
        firstField.element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
        if (firstField.element instanceof HTMLInputElement ||
            firstField.element instanceof HTMLTextAreaElement ||
            firstField.element instanceof HTMLSelectElement) {
          setTimeout(() => {
            firstField.element?.focus()
          }, 300)
        }
      }
    }
  }, [errors])

  return {
    errors,
    setFieldRef,
    validateAll,
    clearErrors,
    getFieldError,
    hasError,
    scrollToFirstError,
  }
}

// Simple scroll to element utility
export function scrollToElement(element: HTMLElement | null, options?: {
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
  focus?: boolean
}) {
  if (!element) return

  const { behavior = "smooth", block = "center", focus = true } = options || {}

  element.scrollIntoView({ behavior, block })

  if (focus && (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  )) {
    setTimeout(() => element.focus(), 300)
  }
}

// Scroll to first element with error class
export function scrollToFirstInvalidField(containerRef?: RefObject<HTMLElement>) {
  const container = containerRef?.current || document
  const firstInvalid = container.querySelector<HTMLElement>('[data-error="true"], .field-error, .invalid')

  if (firstInvalid) {
    scrollToElement(firstInvalid)
    return true
  }
  return false
}
