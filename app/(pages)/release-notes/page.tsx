'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { useMemo, useState } from 'react'

type ChangeType = 'feature' | 'improvement' | 'fix' | 'security'

interface Change {
  type: ChangeType
  text: string
}

interface Release {
  version: string
  date: string
  title: string
  description: string
  changes: Change[]
}

const getBadgeStyles = (type: ChangeType) => {
  switch (type) {
    case 'feature':
      return 'text-[#f2ddbd] bg-[rgba(215,180,127,0.16)] border-[rgba(215,180,127,0.35)]'
    case 'improvement':
      return 'text-[#d6cebf] bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.2)]'
    case 'security':
      return 'text-[#f59e0b] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.35)]'
    case 'fix':
      return 'text-[#ef4444] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.35)]'
    default:
      return 'text-[#d6cebf] bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.2)]'
  }
}

// --- UPDATED RELEASE NOTES ---
const allReleases: Release[] = [
  {
    version: 'v1.1.0',
    date: 'April 6, 2026',
    title: 'Enterprise Performance & Security Update',
    description:
      'A massive architectural upgrade introducing real-time AI streaming, zero-trust security protocols, and blazingly fast vector search capabilities.',
    changes: [
      { type: 'feature', text: 'Implemented real-time AI streaming responses (Vercel AI SDK) for near-zero latency chat.' },
      { type: 'feature', text: 'Added one-click intelligent Unit Test generation for focused files.' },
      { type: 'feature', text: 'Context-aware file chat now automatically injects the active file into the prompt.' },
      { type: 'security', text: 'Upgraded API key storage to use deterministic SHA-256 one-way hashing.' },
      { type: 'security', text: 'Patched IDOR vulnerabilities with strict Zero-Trust repository ownership validation.' },
      { type: 'improvement', text: 'Added HNSW (Hierarchical Navigable Small World) vector indexes to Postgres for exponentially faster code retrieval.' },
      { type: 'improvement', text: 'Introduced plan-based tiered rate limiting to protect API infrastructure.' },
      { type: 'fix', text: 'Wrapped chat and analytics logging in strict ACID database transactions to prevent billing desyncs.' },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'March 21, 2026',
    title: 'General Availability Release',
    description:
      'RepoSage Prime reached v1 with a complete premium workflow for repository intelligence, review support, and delivery acceleration.',
    changes: [
      { type: 'feature', text: 'Launched full production dashboard and repository workspace experience.' },
      { type: 'feature', text: 'Enabled high-confidence review and bug analysis workflows for all paid users.' },
      { type: 'improvement', text: 'Reduced indexing latency through optimized semantic retrieval paths.' },
      { type: 'security', text: 'Strengthened auth and scope controls for enterprise-grade workspace safety.' },
    ],
  },
  {
    version: 'v0.9.0-beta',
    date: 'February 10, 2026',
    title: 'Public Beta Expansion',
    description:
      'We expanded early access and introduced stronger quality controls around pull request review and repository health checks.',
    changes: [
      { type: 'feature', text: 'Added PR review assistant with actionable recommendations.' },
      { type: 'feature', text: 'Introduced semantic bug detection for high-risk code patterns.' },
      { type: 'improvement', text: 'Improved multi-language parsing and repository ingestion reliability.' },
      { type: 'fix', text: 'Resolved indexing edge cases in large and nested repository structures.' },
    ],
  },
  {
    version: 'v0.8.0-alpha',
    date: 'January 15, 2026',
    title: 'Private Alpha Launch',
    description:
      'The initial alpha validated the retrieval-first architecture and core chat workflow with a curated developer group.',
    changes: [
      { type: 'feature', text: 'Released first conversational code intelligence experience.' },
      { type: 'feature', text: 'Connected GitHub repository ingestion with early indexing pipeline.' },
      { type: 'improvement', text: 'Benchmarked retrieval quality and ranking strategy across open-source projects.' },
      { type: 'fix', text: 'Improved handling for long files and dense code sections during processing.' },
    ],
  },
]

export default function ChangelogPage() {
  const { isSignedIn } = useAuth()
  const [activeFilter, setActiveFilter] = useState<ChangeType | 'all'>('all')

  const counts = useMemo(() => {
    const flatChanges = allReleases.flatMap((release) => release.changes)
    return {
      all: flatChanges.length,
      feature: flatChanges.filter((change) => change.type === 'feature').length,
      improvement: flatChanges.filter((change) => change.type === 'improvement').length,
      security: flatChanges.filter((change) => change.type === 'security').length,
      fix: flatChanges.filter((change) => change.type === 'fix').length,
    }
  }, [])

  const filteredReleases = allReleases
    .map((release) => ({
      ...release,
      changes: release.changes.filter((change) => activeFilter === 'all' || change.type === activeFilter),
    }))
    .filter((release) => release.changes.length > 0)

  const filters: { label: string; value: ChangeType | 'all'; count: number }[] = [
    { label: 'All', value: 'all', count: counts.all },
    { label: 'Features', value: 'feature', count: counts.feature },
    { label: 'Improvements', value: 'improvement', count: counts.improvement },
    { label: 'Security', value: 'security', count: counts.security },
    { label: 'Fixes', value: 'fix', count: counts.fix },
  ]

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
        <header className="text-center mb-14">
          <p className="inline-flex items-center text-[10px] tracking-[0.2em] uppercase text-[#f2ddbd] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] rounded-full px-4 py-2">
            Release Notes
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mt-8">Product evolution, clearly documented.</h1>
          <p className="text-[#d6cebf] text-base md:text-lg max-w-3xl mx-auto leading-relaxed mt-6">
            A concise record of product milestones, delivery upgrades, and quality improvements across each release cycle.
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-2 mb-14">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition ${
                activeFilter === filter.value
                  ? 'bg-[#d7b47f] text-[#141317] font-semibold'
                  : 'border border-[rgba(255,255,255,0.16)] text-[#d6cebf] hover:text-[#f5f2ec]'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        <section className="space-y-8">
          {filteredReleases.length === 0 ? (
            <div className="text-center rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-12">
              <p className="text-[#d6cebf]">No entries match this filter.</p>
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-4 text-[#f2ddbd] hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredReleases.map((release) => (
              <article
                key={release.version}
                className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-8 md:p-10"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="font-display text-4xl text-[#f2ddbd]">{release.title}</h2>
                  <span className="text-[10px] uppercase tracking-[0.16em] border border-[rgba(255,255,255,0.16)] rounded-full px-3 py-1 text-[#d6cebf] w-fit">
                    {release.version}
                  </span>
                </div>
                <p className="text-sm text-[#b3ab9c] mt-1">{release.date}</p>
                <p className="text-[#d6cebf] mt-4 leading-relaxed">{release.description}</p>

                <ul className="space-y-3 mt-6">
                  {release.changes.map((change) => (
                    <li key={`${release.version}-${change.text}`} className="flex flex-col sm:flex-row gap-3 sm:items-start">
                      <span className={`text-[10px] uppercase tracking-[0.14em] border rounded-full px-3 py-1 w-fit min-w-[100px] text-center ${getBadgeStyles(change.type)}`}>
                        {change.type}
                      </span>
                      <span className="text-sm text-[#d6cebf] leading-relaxed flex-1">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>

        <section className="mt-16 text-center">
          <Link
            href={isSignedIn ? '/dashboard' : '/sign-up'}
            className="inline-flex items-center justify-center rounded-full bg-[#d7b47f] px-7 py-3 text-sm font-semibold text-[#141317] hover:bg-[#f2ddbd] transition"
          >
            {isSignedIn ? 'Open Workspace' : 'Start Premium Trial'}
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}