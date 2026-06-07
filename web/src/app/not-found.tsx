import Link from 'next/link'
import { Home, Compass } from 'lucide-react'
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center text-center animate-fade-up">
        
        <div className="mb-8 p-6 rounded-full bg-muted/50 border border-border/50">
          <Compass className="w-12 h-12 text-muted-foreground" />
        </div>
        
        <h1 className="text-6xl font-bold mb-4 tracking-tight">
          404
        </h1>
        
        <h2 className="text-xl font-medium mb-4 text-muted-foreground">
          Page not found
        </h2>
        
        <p className="text-muted-foreground mb-10 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <Link 
          href="/" 
          className={buttonVariants({ 
            variant: "default",
            size: "lg", 
            className: "rounded-full px-8 flex items-center justify-center gap-2 shadow-sm" 
          })}
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
