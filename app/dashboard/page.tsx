'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import { Plus, Database, Key, Copy, Check, RefreshCw, ShieldCheck, Search, Activity } from 'lucide-react'
import { LoadingCard } from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { RepoCard, type Repo } from '@/components/dashboard/RepoCard'
import { AddRepoModal } from '@/components/dashboard/AddRepoModal'
import { ProgressBar } from '@/components/dashboard/ProgressBar'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
})

export default function DashboardPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  const { data, error, isLoading, mutate } = useSWR(
    isSignedIn ? '/api/repos' : null, 
    fetcher,
    { revalidateOnFocus: true }
  )

  const repos: Repo[] = data?.repos || []
  const currentPlan: string = data?.plan || 'hobby'

  const [repoQuery, setRepoQuery] = useState('')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')

  const [ingest, setIngest] = useState<{
    running: boolean; progress: number; message: string; repoId?: string
  }>({ running: false, progress: 0, message: '' })

  const generateApiKey = async () => {
    setIsGeneratingKey(true)
    try {
      const res = await fetch('/api/user/keys', { method: 'POST' })
      const keyData = await res.json()
      if (keyData.key) {
        setApiKey(keyData.key)
        toast.success("New API Key generated successfully")
      }
    } catch (err) {
      console.error("Failed to generate API Key", err)
      toast.error("Failed to generate API Key")
    } finally {
      setIsGeneratingKey(false)
    }
  }

  const copyToClipboard = () => {
    if (!apiKey) return
    globalThis.window.navigator.clipboard.writeText(apiKey)
    setHasCopied(true)
    toast.success("API Key copied to clipboard")
    setTimeout(() => setHasCopied(false), 2000)
  }

  useEffect(() => {
    document.title = 'Workspace | RepoSage Prime'
    if (isLoaded && !isSignedIn) router.replace('/sign-in')
  }, [isLoaded, isSignedIn, router])

  const indexedCount = useMemo(() => repos.filter(r => (r.isIndexed ?? 0) === 1).length, [repos])
  
  const filteredRepos = useMemo(() => repos.filter((repo) => {
    const q = repoQuery.trim().toLowerCase()
    if (!q) return true
    return repo.repoName.toLowerCase().includes(q) || repo.owner.toLowerCase().includes(q) || repo.repoUrl.toLowerCase().includes(q)
  }), [repoQuery, repos])

  const closeModal = useCallback(() => {
    if (ingest.running) return
    setIsModalOpen(false)
    setRepoUrl('')
  }, [ingest.running])

  const startIngest = useCallback(async () => {
    if (!repoUrl.trim() || ingest.running) return
    setIngest({ running: true, progress: 5, message: 'Starting background indexing...', repoId: undefined })
    
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Ingest request failed")

      if (result.alreadyIndexed) {
        setIngest({ running: false, progress: 100, message: 'Already indexed!', repoId: result.repoId })
        closeModal()
        toast.info("Repository is already indexed")
        router.push(`/repo/${result.repoId}/chat`) 
        return
      }

      setIngest({ running: true, progress: 20, message: 'Processing files in background... You can safely close this window!', repoId: result.repoId })
      mutate() 

      const pollInterval = setInterval(async () => {
        try {
          setIngest(prev => ({ ...prev, progress: Math.min(prev.progress + 5, 95) }))
          const statusRes = await fetch(`/api/repos/${result.repoId}`)
          if (!statusRes.ok) return

          const repoData = await statusRes.json()
          if (repoData.isIndexed === 1) {
            clearInterval(pollInterval)
            setIngest({ running: true, progress: 100, message: 'Indexing complete!', repoId: result.repoId })
            
            setTimeout(() => {
              setIngest({ running: false, progress: 0, message: '', repoId: undefined })
              closeModal()
              mutate()
              toast.success("Repository indexed successfully!")
              router.push(`/repo/${result.repoId}/chat`)
            }, 1000)
          }
        } catch (e) {
          console.error("Polling error", e)
        }
      }, 3000)

    } catch (e) {
      setIngest({ running: false, progress: 0, message: '' })
      toast.error(e instanceof Error ? e.message : "Failed to index repository")
    }
  }, [closeModal, ingest.running, repoUrl, router, mutate])

  const deleteRepo = useCallback(async (id: string) => {
    try {
      mutate((data: any) => ({ ...data, repos: data.repos.filter((r: Repo) => r.id !== id) }), false)
      await fetch(`/api/repos/${id}`, { method: 'DELETE' })
      mutate()
      toast.success("Repository deleted")
    } catch {
      mutate()
      toast.error("Failed to delete repository")
    }
  }, [mutate])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  if (!isLoaded || !isSignedIn) return null

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />
      <main className="pt-28 pb-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-7 md:p-9">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#f2ddbd]">
                  Workspace
                </p>
                <h1 className="font-display text-4xl md:text-6xl leading-[0.95] mt-5">
                  {greeting}, {user?.firstName || 'Developer'}
                </h1>
                <p className="text-[#d6cebf] mt-4">
                  Manage repositories, monitor indexing, and configure integration credentials.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => mutate()} variant="outline" className="rounded-full border-[rgba(255,255,255,0.16)] text-[#d6cebf] hover:text-[#f5f2ec]">
                  <RefreshCw size={14} className="mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => setIsModalOpen(true)} className="rounded-full bg-[#d7b47f] text-[#141317] hover:bg-[#f2ddbd]">
                  <Plus size={14} className="mr-2" />
                  Add Repository
                </Button>
              </div>
            </div>
          </section>

          {/* --- Updated Stats Section with Token Tracking --- */}
          <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5">
              <p className="text-[11px] uppercase tracking-[0.17em] text-[#b3ab9c]">Current Plan</p>
              <p className="text-2xl font-display text-[#f2ddbd] mt-2 uppercase">{isLoading ? '...' : currentPlan}</p>
            </div>
            
            <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5">
              <p className="text-[11px] uppercase tracking-[0.17em] text-[#b3ab9c]">Repositories</p>
              <p className="text-2xl font-display text-[#f2ddbd] mt-2">{isLoading ? '...' : repos.length}</p>
            </div>
            
            <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5">
              <p className="text-[11px] uppercase tracking-[0.17em] text-[#b3ab9c]">Indexed</p>
              <p className="text-2xl font-display text-[#f2ddbd] mt-2">{isLoading ? '...' : indexedCount}</p>
            </div>

            {/* NEW: API Token Usage Card */}
            <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-3">
                <p className="text-[11px] uppercase tracking-[0.17em] text-[#b3ab9c]">API Usage</p>
                <p className="text-[10px] font-mono text-[#8a8375]">
                  {isLoading ? '...' : `${(data?.tokensUsed || 0).toLocaleString()} / ${currentPlan === 'pro' ? '500K' : currentPlan === 'enterprise' ? '5M' : '50K'}`}
                </p>
              </div>
              <div className="w-full bg-[rgba(255,255,255,0.06)] rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    ((data?.tokensUsed || 0) / (currentPlan === 'pro' ? 500000 : currentPlan === 'enterprise' ? 5000000 : 50000)) * 100 > 85 
                      ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                      : 'bg-[#d7b47f] shadow-[0_0_10px_rgba(215,180,127,0.3)]'
                  }`} 
                  style={{ 
                    width: isLoading ? '0%' : `${Math.min(((data?.tokensUsed || 0) / (currentPlan === 'pro' ? 500000 : currentPlan === 'enterprise' ? 5000000 : 50000)) * 100, 100)}%` 
                  }} 
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-2xl border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)] px-5 py-4 text-sm text-[#fecaca]">
              Failed to load workspace data. Please refresh.
            </div>
          )}

          {ingest.running && (
            <ProgressBar progress={ingest.progress} message={ingest.message || 'Indexing repository'} />
          )}

          {/* Developer Credentials Section */}
          <section className="mt-8 p-6 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <ShieldCheck size={120} className="text-[#d7b47f]" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <Key size={18} className="text-[#d7b47f]" />
                <h2 className="font-display text-2xl text-white">Developer Credentials</h2>
              </div>
              <p className="text-[#d6cebf] text-sm mb-6 max-w-2xl">
                Generate an API key for VS Code integration. Treat this key as secret and rotate if exposed.
              </p>

              {apiKey ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:flex-1 text-sm bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.14)] rounded-xl px-4 py-3 text-[#f2ddbd] break-all">
                    {apiKey}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={copyToClipboard} variant="outline" className="flex-1 sm:flex-none border-[rgba(255,255,255,0.16)] hover:bg-white/5">
                      {hasCopied ? <Check size={16} className="text-[#d7b47f]" /> : <Copy size={16} />}
                      <span className="ml-2">{hasCopied ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <Button onClick={generateApiKey} disabled={isGeneratingKey} variant="ghost" className="text-[#d6cebf] hover:text-white">
                      <RefreshCw size={16} className={isGeneratingKey ? 'animate-spin' : ''} />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={generateApiKey} disabled={isGeneratingKey} className="bg-[#d7b47f] text-[#141317] hover:bg-[#f2ddbd] rounded-full">
                  {isGeneratingKey ? 'Generating...' : 'Generate VS Code API Key'}
                </Button>
              )}
            </div>
          </section>

          {/* Repository List Section */}
          <div className="mt-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h3 className="font-display font-bold text-3xl flex items-center gap-3">
                <Database size={22} className="text-[#d7b47f]" />
                Repository Portfolio
              </h3>

              <div className="relative w-full md:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3ab9c]" />
                <input
                  type="text"
                  value={repoQuery}
                  onChange={(e) => setRepoQuery(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(15,15,18,0.72)] pl-9 pr-4 py-2.5 text-sm text-[#f5f2ec] placeholder:text-[#8f8778] focus:outline-none focus:border-[rgba(215,180,127,0.6)]"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <LoadingCard /> <LoadingCard /> <LoadingCard />
              </div>
            ) : repos.length === 0 ? (
              <div className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-12 text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#d7b47f]/10 blur-[100px] pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="font-display font-bold text-3xl text-white">Index your first repository</h2>
                  <p className="text-sm text-[#d6cebf] mt-4 max-w-lg mx-auto">
                    Connect your GitHub codebase to unlock AI-powered chat and instant reviews.
                  </p>
                  <button onClick={() => setIsModalOpen(true)} className="mt-10 inline-flex items-center gap-2 text-sm px-8 py-4 rounded-2xl border border-[#d7b47f]/40 bg-[#d7b47f]/12 text-[#f2ddbd] hover:bg-[#d7b47f]/20 transition-all">
                    <Plus size={18} /> Add Your First Repo
                  </button>
                </div>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-10 text-center">
                <Activity size={28} className="mx-auto text-[#d7b47f]" />
                <h4 className="font-display text-3xl mt-4">No matching repositories</h4>
                <p className="text-[#d6cebf] mt-2">Try a different search keyword.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRepos.map((r) => (
                  <RepoCard key={r.id} repo={r} isIndexing={ingest.running && ingest.repoId === r.id} onDelete={deleteRepo} />
                ))}
              </div>
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