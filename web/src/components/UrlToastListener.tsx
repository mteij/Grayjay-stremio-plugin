'use client'

import { useEffect, Suspense } from 'react'
import { toast } from 'sonner'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

function ToastLogic() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const message = searchParams.get('message')
    const error = searchParams.get('error')

    if (message) {
      toast.success(message)
    }
    if (error) {
      toast.error(error)
    }

    if (message || error) {
      // Clear the query params from the URL without triggering a reload
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('message')
      newParams.delete('error')
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
    }
  }, [searchParams, pathname, router])

  return null
}

export function UrlToastListener() {
  return (
    <Suspense fallback={null}>
      <ToastLogic />
    </Suspense>
  )
}
