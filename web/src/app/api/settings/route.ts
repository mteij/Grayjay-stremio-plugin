import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const headersList = await headers()
  
  const cookieToken = cookieStore.get('grayjay-api-token')?.value
  const headerToken = headersList.get('grayjay-api-token')
  const authHeader = headersList.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  const apiToken = cookieToken || headerToken || bearerToken

  let userResponse = apiToken 
    ? await supabase.auth.getUser(apiToken)
    : await supabase.auth.getUser()

  const { data: { user }, error: authError } = userResponse

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('tmdb_api_key, stremio_addons, stream_preferences')
    .eq('id', user.id)
    .maybeSingle()

  if (settingsError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!settings) {
    return NextResponse.json({
      tmdb_api_key: "",
      stremio_addons: [],
      stream_preferences: null,
      integrations: null,
      trakt_client_id: process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID || ""
    })
  }

  return NextResponse.json({
    ...settings,
    trakt_client_id: process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID || ""
  })
}
