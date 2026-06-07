import { updatePassword } from '../login/actions'
import { SubmitButton } from '@/components/SubmitButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function UpdatePasswordPage(props: { searchParams: Promise<{ message?: string, error?: string }> }) {
  const searchParams = await props.searchParams
  const message = searchParams?.message
  const error = searchParams?.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <Card className="w-full max-w-[500px] shadow-lg border-border">
        <CardHeader className="text-center pb-6 pt-6">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Update Password
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Enter your new password below.
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
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">New Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-12 px-4 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base font-medium">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="h-12 px-4 text-base"
                />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton
                formAction={updatePassword}
                className="w-full h-12 text-base font-medium"
              >
                Update Password
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
