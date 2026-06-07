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
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex min-w-max sm:grid w-full sm:grid-cols-3 h-12 bg-muted p-1 rounded-lg">
            <TabsTrigger value="general" className="text-sm sm:text-base px-6 sm:px-0">General Settings</TabsTrigger>
            <TabsTrigger value="preferences" className="text-sm sm:text-base px-6 sm:px-0">Stream Preferences</TabsTrigger>
            <TabsTrigger value="integrations" className="text-sm sm:text-base px-6 sm:px-0">Integrations</TabsTrigger>
          </TabsList>
        </div>
        
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
