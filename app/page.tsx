import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { ArrowRight, Sparkles, ShieldCheck, Workflow, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CounterItem } from '@/components/CounterItem'

export const metadata: Metadata = {
  title: 'RepoSage Prime | Enterprise Code Intelligence',
  description: 'Transform any repository into an executive-grade engineering briefing room. Understand architecture, onboard faster, and review with precision.',
  openGraph: {
    title: 'RepoSage Prime | Enterprise Code Intelligence',
    description: 'Understand architecture, onboard faster, and review with precision.',
    url: 'https://reposage.com', 
    siteName: 'RepoSage Prime',
    images: [
      {
        url: 'https://reposage.com/og-image.jpg', 
        width: 1200,
        height: 630,
        alt: 'RepoSage Prime Dashboard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepoSage Prime | Enterprise Code Intelligence',
    description: 'Transform any repository into an executive-grade engineering briefing room.',
    images: ['https://reposage.com/og-image.jpg'],
  },
}

async function getStats() {
  try {
    return { totalVisitors: 1240, totalDemoRuns: 850, totalRepos: 432 }
  } catch {
    return { totalVisitors: 0, totalDemoRuns: 0, totalRepos: 0 }
  }
}

export default async function HomePage() {
  const { userId } = await auth()
  const isSignedIn = !!userId
  
  const ctaHref = isSignedIn ? '/dashboard' : '/sign-up'
  const ctaText = isSignedIn ? 'Enter Workspace' : 'Start Premium Trial'

  const stats = await getStats()

  return (
    <div className="text-[#f5f2ec] overflow-x-hidden bg-[#0A0A0A]">
      <Navbar />

      <main>
        {/* --- HERO SECTION --- */}
        <section className="relative pt-36 pb-20 px-6 md:px-10">
          <div className="absolute left-1/2 -translate-x-1/2 top-16 h-72 w-[80vw] max-w-5xl rounded-full blur-[110px] bg-[radial-gradient(circle,rgba(215,180,127,0.35),transparent_68%)] pointer-events-none" />

          <div className="relative max-w-6xl mx-auto text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.05)] px-4 py-2 text-[10px] tracking-[0.18em] uppercase text-[#f2ddbd] animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Sparkles size={12} />
              Premium Engineering Intelligence
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.95] tracking-wide mt-8 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
              Repository intelligence for teams that ship with confidence.
            </h1>

            <p className="mt-8 max-w-2xl text-base md:text-lg text-[#d6cebf] leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
              RepoSage Prime transforms any repository into an executive-grade engineering briefing room. Understand architecture,
              onboard faster, review with precision, and move from uncertainty to decisions in minutes.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d7b47f] px-7 py-3 text-sm font-semibold tracking-wide text-[#141317] hover:bg-[#f2ddbd] transition-colors"
              >
                {ctaText}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] px-7 py-3 text-sm text-[#f5f2ec] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              >
                Watch Live Demo
              </Link>
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-1000 delay-700">
              {[
                { title: 'Precision Answers', desc: 'RAG-grounded responses anchored to your real code context.' },
                { title: 'Senior-Level Reviews', desc: 'Actionable review recommendations aligned with production quality.' },
                { title: 'Instant Onboarding', desc: 'New engineers become effective in a fraction of the usual ramp time.' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur-md hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                >
                  <h3 className="font-display text-3xl text-[#f2ddbd]">{item.title}</h3>
                  <p className="text-sm text-[#d6cebf] mt-3 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- STATS SECTION --- */}
        <section className="px-6 md:px-10 py-8">
          <div className="max-w-6xl mx-auto rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-8 md:p-10">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#b3ab9c] mb-8 text-center md:text-left">Operational Traction</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <CounterItem target={stats.totalVisitors} label="Unique Visitors" suffix="+" />
              <CounterItem target={stats.totalDemoRuns} label="Demo Sessions" suffix="+" />
              <CounterItem target={stats.totalRepos} label="Repositories Indexed" suffix="+" />
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS SECTION --- */}
        <section className="px-6 md:px-10 py-20">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#b3ab9c] mb-5 text-center md:text-left">How It Works</p>
            <h2 className="font-display text-4xl md:text-6xl leading-tight max-w-3xl text-center md:text-left mx-auto md:mx-0">
              A premium workflow from repository URL to production-level clarity.
            </h2>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: Workflow,
                  step: '01',
                  title: 'Connect Repository',
                  text: 'Submit any public GitHub URL and begin with zero setup friction.',
                },
                {
                  icon: Zap,
                  step: '02',
                  title: 'Intelligence Mapping',
                  text: 'RepoSage Prime indexes architecture, semantics, and dependency flows in seconds.',
                },
                {
                  icon: ShieldCheck,
                  step: '03',
                  title: 'Decision Support',
                  text: 'Get trusted answers, review guidance, and onboarding assets that improve delivery quality.',
                },
              ].map((item) => (
                <article
                  key={item.step}
                  className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-7 hover:-translate-y-1 transition-transform group"
                >
                  <item.icon className="text-[#d7b47f] group-hover:scale-110 transition-transform" size={24} />
                  <p className="mt-4 text-[11px] tracking-[0.2em] uppercase text-[#b3ab9c]">Step {item.step}</p>
                  <h3 className="font-display text-3xl mt-2 text-[#f2ddbd]">{item.title}</h3>
                  <p className="text-sm text-[#d6cebf] mt-3 leading-relaxed">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="px-6 md:px-10 pb-24">
          <div className="max-w-6xl mx-auto rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-10 md:p-14 relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full blur-[90px] bg-[radial-gradient(circle,rgba(215,180,127,0.4),transparent_70%)] pointer-events-none" />
            
            <div className="relative z-10 text-center md:text-left">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#b3ab9c]">Ready To Elevate Engineering</p>
              <h2 className="font-display text-4xl md:text-6xl leading-tight mt-4 max-w-3xl">
                Move from fragmented context to confident technical decisions.
              </h2>
              <p className="mt-5 max-w-2xl text-[#d6cebf] leading-relaxed mx-auto md:mx-0">
                Join teams using RepoSage Prime to replace onboarding drag, review bottlenecks, and unclear architecture with premium clarity.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d7b47f] px-7 py-3 text-sm font-semibold tracking-wide text-[#141317] hover:bg-[#f2ddbd] transition-colors"
                >
                  {isSignedIn ? 'Open Workspace' : 'Get Started'}
                  <ArrowRight size={16} />
                </Link>
                {!isSignedIn && (
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.16)] px-7 py-3 text-sm text-[#f5f2ec] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                  >
                    Member Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}