"use client"

import { ReactNode, forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, Check } from "lucide-react"

interface FormFieldProps {
  label?: string
  error?: string
  success?: boolean
  hint?: string
  required?: boolean
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  error,
  success,
  hint,
  required,
  icon,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block font-body text-xs text-white/40 uppercase tracking-wider">
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
            {icon}
          </div>
        )}
        {children}
        {/* Status indicator */}
        {(error || success) && (
          <div className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2",
            error ? "text-red-500" : "text-green-500"
          )}>
            {error ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Check className="w-5 h-5" />
            )}
          </div>
        )}
      </div>
      {/* Error message */}
      {error && (
        <p className="text-red-400 text-xs font-body animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
      {/* Hint text */}
      {hint && !error && (
        <p className="text-white/30 text-xs font-body">
          {hint}
        </p>
      )}
    </div>
  )
}

// Input with validation states
interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  error?: boolean
  valid?: boolean
  icon?: ReactNode
  inputClassName?: string
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ error, valid, icon, inputClassName, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          {...props}
          data-error={error}
          className={cn(
            "w-full h-14 bg-black border text-white placeholder:text-white/20 font-body text-base",
            "focus:outline-none transition-all duration-200",
            icon ? "pl-12 pr-4" : "px-4",
            error && "border-red-500/50 focus:border-red-500 shake",
            valid && "border-green-500/50 focus:border-green-500",
            !error && !valid && "border-white/10 focus:border-white/30",
            inputClassName
          )}
        />
        {(error || valid) && (
          <div className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2",
            error ? "text-red-500" : "text-green-500"
          )}>
            {error ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Check className="w-5 h-5" />
            )}
          </div>
        )}
      </div>
    )
  }
)
ValidatedInput.displayName = "ValidatedInput"

// Textarea with validation states
interface ValidatedTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  error?: boolean
  valid?: boolean
  textareaClassName?: string
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ error, valid, textareaClassName, ...props }, ref) => {
    return (
      <div className="relative">
        <textarea
          ref={ref}
          {...props}
          data-error={error}
          className={cn(
            "w-full bg-black border text-white placeholder:text-white/20 font-body text-base",
            "focus:outline-none transition-all duration-200 resize-none px-4 py-3",
            error && "border-red-500/50 focus:border-red-500 shake",
            valid && "border-green-500/50 focus:border-green-500",
            !error && !valid && "border-white/10 focus:border-white/30",
            textareaClassName
          )}
        />
      </div>
    )
  }
)
ValidatedTextarea.displayName = "ValidatedTextarea"
