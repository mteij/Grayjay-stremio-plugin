'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <Button
      variant="outline"
      size="icon"
      type="button"
      onClick={handleCopy}
      title="Copy plugin URL"
      className="h-10 w-10 shrink-0"
    >
      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
    </Button>
  )
}
