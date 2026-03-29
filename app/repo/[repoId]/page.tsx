'use client'

import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useUser } from '@clerk/nextjs'
import { Activity, ArrowRight, BookOpen, Copy, Download, FileText, GitPullRequest, MessageSquare, Sparkles } from 'lucide-react'
import { LoadingPage, LoadingDots } from '@/components/LoadingSpinner'

type Repo = {
  id: string
  repoUrl: string
  repoName: string
  owner: string
  description: string | null
  language: string | null
  isIndexed: number | null
  totalFiles: number | null
  createdAt: string | Date | null
}

function formatDate(value: Repo['createdAt']) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

function simpleMarkdownToHtml(md: string) {
  const escape = (s: string) =>
    s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')

  let html = escape(md)

  html = html.replaceAll(/^###\s(.+)$/gm, '<h3 class="font-display text-2xl mt-7 mb-2">$1</h3>')
  html = html.replaceAll(/^##\s(.+)$/gm, '<h2 class="font-display text-3xl mt-8 mb-3">$1</h2>')
  html = html.replaceAll(/^#\s(.+)$/gm, '<h1 class="font-display text-4xl mt-10 mb-4">$1</h1>')
  html = html.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replaceAll(/`([^`]+)`/g, '<code class="rounded border border-(--line) bg-[rgba(247,239,221,0.05)] px-1.5 py-0.5 font-mono text-[12px]">$1</code>')

  html = html.replaceAll(/^\s*-\s(.+)$/gm, '<li class="ml-5 list-disc">$1</li>')
  html = html.replaceAll(/(<li[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="space-y-1 my-3">${m}</ul>`)

  html = html
    .split(/\n{2,}/)
    .map(block => {
      if (block.trim().startsWith('<h') || block.trim().startsWith('<ul')) return block
      return `<p class="text-sm leading-7">${block.replaceAll('\n', '<br/>')}</p>`
    })
    .join('\n')

  return html
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function RepoOverviewPage() {
  const params = useParams()
  const repoId = (params?.repoId ?? '') as string
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [repo, setRepo] = useState<Repo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [onboarding, setOnboarding] = useState<string | null>(null)

  const [readme, setReadme] = useState('')
  const [generatingReadme, setGeneratingReadme] = useState(false)
  const [readmeTab, setReadmeTab] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)

  const canInteract = isLoaded && isSignedIn

  const fetchRepo = useCallback(async () => {
    if (!canInteract || !repoId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/repos/${repoId}`)
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || `Failed to fetch repo (${res.status})`)
      }
      const data = (await res.json()) as { repo: Repo }
      setRepo(data.repo)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch repo'
      setError(msg)
      setRepo(null)
    } finally {
      setLoading(false)
    }
  }, [canInteract, repoId])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in')
      return
    }
    void fetchRepo()
  }, [fetchRepo, isLoaded, isSignedIn, router])

  const language = repo?.language || '—'
  const indexed = useMemo(() => (repo?.isIndexed ?? 0) === 1, [repo?.isIndexed])
  const statusClass = indexed
    ? 'border-(--accent)/30 bg-(--accent)/10 text-(--accent-soft)'
    : 'border-(--line) bg-[rgba(255,255,255,0.04)] text-(--muted)'

  const generateOnboarding = useCallback(async () => {
    if (!repo?.repoUrl || onboardingLoading) return
    setOnboardingLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'onboarding',
          repoUrl: repo.repoUrl,
          userInput: '',
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || `Failed to generate onboarding (${res.status})`)
      }
      const data = (await res.json()) as { result: string }
      setOnboarding(data.result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate onboarding'
      setError(msg)
    } finally {
      setOnboardingLoading(false)
    }
  }, [onboardingLoading, repo?.repoUrl])

  const generateReadme = async () => {
    if (!repoId || generatingReadme) return
    setGeneratingReadme(true)
    setError(null)
    try {
      const res = await fetch('/api/readme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId })
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || `Failed to generate README (${res.status})`)
      }
      const data = (await res.json()) as { readme: string }
      setReadme(data.readme)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate README'
      setError(msg)
    } finally {
      setGeneratingReadme(false)
    }
  }

  const copyReadme = () => {
    if (!readme) return
    navigator.clipboard.writeText(readme)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadReadme = () => {
    const blob = new Blob([readme], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'README.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const cards: {
    title: string
    description: string
    href: string
    Icon: typeof MessageSquare
    color: string
    onClick?: () => void
  }[] = [
    {
      title: 'Chat with Codebase',
      description: 'Ask technical questions and get grounded responses from indexed source.',
      href: repoId ? `/repo/${repoId}/chat` : '',
      Icon: MessageSquare,
      color: '#b7c9ff',
    },
    {
      title: 'PR Code Review',
      description: 'Submit snippets and diffs to get actionable code review direction.',
      href: repoId ? `/repo/${repoId}/review` : '',
      Icon: GitPullRequest,
      color: '#c9ad7a',
    },
    {
      title: 'Code Health',
      description: 'Understand maintainability risks and prioritize technical debt.',
      href: repoId ? `/repo/${repoId}/health` : '',
      Icon: Activity,
      color: '#9db8ff',
    },
    {
      title: 'Onboarding Guide',
      description: 'Generate a practical onboarding map for new contributors.',
      href: '',
      Icon: BookOpen,
      color: '#ffcf8f',
      onClick: () => void generateOnboarding(),
    },
    {
      title: 'README Generator',
      description: 'Create a polished README grounded in your current repository.',
      href: '',
      Icon: FileText,
      color: '#c9ad7a',
      onClick: () => void generateReadme(),
    },
  ] as const

  const hasOnboarding = Boolean(onboarding)
  const hasReadme = readme.length > 0

  let onboardingStatusText: ReactElement | string = 'Click to generate.'
  if (onboardingLoading) {
    onboardingStatusText = <LoadingDots />
  } else if (hasOnboarding) {
    onboardingStatusText = 'Generated — scroll down to view.'
  }

  let readmeStatusText: ReactElement | string = 'Click to generate.'
  if (generatingReadme) {
    readmeStatusText = <LoadingDots />
  } else if (hasReadme) {
    readmeStatusText = 'Generated — scroll down to view.'
  }

  let repoSummaryContent: ReactElement
  if (loading) {
    repoSummaryContent = <LoadingPage text="Loading repository..." />
  } else if (error) {
    repoSummaryContent = <div className="font-mono text-sm text-[#ffb3b3]">{error}</div>
  } else if (repo) {
    repoSummaryContent = (
      <>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-(--line) bg-[rgba(247,239,221,0.03)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-(--accent-soft) font-mono">
              <Sparkles size={11} /> Repository Intelligence
            </span>
            <h1 className="mt-4 font-display font-bold text-4xl md:text-5xl leading-[0.95] truncate">
              {repo.repoName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-(--muted) uppercase tracking-widest">
                {repo.owner}
              </span>
              <span className="font-mono text-[10px] tracking-[1.6px] uppercase px-2.5 py-1 rounded-full border border-[#9db8ff]/35 bg-[#9db8ff]/10 text-[#c4d4ff]">
                {language}
              </span>
              <span className={`font-mono text-[10px] tracking-[1.6px] uppercase px-2.5 py-1 rounded-full border ${statusClass}`}>
                {indexed ? 'Indexed' : 'Not indexed'}
              </span>
            </div>

            {repo.description && (
              <p className="mt-4 font-mono text-sm text-(--muted) leading-7 max-w-3xl">
                {repo.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={repo.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-sm px-4 py-3 rounded-xl border border-(--accent)/35 bg-(--accent)/10 text-(--accent-soft) hover:bg-(--accent)/15 transition"
            >
              Open on GitHub
              <ArrowRight size={13} />
            </a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-4">
            <div className="font-mono text-[10px] tracking-[2px] uppercase text-(--muted)">Files</div>
            <div className="mt-1 font-mono text-lg tabular-nums">{repo.totalFiles ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-4">
            <div className="font-mono text-[10px] tracking-[2px] uppercase text-(--muted)">Indexed date</div>
            <div className="mt-1 font-mono text-sm">{formatDate(repo.createdAt)}</div>
          </div>
          <div className="rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-4">
            <div className="font-mono text-[10px] tracking-[2px] uppercase text-(--muted)">Language</div>
            <div className="mt-1 font-mono text-sm">{language}</div>
          </div>
          <div className="rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-4">
            <div className="font-mono text-[10px] tracking-[2px] uppercase text-(--muted)">Repo ID</div>
            <div className="mt-1 font-mono text-[12px] truncate">{repo.id}</div>
          </div>
        </div>
      </>
    )
  } else {
    repoSummaryContent = <div className="font-mono text-sm text-(--muted)">Repo not found.</div>
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="premium-grid absolute inset-0 opacity-30 pointer-events-none" />
      <Navbar />

      <main className="relative pt-30 pb-20 px-5 md:px-10">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/dashboard')}
            className="font-mono text-sm px-4 py-2 rounded-xl border border-(--line) text-(--muted) hover:text-(--text) hover:border-[rgba(255,255,255,0.18)] transition"
          >
            ← Back to Dashboard
          </button>

          <div className="mt-6 premium-card rounded-3xl p-7 md:p-8">{repoSummaryContent}</div>

          {/* Feature cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((c) => {
              const Icon = c.Icon
              const clickable = Boolean(c.href) || Boolean(c.onClick)
              const onClick = c.onClick

              return (
                <button
                  key={c.title}
                  onClick={() => {
                    if (onClick) return onClick()
                    if (c.href) router.push(c.href)
                  }}
                  disabled={!repo || loading || Boolean(error) || !clickable}
                  className="text-left premium-card rounded-2xl p-6 hover:border-(--accent)/35 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-display text-2xl leading-none">{c.title}</div>
                      <div className="mt-2 font-mono text-sm text-(--muted) leading-6">
                        {c.description}
                      </div>
                    </div>
                    <div className="shrink-0 h-11 w-11 rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] flex items-center justify-center">
                      <Icon size={20} style={{ color: c.color }} />
                    </div>
                  </div>
                  {c.title === 'Onboarding Guide' && (
                    <div className="mt-4 font-mono text-xs text-(--muted) uppercase tracking-widest">
                      {onboardingStatusText}
                    </div>
                  )}
                  {c.title === 'README Generator' && (
                    <div className="mt-4 font-mono text-xs text-(--muted) uppercase tracking-widest">
                      {readmeStatusText}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Onboarding section */}
          <div className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display font-bold text-3xl">Onboarding Guide</h2>
              <button
                onClick={() => void generateOnboarding()}
                disabled={!repo || onboardingLoading}
                className="font-mono text-sm px-4 py-3 rounded-xl border border-[#9db8ff]/35 bg-[#9db8ff]/10 text-[#c4d4ff] hover:bg-[#9db8ff]/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {onboardingLoading ? <LoadingDots /> : 'Generate Onboarding Guide'}
              </button>
            </div>

            <div className="mt-4 premium-card rounded-2xl p-6">
              {hasOnboarding ? (
                <div
                  className="prose prose-invert max-w-none font-mono text-(--text)"
                  dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(onboarding || '') }}
                />
              ) : (
                <div className="font-mono text-sm text-(--muted) leading-7">
                  Generate a repo-specific guide (setup, key files, first tasks) using the Demo engine.
                </div>
              )}
            </div>
          </div>

          {/* README section */}
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="font-display font-bold text-3xl">Generated README</h2>
              <div className="flex items-center gap-2">
                {readme && (
                  <>
                    <button
                      onClick={() => setReadmeTab('preview')}
                      className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition ${
                        readmeTab === 'preview'
                          ? 'border-(--accent)/35 bg-(--accent)/10 text-(--accent-soft)'
                          : 'border-(--line) text-(--muted) hover:text-(--text)'
                      }`}
                    >
                      Preview
                    </button>
                    
                    <button
                      onClick={() => setReadmeTab('code')}
                      className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition ${
                        readmeTab === 'code'
                          ? 'border-[#9db8ff]/35 bg-[#9db8ff]/10 text-[#c4d4ff]'
                          : 'border-(--line) text-(--muted) hover:text-(--text)'
                      }`}
                    >
                      {'<>'} Code
                    </button>

                    <div className="mx-1 h-4 w-px bg-[rgba(255,255,255,0.1)]" />

                    <button
                      onClick={copyReadme}
                      className="font-mono text-xs px-3 py-1.5 rounded-lg border border-(--line) bg-[rgba(247,239,221,0.03)] text-(--muted) hover:text-(--text) transition flex items-center gap-2"
                    >
                      <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={downloadReadme}
                      className="font-mono text-xs px-3 py-1.5 rounded-lg border border-(--line) bg-[rgba(247,239,221,0.03)] text-(--muted) hover:text-(--text) transition flex items-center gap-2"
                    >
                      <Download size={12} /> Download
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
               <button
                  onClick={() => void generateReadme()}
                  disabled={!repo || generatingReadme}
                  className="w-full font-display text-sm px-6 py-4 rounded-2xl border border-(--accent)/35 bg-(--accent)/10 text-(--accent-soft) hover:bg-(--accent)/15 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingReadme ? <LoadingDots /> : (
                    <>
                      <FileText size={18} />
                      {readme ? 'Regenerate README — Premium Style' : 'Generate Professional README'}
                    </>
                  )}
                </button>
            </div>

            <div className="mt-4 premium-card rounded-2xl min-h-75 overflow-hidden">
              {hasReadme ? (
                <>
                  {readmeTab === 'preview' ? (
                    <div
                      className="prose prose-invert max-w-none font-mono text-(--text) text-sm leading-7 p-8"
                      dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(readme) }}
                    />
                  ) : (
                    <div className="relative">
                      <pre className="font-mono text-[11px] text-(--text) p-8 overflow-auto max-h-150 leading-6 whitespace-pre-wrap selection:bg-(--accent)/30">
                        {readme}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="font-mono text-sm text-(--muted) leading-7 p-8">
                  Generate a high-quality README.md with badges, tech stack tables, and project structure.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
