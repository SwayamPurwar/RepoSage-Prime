'use client'

// 1. Import `use` from React
import { useCallback, useEffect, useMemo, useState, use } from 'react' 
import { useRouter } from 'next/navigation' // Removed useParams
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useUser } from '@clerk/nextjs'
import { Activity, BookOpen, FileText, GitPullRequest, MessageSquare, Copy, Download } from 'lucide-react'
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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  let html = escape(md)

  html = html.replace(/^###\s(.+)$/gm, '<h3 class="font-display text-lg mt-6 mb-2">$1</h3>')
  html = html.replace(/^##\s(.+)$/gm, '<h2 class="font-display text-xl mt-8 mb-3">$1</h2>')
  html = html.replace(/^#\s(.+)$/gm, '<h1 class="font-display text-2xl mt-10 mb-4">$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] font-mono text-[12px]">$1</code>')

  html = html.replace(/^\s*-\s(.+)$/gm, '<li class="ml-5 list-disc">$1</li>')
  html = html.replace(/(<li[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="space-y-1 my-3">${m}</ul>`)

  html = html
    .split(/\n{2,}/)
    .map(block => {
      if (block.trim().startsWith('<h') || block.trim().startsWith('<ul')) return block
      return `<p class="text-sm leading-7">${block.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')

  return html
}

const renderMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# ')) 
      return <h1 key={i} className="font-display font-bold text-2xl text-[#e8edf3] mt-6 mb-3">{line.slice(2)}</h1>
    if (line.startsWith('## ')) 
      return <h2 key={i} className="font-display font-bold text-xl text-[#e8edf3] mt-5 mb-2 border-b border-[rgba(255,255,255,0.07)] pb-2">{line.slice(3)}</h2>
    if (line.startsWith('### ')) 
      return <h3 key={i} className="font-display font-bold text-lg text-[#e8edf3] mt-4 mb-2">{line.slice(4)}</h3>
    if (line.startsWith('- ') || line.startsWith('* ')) 
      return <li key={i} className="font-mono text-sm text-[#e8edf3] ml-4 list-disc mb-1">{line.slice(2)}</li>
    if (line.startsWith('```')) 
      return <div key={i} className="font-mono text-xs bg-[rgba(255,255,255,0.03)] rounded px-2 py-0.5 text-[#00e5a0]">{line}</div>
    if (line.trim() === '') 
      return <br key={i} />
    return <p key={i} className="font-mono text-sm text-[#e8edf3] mb-1">{line}</p>
  })
}

// 2. Define the page props to accept params as a Promise
export default function RepoOverviewPage({ 
  params 
}: { 
  params: Promise<{ repoId: string }> 
}) {
  // 3. Unwrap the params using React's `use()` hook
  const { repoId } = use(params)
  
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
    document.title = 'Repository Workspace | RepoSage Prime'
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in')
      return
    }
    void fetchRepo()
  }, [fetchRepo, isLoaded, isSignedIn, router])

  const language = repo?.language || '—'
  const indexed = useMemo(() => (repo?.isIndexed ?? 0) === 1, [repo?.isIndexed])

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
    globalThis.window.navigator.clipboard.writeText(readme)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadReadme = () => {
    const blob = new Blob([readme], { type: 'text/markdown' })
    const url = globalThis.window.URL.createObjectURL(blob)
    const a = globalThis.window.document.createElement('a')
    a.href = url
    a.download = 'README.md'
    a.click()
    globalThis.window.URL.revokeObjectURL(url)
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
      description: 'Ask questions and get grounded answers from indexed code.',
      href: repoId ? `/repo/${repoId}/chat` : '',
      Icon: MessageSquare,
      color: '#00aaff',
    },
    {
      title: 'PR Code Review',
      description: 'Paste diffs or snippets and get senior-level feedback.',
      href: repoId ? `/repo/${repoId}/review` : '',
      Icon: GitPullRequest,
      color: '#00e5a0',
    },
    {
      title: 'Code Health',
      description: 'Get a health score with actionable refactor suggestions.',
      href: repoId ? `/repo/${repoId}/health` : '',
      Icon: Activity,
      color: '#a855f7',
    },
    {
      title: 'Onboarding Guide',
      description: 'Generate a practical guide to ramp up quickly.',
      href: '',
      Icon: BookOpen,
      color: '#f97316',
      onClick: () => void generateOnboarding(),
    },
    {
      title: 'README Generator',
      description: 'Generate a professional README based on your actual code files.',
      href: '',
      Icon: FileText,
      color: '#00e5a0',
      onClick: () => void generateReadme(),
    },
  ] as const

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm px-4 py-2 rounded-full border border-[rgba(255,255,255,0.16)] text-[#d6cebf] hover:text-white hover:border-[rgba(215,180,127,0.45)] transition"
          >
            ← Back to Dashboard
          </button>

          <div className="mt-6 rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-7 md:p-9">
            {loading ? (
              <LoadingPage text="Loading repository..." />
            ) : error ? (
              <div className="text-sm text-[#fecaca] rounded-xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] px-4 py-3">{error}</div>
            ) : repo ? (
              <>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="min-w-0">
                    <h1 className="font-display font-bold text-4xl md:text-6xl leading-[0.95] truncate">
                      {repo.repoName}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-[#b3ab9c] uppercase tracking-[0.16em]">
                        {repo.owner}
                      </span>
                      <span className="text-[10px] tracking-[1.6px] uppercase px-2.5 py-1 rounded-full border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.12)] text-[#93c5fd]">
                        {language}
                      </span>
                      <span
                        className={[
                          'text-[10px] tracking-[1.6px] uppercase px-2.5 py-1 rounded-full border',
                          indexed
                            ? 'border-[rgba(215,180,127,0.35)] bg-[rgba(215,180,127,0.14)] text-[#f2ddbd]'
                            : 'border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] text-[#b3ab9c]',
                        ].join(' ')}
                      >
                        {indexed ? 'Indexed' : 'Not indexed'}
                      </span>
                    </div>

                    {repo.description && (
                      <p className="mt-4 text-sm text-[#d6cebf] leading-7 max-w-3xl">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={repo.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm px-5 py-3 rounded-full border border-[rgba(215,180,127,0.45)] bg-[rgba(215,180,127,0.14)] text-[#f2ddbd] hover:bg-[rgba(215,180,127,0.22)] transition"
                    >
                      Open on GitHub
                    </a>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-4">
                    <div className="text-[10px] tracking-[2px] uppercase text-[#b3ab9c]">Files</div>
                    <div className="mt-1 text-lg tabular-nums font-display">{repo.totalFiles ?? 0}</div>
                  </div>
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-4">
                    <div className="text-[10px] tracking-[2px] uppercase text-[#b3ab9c]">Indexed date</div>
                    <div className="mt-1 text-sm text-[#f5f2ec]">{formatDate(repo.createdAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-4">
                    <div className="text-[10px] tracking-[2px] uppercase text-[#b3ab9c]">Language</div>
                    <div className="mt-1 text-sm text-[#f5f2ec]">{language}</div>
                  </div>
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-4">
                    <div className="text-[10px] tracking-[2px] uppercase text-[#b3ab9c]">Repo ID</div>
                    <div className="mt-1 text-[12px] text-[#f5f2ec] truncate">{repo.id}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-[#d6cebf]">Repo not found.</div>
            )}
          </div>

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
                  className="text-left rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-6 hover:border-[rgba(215,180,127,0.45)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-display font-semibold text-2xl">{c.title}</div>
                      <div className="mt-2 text-sm text-[#d6cebf] leading-6">
                        {c.description}
                      </div>
                    </div>
                    <div className="shrink-0 h-11 w-11 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
                      <Icon size={20} style={{ color: c.color }} />
                    </div>
                  </div>
                  {c.title === 'Onboarding Guide' && (
                    <div className="mt-4 text-xs text-[#b3ab9c]">
                      {onboardingLoading ? <LoadingDots /> : onboarding ? 'Generated — scroll down to view.' : 'Click to generate.'}
                    </div>
                  )}
                  {c.title === 'README Generator' && (
                    <div className="mt-4 text-xs text-[#b3ab9c]">
                      {generatingReadme ? <LoadingDots /> : readme ? 'Generated — scroll down to view.' : 'Click to generate.'}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Onboarding section */}
          <div className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display font-bold text-2xl">Onboarding Guide</h2>
              <button
                onClick={() => void generateOnboarding()}
                disabled={!repo || onboardingLoading}
                className="text-sm px-4 py-3 rounded-full border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.12)] text-[#93c5fd] hover:bg-[rgba(59,130,246,0.2)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {onboardingLoading ? <LoadingDots /> : 'Generate Onboarding Guide'}
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-6">
              {!onboarding ? (
                <div className="text-sm text-[#d6cebf] leading-7">
                  Generate a repo-specific guide (setup, key files, first tasks) using the Demo engine.
                </div>
              ) : (
                <div
                  className="prose prose-invert max-w-none font-mono text-[#e8edf3]"
                  dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(onboarding) }}
                />
              )}
            </div>
          </div>

          {/* README section */}
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="font-display font-bold text-2xl">Generated README</h2>
              <div className="flex items-center gap-2">
                {readme && (
                  <>
                    <button
                      onClick={() => setReadmeTab('preview')}
                      className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition ${
                        readmeTab === 'preview'
                          ? 'border-[rgba(215,180,127,0.35)] bg-[rgba(215,180,127,0.14)] text-[#f2ddbd]'
                          : 'border-[rgba(255,255,255,0.12)] text-[#b3ab9c] hover:text-white'
                      }`}
                    >
                      Preview
                    </button>
                    
                    <button
                      onClick={() => setReadmeTab('code')}
                      className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition ${
                        readmeTab === 'code'
                          ? 'border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.12)] text-[#93c5fd]'
                          : 'border-[rgba(255,255,255,0.12)] text-[#b3ab9c] hover:text-white'
                      }`}
                    >
                      {'<>'} Code
                    </button>

                    <div className="h-4 w-[1px] bg-[rgba(255,255,255,0.1)] mx-1" />

                    <button
                      onClick={copyReadme}
                      className="font-mono text-xs px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[#b3ab9c] hover:text-white transition flex items-center gap-2"
                    >
                      <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={downloadReadme}
                      className="font-mono text-xs px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[#b3ab9c] hover:text-white transition flex items-center gap-2"
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
                  className="w-full font-display font-semibold text-sm px-6 py-4 rounded-2xl border border-[rgba(215,180,127,0.35)] bg-[rgba(215,180,127,0.14)] text-[#f2ddbd] hover:bg-[rgba(215,180,127,0.22)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingReadme ? <LoadingDots /> : (
                    <>
                      <FileText size={18} />
                      {readme ? 'Regenerate README — IMPRESSIVE Style' : 'Generate Professional README'}
                    </>
                  )}
                </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] min-h-[300px] overflow-hidden">
              {!readme ? (
                <div className="text-sm text-[#d6cebf] leading-7 p-8">
                  Generate a high-quality README.md with badges, tech stack tables, and project structure.
                </div>
              ) : (
                <>
                  {readmeTab === 'preview' ? (
                    <div className="prose prose-invert max-w-none font-mono text-sm leading-7 p-8">
                      {renderMarkdown(readme)}
                    </div>
                  ) : (
                    <div className="relative">
                      <pre className="font-mono text-[11px] text-[#e8edf3] p-8 overflow-auto max-h-[600px] leading-6 whitespace-pre-wrap selection:bg-[#00aaff]/30">
                        {readme}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}