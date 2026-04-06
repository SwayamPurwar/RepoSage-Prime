'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import { Lock, Sparkles } from 'lucide-react'

const MAX_FREE_RUNS = 3

type FeatureId = 'chat' | 'review' | 'bug' | 'onboarding' | 'readme'

function getDemoButtonLabel(isLoading: boolean, isLimitReached: boolean) {
  if (isLoading) return 'Running Simulation...'
  if (isLimitReached) return 'Limit Reached'
  return 'Run Premium Demo'
}

export default function DemoPage() {
  const { isSignedIn } = useAuth()
  const [selectedFeature, setSelectedFeature] = useState<FeatureId>('chat')
  const [repoUrl, setRepoUrl] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [runCount, setRunCount] = useState(0)

  useEffect(() => {
    const storedCount = globalThis.window.localStorage.getItem('codesense_demo_runs')
    if (storedCount) {
      setRunCount(Number.parseInt(storedCount, 10))
    }

    const trackVisit = async () => {
      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_type: 'page_visit' }),
        })
      } catch (err) {
        console.warn('Analytics tracking failed', err)
      }
    }

    trackVisit()
  }, [])

  const isLimitReached = runCount >= MAX_FREE_RUNS
  const isPromptFeature = selectedFeature !== 'onboarding' && selectedFeature !== 'readme'

  const handleRunDemo = async () => {
    if (isLimitReached) {
      setError('Demo limit reached. Please sign up to continue.')
      return
    }

    if (!repoUrl) {
      setError('Please enter a repository URL.')
      return
    }

    if (isPromptFeature && !userInput) {
      setError('Please provide your prompt or code snippet.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      void fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'demo_run', feature: selectedFeature }),
      })
    } catch (err) {
      console.warn('Analytics tracking failed', err)
    }

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: selectedFeature,
          repoUrl,
          userInput,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setResult(data.result)
      const newCount = runCount + 1
      setRunCount(newCount)
      globalThis.window.localStorage.setItem('codesense_demo_runs', newCount.toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const renderOutputContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex flex-col justify-center">
          <div className="space-y-3">
            <div className="h-3 rounded-full bg-[rgba(255,255,255,0.08)] animate-pulse" />
            <div className="h-3 rounded-full bg-[rgba(255,255,255,0.08)] animate-pulse w-10/12" />
            <div className="h-3 rounded-full bg-[rgba(255,255,255,0.08)] animate-pulse w-8/12" />
          </div>
          <p className="text-sm text-[#b3ab9c] mt-6">Analyzing repository context...</p>
        </div>
      )
    }

    if (result) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-3xl text-[#f2ddbd] capitalize">{selectedFeature} output</h3>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(result)
                setCopied(true)
                globalThis.window.setTimeout(() => setCopied(false), 1800)
              }}
              className="rounded-full border border-[rgba(255,255,255,0.16)] px-3 py-1 text-xs text-[#d6cebf] hover:text-[#f5f2ec]"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="overflow-y-auto pr-1 max-h-96">
            <p className="whitespace-pre-wrap text-sm text-[#d6cebf] leading-relaxed">{result}</p>
          </div>
          {!isSignedIn && (
            <Link
              href="/sign-up"
              className="mt-6 inline-flex justify-center rounded-full bg-[#d7b47f] px-6 py-3 text-sm font-semibold text-[#141317] hover:bg-[#f2ddbd] transition"
            >
              Unlock Full Access
            </Link>
          )}
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <p className="font-display text-4xl text-[#f2ddbd]">Output Preview</p>
        <p className="text-sm text-[#b3ab9c] mt-3 max-w-xs">
          Your simulation result appears here with premium formatting and share-ready copy.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 md:px-10 pt-32 pb-24">
        <header className="text-center mb-12">
          <p className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#f2ddbd] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] rounded-full px-4 py-2">
            <Sparkles size={12} />
            Live Demo Environment
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mt-8">Experience premium repository intelligence.</h1>
          <p className="text-[#d6cebf] max-w-3xl mx-auto mt-5 leading-relaxed">
            Test the workflow using demo mode. Sign in to unlock full indexing, persistent workspace context, and advanced AI operations.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="relative rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-8">
            {isLimitReached && !isSignedIn && (
              <div className="absolute inset-0 z-10 rounded-3xl bg-[rgba(10,10,13,0.8)] backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[rgba(215,180,127,0.18)] text-[#f2ddbd] flex items-center justify-center mb-4">
                  <Lock size={26} />
                </div>
                <h2 className="font-display text-3xl text-[#f2ddbd]">Demo Limit Reached</h2>
                <p className="text-sm text-[#d6cebf] leading-relaxed mt-3 max-w-md">
                  You have used all {MAX_FREE_RUNS} complimentary simulations. Create a free account for full premium access.
                </p>
                <Link
                  href="/sign-up"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[#d7b47f] px-6 py-3 text-sm font-semibold text-[#141317] hover:bg-[#f2ddbd] transition"
                >
                  Create Free Account
                </Link>
              </div>
            )}

            <div className={isLimitReached ? 'opacity-55 pointer-events-none' : ''}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-3xl">Simulation Input</h2>
                <span className="text-[10px] uppercase tracking-[0.15em] rounded-full border border-[rgba(215,180,127,0.4)] bg-[rgba(215,180,127,0.12)] px-3 py-1 text-[#f2ddbd]">
                  {Math.max(0, MAX_FREE_RUNS - runCount)} runs left
                </span>
              </div>

              <div className="space-y-7 mt-8">
                <div>
                  <label htmlFor="repo-url" className="text-[11px] uppercase tracking-[0.18em] text-[#b3ab9c]">Repository URL</label>
                  <input
                    id="repo-url"
                    type="text"
                    placeholder="https://github.com/owner/repository"
                    value={repoUrl}
                    onChange={(event) => setRepoUrl(event.target.value)}
                    className="w-full mt-2 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] p-3 text-sm text-[#f5f2ec] placeholder:text-[#8f8778] focus:outline-none focus:border-[rgba(215,180,127,0.6)] transition"
                  />
                </div>

                <div>
                  <label htmlFor="feature-mode" className="text-[11px] uppercase tracking-[0.18em] text-[#b3ab9c]">Feature Mode</label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { id: 'chat', label: 'Chat' },
                      { id: 'review', label: 'PR Review' },
                      { id: 'bug', label: 'Bug Detection' },
                      { id: 'onboarding', label: 'Onboarding' },
                      { id: 'readme', label: 'README' },
                    ].map((feature) => (
                      <button
                        key={feature.id}
                        id="feature-mode"
                        onClick={() => setSelectedFeature(feature.id as FeatureId)}
                        className={`rounded-full px-4 py-2 text-xs transition ${
                          selectedFeature === feature.id
                            ? 'bg-[#d7b47f] text-[#141317] font-semibold'
                            : 'border border-[rgba(255,255,255,0.15)] text-[#d6cebf] hover:text-[#f5f2ec]'
                        }`}
                      >
                        {feature.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {isPromptFeature ? (
                    <>
                      <label htmlFor="prompt-input" className="text-[11px] uppercase tracking-[0.18em] text-[#b3ab9c]">
                        {selectedFeature === 'chat' ? 'Prompt' : 'Code Snippet'}
                      </label>
                      <textarea
                        id="prompt-input"
                        rows={6}
                        value={userInput}
                        onChange={(event) => setUserInput(event.target.value)}
                        placeholder={selectedFeature === 'chat' ? 'Ask a repository question...' : 'Paste code here...'}
                        className="w-full mt-2 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] p-3 text-sm text-[#f5f2ec] placeholder:text-[#8f8778] focus:outline-none focus:border-[rgba(215,180,127,0.6)] resize-none transition"
                      />
                    </>
                  ) : (
                    <div className="rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-[#d6cebf] leading-relaxed">
                      {selectedFeature === 'onboarding'
                        ? 'The assistant will create an onboarding narrative from repository context.'
                        : 'The assistant will produce a professional README draft from repository context.'}
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  onClick={handleRunDemo}
                  disabled={isLoading || isLimitReached}
                  className="w-full rounded-full bg-[#d7b47f] px-6 py-3 text-sm font-semibold text-[#141317] hover:bg-[#f2ddbd] transition disabled:opacity-60"
                >
                  {getDemoButtonLabel(isLoading, isLimitReached)}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-8 min-h-128">
            {renderOutputContent()}
          </section>
        </div>

        {!isSignedIn && (
          <aside className="mt-10 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.7)] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-[#d6cebf] leading-relaxed">
              Demo mode uses simulated intelligence. Create an account to activate real repository indexing and persistent AI memory.
            </p>
            <Link href="/sign-up">
              <Button variant="outline" size="sm" className="whitespace-nowrap border-[#d7b47f] text-[#f2ddbd] hover:bg-[#d7b47f] hover:text-[#141317]">
                Start Premium Trial
              </Button>
            </Link>
          </aside>
        )}
      </main>

      <Footer />
    </div>
  )
}
