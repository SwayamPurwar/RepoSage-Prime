import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function TermsPage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      points: [
        'By accessing or using RepoSage Prime, you agree to these Terms of Service.',
        'If you do not agree with any part of these terms, you must discontinue use of the platform.',
      ],
    },
    {
      title: 'Permitted Use',
      points: [
        'You must use the platform only for lawful purposes and in compliance with applicable regulations.',
        'You may not misuse, disrupt, or attempt unauthorized access to systems, services, or data.',
        'You are responsible for ensuring your repository submissions and prompts are authorized and compliant.',
      ],
    },
    {
      title: 'Intellectual Property',
      points: [
        'The platform, branding, design, and original product content are owned by RepoSage Prime unless stated otherwise.',
        'Your underlying code and repository rights remain with you or the applicable rights holder.',
      ],
    },
    {
      title: 'AI Output Disclaimer',
      points: [
        'AI-generated outputs are provided for guidance and should be reviewed by qualified human developers.',
        'We do not guarantee that AI outputs are error-free, complete, or suitable for every production context.',
        'You are responsible for decisions and implementation actions based on generated output.',
      ],
    },
    {
      title: 'Limitation of Liability',
      points: [
        'Services are provided on an as-is and as-available basis to the extent permitted by law.',
        'RepoSage Prime is not liable for indirect, incidental, special, or consequential damages.',
      ],
    },
    {
      title: 'Changes to Terms',
      points: [
        'We may update these terms over time to reflect legal, product, or policy changes.',
        'Continued use of the platform after updates constitutes acceptance of the revised terms.',
      ],
    },
  ]

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />
      <main className="max-w-5xl mx-auto pt-32 pb-24 px-6 md:px-10">
        <header className="text-center mb-14">
          <p className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#f2ddbd]">
            Legal Terms
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mt-8">Terms of Service</h1>
          <p className="text-[#d6cebf] text-sm mt-4">Last updated: March 27, 2026</p>
        </header>

        <section className="mb-10 rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-7 md:p-9">
          <p className="text-[#d6cebf] leading-relaxed text-sm md:text-base">
            These Terms govern access to and use of RepoSage Prime services. They define responsibilities,
            usage limits, and legal boundaries for platform interactions.
          </p>
          <p className="text-[#d6cebf] leading-relaxed text-sm md:text-base mt-4">
            If you use the platform on behalf of a company or team, you confirm that you are authorized to accept
            these terms on that entity&apos;s behalf.
          </p>
        </section>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-7 md:p-9"
            >
              <h2 className="font-display text-3xl text-[#f2ddbd]">
                {index + 1}. {section.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm md:text-base text-[#d6cebf] leading-relaxed">
                    <span className="text-[#d7b47f]">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-7 md:p-9">
            <h2 className="font-display text-3xl text-[#f2ddbd]">7. Contact</h2>
            <p className="mt-4 text-[#d6cebf] text-sm md:text-base leading-relaxed">
              For legal inquiries related to these terms, contact support@reposageprime.com or visit the{' '}
              <Link href="/contact" className="text-[#f2ddbd] hover:underline">
                Contact Page
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
