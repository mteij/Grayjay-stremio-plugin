'use client'

import Link from 'next/link'
import QRCode from 'react-qr-code'
import { useState, useEffect } from 'react'
import { Smartphone, Settings, Code, Copy, Check } from 'lucide-react'
import { Button, buttonVariants } from "@/components/ui/button"

export default function Home() {
  const pluginUrl = 'https://grayjay-stremio.netlify.app/plugin/Config.json'
  const grayjayDeepLink = `grayjay://plugin/${pluginUrl}`

  const [mounted, setMounted] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [positions, setPositions] = useState([
    { top: '10%', left: '10%' },
    { top: '60%', left: '60%' },
    { top: '30%', left: '80%' }
  ])

  useEffect(() => {
    // Randomize starting positions clustered more towards the center (between 20% and 60%)
    setPositions([
      { top: `${Math.random() * 40 + 20}%`, left: `${Math.random() * 40 + 20}%` },
      { top: `${Math.random() * 40 + 20}%`, left: `${Math.random() * 40 + 20}%` },
      { top: `${Math.random() * 40 + 20}%`, left: `${Math.random() * 40 + 20}%` }
    ])
    setMounted(true)
    
    // Trigger logo flip to QR code after 1.5 seconds
    const timer = setTimeout(() => setShowQR(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(pluginUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Colorful Animated Blobs */}
      <div 
        className={`absolute w-[600px] h-[600px] rounded-full bg-blue-300 dark:bg-blue-600 blur-[120px] pointer-events-none animate-blob1 dark:mix-blend-screen transition-opacity duration-1000 ${mounted ? 'opacity-70 dark:opacity-80' : 'opacity-0'}`} 
        style={positions[0]} 
      />
      <div 
        className={`absolute w-[600px] h-[600px] rounded-full bg-purple-300 dark:bg-purple-600 blur-[120px] pointer-events-none animate-blob2 dark:mix-blend-screen transition-opacity duration-1000 ${mounted ? 'opacity-70 dark:opacity-80' : 'opacity-0'}`} 
        style={positions[1]} 
      />
      <div 
        className={`absolute w-[600px] h-[600px] rounded-full bg-pink-300 dark:bg-pink-600 blur-[120px] pointer-events-none animate-blob3 dark:mix-blend-screen transition-opacity duration-1000 ${mounted ? 'opacity-70 dark:opacity-80' : 'opacity-0'}`} 
        style={positions[2]} 
      />

      <div className="w-full max-w-[600px] z-10 flex flex-col items-center text-center">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Grayjay <span className="text-primary">+</span> Stremio
          </h1>
        </div>
        <p className="text-base md:text-lg text-muted-foreground mb-10 leading-relaxed max-w-[450px] animate-fade-up delay-100">
          Watch your favorite movies and shows on Grayjay using video streams directly from your personal Stremio addons.
        </p>

        {/* Morphing Logo -> QR Code & Mobile Install */}
        <div className="flex flex-col items-center justify-center mb-10 animate-fade-up delay-200">
          <div className="mb-4 transition-transform hover:scale-105">
            <div className={`flip-container w-[180px] h-[180px] cursor-pointer ${showQR ? 'flipped' : ''}`} onClick={() => setShowQR(!showQR)}>
              <div className="flip-inner w-full h-full">
                
                {/* Front: Plugin Logo */}
                <div className="flip-front flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/plugin/icon.png" alt="Stremio Plugin Logo" className="w-[150px] h-[150px] object-contain drop-shadow-2xl" />
                </div>
                
                {/* Back: QR Code */}
                <div className="flip-back flex items-center justify-center bg-white p-4 rounded-2xl shadow-xl dark:shadow-none dark:border border-border">
                  <QRCode 
                    value={grayjayDeepLink} 
                    size={150}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                </div>

              </div>
            </div>
          </div>
          
          <div className={`transition-opacity duration-700 ${showQR ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm text-muted-foreground mb-6 font-medium text-center">Scan QR code to install on mobile</p>
          </div>
          
          <div className="flex flex-row items-center justify-center gap-3 w-full animate-fade-up delay-300">
            <a href={grayjayDeepLink} className={buttonVariants({ size: "lg", className: "rounded-full shadow-lg h-12 px-8 flex-1 sm:flex-none" })}>
              <Smartphone className="w-5 h-5 mr-2" />
              Open in Grayjay
            </a>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full shadow-md h-12 px-6 flex-1 sm:flex-none bg-background/50 backdrop-blur-sm" })}>
              <Settings className="w-5 h-5 mr-2" />
              Configure
            </Link>
          </div>

          <div className="mt-4 animate-fade-up delay-400">
            <button 
              onClick={handleCopy} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center transition-colors px-3 py-1.5 rounded-full hover:bg-muted/50"
            >
              {copied ? <Check className="w-4 h-4 mr-1.5 text-primary" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? 'Copied to clipboard!' : 'Copy Plugin URL'}
            </button>
          </div>
        </div>

      </div>

      {/* Footer GitHub Link */}
      <div className="absolute bottom-6 animate-fade-up delay-500">
        <a href="https://github.com/mteij/Grayjay-stremio-pluggin" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </div>
  )
}
