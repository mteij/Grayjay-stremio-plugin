'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  formAction?: string | ((formData: FormData) => void | Promise<void>)
}

export function SubmitButton({ formAction, children, className, disabled, onClick, variant, size, ...props }: SubmitButtonProps) {
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
      formAction={formAction as any}
      onClick={(e) => {
        setClicked(true)
        if (onClick) onClick(e)
      }}
      disabled={pending || disabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {pending && clicked && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
