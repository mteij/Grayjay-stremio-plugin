import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { saveSettings, signout } from './actions'
import AddonList, { Addon } from '@/components/AddonList'
import { SubmitButton } from '@/components/SubmitButton'
import QRCode from 'react-qr-code'
import { Smartphone } from 'lucide-react'

export default async function DashboardPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams
  const message = searchParams?.message

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', user.id)
    .single()

  const tmdbKey = settings?.tmdb_api_key || ''
  const addonUrls = (settings?.stremio_addons as string[]) || []

  // Pre-fetch manifests on the server to hydrate the UI instantly
  const hydratedAddons: Addon[] = await Promise.all(
    addonUrls.map(async (url) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
        if (res.ok) {
          const manifest = await res.json()
          let logo = manifest.logo || ''
          if (logo && !logo.startsWith('http')) {
            try { logo = new URL(logo, url).toString() } catch (e) {}
          }
          return {
            url,
            name: manifest.name || 'Unknown',
            description: manifest.description || '',
            logo,
            version: manifest.version || '1.0.0'
          }
        }
      } catch (e) {
        // Ignore failures
      }
      return { url, name: 'Offline Addon', description: 'Could not load metadata.', logo: '', version: '?' }
    })
  )

  const pluginUrl = 'https://greyjay-stremio.netlify.app/plugin/Config.json'
  const grayjayDeepLink = `grayjay://plugin/${pluginUrl}`

  return (
    <div className="min-h-screen bg-dark p-6 md:p-12 font-sans text-white">
      <div className="mx-auto w-full max-w-[800px]">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Addon Manager
            </h1>
            <p className="mt-2 text-base text-body-color">
              Configure your Grayjay Stremio plugin settings
            </p>
          </div>
          <form action={signout}>
            <SubmitButton
              className="inline-block cursor-pointer rounded-md border border-dark-3 bg-transparent px-6 py-2 text-sm font-medium text-body-color transition hover:border-red-500 hover:bg-red-500 hover:text-white"
            >
              Sign out
            </SubmitButton>
          </form>
        </header>

        <div className="bg-dark-2 rounded-xl border border-dark-3 p-8 sm:p-11 shadow-card">
          {message && (
            <div className="mb-8 rounded-md border border-primary/50 bg-primary/10 px-5 py-4 text-sm font-medium text-primary">
              {message}
            </div>
          )}
          <form className="space-y-6">
            
            <div className="mb-6">
              <label htmlFor="tmdb_api_key" className="mb-[10px] block text-base font-medium text-white">
                TMDB API Key
              </label>
              <input
                id="tmdb_api_key"
                name="tmdb_api_key"
                type="text"
                defaultValue={tmdbKey}
                className="w-full rounded-md border border-dark-3 bg-transparent px-5 py-3 text-base text-body-color outline-none transition focus:border-primary focus-visible:shadow-none dark:text-white"
                placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
              />
              <p className="mt-2 text-sm text-body-color">Used to fetch high quality metadata and posters for the unified library.</p>
            </div>

            <div className="mb-8">
              <AddonList initialAddons={hydratedAddons} />
            </div>

            <div className="flex justify-end pt-4 border-t border-dark-3">
              <SubmitButton
                formAction={saveSettings}
                className="w-full sm:w-auto cursor-pointer rounded-md border border-primary bg-primary px-8 py-3 text-base font-medium text-white transition hover:bg-opacity-90"
              >
                Save & Sync to Grayjay
              </SubmitButton>
            </div>
          </form>
        </div>

        {/* Installation Card - Compact */}
        <div className="mt-8 pt-8 border-t border-dark-3 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
              <QRCode 
                value={grayjayDeepLink} 
                size={64}
                style={{ height: "auto", maxWidth: "100%", width: "64px" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-white mb-1">Install Plugin</h2>
              <p className="text-sm text-dark-6">Scan QR or open directly in Grayjay.</p>
            </div>
          </div>
          
          <a 
            href={grayjayDeepLink}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-md bg-primary/10 border border-primary/20 text-primary px-6 py-3 text-sm font-medium transition hover:bg-primary hover:text-white"
          >
            <Smartphone className="w-4 h-4" />
            Open in Grayjay
          </a>
        </div>
      </div>
    </div>
  )
}
