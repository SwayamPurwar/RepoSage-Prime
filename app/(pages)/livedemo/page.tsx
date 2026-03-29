'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { ArrowRight, Lock, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const MAX_FREE_RUNS = 3

type DemoFeature = 'chat' | 'review' | 'bug' | 'onboarding' | 'readme'

type DemoFeatureOption = {
  id: DemoFeature
  label: string
  premiumLabel: string
}

const featureOptions: DemoFeatureOption[] = [
  { id: 'chat', label: 'Dialogue', premiumLabel: 'Repository Dialogue' },
  { id: 'review', label: 'Due Diligence', premiumLabel: 'Executive Pull Request Review' },
  { id: 'bug', label: 'Risk Scan', premiumLabel: 'Architecture + Bug Surface Scan' },
  { id: 'onboarding', label: 'Briefing', premiumLabel: 'Team Onboarding Briefing' },
  { id: 'readme', label: 'Narrative', premiumLabel: 'Brand-Grade README Narrative' },
]

const valueSignals = [
  'No credit card required',
  '3 flagship simulations included',
  'Designed for engineering leaders',
]

export default function DemoPage() {
  const { isSignedIn } = useAuth()
  const [selectedFeature, setSelectedFeature] = useState<DemoFeature>('chat')
  const [repoUrl, setRepoUrl] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [runCount, setRunCount] = useState(0)

  useEffect(() => {
    const storedCount = localStorage.getItem('codesense_demo_runs')
    if (storedCount) setRunCount(Number.parseInt(storedCount, 10))

    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'page_visit' }),
    }).catch(() => {})
  }, [])

  const isLimitReached = runCount >= MAX_FREE_RUNS

  const isPromptRequired = selectedFeature !== 'onboarding' && selectedFeature !== 'readme'
  const runButtonText = getRunButtonText({ isLoading, isLimitReached, runCount })
  const placeholderText = getPlaceholderText(selectedFeature)

  const selectedPremiumLabel = useMemo(
    () => featureOptions.find((f) => f.id === selectedFeature)?.premiumLabel ?? '',
    [selectedFeature]
  )

  const handleRunDemo = async () => {
    const validationError = validateInput({ isLimitReached, repoUrl, userInput, isPromptRequired })
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    void trackDemoRun(selectedFeature)

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: selectedFeature, repoUrl, userInput }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Something went wrong')

      setResult(data.result)
      const nextCount = runCount + 1
      setRunCount(nextCount)
      localStorage.setItem('codesense_demo_runs', nextCount.toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      <main className="relative max-w-7xl mx-auto px-5 md:px-10 pt-30 pb-20">
        <div className="premium-grid absolute inset-0 opacity-40 pointer-events-none" />

        <section className="relative mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-(--accent-soft) font-mono">
            <Sparkles size={12} />
            Maison Live Experience
          </div>
          <h1 className="mt-5 font-display text-5xl md:text-6xl leading-[0.95] tracking-tight text-glow">
            <span>Preview flagship code intelligence</span>
            <span className="block text-(--accent)">with decision-grade simulation output.</span>
          </h1>
          <p className="mt-4 max-w-3xl text-(--muted)">
            Explore how RespoSage Prime turns repository complexity into strategic clarity, risk insight, and premium-quality technical narratives before you activate a paid plan.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {valueSignals.map((item) => (
              <span
                key={item}
                className="rounded-full border border-(--line) bg-[rgba(247,239,221,0.03)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-(--muted) font-mono"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="relative grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="premium-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -top-10 right-0 h-28 w-28 rounded-full bg-(--accent)/25 blur-3xl pointer-events-none" />

            {isLimitReached && !isSignedIn && <LimitOverlay maxRuns={MAX_FREE_RUNS} />}

            <div className={isLimitReached ? 'opacity-50 pointer-events-none' : ''}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl">Simulation Console</h2>
                  <p className="text-sm text-(--muted) mt-2">Run premium product storytelling flows with realistic AI simulation quality.</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] font-mono border ${isLimitReached ? 'border-red-400/40 text-red-300 bg-red-400/10' : 'border-(--accent)/40 text-(--accent-soft) bg-(--accent)/10'}`}>
                  {Math.max(MAX_FREE_RUNS - runCount, 0)} runs left
                </span>
              </div>

              <div className="mt-8 space-y-7">
                <div>
                  <label htmlFor="repo-url" className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--muted)">
                    Repository URL
                  </label>
                  <input
                    id="repo-url"
                    type="text"
                    placeholder="https://github.com/owner/repository"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={isLimitReached}
                    className="mt-2 w-full rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] px-4 py-3 text-sm text-(--text) focus:outline-none focus:border-(--accent) transition disabled:opacity-50"
                  />
                </div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--muted)">Select Experience</p>
                  <div aria-label="Select experience" className="mt-3 flex flex-wrap gap-2">
                    {featureOptions.map((feature) => (
                      <button
                        key={feature.id}
                        type="button"
                        disabled={isLimitReached}
                        onClick={() => setSelectedFeature(feature.id)}
                        className={`rounded-full px-4 py-2 font-mono text-xs border transition ${
                          selectedFeature === feature.id
                            ? 'bg-(--accent) text-[#181106] border-(--accent)'
                            : 'bg-transparent text-(--muted) border-(--line) hover:text-(--text) hover:border-(--accent)/40'
                        }`}
                      >
                        {feature.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-(--muted)">{selectedPremiumLabel}</p>
                </div>

                <div>
                  {isPromptRequired ? (
                    <>
                      <label htmlFor="prompt-input" className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--muted)">
                        {selectedFeature === 'chat' ? 'Question or Prompt' : 'Code or Diff Context'}
                      </label>
                      <textarea
                        id="prompt-input"
                        rows={6}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={isLimitReached}
                        placeholder={placeholderText}
                        className="mt-2 w-full rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] px-4 py-3 text-sm text-(--text) focus:outline-none focus:border-(--accent) transition resize-none disabled:opacity-50"
                      />
                    </>
                  ) : (
                    <div className="rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-4 text-sm text-(--muted)">
                      {selectedFeature === 'onboarding'
                        ? 'The simulation produces an onboarding briefing designed for fast team ramp-up and architectural context clarity.'
                        : 'The simulation generates a polished README narrative optimized for credibility, trust, and adoption.'}
                    </div>
                  )}
                </div>

                {error && <p className="text-xs text-red-300 font-mono">{error}</p>}

                <button
                  type="button"
                  onClick={handleRunDemo}
                  disabled={isLoading || isLimitReached}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 bg-(--accent) text-[#181106] font-mono text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {runButtonText}
                  {!isLoading && !isLimitReached && <ArrowRight size={15} />}
                </button>
              </div>
            </div>
          </div>

          <DemoOutputPanel
            isLoading={isLoading}
            result={result}
            selectedFeature={selectedFeature}
            copied={copied}
            setCopied={setCopied}
            isSignedIn={isSignedIn}
            isLimitReached={isLimitReached}
          />
        </section>

        {!isSignedIn && (
          <section className="mt-10 rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-(--muted)">
              Demo mode is crafted for evaluation. Sign up to unlock full repository indexing, live context retrieval, and production-grade intelligence workflows.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-lg border border-(--accent) text-(--accent-soft) px-4 py-2 text-sm font-mono hover:bg-(--accent) hover:text-[#181106] transition"
            >
              Activate Maison Access
            </Link>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

function LimitOverlay({ maxRuns }: Readonly<{ maxRuns: number }>) {
  return (
    <div className="absolute inset-0 z-20 bg-[rgba(9,10,16,0.78)] backdrop-blur-sm rounded-3xl border border-(--line) flex flex-col items-center justify-center p-8 text-center">
      <div className="h-14 w-14 rounded-full bg-(--accent)/20 text-(--accent) flex items-center justify-center mb-4">
        <Lock size={28} />
      </div>
      <h2 className="font-display text-3xl leading-none">Flagship Preview Complete</h2>
      <p className="text-sm text-(--muted) mt-3 max-w-sm">
        You have used all {maxRuns} complimentary simulations. Create an account to continue with full repository intelligence.
      </p>
      <Link
        href="/sign-up"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 bg-(--accent) text-[#181106] font-mono text-sm font-semibold hover:brightness-110 transition"
      >
        Unlock Maison Access
        <ArrowRight size={15} />
      </Link>
    </div>
  )
}

function DemoOutputPanel({
  isLoading,
  result,
  selectedFeature,
  copied,
  setCopied,
  isSignedIn,
  isLimitReached,
}: Readonly<{
  isLoading: boolean
  result: string | null
  selectedFeature: DemoFeature
  copied: boolean
  setCopied: (value: boolean) => void
  isSignedIn: boolean | undefined
  isLimitReached: boolean
}>) {
  if (isLoading) {
    return (
      <div className="premium-card rounded-3xl p-6 md:p-8 min-h-130 flex flex-col justify-center">
        <div className="space-y-3">
          <div className="h-4 rounded-full bg-[rgba(247,239,221,0.08)] w-2/3 animate-pulse" />
          <div className="h-4 rounded-full bg-[rgba(247,239,221,0.08)] w-full animate-pulse" />
          <div className="h-4 rounded-full bg-[rgba(247,239,221,0.08)] w-5/6 animate-pulse" />
          <div className="h-4 rounded-full bg-[rgba(247,239,221,0.08)] w-3/4 animate-pulse" />
        </div>
        <p className="mt-6 text-xs text-(--muted) font-mono text-center">Composing flagship-grade intelligence response...</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="premium-card rounded-3xl p-6 md:p-8 min-h-130 flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 className="font-display text-2xl">{getResultTitle(selectedFeature)}</h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] rounded-full bg-(--accent)/10 border border-(--accent)/40 text-(--accent-soft) px-3 py-1">
            Complete
          </span>
        </div>

        <div className="relative flex-1 overflow-y-auto pr-1 max-h-105">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(result)
              setCopied(true)
              globalThis.setTimeout(() => setCopied(false), 2000)
            }}
            className="absolute right-0 top-0 rounded-md border border-(--line) bg-[rgba(247,239,221,0.03)] px-2 py-1 font-mono text-xs text-(--muted) hover:text-(--text) transition"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <p className="pt-9 whitespace-pre-wrap text-sm leading-relaxed text-(--text)/90 font-mono">{result}</p>
        </div>

        {(!isSignedIn || isLimitReached) && (
          <Link
            href="/sign-up"
            className="mt-6 inline-flex items-center justify-center rounded-xl px-4 py-3 bg-(--aqua)/85 text-[#081011] font-mono text-sm font-semibold hover:bg-(--aqua-soft) transition"
          >
            Get Full Maison Access
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="premium-card rounded-3xl p-6 md:p-8 min-h-130 flex flex-col items-center justify-center text-center">
      <div className="h-14 w-14 rounded-full border border-(--line) flex items-center justify-center text-(--accent)">
        <Sparkles size={20} />
      </div>
      <h3 className="font-display text-2xl mt-4">Output Preview</h3>
      <p className="text-sm text-(--muted) mt-2 max-w-sm">
        Your simulation output appears here with premium narrative depth, risk framing, and clear execution guidance.
      </p>
    </div>
  )
}

function getResultTitle(feature: DemoFeature): string {
  if (feature === 'chat') return 'Repository Dialogue Output'
  if (feature === 'review') return 'Due Diligence Review Output'
  if (feature === 'bug') return 'Risk Scan Output'
  if (feature === 'onboarding') return 'Onboarding Briefing Output'
  return 'README Narrative Output'
}

function getPlaceholderText(feature: DemoFeature): string {
  if (feature === 'chat') {
    return 'Ask architecture, scale, and tradeoff questions for executive-ready clarity...'
  }

  if (feature === 'review') {
    return 'Paste pull request snippets for due-diligence style review feedback...'
  }

  return 'Paste risky code paths for premium risk scan simulation...'
}

function getRunButtonText({
  isLoading,
  isLimitReached,
  runCount,
}: Readonly<{
  isLoading: boolean
  isLimitReached: boolean
  runCount: number
}>): string {
  if (isLoading) return 'Running Maison Simulation...'
  if (isLimitReached) return 'Simulation Locked'
  return `Run Flagship Demo (${MAX_FREE_RUNS - runCount} left)`
}

function validateInput({
  isLimitReached,
  repoUrl,
  userInput,
  isPromptRequired,
}: Readonly<{
  isLimitReached: boolean
  repoUrl: string
  userInput: string
  isPromptRequired: boolean
}>): string | null {
  if (isLimitReached) return 'Demo limit reached. Please sign up to continue.'
  if (!repoUrl) return 'Please enter a repository URL'
  if (isPromptRequired && !userInput) return 'Please provide some input for the AI'
  return null
}

async function trackDemoRun(feature: DemoFeature): Promise<void> {
  await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'demo_run', feature }),
  })
}
