'use client'

import { useMemo, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LoadingPage, LoadingDots, LoadingCard } from '@/components/LoadingSpinner'

type Repo = {
  id: string
  repoName: string
  repoUrl: string
}

type HealthSuggestion = {
  type: string
  message?: string
  severity?: string
  issue?: string
  fix?: string
  file?: string
}

type HealthReport = {
  overallScore: number
  complexityScore: number
  documentationScore: number
  duplicateScore: number
  bugRiskScore: number
  suggestions: HealthSuggestion[]
}

function clampScore(v: number) {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

function scoreColor(score: number) {
  const s = clampScore(score)
  if (s >= 80) return '#00e5a0'
  if (s >= 50) return '#f59e0b'
  return '#ef4444'
}

function badgeForType(type: string) {
  const t = (type || '').toLowerCase()
  if (t === 'bug')
    return { label: 'BUG', bg: 'bg-[rgba(239,68,68,0.12)]', border: 'border-[rgba(239,68,68,0.35)]', text: 'text-[#ef4444]' }
  if (t === 'security')
    return { label: 'SECURITY', bg: 'bg-[rgba(245,158,11,0.12)]', border: 'border-[rgba(245,158,11,0.35)]', text: 'text-[#f59e0b]' }
  if (t === 'performance' || t === 'perf')
    return { label: 'PERF', bg: 'bg-[rgba(0,170,255,0.12)]', border: 'border-[rgba(0,170,255,0.35)]', text: 'text-[#00aaff]' }
  if (t === 'style' || t === 'structure' || t === 'purple')
    return { label: (t === 'structure' ? 'STRUCT' : 'STYLE'), bg: 'bg-[rgba(168,85,247,0.14)]', border: 'border-[rgba(168,85,247,0.35)]', text: 'text-[#a855f7]' }
  if (t === 'documentation' || t === 'docs')
    return { label: 'DOCS', bg: 'bg-[rgba(0,229,160,0.10)]', border: 'border-[rgba(0,229,160,0.35)]', text: 'text-[#00e5a0]' }
  return { label: (type || 'INFO').toUpperCase(), bg: 'bg-[rgba(255,255,255,0.06)]', border: 'border-[rgba(255,255,255,0.10)]', text: 'text-[#e8edf3]' }
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const v = clampScore(value)
  const color = scoreColor(v)
  const textClass = v >= 80 ? 'text-[#00e5a0]' : v >= 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
  const size = 86
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - v / 100)

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} className="block">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="transparent" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="transparent" strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="font-display font-bold text-lg leading-none">
              <span className={textClass}>{v}</span>
            </div>
            <div className="font-mono text-[10px] text-[#6b7a8d] mt-0.5">/100</div>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="font-display font-semibold text-sm text-[#e8edf3]">{label}</div>
        <div className="font-mono text-[11px] text-[#6b7a8d] mt-1">
          {v >= 80 ? 'Healthy' : v >= 50 ? 'Needs attention' : 'High risk'}
        </div>
      </div>
    </div>
  )
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
})

export default function RepoHealthPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params)
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const canInteract = isLoaded && isSignedIn

  const { data: repoData, error: repoError } = useSWR(canInteract ? `/api/repos/${repoId}` : null, fetcher)
  const { data: healthData, error: healthError, mutate: mutateHealth } = useSWR(canInteract ? `/api/health?repoId=${repoId}` : null, fetcher)

  const repo: Repo | null = repoData?.repo || null
  const report: HealthReport | null = healthData?.report || null
  const isLoading = !repoData && !repoError

  const [running, setRunning] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const [refactoringIdx, setRefactoringIdx] = useState<number | null>(null)
  const [refactoredCode, setRefactoredCode] = useState<Record<number, string>>({})
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const [creatingPrIdx, setCreatingPrIdx] = useState<number | null>(null)
  const [prUrls, setPrUrls] = useState<Record<number, string>>({})

  const repoName = repo?.repoName || 'this repository'

  const scoreCards = useMemo(() => {
    const r = report
    return [
      { key: 'overall', label: 'Overall', value: r?.overallScore ?? 0 },
      { key: 'complexity', label: 'Complexity', value: r?.complexityScore ?? 0 },
      { key: 'docs', label: 'Documentation', value: r?.documentationScore ?? 0 },
      { key: 'bugs', label: 'Bug Risk', value: r?.bugRiskScore ?? 0 },
      { key: 'dup', label: 'Duplicates', value: r?.duplicateScore ?? 0 },
    ] as const
  }, [report])

  const runAnalysis = async () => {
    if (!canInteract || running) return
    setAnalysisError(null)
    setRunning(true)
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId }),
      })

      if (!res.ok) throw new Error("Health analysis failed")
      const data = await res.json()
      
      mutateHealth({ report: data.health || data.report }, false)
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : 'Health analysis failed')
    } finally {
      setRunning(false)
    }
  }

  const handleRefactor = async (idx: number, filePath: string, issue: string) => {
    if (!canInteract || refactoringIdx !== null) return
    setRefactoringIdx(idx)
    
    try {
      const fileRes = await fetch(`/api/repos/${repoId}/files/content?path=${encodeURIComponent(filePath)}`)
      if (!fileRes.ok) throw new Error("Could not locate original file content")
      const fileData = await fileRes.json()

      const refactorRes = await fetch('/api/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, codeContent: fileData.content, issueDescription: issue })
      })

      if (!refactorRes.ok) throw new Error("AI failed to generate solution")
      const refactorData = await refactorRes.json()

      setRefactoredCode(prev => ({ ...prev, [idx]: refactorData.refactoredCode }))
    } catch (e) {
      console.error("Refactor error", e)
      alert(e instanceof Error ? e.message : "Failed to auto-fix code.")
    } finally {
      setRefactoringIdx(null)
    }
  }

  const handleCreatePR = async (idx: number, filePath: string, issue: string) => {
    if (!canInteract || creatingPrIdx !== null) return
    setCreatingPrIdx(idx)
    
    try {
      const prRes = await fetch(`/api/repos/${repoId}/pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, refactoredCode: refactoredCode[idx], issue })
      })

      const data = await prRes.json()
      if (!prRes.ok) throw new Error(data.error || "Failed to create PR")
      
      setPrUrls(prev => ({ ...prev, [idx]: data.prUrl }))
    } catch (e) {
      console.error("PR generation error", e)
      alert(e instanceof Error ? e.message : "Ensure you have granted RepoSage write access to GitHub.")
    } finally {
      setCreatingPrIdx(null)
    }
  }

  const copyToClipboard = (idx: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  if (!isLoaded || !isSignedIn) return null

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
              <div className="font-display font-bold text-2xl">Code Health</div>
              <div className="text-xs text-[#b3ab9c] uppercase tracking-[0.14em] truncate max-w-[60vw] mt-1">{isLoading ? '...' : repoName}</div>
            </div>
          </div>

          {(repoError || healthError || analysisError) && (
            <div className="rounded-2xl border border-[rgba(255,0,80,0.35)] bg-[rgba(255,0,80,0.08)] p-4 text-sm text-[#fecaca]">
              {analysisError || "Failed to load health data."}
            </div>
          )}

          {isLoading ? (
            <LoadingPage text="Loading health report..." />
          ) : (
            <>
              <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="font-display font-semibold text-2xl">Repo Health Analysis</h2>
                    <p className="font-mono text-[11px] text-[#b3ab9c] mt-1">
                      Run an analysis to score risk areas and get targeted suggestions.
                    </p>
                  </div>

                  <button
                    onClick={runAnalysis}
                    disabled={!canInteract || running}
                    className="w-full md:w-auto text-sm px-6 py-3 rounded-2xl border border-[rgba(215,180,127,0.4)] bg-[rgba(215,180,127,0.16)] text-[#f2ddbd] hover:bg-[rgba(215,180,127,0.24)] hover:border-[rgba(215,180,127,0.55)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {running && (
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-[rgba(215,180,127,0.35)] border-t-[#f2ddbd] animate-spin" />
                      )}
                      {running ? <LoadingDots /> : report ? 'Refresh Analysis' : 'Run Health Analysis'}
                    </span>
                  </button>
                </div>
              </section>

              <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-semibold text-2xl">Scores</h2>
                    <p className="font-mono text-[11px] text-[#b3ab9c] mt-1">
                      0–100 scale with color-coded thresholds.
                    </p>
                  </div>
                  {!report && (
                    <div className="font-mono text-[11px] text-[#b3ab9c] border border-[rgba(255,255,255,0.12)] bg-[rgba(8,11,16,0.6)] px-3 py-1.5 rounded-full">
                      No report yet
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scoreCards.map((c) => (
                    <div key={c.key} className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(8,11,16,0.9)] p-4">
                      <ProgressRing value={c.value} label={c.label} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5">
                <div>
                  <h2 className="font-display font-semibold text-2xl">Suggestions</h2>
                  <p className="font-mono text-[11px] text-[#b3ab9c] mt-1">
                    Prioritized actions based on detected risks.
                  </p>
                </div>

                <div className="mt-4">
                  {!report ? (
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(8,11,16,0.9)] p-6 text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-[rgba(215,180,127,0.35)] bg-[rgba(215,180,127,0.12)] text-[#f2ddbd]">
                        <span className="font-mono text-lg">✓</span>
                      </div>
                      <div className="mt-3">
                        <div className="font-display font-semibold">No report yet</div>
                        <div className="font-mono text-[11px] text-[#b3ab9c] mt-1">
                          Run a health analysis to generate suggestions for {repoName}.
                        </div>
                      </div>
                    </div>
                  ) : report.suggestions.length === 0 ? (
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(8,11,16,0.9)] p-4 font-mono text-[12px] text-[#b3ab9c]">
                      No suggestions returned.
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {report.suggestions.map((s, idx) => {
                        const badge = badgeForType(s.type)
                        const sev = (s.severity || 'unknown').toUpperCase()
                        const issueDescription = s.issue || s.message || ''
                        
                        return (
                          <li key={`${s.type}-${idx}`} className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(8,11,16,0.9)] p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="min-w-0 w-full">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={['font-mono text-[10px] tracking-[2px] uppercase px-2 py-1 rounded-full border text-[9px]', badge.bg, badge.border, badge.text].join(' ')}>
                                      {badge.label}
                                    </span>
                                    {s.severity && (
                                      <span className="font-mono text-[9px] tracking-[2px] uppercase px-2 py-1 rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] text-[#e8edf3]">
                                        {sev}
                                      </span>
                                    )}
                                    {s.file && (
                                      <span className="font-mono text-[9px] tracking-[1px] text-[#6b7a8d] px-2 py-1 rounded-md border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)]">
                                        {s.file}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {s.file && !refactoredCode[idx] && (
                                    <button
                                      onClick={() => handleRefactor(idx, s.file!, issueDescription)}
                                      disabled={refactoringIdx !== null}
                                      className="text-[11px] px-3 py-1.5 rounded-lg border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.16)] text-blue-300 hover:bg-[rgba(59,130,246,0.25)] transition disabled:opacity-50 flex items-center gap-2 font-mono ml-auto"
                                    >
                                      {refactoringIdx === idx ? <><LoadingDots /> Analyzing Code</> : '✨ Auto-Fix'}
                                    </button>
                                  )}
                                </div>

                                <div className="mt-4 space-y-3">
                                  <p className="font-mono text-[13px] leading-6 text-[#c5d0de] whitespace-pre-wrap">
                                    {issueDescription}
                                  </p>
                                  {s.fix && !refactoredCode[idx] && (
                                    <div className="bg-[rgba(0,229,160,0.04)] border border-[rgba(0,229,160,0.1)] rounded-xl p-3">
                                      <div className="text-[10px] uppercase tracking-widest text-[#00e5a0] font-mono mb-1">Suggested Fix</div>
                                      <p className="font-mono text-[12px] text-[#e8edf3]/80 leading-relaxed italic">
                                        {s.fix}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {refactoredCode[idx] && (
                                  <div className="mt-5 rounded-xl border border-[rgba(59,130,246,0.3)] bg-[#0A0A0A] overflow-hidden shadow-lg shadow-blue-900/10">
                                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.1)] flex-wrap gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-mono text-blue-300 uppercase tracking-widest font-semibold">✨ AI Refactored Solution</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <button
                                         onClick={() => {
  const code = refactoredCode[idx];
  if (code) {
    copyToClipboard(idx, code);
  }
}}
                                          className="text-[11px] font-mono px-3 py-1.5 rounded bg-[rgba(255,255,255,0.05)] text-gray-300 hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition"
                                        >
                                          {copiedIdx === idx ? 'Copied!' : 'Copy Code'}
                                        </button>

                                        {prUrls[idx] ? (
                                          <a
                                            href={prUrls[idx]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] font-mono px-3 py-1.5 rounded border border-[rgba(0,229,160,0.4)] bg-[rgba(0,229,160,0.1)] text-[#00e5a0] hover:bg-[rgba(0,229,160,0.2)] transition"
                                          >
                                            View PR ↗
                                          </a>
                                        ) : (
                                          <button
                                            onClick={() => handleCreatePR(idx, s.file!, issueDescription)}
                                            disabled={creatingPrIdx !== null}
                                            className="text-[11px] font-mono px-3 py-1.5 rounded border border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.15)] text-[#d8b4fe] hover:bg-[rgba(168,85,247,0.25)] transition disabled:opacity-50 flex items-center gap-1"
                                          >
                                            {creatingPrIdx === idx ? 'Opening PR...' : '🤖 Create PR'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-4 overflow-x-auto">
                                      <pre className="text-[12px] font-mono text-gray-300 leading-relaxed">
                                        <code>{refactoredCode[idx]}</code>
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}