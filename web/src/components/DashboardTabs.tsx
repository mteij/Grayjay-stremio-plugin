'use client'

import React, { useState } from 'react'

interface Props {
  generalContent: React.ReactNode
  preferencesContent: React.ReactNode
  submitContent: React.ReactNode
}

export default function DashboardTabs({ generalContent, preferencesContent, submitContent }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'preferences'>('general')

  return (
    <>
      <div className="mb-8 border-b border-dark-3">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-base transition-colors ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-body-color hover:text-white hover:border-dark-4'
            }`}
          >
            General Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-base transition-colors ${
              activeTab === 'preferences'
                ? 'border-primary text-primary'
                : 'border-transparent text-body-color hover:text-white hover:border-dark-4'
            }`}
          >
            Stream Preferences
          </button>
        </nav>
      </div>

      <div className={activeTab === 'general' ? 'block' : 'hidden'}>
        {generalContent}
      </div>
      
      <div className={activeTab === 'preferences' ? 'block' : 'hidden'}>
        {preferencesContent}
      </div>

      <div className="flex justify-end pt-6 border-t border-dark-3 mt-8">
        {submitContent}
      </div>
    </>
  )
}
