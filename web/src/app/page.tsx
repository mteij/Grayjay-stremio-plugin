'use client'

import Link from 'next/link'
import QRCode from 'react-qr-code'
import { Smartphone, Settings, ArrowRight } from 'lucide-react'

export default function Home() {
  const pluginUrl = 'https://greyjay-stremio.netlify.app/plugin/Config.json'
  const grayjayDeepLink = `grayjay://plugin/${pluginUrl}`

  return (
    <div className="min-h-screen bg-dark font-sans text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[800px] z-10 flex flex-col items-center text-center">
        {/* Header */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
          Grayjay <span className="text-primary">+</span> Stremio
        </h1>
        <p className="text-lg sm:text-xl text-body-color mb-12 max-w-[600px] leading-relaxed">
          Watch your favorite movies and shows on Grayjay using high-quality video streams directly from your personal Stremio addons.
        </p>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[700px]">
          
          {/* Card 1: Install Plugin */}
          <div className="bg-dark-2 rounded-2xl p-8 border border-dark-3 flex flex-col items-center shadow-card relative overflow-hidden group hover:border-primary/50 transition duration-300">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-primary" />
              Install Plugin
            </h2>
            <p className="text-body-color text-sm mb-8">
              Scan this QR code with your phone or tap the button below to install directly into Grayjay.
            </p>
            
            <div className="bg-white p-4 rounded-xl mb-8 shadow-md">
              <QRCode 
                value={grayjayDeepLink} 
                size={180}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>

            <a 
              href={grayjayDeepLink}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-base font-bold text-white transition hover:bg-opacity-90 shadow-lg"
            >
              Open in Grayjay
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Card 2: Configure Addons */}
          <div className="bg-dark-2 rounded-2xl p-8 border border-dark-3 flex flex-col items-center shadow-card relative overflow-hidden group hover:border-primary/50 transition duration-300">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <Settings className="w-6 h-6 text-dark-6" />
              Configure
            </h2>
            <p className="text-body-color text-sm mb-auto">
              Add your TMDB API Key and Stremio Addon URLs to customize your streaming experience.
            </p>
            
            <div className="my-10 w-full flex justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-dark-3 border-dashed flex items-center justify-center text-dark-5">
                <Settings className="w-12 h-12" />
              </div>
            </div>

            <Link 
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dark-3 bg-dark px-6 py-4 text-base font-bold text-white transition hover:border-primary hover:bg-primary/10"
            >
              Manage Settings
            </Link>
          </div>

        </div>

        {/* Footer info */}
        <p className="mt-12 text-sm text-dark-6">
          Created entirely using AI agents. 100% Free and Open Source.
        </p>
      </div>
    </div>
  )
}
