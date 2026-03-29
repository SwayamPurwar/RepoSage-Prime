import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type WorkflowStep = {
  id: string
  title: string
  narrative: string
  technical: string
  outcome: string
}

const steps: WorkflowStep[] = [
  {
    id: '01',
    title: 'Repository Intake',
    narrative:
      'Share any public GitHub URL and RespoSage Prime immediately maps the repository structure, validates scope, and prepares it for strategic indexing.',
    technical:
      'GitHub API + Octokit retrieve metadata, branches, and complete file-tree context before ingestion begins.',
    outcome: 'Outcome: instant repository readiness with zero manual setup.',
  },
  {
    id: '02',
    title: 'Intelligence Indexing',
    narrative:
      'Your codebase is segmented into meaningful semantic chunks and transformed into retrieval-ready vectors for precise contextual recall.',
    technical:
      'Production embedding pipelines encode code chunks into retrieval vectors, indexed in a managed vector layer for high-speed semantic similarity search.',
    outcome: 'Outcome: deep, fast, and scalable context retrieval foundation.',
  },
  {
    id: '03',
    title: 'Decision-Grade Responses',
    narrative:
      'Ask for architectural guidance, due-diligence reviews, onboarding briefs, or risk scans and receive answers grounded in your own repository context.',
    technical:
      'RAG retrieves top relevant chunks through cosine similarity, then Gemini 1.5 Pro composes output with repository-specific evidence and structured reasoning.',
    outcome: 'Outcome: premium-quality insight that teams can act on confidently.',
  },
]

const stack = [
  'Modern Web Platform',
  'Secure Authentication',
  'Managed Data Services',
  'Vector Retrieval Index',
  'Advanced AI Model Layer',
  'Git Repository Integrations',
  'Global Hosting Fabric',
  'Type-Safe Data Access',
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      <main className="relative pt-30 pb-24 px-5 md:px-10">
        <div className="premium-grid absolute inset-0 opacity-35 pointer-events-none" />

        <section className="relative max-w-6xl mx-auto text-center">
          <span className="inline-flex rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-(--accent-soft) font-mono">
            Operating Model
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.9] tracking-tight text-glow">
            <span>From raw repository to</span>
            <span className="block text-(--accent)">flagship intelligence output.</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-(--muted) text-base md:text-lg leading-relaxed">
            RespoSage Prime combines retrieval-augmented generation with premium interface design to turn codebase complexity into executive-ready clarity and engineering momentum.
          </p>
        </section>

        <section className="relative max-w-6xl mx-auto mt-14 space-y-8">
          {steps.map((step) => (
            <article key={step.id} className="premium-card rounded-3xl p-7 md:p-9">
              <div className="grid grid-cols-1 lg:grid-cols-[0.28fr_0.72fr] gap-8">
                <div>
                  <p className="font-display text-7xl leading-none text-(--accent)/35">{step.id}</p>
                  <h2 className="mt-3 font-display text-3xl leading-none">{step.title}</h2>
                </div>

                <div className="space-y-5">
                  <p className="text-(--text)/90 leading-relaxed">{step.narrative}</p>
                  <div className="rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-(--accent-soft)">Technical Foundation</p>
                    <p className="mt-3 text-sm text-(--muted) leading-relaxed">{step.technical}</p>
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-(--accent-soft)">{step.outcome}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="relative max-w-6xl mx-auto mt-14 grid grid-cols-1 lg:grid-cols-[0.7fr_0.3fr] gap-6">
          <article className="premium-card rounded-3xl p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">Platform Stack</p>
            <h3 className="mt-4 font-display text-4xl leading-none">Precision, speed, and reliability under load</h3>
            <p className="mt-4 text-sm text-(--muted) max-w-2xl">
              The stack is selected for production-grade performance, secure identity boundaries, and high-quality AI output consistency.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-(--line) bg-[rgba(247,239,221,0.03)] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-(--muted) font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>
          </article>

          <article className="premium-card rounded-3xl p-7 md:p-9 flex flex-col justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">Next Step</p>
              <h3 className="mt-4 font-display text-3xl leading-none">Run the live flagship preview</h3>
              <p className="mt-4 text-sm text-(--muted)">
                Experience the workflow in action and evaluate the response quality before activating full access.
              </p>
            </div>

            <Link
              href="/livedemo"
              className="mt-7 inline-flex items-center justify-center rounded-xl px-4 py-3 bg-(--accent) text-[#1b1307] text-sm font-mono font-semibold hover:brightness-110 transition"
            >
              Open Live Experience
            </Link>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  )
}
