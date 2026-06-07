'use client'

import React, { useState, useTransition } from 'react'
import DashboardTabs from '@/components/DashboardTabs'
import AddonList, { Addon } from '@/components/AddonList'
import StreamPreferencesConfig from '@/components/StreamPreferences'
import IntegrationsConfig, { Integrations } from '@/components/IntegrationsConfig'
import { StreamPreferences, DEFAULT_PREFERENCES } from '@/lib/streamPreferences'
import { Button } from '@/components/ui/button'
import { saveSettings } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { Loader2, Check } from 'lucide-react'

interface Props {
  initialTmdbKey: string
  initialAddons: Addon[]
  initialPrefs: Partial<StreamPreferences>
  initialIntegrations: Integrations
}

export function DashboardForm({ initialTmdbKey, initialAddons, initialPrefs, initialIntegrations }: Props) {
  const [isPending, startTransition] = useTransition()
  
  // Track current state
  const [tmdbKey, setTmdbKey] = useState(initialTmdbKey)
  const [addons, setAddons] = useState<Addon[]>(initialAddons)
  const [prefs, setPrefs] = useState<StreamPreferences>({ ...DEFAULT_PREFERENCES, ...initialPrefs })
  const [integrations, setIntegrations] = useState<Integrations>(initialIntegrations || { rpdb_key: 't0-free-rpdb-rounded-blocks' })

  // Track the baseline state for dirty checking
  const [baselineTmdbKey, setBaselineTmdbKey] = useState(initialTmdbKey)
  const [baselineAddons, setBaselineAddons] = useState<Addon[]>(initialAddons)
  const [baselinePrefs, setBaselinePrefs] = useState<StreamPreferences>({ ...DEFAULT_PREFERENCES, ...initialPrefs })
  const [baselineIntegrations, setBaselineIntegrations] = useState<Integrations>(initialIntegrations || { rpdb_key: 't0-free-rpdb-rounded-blocks' })

  const isDirty = 
    tmdbKey !== baselineTmdbKey || 
    JSON.stringify(addons) !== JSON.stringify(baselineAddons) || 
    JSON.stringify(prefs) !== JSON.stringify(baselinePrefs) ||
    JSON.stringify(integrations) !== JSON.stringify(baselineIntegrations)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isDirty) return

    const formData = new FormData()
    formData.append('tmdb_api_key', tmdbKey)
    formData.append('stremio_addons', JSON.stringify(addons.map(a => a.url)))
    formData.append('stream_preferences', JSON.stringify(prefs))
    formData.append('integrations', JSON.stringify(integrations))

    startTransition(async () => {
      try {
        const result = await saveSettings(formData)
        if (result.success) {
          toast.success(result.message)
          // Update baseline so isDirty becomes false without a page reload
          setBaselineTmdbKey(tmdbKey)
          setBaselineAddons(addons)
          setBaselinePrefs(prefs)
          setBaselineIntegrations(integrations)
        } else {
          toast.error(result.message)
        }
      } catch (err: any) {
        toast.error(err.message || 'Something went wrong')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0 animate-fade-up delay-100">
      <DashboardTabs
        generalContent={
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="tmdb_api_key" className="text-base font-medium">
                TMDB API Key
              </label>
              <input
                id="tmdb_api_key"
                name="tmdb_api_key"
                type="text"
                value={tmdbKey}
                onChange={(e) => setTmdbKey(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
              />
              <p className="text-sm text-muted-foreground">Used to fetch high quality metadata and posters for the unified library.</p>
            </div>
            <div className="pt-2">
              <AddonList initialAddons={addons} onChange={setAddons} />
            </div>
          </div>
        }
        preferencesContent={
          <StreamPreferencesConfig initialPrefs={prefs} onChange={setPrefs} />
        }
        integrationsContent={
          <IntegrationsConfig initialIntegrations={integrations} onChange={setIntegrations} />
        }
        submitContent={
          <Button
            type="submit"
            disabled={!isDirty || isPending}
            variant={isDirty ? "default" : "secondary"}
            className="w-full sm:w-auto h-10 px-8 flex items-center justify-center transition-all"
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : isDirty ? (
              'Save & Sync to Grayjay'
            ) : (
              <><Check className="mr-2 h-4 w-4" /> Up to date</>
            )}
          </Button>
        }
      />
    </form>
  )
}
