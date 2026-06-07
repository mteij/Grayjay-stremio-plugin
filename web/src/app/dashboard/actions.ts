'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const tmdbApiKey = formData.get('tmdb_api_key') as string
  const stremioAddonsRaw = formData.get('stremio_addons') as string
  const streamPreferencesRaw = formData.get('stream_preferences') as string
  const integrationsRaw = formData.get('integrations') as string
  
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

  let streamPreferences = {}
  try {
    if (streamPreferencesRaw) {
      streamPreferences = JSON.parse(streamPreferencesRaw)
    }
  } catch (e) {
    console.error('Failed to parse stream preferences', e)
  }

  let integrations = {}
  try {
    if (integrationsRaw) {
      integrations = JSON.parse(integrationsRaw)
    }
  } catch (e) {
    console.error('Failed to parse integrations', e)
  }

  // Upsert settings
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      id: user.id,
      tmdb_api_key: tmdbApiKey,
      stremio_addons: stremioAddons,
      stream_preferences: streamPreferences,
      integrations: integrations
    })

  if (error) {
    console.error('Error saving settings', error)
    return { success: false, message: 'Failed to save settings. Please try again.' }
  }

  return { success: true, message: 'Settings successfully saved!' }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
