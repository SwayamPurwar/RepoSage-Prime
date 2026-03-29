'use client'

import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const metrics = [
  { value: '3x', label: 'Faster Engineering Context' },
  { value: 'Flagship', label: 'Product Positioning Standard' },
  { value: 'Decision-Grade', label: 'Intelligence Output Quality' },
]

const principles = [
  {
    id: '01',
    title: 'Signal Before Noise',
    description:
      'Every screen is designed to reduce cognitive load and surface what influences delivery, risk, and strategic decisions first.',
  },
  {
    id: '02',
    title: 'Narrative Over Raw Data',
    description:
      'RespoSage Prime turns code intelligence into decision-ready narratives that engineering leads, founders, and buyers can align on quickly.',
  },
  {
    id: '03',
    title: 'Premium by Design',
    description:
      'The UX language, visual hierarchy, and interaction quality are intentionally crafted to support high trust and premium willingness to pay.',
  },
]

const stack = [
  'Modern Web Platform',
  'Secure Identity Layer',
  'Managed Data Infrastructure',
  'Semantic Vector Indexing',
  'Advanced AI Reasoning',
  'Repository Connectors',
  'Global Edge Delivery',
  'Typed Data Access',
]

export default function AboutPage() {
  const { isSignedIn } = useAuth()

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      <main className="relative pt-30 pb-24 px-5 md:px-10">
        <div className="premium-grid absolute inset-0 opacity-35 pointer-events-none" />

        <section className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-end">
           <div></div>
            <span className="inline-flex items-center gap-2 rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-(--accent-soft)">
              <Sparkles size={12} />
              The RespoSage Prime House
            </span>

            <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.9] tracking-tight text-glow">
              Built to make engineering
              <span className="block text-(--accent)">look and operate like a premium discipline.</span>
            </h1>

            <p className="mt-6 max-w-3xl text-(--muted) text-base md:text-lg leading-relaxed">
              RespoSage Prime was created around one conviction: repository intelligence should not just answer questions, it should strengthen strategic confidence.
              We design for teams who value precision, speed, and flagship product quality.
            </p>
              <h2 className="font-display text-4xl leading-none">RespoSage Prime Studio</h2>

          <article className="premium-card rounded-3xl p-6 md:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">Executive Snapshot</p>
            <div className="mt-5 space-y-3">
              {metrics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="font-display text-2xl text-(--accent)">{item.value}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--muted) text-right">{item.label}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="relative max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8">
          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">Founder Narrative</p>
            <div className="mt-5 flex items-start gap-5">
              <div className="h-16 w-16 rounded-2xl bg-(--accent) text-[#1b1307] font-display text-2xl flex items-center justify-center">SP</div>
              <div>
                <h2 className="font-display text-4xl leading-none">Swayam Purwar</h2>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-(--muted)">Product Engineering & Intelligence Design</p>
              </div>
            </div>

            <blockquote className="mt-6 border-l-2 border-(--accent)/50 pl-4 text-(--text) leading-relaxed">
              RespoSage Prime is my response to a real developer pain point: teams lose time understanding codebases when they should be shipping outcomes.
              This product exists to convert complexity into clarity at a premium standard.
            </blockquote>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Bachelor of Computer Application', 'Pre-Final Year', 'Product Engineering'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-(--line) px-3 py-1 text-[9px] uppercase tracking-[0.14em] text-(--muted) font-mono"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/swayam-purwar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-(--line) px-3 py-2 text-sm text-(--muted) hover:text-(--text) hover:border-(--accent)/35 transition"
              >
                <ExternalLink size={15} />
                LinkedIn
              </a>
              <a
                href="https://github.com/swayampurwar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-(--line) px-3 py-2 text-sm text-(--muted) hover:text-(--text) hover:border-(--accent)/35 transition"
              >
                <ExternalLink size={15} />
                GitHub
              </a>
            </div>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">Platform Composition</p>
            <h3 className="mt-4 font-display text-4xl leading-none">Built for reliability and trust</h3>
            <p className="mt-4 text-sm text-(--muted) leading-relaxed">
              The stack is chosen for speed, scalability, and consistent high-quality output under real engineering pressure.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              {stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg border border-(--line) bg-[rgba(247,239,221,0.03)] px-3 py-2 text-[10px] uppercase tracking-[0.12em] font-mono text-(--muted)"
                >
                  {tech}
                </span>
              ))}
            </div>

            <a
              href="https://github.com/swayampurwar/CodeSense-AI.git"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-lg border border-(--line) px-4 py-2 text-sm text-(--muted) hover:text-(--text) hover:border-(--accent)/35 transition"
            >
              <ExternalLink size={15} />
              View Repository
            </a>
          </article>
        </section>

        <section className="relative max-w-6xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {principles.map((item) => (
            <article key={item.id} className="premium-card rounded-2xl p-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">{item.id}</span>
              <h3 className="font-display text-2xl leading-none mt-3">{item.title}</h3>
              <p className="mt-3 text-sm text-(--muted) leading-relaxed">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="relative max-w-5xl mx-auto mt-14 premium-card rounded-3xl p-8 md:p-11 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">Partnership</p>
          <h2 className="mt-4 font-display text-4xl md:text-5xl leading-none">Collaborate at flagship ambition.</h2>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto">
            Open to product collaborations, premium engineering initiatives, and AI workflow partnerships that require precision and velocity.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://www.linkedin.com/in/swayam-purwar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-(--accent) text-[#1b1307] font-mono text-sm font-semibold hover:brightness-110 transition"
            >
              Connect on LinkedIn
            </a>
            <a
              href="https://github.com/swayampurwar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 border border-(--line) text-(--text) font-mono text-sm hover:bg-[rgba(247,239,221,0.06)] transition"
            >
              Explore GitHub
            </a>
            <Link
              href={isSignedIn ? '/dashboard' : '/sign-up'}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 border border-transparent text-(--muted) font-mono text-sm hover:text-(--text) transition"
            >
              {isSignedIn ? 'Open Console' : 'Try RespoSage Prime'}
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
