'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { ArrowRight, CheckCircle2, Lock, Sparkles, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '../components/Footer'

export default function HomePage() {
  const { isSignedIn } = useAuth()
  const ctaHref = isSignedIn ? '/dashboard' : '/sign-up'
  const ctaText = isSignedIn ? 'Enter Flagship Workspace' : 'Claim Priority Access'

  const [stats, setStats] = useState({
    totalVisitors: 0,
    totalDemoRuns: 0,
    totalRepos: 0,
  })

  useEffect(() => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'page_visit' }),
    }).catch(() => {})

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics')
        if (!response.ok) return

        const data = await response.json()
        if (data && !data.error) {
          setStats({
            totalVisitors: data.totalVisitors || 0,
            totalDemoRuns: data.totalDemoRuns || 0,
            totalRepos: data.totalRepos || 0,
          })
        }
      } catch {
        // Ignore fetch errors for non-critical UI stats.
      }
    }

    fetchStats()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.12 }
    )

    const nodes = document.querySelectorAll('.fade-up')
    nodes.forEach((node) => observer.observe(node))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden selection:bg-(--accent)/30">
      <Navbar />

      <main>
        <section className="relative pt-32 pb-24 px-5 md:px-10">
          <div className="premium-grid absolute inset-0 pointer-events-none opacity-70" />
          <div className="absolute -top-24 left-[8%] h-56 w-56 rounded-full bg-(--accent)/25 blur-[110px] pointer-events-none" />
          <div className="absolute top-12 right-[8%] h-56 w-56 rounded-full bg-(--aqua)/20 blur-[120px] pointer-events-none" />

          <div className="relative max-w-6xl mx-auto">
            <div className="fade-up inline-flex items-center gap-2 rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 text-[10px] tracking-[0.28em] uppercase text-(--accent-soft) font-mono">
              <Sparkles size={13} />
              Flagship Engineering Intelligence
            </div>

            <div className="mt-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-end">
              <div className="fade-up">
                <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight text-glow">
                  The flagship layer
                  <br />
                  for elite software teams
                  <span className="block text-(--accent)">built to command premium trust.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-base md:text-lg text-(--muted) leading-relaxed">
                  RespoSage Prime transforms any repository into boardroom-grade clarity, senior-level review quality, and faster delivery confidence, packaged in a product experience buyers immediately value at a premium tier.
                </p>

                <div className="mt-9 flex flex-col sm:flex-row gap-4">
                  <Link
                    href={ctaHref}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 bg-(--accent) text-[#151007] font-mono text-sm font-semibold hover:brightness-110 transition"
                  >
                    {ctaText}
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/livedemo"
                    className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 border border-(--line) text-(--text) font-mono text-sm hover:bg-[rgba(247,239,221,0.06)] transition"
                  >
                    Experience The Product Story
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 text-xs text-(--muted) font-mono uppercase tracking-[0.14em]">
                  <span className="inline-flex items-center gap-2"><Lock size={13} /> Enterprise-grade trust</span>
                  <span className="inline-flex items-center gap-2"><Zap size={13} /> Instant strategic insight</span>
                  <span className="inline-flex items-center gap-2"><CheckCircle2 size={13} /> Buyer-ready experience</span>
                </div>
              </div>

              <div className="fade-up premium-card rounded-2xl p-6 md:p-8 animate-float">
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-(--accent-soft)">Market Proof</div>
                <div className="mt-6 space-y-5">
                  <StatRow label="Visitors" value={stats.totalVisitors.toLocaleString()} />
                  <StatRow label="Demo Runs" value={stats.totalDemoRuns.toLocaleString()} />
                  <StatRow label="Repositories" value={stats.totalRepos.toLocaleString()} />
                </div>
                <div className="mt-8 rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-(--accent-soft)">Premium conversion architecture</p>
                  <p className="mt-2 text-sm text-(--muted)">
                    This UX is designed to introduce high-value plans without reworking layout, storytelling, or buyer psychology.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-(--line) bg-[rgba(247,239,221,0.02)] py-5 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap inline-flex gap-12 text-(--muted) font-mono text-xs uppercase tracking-[0.24em]">
            {[
              { id: 'm1', label: 'Architecture Mapping' },
              { id: 'm2', label: 'Executive Engineering Visibility' },
              { id: 'm3', label: 'Senior-Level Review Intelligence' },
              { id: 'm4', label: 'Flagship Developer Experience' },
              { id: 'm5', label: 'Strategic Repo Narratives' },
              { id: 'm6', label: 'Premium Team Workflows' },
              { id: 'm7', label: 'Architecture Mapping' },
              { id: 'm8', label: 'Executive Engineering Visibility' },
              { id: 'm9', label: 'Senior-Level Review Intelligence' },
              { id: 'm10', label: 'Flagship Developer Experience' },
              { id: 'm11', label: 'Strategic Repo Narratives' },
              { id: 'm12', label: 'Premium Team Workflows' },
            ].map((item) => (
              <span key={item.id}>{item.label}</span>
            ))}
          </div>
        </section>

        <section id="features" className="max-w-6xl mx-auto px-5 md:px-10 py-20">
          <div className="fade-up text-center max-w-2xl mx-auto">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-(--accent-soft)">Why Buyers Pay More</p>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight mt-4">Positioned as a category flagship</h2>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {[
              {
                title: 'Boardroom Clarity',
                desc: 'Every repository narrative is shaped for confidence in technical due diligence, roadmap planning, and delivery commitments.',
              },
              {
                title: 'Principal-Grade Depth',
                desc: 'Move from surface-level dashboards to high-resolution review intelligence, risks, and architecture tradeoffs in minutes.',
              },
              {
                title: 'High-Ticket Product Language',
                desc: 'The interface, copy, and hierarchy are intentionally crafted to support premium pricing and strong willingness to pay.',
              },
            ].map((card) => (
              <article key={card.title} className="fade-up premium-card rounded-2xl p-6">
                <h3 className="font-display text-2xl leading-tight">{card.title}</h3>
                <p className="mt-3 text-(--muted) text-sm leading-relaxed">{card.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 md:px-10 pb-24">
          <div className="fade-up premium-card rounded-3xl p-7 md:p-10">
            <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-9 items-center">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-(--accent-soft)">Monetization Strategy</p>
                <h3 className="font-display text-4xl md:text-5xl mt-4 tracking-tight">Engineered to support higher pricing confidence.</h3>
                <p className="mt-4 text-(--muted) max-w-xl">
                  Launch with a premium first impression now, then activate tiered revenue with minimal friction as your buyer pipeline and product usage mature.
                </p>
              </div>

              <div className="rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-(--accent-soft)">Flagship plan architecture</p>
                <ul className="mt-4 space-y-2 text-sm text-(--muted)">
                  <li>Signature: single-team intelligence command center</li>
                  <li>Scale: unlimited repos with advanced review depth</li>
                  <li>Flagship: governance, collaboration, and strategic analytics</li>
                </ul>
                <Link
                  href="/dashboard"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 bg-(--aqua)/85 text-[#081011] font-mono text-sm font-semibold hover:bg-(--aqua-soft) transition"
                >
                  Enter Flagship Console
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function StatRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] px-4 py-3">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-(--muted)">{label}</span>
      <span className="font-display text-2xl text-(--accent)">{value}</span>
    </div>
  )
}
