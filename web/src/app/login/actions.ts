'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=Invalid login credentials')
  }

  if (authData.session) {
    const cookieStore = await cookies()
    cookieStore.set('grayjay-api-token', authData.session.access_token, {
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const origin = (await headers()).get('origin')

  const { data: authData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=Could not create account: ' + error.message)
  }

  if (authData.user && !authData.session) {
    redirect('/login?message=Success! Please check your email to confirm your account before logging in.')
  }

  if (authData.session) {
    const cookieStore = await cookies()
    cookieStore.set('grayjay-api-token', authData.session.access_token, {
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = (await headers()).get('origin')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    redirect('/forgot-password?error=Could not send reset email: ' + error.message)
  }

  redirect('/forgot-password?message=Check your email for the password reset link.')
}

export async function magicLinkLogin(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = (await headers()).get('origin')

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=Could not send magic link: ' + error.message)
  }

  redirect('/login?message=Check your email for the magic link.')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    redirect('/update-password?error=Passwords do not match')
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    redirect('/update-password?error=Could not update password: ' + error.message)
  }

  redirect('/dashboard')
}

export async function continueToDashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const cookieStore = await cookies()
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    })
  }

  redirect('/dashboard')
}
