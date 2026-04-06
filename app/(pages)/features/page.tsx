'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@clerk/nextjs'
import { BotMessageSquare, FileCode2, ShieldCheck, Sparkles, Workflow, Zap } from 'lucide-react'

export default function FeaturesPage() {
  const { isSignedIn } = useAuth()

  const features = [
    {
      icon: Zap,
      title: 'Real-Time Streaming Intelligence',
      tag: 'STREAMING AI',
      desc: 'Ask deep architectural questions and receive instantly streaming, context-anchored answers powered by the Vercel AI SDK.',
      bullets: [
        'Near-zero latency streaming responses',
        'Automatic active-file context injection',
        'Model routing (GPT-4o, Gemini 1.5 Pro, Llama 3.3)',
        'Contextual memory and conversation history',
      ],
    },
    {
      icon: FileCode2,
      title: 'Intelligent Test Generation',
      tag: 'ONE-CLICK AUTOMATION',
      desc: 'Instantly generate comprehensive, context-aware unit test suites for any focused file to ensure reliable code coverage.',
      bullets: [
        'One-click automated test drafting',
        'Focus-mode aware of active file contents',
        'Customized to your specific repository patterns',
        'Directly integrates into your chat workspace',
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security & Speed',
      tag: 'ZERO-TRUST ARCHITECTURE',
      desc: 'Built on a foundation of rigorous security, utilizing deterministic one-way hashing and blazingly fast vector indexes.',
      bullets: [
        'HNSW Postgres indexing for millisecond retrieval',
        'Strict Zero-Trust repository ownership validation',
        'SHA-256 secure one-way API key hashing',
        'ACID-compliant transactional billing & analytics',
      ],
    },
    {
      icon: Workflow,
      title: 'Accelerated Team Onboarding',
      tag: 'TEAM ENABLEMENT',
      desc: 'Turn unfamiliar codebases into clear onboarding pathways so engineers can contribute with confidence from day one.',
      bullets: [
        'Generate architecture overviews instantly',
        'Map important flows and system boundaries',
        'Create reusable onboarding narratives',
        'Shorten time-to-productivity dramatically',
      ],
    },
  ]

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-10 max-w-6xl mx-auto">
        <header className="text-center mb-20">
          <p className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#f2ddbd] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] rounded-full px-4 py-2">
            <Sparkles size={12} />
            Premium Feature Suite
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mt-8">
            Every capability you need for confident software delivery.
          </h1>
          <p className="text-[#d6cebf] text-base md:text-lg max-w-3xl mx-auto leading-relaxed mt-6">
            RepoSage Prime combines real-time architectural understanding, automated testing, enterprise-grade security, and onboarding acceleration in one premium product experience.
          </p>
        </header>

        <section className="space-y-8">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-8 md:p-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8">
                <div>
                  <feature.icon className="text-[#d7b47f]" size={24} />
                  <h2 className="font-display text-4xl text-[#f2ddbd] mt-4">{feature.title}</h2>
                  <p className="text-[#d6cebf] leading-relaxed mt-4">{feature.desc}</p>
                  <span className="inline-block mt-5 text-[10px] uppercase tracking-[0.16em] text-[#f2ddbd] border border-[rgba(215,180,127,0.35)] bg-[rgba(215,180,127,0.1)] px-3 py-1 rounded-full">
                    {feature.tag}
                  </span>
                </div>

                <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6">
                  <p className="text-[11px] tracking-[0.18em] uppercase text-[#b3ab9c]">Capabilities</p>
                  <ul className="space-y-3 mt-4">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3 text-sm text-[#d6cebf] leading-relaxed">
                        <span className="text-[#d7b47f]">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-20 text-center rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-10 md:p-14">
          <h2 className="font-display text-4xl md:text-6xl leading-tight">Ready to upgrade your engineering workflow?</h2>
          <p className="mt-5 text-[#d6cebf] max-w-2xl mx-auto leading-relaxed">
            Start with premium repository intelligence and turn every sprint into a higher-confidence delivery cycle.
          </p>
          <div className="mt-8">
            <Link
              href={isSignedIn ? '/dashboard' : '/sign-up'}
              className="inline-flex items-center justify-center rounded-full bg-[#d7b47f] px-7 py-3 text-sm font-semibold text-[#141317] hover:bg-[#f2ddbd] transition"
            >
              {isSignedIn ? 'Open Workspace' : 'Start Premium Trial'}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}