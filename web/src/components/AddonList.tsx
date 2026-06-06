'use client'

import { useState } from 'react'
import { ArrowUp, ArrowDown, Trash2, Plus, Loader2, Link as LinkIcon } from 'lucide-react'

export interface Addon {
  url: string
  name: string
  description: string
  logo: string
  version: string
}

export default function AddonList({ initialAddons }: { initialAddons: Addon[] }) {
  const [addons, setAddons] = useState<Addon[]>(initialAddons)
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      <div>
        <label className="mb-[10px] block text-base font-medium text-white">
          Add Stremio Addon
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => { setNewUrl(e.target.value); setError(''); }}
            placeholder="https://torrentio.strem.fun/manifest.json"
            className="w-full rounded-md border border-dark-3 bg-transparent px-5 py-3 text-base text-white outline-hidden focus:border-primary focus-visible:shadow-none transition"
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd(e)
                }
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading || !newUrl}
            className="flex items-center justify-center gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-base font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      {/* Addon List */}
      <div className="space-y-3">
        {addons.length === 0 ? (
          <div className="rounded-lg border border-dark-3 border-dashed p-8 text-center">
            <LinkIcon className="mx-auto h-8 w-8 text-dark-5 mb-3" />
            <p className="text-body-color">No addons added yet.</p>
            <p className="text-sm text-dark-6 mt-1">Paste a Stremio manifest URL above to get started.</p>
          </div>
        ) : (
          addons.map((addon, index) => (
            <div 
              key={addon.url} 
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-dark-3 bg-dark p-4 transition hover:border-primary/50"
            >
              <div className="flex items-center gap-4 flex-grow min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-md bg-dark-3 flex items-center justify-center overflow-hidden border border-dark-3">
                  {addon.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={addon.logo} alt={addon.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-xl font-bold text-dark-6">{addon.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-medium text-white" title={addon.name}>{addon.name}</h3>
                    <span className="shrink-0 rounded-full bg-dark-3 px-2 py-0.5 text-xs font-medium text-body-color">v{addon.version}</span>
                  </div>
                  <p className="truncate text-sm text-body-color" title={addon.description}>
                    {addon.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t border-dark-3 sm:border-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                <div className="flex flex-row sm:flex-col gap-1 mr-2">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-md text-body-color hover:bg-dark-3 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === addons.length - 1}
                    className="p-1.5 rounded-md text-body-color hover:bg-dark-3 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeAddon(index)}
                  className="p-2 rounded-md text-red-500 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/20"
                  title="Remove Addon"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
