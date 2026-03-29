'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Check, Link2, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type ChangeType = 'feature' | 'improvement' | 'fix' | 'security'

type ReleaseChange = {
  id: string
  type: ChangeType
  text: string
}

type Release = {
  id: string
  version: string
  date: string
  title: string
  description: string
  changes: ReleaseChange[]
}

const releases: Release[] = [
  {
    id: 'rel-100',
    version: 'v1.0.0',
    date: 'March 21, 2026',
    title: 'Flagship Launch: RespoSage Prime',
    description:
      'RespoSage Prime officially moved from beta to flagship production release with premium-grade repository intelligence workflows.',
    changes: [
      {
        id: 'r100-c1',
        type: 'feature',
        text: 'Launched complete production access across dashboard intelligence, repository dialogue, and guided workflow tooling.',
      },
      {
        id: 'r100-c2',
        type: 'feature',
        text: 'Enabled high-confidence PR review intelligence with structured recommendations and risk framing.',
      },
      {
        id: 'r100-c3',
        type: 'improvement',
        text: 'Upgraded retrieval pipeline performance for larger repositories and denser contextual recall.',
      },
      {
        id: 'r100-c4',
        type: 'security',
        text: 'Strengthened authentication boundaries and scoped access flow for enterprise-ready deployment.',
      },
    ],
  },
  {
    id: 'rel-090',
    version: 'v0.9.0-beta',
    date: 'February 10, 2026',
    title: 'Public Beta: Review & Risk Intelligence',
    description:
      'Expanded beta usage with deeper technical workflows for pull-request review, risk discovery, and repository health insight.',
    changes: [
      {
        id: 'r090-c1',
        type: 'feature',
        text: 'Introduced due-diligence PR review with implementation-level recommendations.',
      },
      {
        id: 'r090-c2',
        type: 'feature',
        text: 'Released intelligent bug and risk scan for anti-pattern detection and quality assurance.',
      },
      {
        id: 'r090-c3',
        type: 'improvement',
        text: 'Expanded language and syntax comprehension for mixed-stack repositories.',
      },
      {
        id: 'r090-c4',
        type: 'fix',
        text: 'Improved long-file handling and reduced analysis latency in large mono-repos.',
      },
    ],
  },
  {
    id: 'rel-080',
    version: 'v0.8.0-alpha',
    date: 'January 15, 2026',
    title: 'Private Alpha: Core RAG Foundation',
    description:
      'Initial private alpha focused on validating repository ingestion, retrieval relevance, and AI response grounding.',
    changes: [
      {
        id: 'r080-c1',
        type: 'feature',
        text: 'Launched repository chat powered by retrieval-augmented generation.',
      },
      {
        id: 'r080-c2',
        type: 'feature',
        text: 'Added GitHub connection and manual repository synchronization flow.',
      },
      {
        id: 'r080-c3',
        type: 'improvement',
        text: 'Benchmarked indexing quality and retrieval relevance against large open-source codebases.',
      },
      {
        id: 'r080-c4',
        type: 'fix',
        text: 'Resolved chunking edge cases on high-length files and deeply nested source trees.',
      },
    ],
  },
]

const filters: Array<{ label: string; value: ChangeType | 'all' }> = [
  { label: 'All Updates', value: 'all' },
  { label: 'Features', value: 'feature' },
  { label: 'Improvements', value: 'improvement' },
  { label: 'Security', value: 'security' },
  { label: 'Fixes', value: 'fix' },
]

function getBadgeStyles(type: ChangeType): string {
  if (type === 'feature') {
    return 'text-(--accent-soft) bg-(--accent)/10 border-(--accent)/35'
  }
  if (type === 'improvement') {
    return 'text-[#9db8ff] bg-[rgba(157,184,255,0.12)] border-[rgba(157,184,255,0.35)]'
  }
  if (type === 'security') {
    return 'text-[#d8b1ff] bg-[rgba(216,177,255,0.12)] border-[rgba(216,177,255,0.35)]'
  }
  return 'text-[#ffb1b1] bg-[rgba(255,177,177,0.12)] border-[rgba(255,177,177,0.35)]'
}

export default function ChangelogPage() {
  const { isSignedIn } = useAuth()
  const [activeFilter, setActiveFilter] = useState<ChangeType | 'all'>('all')
  const [copiedReleaseId, setCopiedReleaseId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const flat = releases.flatMap((release) => release.changes)
    return {
      all: flat.length,
      feature: flat.filter((item) => item.type === 'feature').length,
      improvement: flat.filter((item) => item.type === 'improvement').length,
      security: flat.filter((item) => item.type === 'security').length,
      fix: flat.filter((item) => item.type === 'fix').length,
    }
  }, [])

  const filteredReleases = useMemo(() => {
    return releases
      .map((release) => ({
        ...release,
        changes: release.changes.filter((change) => activeFilter === 'all' || change.type === activeFilter),
      }))
      .filter((release) => release.changes.length > 0)
  }, [activeFilter])

  const handleCopyLink = async (release: Release) => {
    const origin = globalThis.location?.origin ?? ''
    const url = `${origin}/changelog#${release.version}`

    try {
      await navigator.clipboard.writeText(url)
      setCopiedReleaseId(release.id)
      globalThis.setTimeout(() => setCopiedReleaseId(null), 1800)
    } catch {
      setCopiedReleaseId(null)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      <main className="relative pt-30 pb-24 px-5 md:px-10">
        <div className="premium-grid absolute inset-0 opacity-35 pointer-events-none" />

        <section className="relative max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-(--accent-soft) font-mono">
            <Sparkles size={12} />
            Product Evolution
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.9] tracking-tight text-glow">
            <span>The RespoSage Prime changelog</span>
            <span className="block text-(--accent)">from alpha conviction to flagship release.</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-(--muted) text-base md:text-lg leading-relaxed">
            Track product progress, architectural milestones, and quality upgrades with release notes written for teams that care about engineering rigor.
          </p>
        </section>

        <section className="relative max-w-6xl mx-auto mt-12 flex flex-wrap items-center justify-center gap-2">
          {filters.map((filter) => {
            const count = counts[filter.value]
            const isActive = activeFilter === filter.value
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] md:text-xs uppercase tracking-[0.12em] font-mono transition-all border ${
                  isActive
                    ? 'bg-(--accent) text-[#1b1307] border-(--accent) shadow-[0_0_18px_rgba(216,164,93,0.35)]'
                    : 'bg-[rgba(247,239,221,0.03)] text-(--muted) border-(--line) hover:text-(--text) hover:border-(--accent)/35'
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    isActive ? 'bg-[#1b1307]/15 text-[#1b1307]' : 'bg-[rgba(247,239,221,0.05)] text-(--muted)'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </section>

        <section className="relative max-w-6xl mx-auto mt-12">
          {filteredReleases.length === 0 ? (
            <div className="premium-card rounded-3xl p-16 text-center">
              <span className="font-display text-5xl text-(--accent)">•</span>
              <h2 className="font-display text-3xl mt-4">No updates in this category yet</h2>
              <p className="text-(--muted) mt-3">Try another filter to view all available release notes.</p>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 border border-(--line) text-(--text) font-mono text-sm hover:bg-[rgba(247,239,221,0.06)] transition"
              >
                Show All Updates
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="hidden md:block absolute left-10 top-4 bottom-4 w-px bg-[linear-gradient(180deg,rgba(216,164,93,0.45),rgba(247,239,221,0.08),transparent)]" />

              <div className="space-y-8">
                {filteredReleases.map((release) => (
                  <article key={release.id} id={release.version} className="premium-card rounded-3xl p-7 md:p-9">
                    <div className="grid grid-cols-1 md:grid-cols-[0.18fr_0.82fr] gap-6 md:gap-8">
                      <div className="md:pl-8 relative">
                        <div className="hidden md:block absolute left-0.5 top-2 h-4 w-4 rounded-full border border-(--accent)/45 bg-(--accent)/18" />
                        <span className="inline-flex rounded-full border border-(--accent)/35 bg-(--accent)/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-(--accent-soft) font-mono">
                          {release.version}
                        </span>
                        <p className="mt-2 text-xs text-(--muted) font-mono">{release.date}</p>
                      </div>

                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <h2 className="font-display text-3xl leading-none">{release.title}</h2>
                            <p className="mt-3 text-(--muted) leading-relaxed">{release.description}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(release)}
                            className="inline-flex items-center gap-2 rounded-lg border border-(--line) px-3 py-2 text-xs font-mono text-(--muted) hover:text-(--text) hover:border-(--accent)/35 transition"
                          >
                            {copiedReleaseId === release.id ? <Check size={14} /> : <Link2 size={14} />}
                            {copiedReleaseId === release.id ? 'Copied' : 'Copy Link'}
                          </button>
                        </div>

                        <div className="mt-6 rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-5">
                          <ul className="space-y-3">
                            {release.changes.map((change) => (
                              <li key={change.id} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] font-mono ${getBadgeStyles(change.type)}`}
                                >
                                  {change.type}
                                </span>
                                <span className="text-sm text-(--text)/90 leading-relaxed">{change.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="relative max-w-5xl mx-auto mt-14 premium-card rounded-3xl p-8 md:p-11 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">Try It Live</p>
          <h3 className="mt-4 font-display text-4xl md:text-5xl leading-none">Experience the current flagship build.</h3>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto">
            Preview the latest RespoSage Prime workflows in real time and evaluate output quality before scaling usage.
          </p>
          <Link
            href={isSignedIn ? '/dashboard' : '/sign-up'}
            className="mt-7 inline-flex items-center justify-center rounded-xl px-7 py-3.5 bg-(--accent) text-[#1b1307] font-mono text-sm font-semibold hover:brightness-110 transition"
          >
            {isSignedIn ? 'Open Console' : 'Start For Free'}
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
