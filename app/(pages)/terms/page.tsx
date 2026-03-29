import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      
      <main className="relative pt-30 pb-24 px-5 md:px-10">
        <div className="premium-grid absolute inset-0 opacity-35 pointer-events-none" />

        <section className="relative max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-(--accent-soft) font-mono">
            Terms & Governance
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.9] tracking-tight text-glow">
            Terms with clarity,{' '}
            <span className="block text-(--accent)">written for professional teams.</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-(--muted) text-base md:text-lg leading-relaxed">
            These Terms define how RespoSage Prime is accessed, used, and supported. Our objective is simple: transparent expectations and reliable platform conduct.
          </p>
          <p className="mt-4 text-xs md:text-sm font-mono uppercase tracking-[0.14em] text-(--muted)">
            Last updated: March 2026
          </p>
        </section>

        <section className="relative max-w-6xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="premium-card rounded-2xl p-5 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">Permitted Use</p>
            <p className="mt-2 text-sm text-(--text)">Public repositories and lawful platform usage only.</p>
          </div>
          <div className="premium-card rounded-2xl p-5 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">AI Outputs</p>
            <p className="mt-2 text-sm text-(--text)">Assistant guidance; final engineering judgment remains yours.</p>
          </div>
          <div className="premium-card rounded-2xl p-5 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">Updates</p>
            <p className="mt-2 text-sm text-(--text)">Policy changes are published with a revised effective date.</p>
          </div>
        </section>

        <section className="relative max-w-6xl mx-auto mt-8 space-y-6">
          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">01 · Acceptance</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Agreement to platform terms</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              By accessing or using RespoSage Prime, you agree to these Terms of Service. If you do not agree, please discontinue use of the platform.
            </p>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">02 · Service Use</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Use standards and operating boundaries</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              RespoSage Prime is built for repository analysis and AI-assisted engineering workflows. You agree to maintain responsible and lawful use.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-(--text)/90">
              <li>Submit repositories only when you have authorization to access and process them.</li>
              <li>Do not use the service for abusive, malicious, or unlawful activities.</li>
              <li>Do not attempt to disrupt, reverse engineer, or bypass platform safeguards.</li>
            </ul>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">03 · Intellectual Property</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Ownership and protected platform assets</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              RespoSage Prime product design, software logic, and branded platform elements remain the property of the service owner and are protected by applicable intellectual property laws.
            </p>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">04 · AI Output Disclaimer</p>
            <h2 className="mt-3 font-display text-3xl leading-none">AI guidance is advisory, not absolute</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              Platform outputs are generated by machine learning systems and should be reviewed by qualified developers before implementation.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-(--text)/90">
              <li>Responses may be incomplete, outdated, or imperfect for a specific codebase context.</li>
              <li>You are responsible for validation, testing, and production decisions.</li>
              <li>We do not guarantee absolute accuracy or fitness for any particular purpose.</li>
            </ul>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">05 · Liability Limits</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Scope of liability and warranty position</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              RespoSage Prime is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages arising from platform use.
            </p>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">06 · Changes To Terms</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Policy updates and effective date control</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              We may revise these Terms as the platform evolves. Updated terms will be posted on this page with a revised &quot;Last updated&quot; date.
            </p>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">07 · Contact</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Questions about obligations or legal terms</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              For contractual or service-term questions, contact support@veloramaison.com or use our direct contact channel.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 border border-(--line) text-(--text) font-mono text-sm hover:bg-[rgba(247,239,221,0.06)] transition"
            >
              Open Contact Page
            </Link>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  )
}
