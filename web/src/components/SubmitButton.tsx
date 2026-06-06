'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  formAction?: string | ((formData: FormData) => void | Promise<void>)
  children: React.ReactNode
  className?: string
}

export function SubmitButton({ formAction, children, className = '', ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const [clicked, setClicked] = useState(false)

  // Reset clicked state when the form is no longer pending
  useEffect(() => {
    if (!pending) {
      setClicked(false)
    }
  }, [pending])

  return (
    <button
      formAction={formAction}
      onClick={(e) => {
        setClicked(true)
        if (props.onClick) props.onClick(e)
      }}
      disabled={pending || props.disabled}
      className={`flex items-center justify-center gap-2 ${className} ${(pending || props.disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {pending && clicked && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  )
}
