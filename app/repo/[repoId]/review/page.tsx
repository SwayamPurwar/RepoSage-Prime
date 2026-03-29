'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LoadingSpinner, LoadingDots } from '@/components/LoadingSpinner'
import { ArrowRight, Sparkles } from 'lucide-react'

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
  let dateValue: string | number | Date = Date.now()
  if (v instanceof Date || typeof v === 'string') {
    dateValue = v
  }
  const d = new Date(dateValue)
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

// eslint-disable-next-line sonarjs/cognitive-complexity
function renderInline(text: string) {
  const segments: React.JSX.Element[] = []
  let remaining = text

  while (remaining.length > 0) {
    const boldStart = remaining.indexOf('**')
    const codeStart = remaining.indexOf('`')
    let nextMarker = -1
    if (boldStart === -1) {
      nextMarker = codeStart
    } else if (codeStart === -1) {
      nextMarker = boldStart
    } else {
      nextMarker = Math.min(boldStart, codeStart)
    }

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

export default function RepoReviewPage() {
  const params = useParams()
  const repoId = params.repoId as string

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
    document.title = "Review | RespoSage Prime"
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

  const reviewPreviewContent = review ? (
    <div className="space-y-2">
      {parsedReview.map((line, idx) => {
        const key = `${line.type}-${line.content.slice(0, 40)}-${idx}`
        if (line.type === 'heading') {
          return (
            <h3
              key={key}
              className="mt-3 mb-1 font-display text-sm font-semibold text-(--text) border-b border-(--line) pb-1"
            >
              {renderInline(line.content)}
            </h3>
          )
        }

        if (line.type === 'list') {
          return (
            <div key={key} className="flex items-start gap-2 font-mono text-[13px] text-[#d8dfeb]">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-(--accent)" />
              <span>{renderInline(line.content)}</span>
            </div>
          )
        }

        return (
          <p key={key} className="font-mono text-[13px] leading-6 text-[#d8dfeb] whitespace-pre-wrap">
            {renderInline(line.content)}
          </p>
        )
      })}
    </div>
  ) : (
    <div className="h-full flex flex-col items-center justify-center text-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-2xl border border-[#9db8ff]/35 bg-[#9db8ff]/10 text-[#c4d4ff]">
        <span className="font-mono text-lg">{'</>'}</span>
      </div>
      <div>
        <p className="font-display font-semibold text-base">Your review will appear here</p>
        <p className="font-mono text-[11px] text-(--muted) mt-1">
          Paste a snippet on the left and hit &quot;Review Code&quot; to get started.
        </p>
      </div>
    </div>
  )

  let historyContent: React.JSX.Element
  if (loadingHistory) {
    historyContent = <LoadingSpinner text="Loading reviews..." />
  } else if (history.length === 0) {
    historyContent = (
      <div className="py-6 text-center font-mono text-[12px] text-(--muted)">
        No past reviews yet. Your history will appear here.
      </div>
    )
  } else {
    historyContent = (
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
            className="rounded-2xl border border-(--line) bg-[rgba(0,0,0,0.24)] p-3"
          >
            <button
              type="button"
              onClick={() => toggleExpanded(item.id)}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <div>
                <div className="font-mono text-[11px] text-[#6b7a8d]">
                  {formatDate(item.createdAt)}
                </div>
                <pre className="mt-1 font-mono text-[12px] text-[#d8dfeb] whitespace-pre-wrap line-clamp-2">
                  {snippetPreview || '[empty snippet]'}
                </pre>
              </div>
              <span className="font-mono text-[11px] text-(--muted)">
                {isExpanded ? 'Hide' : 'View'}
              </span>
            </button>

            {isExpanded && (
              <div className="mt-3 border-t border-(--line) pt-3 space-y-2">
                <div>
                  <div className="font-mono text-[11px] text-(--muted) mb-1">Snippet</div>
                  <pre className="font-mono text-[12px] text-[#d8dfeb] whitespace-pre-wrap bg-[rgba(0,0,0,0.24)] rounded-xl border border-(--line) px-3 py-2">
                    {item.codeSnippet || '[empty snippet]'}
                  </pre>
                </div>
                <div>
                  <div className="font-mono text-[11px] text-(--muted) mb-1">Review</div>
                  <div className="rounded-xl border border-(--line) bg-[rgba(0,0,0,0.24)] px-3 py-2 max-h-80 overflow-y-auto">
                    {parseMarkdownLike(item.review).map((line, idx) => {
                      const key = `hist-${item.id}-${line.type}-${line.content.slice(0, 40)}-${idx}`
                      if (line.type === 'heading') {
                        return (
                          <h3
                            key={key}
                            className="mt-3 mb-1 font-display text-sm font-semibold text-(--text) border-b border-(--line) pb-1"
                          >
                            {renderInline(line.content)}
                          </h3>
                        )
                      }
                      if (line.type === 'list') {
                        return (
                          <div
                            key={key}
                            className="flex items-start gap-2 font-mono text-[13px] text-[#d8dfeb]"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-(--accent)" />
                            <span>{renderInline(line.content)}</span>
                          </div>
                        )
                      }
                      return (
                        <p
                          key={key}
                          className="font-mono text-[13px] leading-6 text-[#d8dfeb] whitespace-pre-wrap"
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
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="premium-grid absolute inset-0 opacity-30 pointer-events-none" />
      <Navbar />

      <main className="relative pt-30 pb-24 px-5 md:px-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push(`/repo/${repoId}`)}
              className="font-mono text-sm px-4 py-2 rounded-xl border border-(--line) text-(--muted) hover:text-(--text) hover:border-[rgba(255,255,255,0.18)] transition"
            >
              ← Back
            </button>

            <div className="text-right">
              <div className="inline-flex items-center gap-2 font-display font-bold text-2xl">
                <Sparkles size={16} className="text-(--accent-soft)" />
                Code Review
              </div>
              <div className="font-mono text-xs text-(--muted) truncate max-w-[60vw] uppercase tracking-widest">{repoName}</div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-[rgba(255,120,120,0.35)] bg-[rgba(255,120,120,0.08)] p-4">
              <div className="font-mono text-xs text-[#ffc2c2]">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="premium-card rounded-3xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-semibold text-2xl">Code Input</h2>
                  <p className="font-mono text-[11px] text-(--muted) mt-1 uppercase tracking-widest">
                    Paste a diff, function, or file for targeted review.
                  </p>
                </div>
                <div className="font-mono text-[11px] text-(--muted)">
                  <span className={charCount > 4000 ? 'text-[#ffb1b1]' : ''}>{charCount}</span>
                  <span className="text-(--muted)"> chars</span>
                </div>
              </div>

              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                rows={15}
                className="w-full resize-vertical rounded-2xl bg-[rgba(0,0,0,0.24)] border border-(--line) px-4 py-3 font-mono text-sm text-(--text) placeholder:text-(--muted) outline-none focus:border-[#9db8ff]/60 focus:ring-1 focus:ring-[#9db8ff]/35"
                placeholder="Paste your code here..."
                spellCheck={false}
              />

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pr-url-input" className="font-mono text-[11px] text-(--muted) uppercase tracking-widest">Optional PR URL</label>
                  <input
                    id="pr-url-input"
                    value={prUrl}
                    onChange={(e) => setPrUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo/pull/123"
                    className="w-full rounded-xl bg-[rgba(0,0,0,0.24)] border border-(--line) px-3 py-2 font-mono text-sm text-(--text) placeholder:text-(--muted) outline-none focus:border-(--accent)/60 focus:ring-1 focus:ring-(--accent)/35"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!codeSnippet.trim() || isSubmitting || !canInteract}
                  className="mt-1 w-full inline-flex items-center justify-center gap-2 font-mono text-sm px-4 py-2.5 rounded-xl border border-(--accent)/30 bg-(--accent)/10 text-(--accent-soft) hover:bg-(--accent)/16 hover:border-(--accent)/45 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <LoadingDots /> : <><span>Review Code</span><ArrowRight size={13} /></>}
                </button>

                <p className="font-mono text-[11px] text-(--muted)">
                  We&apos;ll highlight bugs, design issues, and improvement opportunities based on {repoName}.
                </p>
              </div>
            </section>

            <section className="premium-card rounded-3xl p-5 flex flex-col gap-3 min-h-65">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-semibold text-2xl">Review Output</h2>
                  <p className="font-mono text-[11px] text-(--muted) mt-1 uppercase tracking-widest">
                    Structured feedback with actionable recommendations.
                  </p>
                </div>

                <button
                  onClick={handleCopy}
                  disabled={!review}
                  className="font-mono text-[11px] px-3 py-1.5 rounded-xl border border-(--line) text-(--muted) hover:text-(--text) hover:border-[#9db8ff]/35 bg-[rgba(0,0,0,0.24)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Copy review
                </button>
              </div>

              <div className="mt-2 flex-1 rounded-2xl border border-(--line) bg-[rgba(0,0,0,0.24)] px-4 py-3 overflow-y-auto max-h-105">
                {reviewPreviewContent}
              </div>
            </section>
          </div>

          <section className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display font-semibold text-2xl">Review History</h2>
                <p className="font-mono text-[11px] text-(--muted) mt-1 uppercase tracking-widest">
                  The last 10 reviews for this repo.
                </p>
              </div>
            </div>

            <div className="premium-card rounded-3xl p-4">{historyContent}</div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
