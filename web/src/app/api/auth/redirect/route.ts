import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    const html = `<html><head><meta http-equiv="refresh" content="0;url=/dashboard"></head><body style="background:#09090b;color:#fafafa;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>Restoring session...</h2><script>window.location.href = '/dashboard';</script></body></html>`;
    const response = new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
    
    response.cookies.set('grayjay-api-token', session.access_token, {
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });
    
    return response;
  }
  
  return NextResponse.redirect(new URL('/dashboard', request.url), 303);
}
