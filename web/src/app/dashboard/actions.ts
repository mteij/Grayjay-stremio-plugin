'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function saveSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const tmdbApiKey = formData.get('tmdb_api_key') as string
  const stremioAddonsRaw = formData.get('stremio_addons') as string
  
  let stremioAddons = []
  try {
    // If the user pastes a comma-separated list or JSON, we parse it
    if (stremioAddonsRaw.trim().startsWith('[')) {
      stremioAddons = JSON.parse(stremioAddonsRaw)
    } else {
      stremioAddons = stremioAddonsRaw.split(',').map(s => s.trim()).filter(Boolean)
    }
  } catch (e) {
    stremioAddons = []
  }

  // Upsert settings
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      id: user.id,
      tmdb_api_key: tmdbApiKey,
      stremio_addons: stremioAddons
    })

  if (error) {
    console.error('Error saving settings', error)
    throw new Error('Failed to save settings')
  }

  redirect('/login/success')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
