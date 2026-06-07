'use client'

import React, { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Trash2, Plus, Loader2, Link as LinkIcon } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
export interface Addon {
  url: string
  name: string
  description: string
  logo: string
  version: string
}

export default function AddonList({ initialAddons, onChange }: { initialAddons: Addon[], onChange?: (addons: Addon[]) => void }) {
  const [addons, setAddons] = useState<Addon[]>(initialAddons)
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Report state changes to parent form tracker
  useEffect(() => {
    if (onChange) onChange(addons)
  }, [addons, onChange])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl) return

    // Basic URL validation
    let parsedUrl = newUrl.trim()
    if (!parsedUrl.startsWith('http')) {
      parsedUrl = 'https://' + parsedUrl
    }
    if (!parsedUrl.endsWith('manifest.json')) {
      if (!parsedUrl.endsWith('/')) parsedUrl += '/'
      parsedUrl += 'manifest.json'
    }

    if (addons.some(a => a.url === parsedUrl)) {
      setError('This addon is already in your list.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/parse-addon?url=${encodeURIComponent(parsedUrl)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load addon manifest')
      }

      setAddons([...addons, data])
      setNewUrl('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newAddons = [...addons]
    const temp = newAddons[index]
    newAddons[index] = newAddons[index - 1]
    newAddons[index - 1] = temp
    setAddons(newAddons)
  }

  const moveDown = (index: number) => {
    if (index === addons.length - 1) return
    const newAddons = [...addons]
    const temp = newAddons[index]
    newAddons[index] = newAddons[index + 1]
    newAddons[index + 1] = temp
    setAddons(newAddons)
  }

  const removeAddon = (index: number) => {
    setAddons(addons.filter((_, i) => i !== index))
  }

  // We need to inject the raw array of URLs into the form for our Server Action
  const addonUrls = addons.map(a => a.url)

  return (
    <div className="space-y-6">
      {/* Hidden input for the Server Action to pick up */}
      <input type="hidden" name="stremio_addons" value={JSON.stringify(addonUrls)} />

      {/* Add New Addon Form */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Add Stremio Addon</Label>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            value={newUrl}
            onChange={(e) => { setNewUrl(e.target.value); setError(''); }}
            placeholder="https://torrentio.strem.fun/manifest.json"
            className="flex-grow"
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd(e as any)
                }
            }}
          />
          <Button
            type="button"
            onClick={handleAdd as any}
            disabled={loading || !newUrl}
            className="shrink-0"
          >
            {loading ? <Loader2 className="mr-2 animate-spin w-5 h-5" /> : <Plus className="mr-2 w-5 h-5" />}
            Add
          </Button>
        </div>
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      </div>

      {/* Addon List */}
      <div className="flex flex-col gap-3">
        {addons.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center bg-muted/50">
            <LinkIcon className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">No addons added yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Paste a Stremio manifest URL above to get started.</p>
          </div>
        ) : (
          addons.map((addon, index) => (
            <Card key={addon.url} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 shadow-sm transition-shadow hover:shadow-md overflow-hidden">
              <div className="flex items-center gap-3 flex-grow min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-md bg-zinc-900 dark:bg-muted flex items-center justify-center overflow-hidden border border-zinc-800 dark:border-border">
                  {addon.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={addon.logo} alt={addon.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">{addon.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground" title={addon.name}>{addon.name}</h3>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">v{addon.version}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5" title={addon.description}>
                    {addon.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 mt-2 sm:mt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === addons.length - 1}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>
                <AlertDialog>
                  <AlertDialogTrigger 
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove Addon"
                      />
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Addon</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {addon.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeAddon(index)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
