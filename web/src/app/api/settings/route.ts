import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('tmdb_api_key, stremio_addons')
    .eq('id', user.id)
    .single()

  if (settingsError) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
  }

  return NextResponse.json(settings)
}
