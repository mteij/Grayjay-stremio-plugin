'use client'

import React, { useState, useEffect } from 'react'
import { StreamPreferences, DEFAULT_PREFERENCES } from '@/lib/streamPreferences'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Props {
  initialPrefs?: Partial<StreamPreferences>
  onChange?: (prefs: StreamPreferences) => void
}

export default function StreamPreferencesConfig({ initialPrefs, onChange }: Props) {
  const [prefs, setPrefs] = useState<StreamPreferences>({ ...DEFAULT_PREFERENCES, ...initialPrefs })

  // Report state changes to parent form tracker
  useEffect(() => {
    if (onChange) onChange(prefs)
  }, [prefs, onChange])

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
    <div className="space-y-3">
      <div>
        <Label className="text-base font-medium">{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border">
        {(prefs[listName] as string[]).map((item, index) => (
          <div key={item} className="flex items-center bg-background rounded-md border text-sm font-medium overflow-hidden shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={(e) => { e.preventDefault(); moveItem(listName, index, 'up'); }}
              disabled={index === 0}
              className="h-8 w-6 rounded-none"
            >
              &lt;
            </Button>
            <span className="px-2">{item}</span>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={(e) => { e.preventDefault(); moveItem(listName, index, 'down'); }}
              disabled={index === (prefs[listName] as string[]).length - 1}
              className="h-8 w-6 rounded-none"
            >
              &gt;
            </Button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-8 pt-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="space-y-1">
          <h2 className="text-lg font-medium leading-none">Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your stream sorting and filtering.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger 
            render={
              <Button
                type="button"
                variant="outline"
              />
            }
          >
            Reset to Default
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all your stream preferences, including sorting priorities and filters, back to their recommended default settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => setPrefs(DEFAULT_PREFERENCES)}>
                Reset Preferences
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Hidden input to submit the prefs JSON to the server action */}
      <input type="hidden" name="stream_preferences" value={JSON.stringify(prefs)} />

      {renderSortableList('resolutionOrder', 'Resolution Priority', 'Higher resolutions score more. Order them from most to least preferred.')}
      {renderSortableList('codecOrder', 'Codec Priority', 'Order codecs from most to least preferred.')}
      {renderSortableList('qualityOrder', 'Quality Priority', 'Order stream qualities from most to least preferred.')}
      
      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium">HDR Preference</Label>
          <p className="text-sm text-muted-foreground">Prefer streams with HDR/Dolby Vision, exclude them, or no preference.</p>
        </div>
        <div className="flex rounded-md shadow-sm" role="group">
          {(['prefer', 'exclude', 'any'] as const).map(option => (
            <Button
              key={option}
              type="button"
              variant={prefs.hdrPreference === option ? "default" : "outline"}
              onClick={() => setPrefs({ ...prefs, hdrPreference: option })}
              className={`flex-1 ${option === 'prefer' ? 'rounded-r-none' : option === 'any' ? 'rounded-l-none border-l-0' : 'rounded-none border-l-0'} shadow-none`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium">Max File Size (GB)</Label>
          <p className="text-sm text-muted-foreground">Streams larger than this will be hidden. Leave empty for unlimited.</p>
        </div>
        <Input
          type="number"
          value={prefs.maxSizeGB || ''}
          onChange={(e) => setPrefs({ ...prefs, maxSizeGB: e.target.value ? Number(e.target.value) : null })}
          placeholder="Unlimited"
        />
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium">Min Seeders</Label>
          <p className="text-sm text-muted-foreground">Torrent streams with fewer seeders will be hidden. Leave empty for no minimum.</p>
        </div>
        <Input
          type="number"
          value={prefs.minSeeders || ''}
          onChange={(e) => setPrefs({ ...prefs, minSeeders: e.target.value ? Number(e.target.value) : null })}
          placeholder="No minimum"
        />
      </div>
    </div>
  )
}
