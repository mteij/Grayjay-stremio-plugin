'use client'

import React, { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import { Loader2, ExternalLink, Check, Unplug } from 'lucide-react'
import { exchangeTraktPin } from '@/app/dashboard/traktActions'

export interface Integrations {
  rpdb_key?: string
  trakt?: {
    access_token: string
    refresh_token: string
    expires_at: number
  } | null
}

interface Props {
  initialIntegrations?: Integrations
  onChange?: (integrations: Integrations) => void
}

export default function IntegrationsConfig({ initialIntegrations, onChange }: Props) {
  const [integrations, setIntegrations] = useState<Integrations>(initialIntegrations || { rpdb_key: 't0-free-rpdb-rounded-blocks' })
  const [pin, setPin] = useState('')
  const [loadingTrakt, setLoadingTrakt] = useState(false)

  // Report state changes to parent form tracker
  useEffect(() => {
    if (onChange) onChange(integrations)
  }, [integrations, onChange])

  const clientId = process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID
  const authUrl = clientId 
    ? `https://trakt.tv/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=urn:ietf:wg:oauth:2.0:oob` 
    : '#'

  const handleVerifyPin = async () => {
    if (!pin.trim()) {
      toast.error('Please enter a PIN code.')
      return
    }

    setLoadingTrakt(true)
    const result = await exchangeTraktPin(pin)
    setLoadingTrakt(false)

    if (result.success && result.tokens) {
      setIntegrations({ ...integrations, trakt: result.tokens })
      setPin('')
      toast.success('Successfully connected to Trakt!')
    } else {
      toast.error(result.message || 'Failed to verify PIN.')
    }
  }

  const handleDisconnectTrakt = () => {
    setIntegrations({ ...integrations, trakt: null })
    toast.success('Trakt disconnected. Click Save to apply.')
  }

  return (
    <div className="space-y-8 pt-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="space-y-1">
          <h2 className="text-lg font-medium leading-none">Integrations</h2>
          <p className="text-sm text-muted-foreground">Connect third-party services to enhance your library.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* RatingPosterDB Section */}
        <div className="space-y-3 p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
          <div className="flex justify-between items-start gap-4">
            <div>
              <Label className="text-base font-semibold">RatingPosterDB (RPDB)</Label>
              <p className="text-sm text-muted-foreground mt-1">Get beautiful posters with IMDB and Trakt ratings baked right into the image.</p>
            </div>
            <a href="https://ratingposterdb.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium flex items-center shrink-0">
              Get an API Key <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
          
          <div className="pt-2">
            <Label htmlFor="rpdb_key" className="text-sm font-medium mb-1.5 block">API Key</Label>
            <Input
              id="rpdb_key"
              type="text"
              value={integrations.rpdb_key || ''}
              onChange={(e) => setIntegrations({ ...integrations, rpdb_key: e.target.value })}
              placeholder="e.g. t0-free-rpdb-rounded-blocks"
              className="font-mono bg-background"
            />
            <p className="text-xs text-muted-foreground mt-2">
              The default free key provides rounded rating blocks.{' '}
              <button 
                type="button" 
                onClick={() => setIntegrations({ ...integrations, rpdb_key: 't0-free-rpdb-rounded-blocks' })}
                className="text-primary hover:underline font-medium"
              >
                Use free key
              </button>
            </p>
          </div>
        </div>

        {/* Trakt.tv Section */}
        <div className="space-y-4 p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
          <div className="flex justify-between items-start gap-4">
            <div>
              <Label className="text-base font-semibold text-red-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Trakt.tv
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Connect your Trakt account to scrobble watched status and sync your progress.</p>
            </div>
          </div>

          <div className="pt-2">
            {integrations.trakt?.access_token ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                  <Check className="w-5 h-5" />
                  Trakt is connected and active
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnectTrakt} className="shrink-0 hover:bg-destructive hover:text-destructive-foreground">
                  <Unplug className="w-4 h-4 mr-2" /> Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-4 bg-muted/30 p-4 border rounded-md">
                <div className="text-sm font-medium space-y-2">
                  <p>1. Click the button below to authorize Grayjay Stremio Plugin on Trakt.</p>
                  <p>2. Trakt will give you an 8-character alphanumeric PIN code.</p>
                  <p>3. Paste the code here to complete the connection.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={authUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-600 disabled:pointer-events-none disabled:opacity-50">
                    Get PIN from Trakt <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input 
                      type="text" 
                      placeholder="Paste PIN here..." 
                      value={pin}
                      onChange={(e) => setPin(e.target.value.toUpperCase())}
                      className="font-mono uppercase"
                    />
                    <Button type="button" onClick={handleVerifyPin} disabled={loadingTrakt || !pin.trim()}>
                      {loadingTrakt ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                </div>

                {!clientId && (
                  <p className="text-xs text-destructive font-medium mt-2 flex items-center">
                    Warning: NEXT_PUBLIC_TRAKT_CLIENT_ID is not configured in .env
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
