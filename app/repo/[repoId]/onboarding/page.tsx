'use client'

import React, { useMemo, useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr' // <-- NEW: Import SWR
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LoadingDots } from '@/components/LoadingSpinner'

type Repo = {
  id: string
  repoName: string
  repoUrl: string
}

type ParsedLine =
  | { type: 'heading'; level: 2; content: string }
  | { type: 'list'; content: string }
  | { type: 'paragraph'; content: string }

function parseMarkdownLike(text: string): ParsedLine[] {
  const lines = text.split('\n')
  return lines.map((raw) => {
    const line = raw.trim()
    if (line.startsWith('##')) {
      return { type: 'heading', level: 2, content: line.replace(/^##\s*/, '') }
    }
    if (line.startsWith('-')) {
      return { type: 'list', content: line.replace(/^-+\s*/, '') }
    }
    return { type: 'paragraph', content: raw }
  })
}

function renderInline(text: string) {
  const segments: React.JSX.Element[] = []
  let remaining = text

  while (remaining.length > 0) {
    const boldStart = remaining.indexOf('**')
    const codeStart = remaining.indexOf('`')

    const nextMarker =
      boldStart === -1 ? codeStart : codeStart === -1 ? boldStart : Math.min(boldStart, codeStart)

    if (nextMarker === -1) {
      segments.push(<span key={segments.length}>{remaining}</span>)
      break
    }

    if (nextMarker > 0) {
      segments.push(<span key={segments.length}>{remaining.slice(0, nextMarker)}</span>)
      remaining = remaining.slice(nextMarker)
      continue
    }

    if (remaining.startsWith('**')) {
      const end = remaining.indexOf('**', 2)
      if (end === -1) {
        segments.push(<span key={segments.length}>{remaining}</span>)
        break
      }
      const content = remaining.slice(2, end)
      segments.push(
        <span key={segments.length} className="font-semibold text-[#ffffff]">
          {content}
        </span>,
      )
      remaining = remaining.slice(end + 2)
      continue
    }

    if (remaining.startsWith('`')) {
      const end = remaining.indexOf('`', 1)
      if (end === -1) {
        segments.push(<span key={segments.length}>{remaining}</span>)
        break
      }
      const content = remaining.slice(1, end)
      segments.push(
        <code
          key={segments.length}
          className="px-1.5 py-0.5 rounded-md bg-[rgba(15,21,32,0.85)] border border-[rgba(255,255,255,0.08)] font-mono text-[12px] text-[#e8edf3]"
        >
          {content}
        </code>,
      )
      remaining = remaining.slice(end + 1)
      continue
    }

    segments.push(<span key={segments.length}>{remaining}</span>)
    break
  }

  return segments
}

// --- SWR Fetcher ---
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
})

export default function RepoOnboardingPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params)
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const canInteract = isLoaded && isSignedIn

  // --- 🚀 INSTANT DATA FETCHING WITH SWR ---
  const { data: repoData, error: repoError } = useSWR(canInteract ? `/api/repos/${repoId}` : null, fetcher)
  
  const repo: Repo | null = repoData?.repo || null
  const repoName = repo?.repoName || 'this repository'

  const [onboarding, setOnboarding] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Project Onboarding | RepoSage Prime'
    if (isLoaded && !isSignedIn) router.replace('/sign-in')
  }, [isLoaded, isSignedIn, router])

  const generateOnboarding = async () => {
    if (!canInteract || isGenerating) return
    setError(null)
    setIsGenerating(true)

    try {
      const res = await fetch(`/api/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || "Failed to generate onboarding guide")
      }

      const data = await res.json()
      setOnboarding(data.onboarding)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!onboarding) return
    try { await navigator.clipboard.writeText(onboarding) } catch {}
  }

  const parsedOnboarding = useMemo(() => (onboarding ? parseMarkdownLike(onboarding) : []), [onboarding])

  if (!isLoaded || !isSignedIn) return null

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push(`/repo/${repoId}`)}
              className="text-sm px-4 py-2 rounded-full border border-[rgba(255,255,255,0.16)] text-[#d6cebf] hover:text-white hover:border-[rgba(215,180,127,0.45)] transition"
            >
              ← Back
            </button>

            <div className="text-right">
              <div className="font-display font-bold text-2xl">Onboarding Guide</div>
              <div className="text-xs text-[#b3ab9c] uppercase tracking-[0.14em] truncate max-w-[60vw] mt-1">
                {repoData ? repoName : '...'}
              </div>
            </div>
          </div>

          {(error || repoError) && (
            <div className="rounded-2xl border border-[rgba(255,0,80,0.35)] bg-[rgba(255,0,80,0.08)] p-4 text-sm text-[#fecaca]">
              {error || "Failed to load repository."}
            </div>
          )}

          <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-6 md:p-8 flex flex-col gap-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-6">
              <div>
                <h2 className="font-display font-semibold text-3xl">Comprehensive Onboarding</h2>
                <p className="text-sm text-[#b3ab9c] mt-2 max-w-xl">
                  Generate a "Staff Engineer" level onboarding document detailing architecture, dependencies, local setup, and best practices.
                </p>
              </div>

              <button
                onClick={generateOnboarding}
                disabled={isGenerating || !canInteract}
                className="w-full md:w-auto text-sm px-6 py-3 rounded-2xl border border-[rgba(215,180,127,0.4)] bg-[rgba(215,180,127,0.16)] text-[#f2ddbd] hover:bg-[rgba(215,180,127,0.24)] hover:border-[rgba(215,180,127,0.55)] transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-mono whitespace-nowrap"
              >
                {isGenerating && (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-[rgba(215,180,127,0.35)] border-t-[#f2ddbd] animate-spin" />
                )}
                {isGenerating ? 'Generating...' : onboarding ? 'Regenerate Guide' : 'Generate Guide'}
              </button>
            </div>

            <div className="flex-1 min-h-[400px] rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(8,11,16,0.9)] p-6 md:p-8">
              {!onboarding ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border border-[rgba(215,180,127,0.35)] bg-[rgba(215,180,127,0.12)] text-[#f2ddbd]">
                    <span className="font-mono text-xl">📄</span>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-xl">Ready to onboard?</p>
                    <p className="text-sm text-[#b3ab9c] mt-2 max-w-sm">
                      Click the button above to analyze the codebase and compile the documentation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleCopy}
                      className="font-mono text-[11px] px-4 py-2 rounded-xl border border-[rgba(255,255,255,0.14)] text-[#b3ab9c] hover:text-white hover:border-[rgba(215,180,127,0.45)] bg-[rgba(15,15,18,0.72)] transition"
                    >
                      Copy Full Guide
                    </button>
                  </div>
                  
                  {parsedOnboarding.map((line, idx) => {
                    if (line.type === 'heading') {
                      return (
                        <h3
                          key={idx}
                          className="mt-8 mb-4 font-display text-2xl font-semibold text-[#f2ddbd] border-b border-[rgba(255,255,255,0.08)] pb-2"
                        >
                          {renderInline(line.content)}
                        </h3>
                      )
                    }

                    if (line.type === 'list') {
                      return (
                        <div key={idx} className="flex items-start gap-3 font-mono text-[14px] text-[#c5d0de] ml-2">
                          <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d7b47f]" />
                          <span className="leading-relaxed">{renderInline(line.content)}</span>
                        </div>
                      )
                    }

                    return (
                      <p key={idx} className="font-mono text-[14px] leading-7 text-[#e8edf3] whitespace-pre-wrap">
                        {renderInline(line.content)}
                      </p>
                    )
                  })}
                </div>
              )}
            </div>

          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}