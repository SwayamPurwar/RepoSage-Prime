'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@clerk/nextjs'
import { ArrowRight, Sparkles } from 'lucide-react'

type Feature = {
  icon: string
  title: string
  tag: string
  desc: string
  bullets: string[]
}

export default function FeaturesPage() {
  const { isSignedIn } = useAuth()
  const features: Feature[] = [
    {
      icon: '💬',
      title: 'Repository Intelligence Chat',
      tag: 'CONTEXT GROUNDED',
      desc: 'Interrogate any repository with confidence and receive precise answers anchored in real implementation context, architecture links, and code-level evidence.',
      bullets: [
        'Context-anchored answers powered by retrieval architecture',
        'Understands complex cross-module dependencies',
        'Coverage across modern multi-language repositories',
        'Generates clear explanations and technical narratives instantly',
        'Ask about architecture, logic paths, or specific functions',
      ],
    },
    {
      icon: '🔍',
      title: 'Executive-Grade PR Review',
      tag: 'REVIEW ENGINE',
      desc: 'Submit code or diffs and receive high-caliber review guidance centered on maintainability, delivery confidence, and pre-merge risk control.',
      bullets: [
        'Automated review depth for every pull request',
        'Proactive detection of security liabilities',
        'Targeted performance and efficiency guidance',
        'Consistency checks aligned to engineering standards',
        'Actionable recommendations with implementation direction',
      ],
    },
    {
      icon: '🐛',
      title: 'Risk & Defect Detection',
      tag: 'INTELLIGENT SCAN',
      desc: 'Expose latent defects, security anti-patterns, and structural quality drift using semantic detection that goes beyond conventional static checks.',
      bullets: [
        'Deep semantic bug discovery across critical paths',
        'Flags race conditions and memory-risk patterns',
        'Identifies common security anti-patterns early',
        'Reduces technical debt with focused refactor guidance',
        'Supports continuous quality surveillance',
      ],
    },
    {
      icon: '📋',
      title: 'Flagship Onboarding Briefs',
      tag: 'GUIDED RAMP-UP',
      desc: 'Generate structured onboarding narratives that help new engineers understand architecture, critical flows, and strategic decision points in record time.',
      bullets: [
        'Instant architecture overviews with clear framing',
        'Maps key entry points and data-flow pathways',
        'Produces production-ready onboarding docs and guides',
        'Interactive Q&A support for fast team ramp-up',
        'Documentation stays aligned as the codebase evolves',
      ],
    },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      <main className="relative pt-30 pb-24 px-5 md:px-10">
        <div className="premium-grid absolute inset-0 opacity-35 pointer-events-none" />

        <section className="relative max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-(--accent-soft) font-mono">
            <Sparkles size={12} />
            Flagship Capabilities
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.9] tracking-tight text-glow">
            Built for teams that expect
            <span className="block text-(--accent)">premium intelligence across every release cycle.</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-(--muted) text-base md:text-lg leading-relaxed">
            RespoSage Prime turns repository complexity into decision-grade clarity, stronger engineering velocity, and a platform experience worthy of premium standards.
          </p>
        </section>

        <section className="relative max-w-6xl mx-auto mt-14 space-y-6">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group premium-card rounded-3xl p-7 md:p-9 transition-all duration-300 hover:border-[rgba(216,164,93,0.32)]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl" aria-hidden="true">{feature.icon}</div>
                    <span className="text-[10px] uppercase tracking-widest text-(--accent-soft) bg-[rgba(216,164,93,0.1)] border border-[rgba(216,164,93,0.3)] px-3 py-1 rounded-full font-mono">
                      {feature.tag}
                    </span>
                  </div>

                  <h2 className="font-display font-bold text-3xl leading-none">{feature.title}</h2>
                  <p className="text-(--muted) leading-relaxed mt-4">
                    {feature.desc}
                  </p>
                </div>

                <div className="rounded-2xl border border-(--line) bg-[rgba(0,0,0,0.24)] p-6 md:p-7">
                  <h3 className="text-[10px] uppercase tracking-[0.18em] text-(--accent-soft) mb-4 font-mono">Capabilities</h3>
                  <ul className="space-y-3">
                    {feature.bullets.map((bullet) => (
                      <li key={`${feature.title}-${bullet}`} className="flex gap-3 text-sm font-mono text-(--text)/85">
                        <span className="text-(--accent-soft)">→</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="relative max-w-5xl mx-auto mt-14 premium-card rounded-3xl p-8 md:p-11 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">Start Now</p>
          <h2 className="mt-4 font-display text-4xl md:text-5xl leading-none">Activate flagship access.</h2>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto">
            Bring your repository into RespoSage Prime and run premium chat, review, risk analysis, and onboarding workflows from one unified command center.
          </p>

          <div className="mt-7">
            <Link
              href={isSignedIn ? '/dashboard' : '/sign-up'}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 bg-(--accent) text-[#1b1307] font-mono text-sm font-semibold hover:brightness-110 transition"
            >
              {isSignedIn ? 'Open Console' : 'Start Premium Access'}
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
