import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from 'lucide-react'
import { buttonVariants } from "@/components/ui/button"

export default function MagicLinkSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <Card className="w-full max-w-[500px] shadow-lg border-border text-center">
        <CardHeader className="pb-4 pt-8 items-center flex flex-col">
          <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold tracking-tight">
            Check your email
          </CardTitle>
          <CardDescription className="text-base mt-2 max-w-[300px] mx-auto">
            We've sent a magic link to your email address. Click the link to securely sign in.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 pb-8">
          <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full h-12 text-base font-medium" })}>
            Back to Sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
