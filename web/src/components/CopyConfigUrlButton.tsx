'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  url: string
}

export default function CopyConfigUrlButton({ url }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy', e)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy plugin URL"
      className="p-2 text-dark-6 hover:text-white hover:bg-dark-3 rounded-md transition"
    >
      {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
    </button>
  )
}
