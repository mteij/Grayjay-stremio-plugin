import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Short timeout so we don't hang if the addon is offline
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    const manifest = await response.json()
    
    // Ensure the logo has a valid URL
    let logoUrl = manifest.logo || ''
    if (logoUrl && !logoUrl.startsWith('http')) {
      // If it's a relative logo, try to resolve it against the manifest URL
      try {
        logoUrl = new URL(logoUrl, url).toString()
      } catch (e) {
        logoUrl = ''
      }
    }

    return NextResponse.json({
      url,
      name: manifest.name || 'Unknown Addon',
      description: manifest.description || 'No description provided.',
      logo: logoUrl,
      version: manifest.version || '1.0.0'
    })
  } catch (error) {
    console.error('Error parsing addon:', error)
    return NextResponse.json({ 
      error: 'Failed to parse addon manifest. Please ensure the URL is correct and the addon is online.' 
    }, { status: 500 })
  }
}
