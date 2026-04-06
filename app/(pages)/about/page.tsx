'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { BriefcaseBusiness, FolderGit2, Globe, Sparkles, ShieldCheck, Zap, Cpu } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'

export default function AboutPage() {
  const { isSignedIn } = useAuth()

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-10 space-y-24">
        {/* --- HERO SECTION --- */}
        <section className="max-w-5xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#f2ddbd] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] rounded-full px-4 py-2">
            <Sparkles size={12} />
            About RepoSage Prime
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mt-8">
            Built for teams that demand velocity, security, and absolute clarity.
          </h1>
          <p className="max-w-3xl mx-auto mt-7 text-[#d6cebf] text-base md:text-lg leading-relaxed">
            RepoSage Prime started with a simple observation: modern codebases grow faster than human context. 
            We built an enterprise-grade intelligence layer that bridges the gap between raw code and actionable architectural insight, 
            helping teams move from exploration to confident execution in seconds.
          </p>
        </section>

        {/* --- FOUNDER & CONNECT SECTION --- */}
        <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
          <article className="relative rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-8 md:p-10 overflow-hidden">
            {/* Subtle premium background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d7b47f] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#b3ab9c]">The Architect</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-6 sm:items-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-display text-[#141317] bg-[#d7b47f] shadow-[0_0_30px_rgba(215,180,127,0.3)]">
                SP
              </div>
              <div>
                <h2 className="font-display text-4xl text-[#f2ddbd]">Swayam Purwar</h2>
                <p className="mt-1 text-sm text-[#d6cebf] uppercase tracking-[0.16em]">Full Stack & AI Infrastructure</p>
              </div>
            </div>

            <p className="mt-8 text-[#d6cebf] leading-relaxed relative z-10">
              I specialize in building performant, zero-friction products at the intersection of full-stack engineering and scalable AI. 
              RepoSage Prime reflects that exact focus: a highly secure, lightning-fast platform designed to eliminate codebase friction 
              and make complex technical context instantly accessible to modern developers.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 relative z-10">
              {['BCA Pre-Final Year', 'Next.js + AI SDK', 'Zero-Trust Architecture'].map((tag) => (
                <span key={tag} className="rounded-full border border-[rgba(215,180,127,0.3)] bg-[rgba(215,180,127,0.05)] px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-[#f2ddbd]">
                  {tag}
                </span>
              ))}
            </div>
          </article>

          <aside className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-8 flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#b3ab9c] mb-6">Connect & Verify</p>
            <div className="space-y-3">
              <a
                href="https://www.linkedin.com/in/swayam-purwar"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-5 py-4 text-sm text-[#d6cebf] hover:text-[#f2ddbd] hover:border-[rgba(215,180,127,0.4)] hover:bg-[rgba(215,180,127,0.05)] transition-all"
              >
                <BriefcaseBusiness size={18} className="text-[#b3ab9c] group-hover:text-[#f2ddbd] transition-colors" />
                <div className="flex-1">
                  <p className="font-semibold text-white group-hover:text-[#f2ddbd] transition-colors">LinkedIn Profile</p>
                  <p className="text-xs text-[#8a8375] mt-0.5">Professional Network</p>
                </div>
              </a>
              <a
                href="https://github.com/swayampurwar"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-5 py-4 text-sm text-[#d6cebf] hover:text-[#f2ddbd] hover:border-[rgba(215,180,127,0.4)] hover:bg-[rgba(215,180,127,0.05)] transition-all"
              >
                <FolderGit2 size={18} className="text-[#b3ab9c] group-hover:text-[#f2ddbd] transition-colors" />
                <div className="flex-1">
                  <p className="font-semibold text-white group-hover:text-[#f2ddbd] transition-colors">GitHub Profile</p>
                  <p className="text-xs text-[#8a8375] mt-0.5">Open Source Contributions</p>
                </div>
              </a>
              <a
                href="https://github.com/SwayamPurwar/RepoSage-Prime.git"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-5 py-4 text-sm text-[#d6cebf] hover:text-[#f2ddbd] hover:border-[rgba(215,180,127,0.4)] hover:bg-[rgba(215,180,127,0.05)] transition-all"
              >
                <Globe size={18} className="text-[#b3ab9c] group-hover:text-[#f2ddbd] transition-colors" />
                <div className="flex-1">
                  <p className="font-semibold text-white group-hover:text-[#f2ddbd] transition-colors">Project Repository</p>
                  <p className="text-xs text-[#8a8375] mt-0.5">View the source code</p>
                </div>
              </a>
            </div>
          </aside>
        </section>

        {/* --- PILLARS SECTION --- */}
        <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Cpu,
              title: 'The Challenge',
              text: 'Engineering teams spend excessive time decoding architecture, ownership, and hidden dependencies before they can confidently push to production.',
            },
            {
              icon: Zap,
              title: 'The Architecture',
              text: 'Powered by HNSW vector indexing and real-time AI streaming, RepoSage transforms static code into a deeply conversational knowledge layer.',
            },
            {
              icon: ShieldCheck,
              title: 'The Standard',
              text: 'Built on a strict Zero-Trust foundation, ensuring your repository analysis is entirely secure, accurate, and tied explicitly to your active codebase.',
            },
          ].map((card) => (
            <article key={card.title} className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8 hover:border-[rgba(215,180,127,0.3)] transition-colors duration-500">
              <div className="w-12 h-12 rounded-xl bg-[rgba(215,180,127,0.1)] border border-[rgba(215,180,127,0.2)] flex items-center justify-center mb-6">
                <card.icon className="text-[#d7b47f]" size={20} />
              </div>
              <h3 className="font-display text-3xl text-[#f2ddbd]">{card.title}</h3>
              <p className="mt-4 text-sm text-[#d6cebf] leading-relaxed">{card.text}</p>
            </article>
          ))}
        </section>

        {/* --- CTA SECTION --- */}
        <section className="max-w-4xl mx-auto rounded-3xl border border-[rgba(215,180,127,0.2)] bg-[linear-gradient(145deg,rgba(215,180,127,0.05),rgba(15,15,18,0.8))] p-10 md:p-16 text-center shadow-[0_0_50px_rgba(215,180,127,0.05)]">
          <h2 className="font-display text-4xl md:text-6xl leading-tight text-white">Interested in building something exceptional?</h2>
          <p className="mt-6 text-[#d6cebf] max-w-2xl mx-auto leading-relaxed text-lg">
            I am always open to ambitious collaborations, product partnerships, and high-impact engineering conversations.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.linkedin.com/in/swayam-purwar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#d7b47f] px-8 py-3.5 text-sm font-bold text-[#141317] hover:bg-[#f2ddbd] transition-all hover:scale-105"
            >
              Connect on LinkedIn
            </a>
            <Link
              href={isSignedIn ? '/dashboard' : '/sign-up'}
              className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] px-8 py-3.5 text-sm font-semibold text-[#f5f2ec] hover:bg-[rgba(255,255,255,0.1)] transition-all"
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