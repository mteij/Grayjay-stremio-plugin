'use client'

import Link from 'next/link'
import QRCode from 'react-qr-code'
import { Smartphone, Settings, Code } from 'lucide-react'

export default function Home() {
  const pluginUrl = 'https://greyjay-stremio.netlify.app/plugin/Config.json'
  const grayjayDeepLink = `grayjay://plugin/${pluginUrl}`

  return (
    <div className="min-h-screen bg-dark font-sans text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Subtle Background Decorator */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[600px] z-10 flex flex-col items-center text-center">
        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Grayjay <span className="text-primary">+</span> Stremio
        </h1>
        <p className="text-base md:text-lg text-body-color mb-8 leading-relaxed max-w-[450px]">
          Watch your favorite movies and shows on Grayjay using video streams directly from your personal Stremio addons.
        </p>

        {/* QR Code & Mobile Install */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-white p-3 rounded-xl shadow-md mb-4 transition-transform hover:scale-105">
            <QRCode 
              value={grayjayDeepLink} 
              size={150}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          </div>
          <p className="text-sm text-dark-6 mb-5">Scan QR code to install on mobile</p>
          
          <a 
            href={grayjayDeepLink}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-base font-medium text-white transition hover:bg-opacity-90 shadow-lg"
          >
            <Smartphone className="w-5 h-5" />
            Open in Grayjay
          </a>
        </div>

        {/* Secondary Navigation */}
        <div className="pt-6 border-t border-dark-3 w-full max-w-[400px] flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link 
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-body-color transition hover:text-primary"
          >
            <Settings className="w-4 h-4" />
            Configure Addons
          </Link>
          <a 
            href="https://github.com/mteij/Grayjay-stremio-pluggin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-body-color transition hover:text-primary"
          >
            <Code className="w-4 h-4" />
            Source Code
          </a>
        </div>
      </div>
    </div>
  )
}
