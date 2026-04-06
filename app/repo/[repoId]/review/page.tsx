// app/repo/[repoId]/review/page.tsx
'use client'

import React, { useEffect, useMemo, useState, use } from 'react' // Added use
import { useRouter } from 'next/navigation' // Removed useParams
import { useUser } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LoadingSpinner, LoadingDots } from '@/components/LoadingSpinner'

type Repo = {
  id: string
  repoName: string
  repoUrl: string
}

type ReviewHistoryItem = {
  id: string
  codeSnippet: string
  review: string
  createdAt?: string | Date | null
}

function toDate(v: unknown) {
  const d = v instanceof Date ? v : new Date(typeof v === 'string' ? v : Date.now())
  return Number.isNaN(d.getTime()) ? new Date() : d
}

function formatDate(value: unknown) {
  const d = toDate(value)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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

export default function RepoReviewPage({ 
  params 
}: { 
  params: Promise<{ repoId: string }> 
}) {
  const { repoId } = use(params) // Unwrapped params

  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const [repo, setRepo] = useState<Repo | null>(null)
  const [codeSnippet, setCodeSnippet] = useState('')
  const [prUrl, setPrUrl] = useState('')
  const [review, setReview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [history, setHistory] = useState<ReviewHistoryItem[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canInteract = isLoaded && isSignedIn
  const repoName = repo?.repoName || 'this repository'
  const charCount = codeSnippet.length

  useEffect(() => {
    document.title = 'Repository Review | RepoSage Prime'
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (!canInteract || !repoId) return

    let cancelled = false

    const load = async () => {
      setError(null)
      try {
        const [repoRes, historyRes] = await Promise.all([
          fetch(`/api/repos/${repoId}`),
          fetch(`/api/review?repoId=${encodeURIComponent(repoId)}`),
        ])

        if (!repoRes.ok) {
          if (repoRes.status === 404) throw new Error("Repo not found")
          const body = (await repoRes.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error || "Something went wrong, please try again")
        }

        const repoData = (await repoRes.json()) as { repo: Repo & { isIndexed?: number } }

        if (repoData.repo && repoData.repo.isIndexed === 0) {
          throw new Error("Please index repo first")
        }

        if (!historyRes.ok) {
          const body = (await historyRes.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error || "Something went wrong, please try again")
        }
        const historyData = (await historyRes.json()) as { reviews: ReviewHistoryItem[] }

        if (cancelled) return

        setRepo(repoData.repo)
        setHistory((historyData.reviews || []).slice(0, 10))
        setLoadingHistory(false)
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Failed to load review page'
        setError(msg)
        setLoadingHistory(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [canInteract, repoId])

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    const trimmed = codeSnippet.trim()
    if (!trimmed || isSubmitting || !canInteract) return

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId,
          codeSnippet: trimmed,
          prUrl: prUrl.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || `Review failed (${res.status})`)
      }

      const data = (await res.json()) as { review: string; id?: string; createdAt?: string | Date | null }
      const reviewText = data.review
      setReview(reviewText)

      const newItem: ReviewHistoryItem = {
        id: data.id || `local-${Date.now()}`,
        codeSnippet: trimmed,
        review: reviewText,
        createdAt: data.createdAt ?? new Date().toISOString(),
      }

      setHistory((prev) => [newItem, ...prev].slice(0, 10))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Review failed'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (!review) return
    try {
      await navigator.clipboard.writeText(review)
    } catch {
      // ignore copy errors
    }
  }

  const parsedReview = useMemo(() => (review ? parseMarkdownLike(review) : []), [review])

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push(`/repo/${repoId}`)}
              className="text-sm px-4 py-2 rounded-full border border-[rgba(255,255,255,0.16)] text-[#d6cebf] hover:text-white hover:border-[rgba(215,180,127,0.45)] transition"
            >
              ← Back
            </button>

            <div className="text-right">
              <div className="font-display font-bold text-2xl">Code Review</div>
              <div className="text-xs text-[#b3ab9c] uppercase tracking-[0.14em] truncate max-w-[60vw] mt-1">{repoName}</div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-[rgba(255,0,80,0.35)] bg-[rgba(255,0,80,0.08)] p-4">
              <div className="text-sm text-[#fecaca]">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-semibold text-2xl">Code Input</h2>
                  <p className="font-mono text-[11px] text-[#b3ab9c] mt-1">
                    Paste a diff, function, or file for targeted review.
                  </p>
                </div>
                <div className="font-mono text-[11px] text-[#b3ab9c]">
                  <span className={charCount > 4000 ? 'text-[rgba(255,120,120,0.9)]' : ''}>{charCount}</span>
                  <span className="text-[#b3ab9c]"> chars</span>
                </div>
              </div>

              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                rows={15}
                className="w-full rounded-2xl bg-[rgba(8,11,16,0.85)] border border-[rgba(255,255,255,0.14)] px-4 py-3 font-mono text-sm text-[#e8edf3] placeholder:text-[rgba(107,122,141,0.85)] outline-none focus:border-[rgba(215,180,127,0.55)] focus:ring-1 focus:ring-[rgba(215,180,127,0.28)] resize-vertical"
                placeholder="Paste your code here..."
                spellCheck={false}
              />

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] text-[#b3ab9c]">Optional PR URL</label>
                  <input
                    value={prUrl}
                    onChange={(e) => setPrUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo/pull/123"
                    className="w-full rounded-xl bg-[rgba(8,11,16,0.85)] border border-[rgba(255,255,255,0.14)] px-3 py-2 font-mono text-sm text-[#e8edf3] placeholder:text-[rgba(107,122,141,0.85)] outline-none focus:border-[rgba(59,130,246,0.6)] focus:ring-1 focus:ring-[rgba(59,130,246,0.35)]"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!codeSnippet.trim() || isSubmitting || !canInteract}
                  className="mt-1 w-full text-sm px-4 py-2.5 rounded-xl border border-[rgba(215,180,127,0.4)] bg-[rgba(215,180,127,0.16)] text-[#f2ddbd] hover:bg-[rgba(215,180,127,0.24)] hover:border-[rgba(215,180,127,0.55)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <LoadingDots /> : 'Review Code'}
                </button>

                <p className="font-mono text-[11px] text-[#b3ab9c]">
                  We&apos;ll highlight bugs, design issues, and improvement opportunities based on {repoName}.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5 flex flex-col gap-3 min-h-[260px]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-semibold text-2xl">Review Output</h2>
                  <p className="font-mono text-[11px] text-[#b3ab9c] mt-1">
                    Structured feedback with actionable recommendations.
                  </p>
                </div>

                <button
                  onClick={handleCopy}
                  disabled={!review}
                  className="font-mono text-[11px] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.14)] text-[#b3ab9c] hover:text-white hover:border-[rgba(215,180,127,0.45)] bg-[rgba(8,11,16,0.85)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Copy review
                </button>
              </div>

              <div className="mt-2 flex-1 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(8,11,16,0.9)] px-4 py-3 overflow-y-auto max-h-[420px]">
                {!review ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-2xl border border-[rgba(215,180,127,0.35)] bg-[rgba(215,180,127,0.12)] text-[#f2ddbd]">
                      <span className="font-mono text-lg">{'</>'}</span>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-base">Your review will appear here</p>
                      <p className="font-mono text-[11px] text-[#b3ab9c] mt-1">
                        Paste a snippet on the left and hit &quot;Review Code&quot; to get started.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {parsedReview.map((line, idx) => {
                      if (line.type === 'heading') {
                        return (
                          <h3
                            key={idx}
                            className="mt-3 mb-1 font-display text-sm font-semibold text-[#e8edf3] border-b border-[rgba(255,255,255,0.05)] pb-1"
                          >
                            {renderInline(line.content)}
                          </h3>
                        )
                      }

                      if (line.type === 'list') {
                        return (
                          <div key={idx} className="flex items-start gap-2 font-mono text-[13px] text-[#c5d0de]">
                            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#00e5a0]" />
                            <span>{renderInline(line.content)}</span>
                          </div>
                        )
                      }

                      return (
                        <p key={idx} className="font-mono text-[13px] leading-6 text-[#c5d0de] whitespace-pre-wrap">
                          {renderInline(line.content)}
                        </p>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display font-semibold text-2xl">Review History</h2>
                <p className="font-mono text-[11px] text-[#b3ab9c] mt-1">
                  The last 10 reviews for this repo.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-4">
              {loadingHistory ? (
                <LoadingSpinner text="Loading reviews..." />
              ) : history.length === 0 ? (
                <div className="py-6 text-center font-mono text-[12px] text-[#b3ab9c]">
                  No past reviews yet. Your history will appear here.
                </div>
              ) : (
                <ul className="space-y-2">
                  {history.map((item) => {
                    const isExpanded = expandedIds.has(item.id)
                    const snippetPreview =
                      item.codeSnippet.length > 100
                        ? `${item.codeSnippet.slice(0, 100).trimEnd()}…`
                        : item.codeSnippet

                    return (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(8,11,16,0.9)] p-3"
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          className="w-full flex items-center justify-between gap-3 text-left"
                        >
                          <div>
                            <div className="font-mono text-[11px] text-[#b3ab9c]">
                              {formatDate(item.createdAt)}
                            </div>
                            <pre className="mt-1 font-mono text-[12px] text-[#c5d0de] whitespace-pre-wrap line-clamp-2">
                              {snippetPreview || '[empty snippet]'}
                            </pre>
                          </div>
                          <span className="font-mono text-[11px] text-[#b3ab9c]">
                            {isExpanded ? 'Hide' : 'View'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-3 border-t border-[rgba(255,255,255,0.06)] pt-3 space-y-2">
                            <div>
                              <div className="font-mono text-[11px] text-[#6b7a8d] mb-1">Snippet</div>
                              <pre className="font-mono text-[12px] text-[#c5d0de] whitespace-pre-wrap bg-[rgba(8,11,16,0.9)] rounded-xl border border-[rgba(255,255,255,0.05)] px-3 py-2">
                                {item.codeSnippet || '[empty snippet]'}
                              </pre>
                            </div>
                            <div>
                              <div className="font-mono text-[11px] text-[#6b7a8d] mb-1">Review</div>
                              <div className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(8,11,16,0.9)] px-3 py-2 max-h-80 overflow-y-auto">
                                {parseMarkdownLike(item.review).map((line, idx) => {
                                  if (line.type === 'heading') {
                                    return (
                                      <h3
                                        key={idx}
                                        className="mt-3 mb-1 font-display text-sm font-semibold text-[#e8edf3] border-b border-[rgba(255,255,255,0.05)] pb-1"
                                      >
                                        {renderInline(line.content)}
                                      </h3>
                                    )
                                  }
                                  if (line.type === 'list') {
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-start gap-2 font-mono text-[13px] text-[#c5d0de]"
                                      >
                                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#00e5a0]" />
                                        <span>{renderInline(line.content)}</span>
                                      </div>
                                    )
                                  }
                                  return (
                                    <p
                                      key={idx}
                                      className="font-mono text-[13px] leading-6 text-[#c5d0de] whitespace-pre-wrap"
                                    >
                                      {renderInline(line.content)}
                                    </p>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}