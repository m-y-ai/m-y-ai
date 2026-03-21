'use client'

import { useState, useEffect, useCallback } from 'react'
import { Package, Download, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type PackageType = 'pip' | 'npm' | 'ubuntu'

interface PackageList {
  pip: string[]
  npm: string[]
  ubuntu: string[]
}

interface InstallResult {
  ok: boolean
  installed: string[]
  error?: string
}

interface InstallResponse {
  ok: boolean
  results: Partial<Record<PackageType | 'all', InstallResult>>
  error?: string
}

const TYPE_META: Record<PackageType, { label: string; icon: string; color: string }> = {
  pip:    { label: 'Python (pip)',  icon: '🐍', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  npm:    { label: 'Node (npm)',    icon: '📦', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  ubuntu: { label: 'Ubuntu (apt)', icon: '🐧', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
}

function PackageTypeCard({
  type,
  packages,
  installing,
  result,
  onInstall,
}: {
  type: PackageType
  packages: string[]
  installing: boolean
  result: InstallResult | null
  onInstall: (type: PackageType) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = TYPE_META[type]

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <CardTitle className="text-sm font-semibold text-white">{meta.label}</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                {packages.length} package{packages.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {result && (
              result.ok
                ? <CheckCircle className="h-4 w-4 text-green-400" />
                : <XCircle className="h-4 w-4 text-red-400" />
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={installing}
              onClick={() => onInstall(type)}
              className="h-8 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              {installing
                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" />
              }
              <span className="ml-1.5 text-xs">{installing ? 'Installing…' : 'Install'}</span>
            </Button>
          </div>
        </div>

        {result && (
          <div className={`mt-2 rounded-md px-3 py-2 text-xs ${result.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
            {result.ok
              ? `✓ ${result.installed.length} packages installed`
              : `✗ ${result.error}`
            }
          </div>
        )}
      </CardHeader>

      {packages.length > 0 && (
        <CardContent className="pt-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex w-full items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Hide packages' : 'Show packages'}
          </button>

          {expanded && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {packages.map(pkg => (
                <Badge
                  key={pkg}
                  variant="outline"
                  className={`font-mono text-[10px] ${meta.color}`}
                >
                  {pkg}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export function PackageInstaller() {
  const [packages, setPackages] = useState<PackageList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [installing, setInstalling] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Partial<Record<PackageType | 'all', InstallResult>>>({})

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/install')
      if (!res.ok) throw new Error(`Failed to load packages (${res.status})`)
      setPackages(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  const runInstall = useCallback(async (type: PackageType | 'all') => {
    setInstalling(prev => ({ ...prev, [type]: true }))
    setResults(prev => { const n = { ...prev }; delete n[type]; return n })
    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data: InstallResponse = await res.json()

      if (type === 'all') {
        // Spread per-type results
        setResults(prev => ({ ...prev, ...data.results }))
      } else {
        const r = data.results?.[type] ?? { ok: data.ok, installed: [], error: data.error }
        setResults(prev => ({ ...prev, [type]: r }))
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (type === 'all') {
        const failAll = (['pip', 'npm', 'ubuntu'] as PackageType[]).reduce(
          (acc, t) => ({ ...acc, [t]: { ok: false, installed: [], error: msg } }),
          {} as Partial<Record<PackageType, InstallResult>>
        )
        setResults(prev => ({ ...prev, ...failAll }))
      } else {
        setResults(prev => ({ ...prev, [type]: { ok: false, installed: [], error: msg } }))
      }
    } finally {
      setInstalling(prev => ({ ...prev, [type]: false }))
    }
  }, [])

  const anyInstalling = Object.values(installing).some(Boolean)

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-zinc-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">System Dependencies</h2>
            <p className="text-xs text-zinc-500">
              Packages defined in <code className="font-mono text-zinc-400">storage/System/*.md</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchPackages}
            disabled={loading}
            className="h-8 border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            size="sm"
            disabled={anyInstalling || loading || !!error}
            onClick={() => runInstall('all')}
            className="h-8 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
          >
            {anyInstalling
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />
            }
            <span className="ml-1.5 text-xs">Install All</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
          <button onClick={fetchPackages} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Package cards */}
      {packages && !loading && (
        <div className="space-y-3">
          {(['pip', 'npm', 'ubuntu'] as PackageType[]).map(type => (
            <PackageTypeCard
              key={type}
              type={type}
              packages={packages[type]}
              installing={!!installing[type]}
              result={results[type] ?? null}
              onInstall={runInstall}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-600">
        Edit <code className="font-mono text-zinc-500">backend/storage/System/PIP_PACKAGES.md</code>,{' '}
        <code className="font-mono text-zinc-500">NPM_PACKAGES.md</code>, or{' '}
        <code className="font-mono text-zinc-500">UBUNTU_PACKAGES.md</code> to add/remove packages.
        Changes take effect on the next install run.
      </p>
    </div>
  )
}
