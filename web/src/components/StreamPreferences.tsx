'use client'

import React, { useState, useEffect } from 'react'
import { StreamPreferences, DEFAULT_PREFERENCES } from '@/lib/streamPreferences'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  initialPrefs?: Partial<StreamPreferences>
}

export default function StreamPreferencesConfig({ initialPrefs }: Props) {
  const [prefs, setPrefs] = useState<StreamPreferences>({ ...DEFAULT_PREFERENCES, ...initialPrefs })

  const moveItem = (listName: keyof StreamPreferences, index: number, direction: 'up' | 'down') => {
    const list = [...prefs[listName] as string[]]
    if (direction === 'up' && index > 0) {
      [list[index - 1], list[index]] = [list[index], list[index - 1]]
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index + 1], list[index]] = [list[index], list[index + 1]]
    }
    setPrefs({ ...prefs, [listName]: list })
  }

  const renderSortableList = (listName: keyof StreamPreferences, title: string, description: string) => (
    <div className="mb-6">
      <label className="mb-2 block text-base font-medium text-white">{title}</label>
      <p className="mb-3 text-sm text-body-color">{description}</p>
      <div className="space-y-2">
        {(prefs[listName] as string[]).map((item, index) => (
          <div key={item} className="flex items-center justify-between rounded bg-dark-3 px-4 py-2 border border-dark-4">
            <span className="text-white text-sm font-medium">{item}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => moveItem(listName, index, 'up')}
                disabled={index === 0}
                className="text-body-color hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(listName, index, 'down')}
                disabled={index === (prefs[listName] as string[]).length - 1}
                className="text-body-color hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-dark-2 rounded-xl border border-dark-3 p-8 sm:p-11 shadow-card mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">Stream Preferences</h2>
      
      {/* Hidden input to submit the prefs JSON to the server action */}
      <input type="hidden" name="stream_preferences" value={JSON.stringify(prefs)} />

      {renderSortableList('resolutionOrder', 'Resolution Priority', 'Higher resolutions score more. Order them from most to least preferred.')}
      {renderSortableList('codecOrder', 'Codec Priority', 'Order codecs from most to least preferred.')}
      {renderSortableList('qualityOrder', 'Quality Priority', 'Order stream qualities from most to least preferred.')}
      
      <div className="mb-6">
        <label className="mb-2 block text-base font-medium text-white">HDR Preference</label>
        <p className="mb-3 text-sm text-body-color">Prefer streams with HDR/Dolby Vision, exclude them, or no preference.</p>
        <div className="flex rounded-md shadow-sm" role="group">
          {(['prefer', 'exclude', 'any'] as const).map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setPrefs({ ...prefs, hdrPreference: option })}
              className={`flex-1 px-4 py-2 text-sm font-medium border ${
                prefs.hdrPreference === option 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-dark-3 text-body-color border-dark-4 hover:bg-dark-4'
              } ${option === 'prefer' ? 'rounded-l-lg' : option === 'any' ? 'rounded-r-lg' : ''}`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-base font-medium text-white">Max File Size (GB)</label>
        <p className="mb-2 text-sm text-body-color">Streams larger than this will be hidden. Leave 0 or empty for unlimited.</p>
        <input
          type="number"
          value={prefs.maxSizeGB || ''}
          onChange={(e) => setPrefs({ ...prefs, maxSizeGB: e.target.value ? Number(e.target.value) : null })}
          className="w-full rounded-md border border-dark-3 bg-transparent px-5 py-3 text-base text-body-color outline-none transition focus:border-primary focus-visible:shadow-none dark:text-white"
          placeholder="Unlimited"
        />
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-base font-medium text-white">Min Seeders</label>
        <p className="mb-2 text-sm text-body-color">Torrent streams with fewer seeders will be hidden. Leave 0 or empty for no minimum.</p>
        <input
          type="number"
          value={prefs.minSeeders || ''}
          onChange={(e) => setPrefs({ ...prefs, minSeeders: e.target.value ? Number(e.target.value) : null })}
          className="w-full rounded-md border border-dark-3 bg-transparent px-5 py-3 text-base text-body-color outline-none transition focus:border-primary focus-visible:shadow-none dark:text-white"
          placeholder="No minimum"
        />
      </div>
    </div>
  )
}
