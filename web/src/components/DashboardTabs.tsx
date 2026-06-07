'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  generalContent: React.ReactNode
  preferencesContent: React.ReactNode
  integrationsContent: React.ReactNode
  submitContent: React.ReactNode
}

export default function DashboardTabs({ generalContent, preferencesContent, integrationsContent, submitContent }: Props) {
  return (
    <div className="w-full">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="general" className="text-base">General Settings</TabsTrigger>
          <TabsTrigger value="preferences" className="text-base">Stream Preferences</TabsTrigger>
          <TabsTrigger value="integrations" className="text-base">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent key="general" value="general" className="space-y-6 animate-fade-up outline-none mt-6">
          {generalContent}
        </TabsContent>
        
        <TabsContent key="preferences" value="preferences" className="space-y-6 animate-fade-up outline-none mt-6">
          {preferencesContent}
        </TabsContent>

        <TabsContent key="integrations" value="integrations" className="space-y-6 animate-fade-up outline-none mt-6">
          {integrationsContent}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-8">
        {submitContent}
      </div>
    </div>
  )
}
