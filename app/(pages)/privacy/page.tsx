import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      
      <main className="relative pt-30 pb-24 px-5 md:px-10">
        <div className="premium-grid absolute inset-0 opacity-35 pointer-events-none" />

        <section className="relative max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-(--accent-soft) font-mono">
            Trust & Privacy
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.9] tracking-tight text-glow">
            Privacy, designed for{' '}
            <span className="block text-(--accent)">serious engineering teams.</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-(--muted) text-base md:text-lg leading-relaxed">
            RespoSage Prime is built to deliver deep repository intelligence while maintaining disciplined handling of account data, usage context, and code signals.
          </p>
          <p className="mt-4 text-xs md:text-sm font-mono uppercase tracking-[0.14em] text-(--muted)">
            Last updated: March 2026
          </p>
        </section>

        <section className="relative max-w-6xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="premium-card rounded-2xl p-5 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">Data Sales</p>
            <p className="mt-2 text-sm text-(--text)">Never sold to third parties.</p>
          </div>
          <div className="premium-card rounded-2xl p-5 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">Encryption</p>
            <p className="mt-2 text-sm text-(--text)">Data encrypted in transit with TLS.</p>
          </div>
          <div className="premium-card rounded-2xl p-5 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">Retention</p>
            <p className="mt-2 text-sm text-(--text)">User-controlled deletion and 30-day history retention.</p>
          </div>
        </section>

        <section className="relative max-w-6xl mx-auto mt-8 space-y-6">
          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">01 · Information We Collect</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Data required to deliver platform intelligence</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              We collect the minimum operational data required to authenticate access, ingest repositories, and provide analysis continuity.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-(--text)/90">
              <li>GitHub repository URLs or references submitted for analysis.</li>
              <li>Account profile data handled through Clerk (email, name, and avatar).</li>
              <li>Usage history, including prompts, responses, and analysis events.</li>
            </ul>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">02 · How Data Is Used</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Purpose-limited use with clear boundaries</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              Data is used only to operate and improve RespoSage Prime workflows, including repository chat, reviews, and quality analysis.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-(--text)/90">
              <li>Deliver and maintain AI analysis and repository conversation features.</li>
              <li>Improve retrieval quality, reliability, and product performance.</li>
              <li>Communicate operational updates, account notices, or support responses.</li>
              <li>We do not sell personal data or usage data.</li>
            </ul>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">03 · Security & Infrastructure</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Infrastructure selected for resilience and control</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              We apply practical safeguards and trusted services to protect platform data and maintain service continuity.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-(--text)/90">
              <li>Primary storage in managed PostgreSQL infrastructure with secure operational controls.</li>
              <li>Vector representations stored in a managed retrieval index for semantic performance.</li>
              <li>TLS encryption in transit and scoped service-level access controls.</li>
            </ul>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">04 · Service Providers</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Partners we rely on to operate the platform</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              We use specialized third-party providers for authentication, model processing, repository access, and database infrastructure.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-(--text)/90">
              <li>Clerk for authentication and user session management.</li>
              <li>Google Gemini API for advanced model-driven code analysis.</li>
              <li>GitHub API for repository access and content retrieval.</li>
              <li>Managed PostgreSQL services for durable storage operations.</li>
            </ul>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">05 · Retention & User Control</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Clear retention window and account-level control</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              Analysis history is retained for 30 days to preserve workflow continuity. You may request account deletion and associated data removal through your workspace settings.
            </p>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">06 · Contact</p>
            <h2 className="mt-3 font-display text-3xl leading-none">Questions about privacy or data handling</h2>
            <p className="mt-4 text-(--muted) leading-relaxed">
              Reach us at support@veloramaison.com, or use the dedicated contact channel for platform and compliance-related questions.
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
