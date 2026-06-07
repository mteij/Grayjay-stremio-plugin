import { resetPassword } from '../login/actions'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function ForgotPasswordPage(props: { searchParams: Promise<{ message?: string, error?: string }> }) {
  const searchParams = await props.searchParams
  const message = searchParams?.message
  const error = searchParams?.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <Card className="w-full max-w-[500px] shadow-lg border-border">
        <CardHeader className="text-center pb-6 pt-6">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Reset Password
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Enter your email and we will send you a reset link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert className="border-primary text-primary bg-primary/10">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            
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

            <div className="flex flex-col gap-3 pt-2">
              <SubmitButton
                formAction={resetPassword}
                className="w-full h-12 text-base font-medium"
              >
                Send Reset Link
              </SubmitButton>
            </div>
            
            <div className="text-center pt-2">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors">
                Back to Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
