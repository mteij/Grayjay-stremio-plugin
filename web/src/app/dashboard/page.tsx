import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { saveSettings, signout } from './actions'
import AddonList, { Addon } from '@/components/AddonList'
import { SubmitButton } from '@/components/SubmitButton'
import QRCode from 'react-qr-code'
import { Smartphone } from 'lucide-react'
import StreamPreferencesConfig from '@/components/StreamPreferences'
import { DashboardForm } from '@/components/DashboardForm'
import CopyConfigUrlButton from '@/components/CopyConfigUrlButton'
import { buttonVariants } from '@/components/ui/button'

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
  const integrations = settings?.integrations || { rpdb_key: 't0-free-rpdb-rounded-blocks' }

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

  const pluginUrl = 'https://grayjay-stremio.netlify.app/plugin/Config.json'
  const grayjayDeepLink = `grayjay://plugin/${pluginUrl}`

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
      <div className="mx-auto w-full max-w-[800px]">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Plugin Configuration
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Manage your Grayjay Stremio plugin settings
            </p>
          </div>
          <form action={signout} className="flex items-center">
            <SubmitButton
              variant="destructive"
              className="w-full sm:w-auto h-10 flex items-center justify-center px-4"
            >
              Sign out
            </SubmitButton>
          </form>
        </header>

        <div className="space-y-6">
          <DashboardForm 
            initialTmdbKey={tmdbKey}
            initialAddons={hydratedAddons}
            initialPrefs={settings?.stream_preferences || {}}
            initialIntegrations={integrations || { rpdb_key: 't0-free-rpdb-rounded-blocks' }}
          />
        </div>

        {/* Installation Card - Compact */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-up delay-200">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg shadow-sm shrink-0 dark:border dark:border-border dark:shadow-none">
              <QRCode 
                value={grayjayDeepLink} 
                size={64}
                style={{ height: "auto", maxWidth: "100%", width: "64px" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold mb-1">Install Plugin</h2>
              <p className="text-sm text-muted-foreground">Scan QR or open directly in Grayjay.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a 
              href={grayjayDeepLink}
              className={buttonVariants({ className: "w-full sm:w-auto shrink-0 gap-2 h-10 px-4" })}
            >
              <Smartphone className="w-4 h-4" />
              Open in Grayjay
            </a>
            <CopyConfigUrlButton url={pluginUrl} />
          </div>
        </div>
      </div>
    </div>
  )
}
