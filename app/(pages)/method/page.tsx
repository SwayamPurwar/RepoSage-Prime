import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Repository Intake & Zero-Trust Check',
      desc: 'Submit a GitHub repository URL to initiate ingestion through our strict security and validation pipeline.',
      detail:
        'RepoSage Prime verifies repository ownership, applies plan-based tiered rate limiting via Upstash Redis, and resolves codebase boundaries before indexing.',
    },
    {
      num: '02',
      title: 'High-Performance Vector Indexing',
      desc: 'Your codebase is chunked intelligently and converted into high-value embeddings for blazingly fast retrieval.',
      detail:
        'Embeddings are stored in Neon Postgres using HNSW (Hierarchical Navigable Small World) indexes to guarantee millisecond similarity search at scale.',
    },
    {
      num: '03',
      title: 'Streaming Intelligence Layer',
      desc: 'Queries merge with active-file context and HNSW vector results, streaming back instantly with accurate token tracking.',
      detail:
        'The Vercel AI SDK powers real-time generation, while ACID-compliant Drizzle database transactions handle analytics and token logging in the background without blocking the UI.',
    },
  ]

  const techStack = [
    'Next.js 15 App Router',
    'Vercel AI SDK',
    'Neon Postgres + HNSW',
    'Upstash Redis',
    'Drizzle ORM',
    'Clerk Auth',
    'Groq / OpenAI',
  ]

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-10 max-w-6xl mx-auto">
        <header className="text-center mb-20">
          <p className="inline-flex items-center text-[10px] tracking-[0.2em] uppercase text-[#f2ddbd] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] rounded-full px-4 py-2">
            Method
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mt-8">From repository URL to delivery-grade insight.</h1>
          <p className="text-[#d6cebf] text-base md:text-lg max-w-3xl mx-auto leading-relaxed mt-6">
            RepoSage Prime combines HNSW retrieval architecture with real-time model streaming to produce answers engineering teams can trust.
          </p>
        </header>

        <section className="space-y-8">
          {steps.map((step) => (
            <article
              key={step.num}
              className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-6 rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-8 md:p-10"
            >
              <div>
                <p className="font-display text-6xl text-[#d7b47f] leading-none">{step.num}</p>
              </div>
              <div>
                <h2 className="font-display text-4xl text-[#f2ddbd]">{step.title}</h2>
                <p className="text-[#d6cebf] leading-relaxed mt-4">{step.desc}</p>
                <div className="mt-5 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#b3ab9c]">Technical Detail</p>
                  <p className="text-sm text-[#d6cebf] mt-2 leading-relaxed">{step.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-20 text-center">
          <h2 className="font-display text-4xl md:text-5xl">Platform Foundation</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[#d6cebf]"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}