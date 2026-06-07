'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  generalContent: React.ReactNode
  preferencesContent: React.ReactNode
  integrationsContent: React.ReactNode
  submitContent: React.ReactNode
}

export default function DashboardTabs({ generalContent, preferencesContent, integrationsContent, submitContent }: Props) {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop Tabs */}
        <div className="hidden sm:block mb-6">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted p-1 rounded-lg">
            <TabsTrigger value="general" className="text-base">General Settings</TabsTrigger>
            <TabsTrigger value="preferences" className="text-base">Stream Preferences</TabsTrigger>
            <TabsTrigger value="integrations" className="text-base">Integrations</TabsTrigger>
          </TabsList>
        </div>

        {/* Mobile Dropdown */}
        <div className="sm:hidden mb-6 relative w-full">
          <select 
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full h-12 appearance-none bg-muted/50 border border-border text-foreground text-base rounded-lg px-4 font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer shadow-sm"
          >
            <option value="general">General Settings</option>
            <option value="preferences">Stream Preferences</option>
            <option value="integrations">Integrations</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
        <TabsContent key="general" value="general" className="space-y-6 animate-fade-up outline-none">
          {generalContent}
        </TabsContent>
        
        <TabsContent key="preferences" value="preferences" className="space-y-6 animate-fade-up outline-none">
          {preferencesContent}
        </TabsContent>

        <TabsContent key="integrations" value="integrations" className="space-y-6 animate-fade-up outline-none">
          {integrationsContent}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-8">
        {submitContent}
      </div>
    </div>
  )
}
