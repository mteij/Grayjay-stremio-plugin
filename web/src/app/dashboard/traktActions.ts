'use server'

export async function exchangeTraktPin(pin: string) {
  const clientId = process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID
  const clientSecret = process.env.TRAKT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return { success: false, message: 'Trakt credentials are not configured on the server.' }
  }

  if (!pin || pin.trim() === '') {
    return { success: false, message: 'Please enter a valid PIN.' }
  }

  try {
    const response = await fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': clientId,
        'User-Agent': 'GrayjayStremioPlugin/1.0'
      },
      body: JSON.stringify({
        code: pin.trim(),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
        grant_type: 'authorization_code'
      })
    })

    const text = await response.text()
    let data;
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('Trakt returned non-JSON response:', text)
      return { success: false, message: `Trakt API returned an invalid response (HTTP ${response.status}).` }
    }

    if (!response.ok) {
      console.error('Trakt OAuth Error:', data)
      return { success: false, message: data.error_description || data.error || 'Invalid PIN or Trakt error.' }
    }

    return {
      success: true,
      tokens: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.created_at + data.expires_in
      }
    }
  } catch (error: any) {
    console.error('Trakt Exchange Error:', error)
    return { success: false, message: `Failed to communicate with Trakt: ${error.message || error}` }
  }
}
