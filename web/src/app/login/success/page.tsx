'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect back to the dashboard after a tiny delay.
    // This allows Grayjay to intercept the URL and close the popup on mobile,
    // while Desktop users will be seamlessly redirected back to continue editing!
    const timeout = setTimeout(() => {
      router.push('/dashboard?message=Settings+saved+successfully!')
    }, 500)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4 font-sans text-white">
      <div className="w-full max-w-[500px] rounded-lg bg-dark-2 px-8 py-10 sm:px-10 sm:py-12 shadow-2 dark:bg-dark-2 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white sm:text-[28px]">
          Syncing...
        </h2>
        <p className="text-base text-body-color dark:text-dark-6">
          Transferring settings to Grayjay. You will be redirected shortly.
        </p>
      </div>
    </div>
  )
}
