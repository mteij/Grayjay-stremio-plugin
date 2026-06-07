import { login, signup, magicLinkLogin, continueToDashboard } from './actions'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string, message?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans relative">
        <div className="absolute top-6 left-6 sm:top-10 sm:left-10 animate-fade-up">
          <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>

        <div className="w-full max-w-[400px] animate-fade-up">
          <Card className="w-full shadow-lg border-border">
            <CardHeader className="text-center pb-6 pt-6">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base mt-2">
                You are currently signed in as <span className="font-medium text-foreground block mt-1 truncate">{user.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={continueToDashboard} className="flex flex-col space-y-4">
                <SubmitButton className="w-full h-12 text-base font-medium">
                  Continue to Dashboard
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const searchParams = await props.searchParams
  const error = searchParams?.error
  const message = searchParams?.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans relative">
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 animate-fade-up">
        <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>
      </div>

      <div className="w-full max-w-[500px] animate-fade-up delay-100">
        <Card className="w-full shadow-lg border-border">
        <CardHeader className="text-center pb-8 pt-6">
          <CardTitle className="text-3xl font-bold sm:text-4xl tracking-tight">
            Stremio + Grayjay
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Sign in to configure your Stremio addons, TMDB keys, and stream preferences.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="h-12 px-4 text-base"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-base font-medium">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                className="h-12 px-4 text-base"
                placeholder="Enter your Password"
              />
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <SubmitButton
                formAction={login}
                className="w-full h-12 text-base font-medium"
              >
                Log in
              </SubmitButton>
              <SubmitButton
                formAction={signup}
                variant="outline"
                className="w-full h-12 text-base font-medium"
              >
                Create Account
              </SubmitButton>
              
              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="shrink-0 mx-4 text-sm text-muted-foreground uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-border"></div>
              </div>
              
              <SubmitButton
                formAction={magicLinkLogin}
                variant="secondary"
                className="w-full h-12 text-base font-medium"
              >
                Send Magic Link
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
