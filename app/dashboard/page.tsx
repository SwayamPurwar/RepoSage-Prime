'use client'

import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useUser } from '@clerk/nextjs'
import { Plus, Database, Key, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react'
import { LoadingCard } from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'

// Components
import { RepoCard, type Repo } from '@/components/dashboard/RepoCard'
import { AddRepoModal } from '@/components/dashboard/AddRepoModal'
import { ProgressBar } from '@/components/dashboard/ProgressBar'

type IngestEvent = {
  progress: number
  message: string
  repoId?: string
  alreadyIndexed?: boolean
  error?: boolean
}

function getDayGreeting(hours: number): string {
  if (hours < 12) return 'morning'
  if (hours < 18) return 'afternoon'
  return 'evening'
}

async function processIngestStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (evt: IngestEvent) => boolean,
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) return

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''

    for (const part of parts) {
      const line = part.split('\n').find((item) => item.startsWith('data:'))
      if (!line) continue
      const evt = JSON.parse(line.replace(/^data:\s*/, '')) as IngestEvent
      const shouldStop = onEvent(evt)
      if (shouldStop) return
    }
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  const [repos, setRepos] = useState<Repo[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>('hobby')
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)

  // API Key State
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')

  const [ingest, setIngest] = useState<{
    running: boolean
    progress: number
    message: string
    repoId?: string
  }>({ running: false, progress: 0, message: '' })

  const canInteract = isLoaded && isSignedIn

  const fetchRepos = useCallback(async () => {
    if (!canInteract) return
    setReposLoading(true)
    setReposError(null)
    try {
      const res = await fetch('/api/repos', { method: 'GET' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || `Failed to fetch repos (${res.status})`)
      }
      const data = (await res.json()) as { repos: Repo[], plan: string }
      setRepos(data.repos || [])
      setCurrentPlan(data.plan || 'hobby')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch repos'
      setReposError(msg)
    } finally {
      setReposLoading(false)
    }
  }, [canInteract])

  // NEW: API Key Generation Logic
  const generateApiKey = async () => {
    setIsGeneratingKey(true)
    try {
      const res = await fetch('/api/user/keys', { method: 'POST' })
      const data = await res.json()
      if (data.key) {
        setApiKey(data.key)
      }
    } catch (err) {
      console.error("Failed to generate API Key", err)
    } finally {
      setIsGeneratingKey(false)
    }
  }

  const copyToClipboard = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setHasCopied(true)
    setTimeout(() => setHasCopied(false), 2000)
  }

  useEffect(() => {
    document.title = "Dashboard | RespoSage Prime"
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in')
      return
    }
    void fetchRepos()
  }, [fetchRepos, isLoaded, isSignedIn, router])

  const indexedCount = useMemo(() => repos.filter(r => (r.isIndexed ?? 0) === 1).length, [repos])
  const planLabel = useMemo(() => {
    const map: Record<string, string> = {
      hobby: 'Hobby',
      atelier: 'Atelier',
      sovereign: 'Sovereign',
    }
    return map[currentPlan] ?? currentPlan
  }, [currentPlan])

  const closeModal = useCallback(() => {
    if (ingest.running) return
    setIsModalOpen(false)
    setRepoUrl('')
  }, [ingest.running])

  const startIngest = useCallback(async () => {
    if (!repoUrl.trim() || ingest.running) return
    setIngest({ running: true, progress: 0, message: 'Starting...', repoId: undefined })

    const onEvent = (evt: IngestEvent): boolean => {
      setIngest((prev) => ({
        running: true,
        progress: evt.progress ?? prev.progress,
        message: evt.message || prev.message,
        repoId: evt.repoId || prev.repoId,
      }))

      if (evt.progress < 100) return false
      setIngest((prev) => ({ ...prev, running: false }))
      closeModal()
      void fetchRepos()
      return true
    }

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      })
      if (!res.ok) throw new Error('Ingest request failed')
      const reader = res.body?.getReader()
      if (!reader) return

      await processIngestStream(reader, onEvent)
    } catch (e) {
      setIngest({ running: false, progress: 0, message: '' })
      setReposError(e instanceof Error ? e.message : 'Indexing failed')
    }
  }, [closeModal, fetchRepos, ingest.running, repoUrl])

  const deleteRepo = useCallback(async (id: string) => {
    try {
      await fetch(`/api/repos/${id}`, { method: 'DELETE' })
      void fetchRepos()
    } catch {
      setReposError('Delete failed')
    }
  }, [fetchRepos])

  const greeting = useMemo(() => getDayGreeting(new Date().getHours()), [])

  let repositoriesContent: ReactElement
  if (reposLoading) {
    repositoriesContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <LoadingCard /> <LoadingCard /> <LoadingCard />
      </div>
    )
  } else if (repos.length === 0) {
    repositoriesContent = (
      <div className="relative overflow-hidden premium-card rounded-[2.5rem] p-12 text-center group">
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 bg-(--accent)/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-display font-bold text-4xl">Index your first repository</h2>
          <p className="font-mono text-sm text-(--muted) mt-4 max-w-lg mx-auto leading-relaxed uppercase tracking-[0.08em]">
            Connect a repository to unlock deep review intelligence, repository chat, and guided code health insights.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="mt-10 inline-flex items-center gap-2 font-mono text-sm px-8 py-4 rounded-2xl border border-(--accent)/35 bg-(--accent)/10 text-(--accent-soft) hover:bg-(--accent)/20 transition-all">
            <Plus size={18} /> Add Your First Repo
          </button>
        </div>
      </div>
    )
  } else {
    repositoriesContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {repos.map((r) => (
          <RepoCard key={r.id} repo={r} isIndexing={ingest.running && ingest.repoId === r.id} onDelete={deleteRepo} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="relative pt-30 pb-20 px-5 md:px-10">
        <div className="premium-grid absolute inset-0 opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 border border-(--line) text-(--accent-soft) text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full bg-[rgba(247,239,221,0.04)] font-mono w-fit">
                Control Center
              </div>
              <h1 className="font-display font-bold text-4xl md:text-5xl mt-4 leading-[0.95] text-glow">
                {`Good ${greeting}, ${user?.firstName || 'Developer'}.`}
              </h1>
              <p className="text-(--muted) font-mono text-sm mt-3 flex items-center gap-2 uppercase tracking-[0.14em]">
                Active Tier: <span className="text-(--accent-soft) font-semibold">{planLabel}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 border border-(--line) bg-[rgba(247,239,221,0.03)] rounded-xl px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-(--accent)" />
                <div className="font-mono text-xs text-(--muted)">
                  Indexed <span className="text-(--text)">{indexedCount}</span> / {repos.length}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="font-mono text-sm px-4 py-3 rounded-xl border border-(--accent)/35 bg-(--accent)/10 text-(--accent-soft) hover:bg-(--accent)/15 transition"
              >
                Add Repository
              </button>
            </div>
          </div>

          <section className="relative mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="premium-card rounded-2xl p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">Connected Repositories</p>
              <p className="mt-2 font-display text-4xl leading-none">{repos.length}</p>
            </div>
            <div className="premium-card rounded-2xl p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">Indexed For Analysis</p>
              <p className="mt-2 font-display text-4xl leading-none">{indexedCount}</p>
            </div>
            <div className="premium-card rounded-2xl p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">Current Tier</p>
              <p className="mt-2 font-display text-4xl leading-none">{planLabel}</p>
            </div>
          </section>

          {ingest.running && (
            <ProgressBar progress={ingest.progress} message={ingest.message || 'Processing repository content...'} />
          )}

          {/* API Key Section (Option B Implementation) */}
          <section className="mt-10 premium-card rounded-2xl p-6 md:p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <ShieldCheck size={120} className="text-(--accent-soft)" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <Key size={18} className="text-(--accent-soft)" />
                    <h2 className="font-display font-bold text-2xl">Developer Access Key</h2>
                </div>
                <p className="text-(--muted) font-mono text-xs mb-6 max-w-2xl leading-relaxed uppercase tracking-[0.08em]">
                    Generate an API key for the RespoSage Prime VS Code integration. Treat this key like a password and rotate when needed.
                </p>

                {apiKey ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="w-full sm:flex-1 font-mono text-sm bg-[rgba(0,0,0,0.24)] border border-(--line) rounded-xl px-4 py-3 text-(--accent-soft) break-all">
                            {apiKey}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button onClick={copyToClipboard} variant="outline" className="flex-1 sm:flex-none border-(--line) hover:bg-white/5">
                            {hasCopied ? <Check size={16} className="text-(--accent-soft)" /> : <Copy size={16} />}
                                <span className="ml-2">{hasCopied ? 'Copied' : 'Copy'}</span>
                            </Button>
                          <Button onClick={generateApiKey} disabled={isGeneratingKey} variant="ghost" className="text-(--muted) hover:text-(--text)">
                                <RefreshCw size={16} className={isGeneratingKey ? 'animate-spin' : ''} />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button 
                        onClick={generateApiKey} 
                        disabled={isGeneratingKey}
                        className="bg-(--accent)/10 text-(--accent-soft) border border-(--accent)/30 hover:bg-(--accent)/20 font-mono text-xs py-5 px-6 rounded-xl"
                    >
                        {isGeneratingKey ? 'Generating...' : 'Generate VS Code API Key'}
                    </Button>
                )}
            </div>
          </section>

          {/* Repository List Section */}
          <div className="mt-12">
            <h3 className="font-display font-bold text-3xl mb-6 flex items-center gap-3">
                <Database size={20} className="text-(--accent-soft)" />
                Your Repositories
            </h3>
            {repositoriesContent}
            {reposError && (
              <p className="mt-4 rounded-xl border border-[rgba(255,120,120,0.28)] bg-[rgba(255,120,120,0.07)] px-4 py-3 font-mono text-xs text-[#ffb3b3]">
                {reposError}
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <AddRepoModal 
        isOpen={isModalOpen} onClose={closeModal} repoUrl={repoUrl} setRepoUrl={setRepoUrl} 
        onStartIndexing={startIngest} isIndexing={ingest.running} indexingMessage={ingest.message} 
        indexingProgress={ingest.progress} currentPlan={currentPlan} repoCount={repos.length}
      />
    </div>
  )
}