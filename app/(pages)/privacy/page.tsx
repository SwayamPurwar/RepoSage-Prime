import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function PrivacyPage() {
  const sections = [
    {
      title: 'Information We Collect',
      points: [
        'Account profile details provided through authentication providers (such as email and display name).',
        'Repository metadata and repository URLs submitted for indexing and analysis.',
        'Product usage signals including interactions, feature usage, and generated outputs.',
      ],
    },
    {
      title: 'How We Use Data',
      points: [
        'To deliver repository intelligence features, including chat, review, and onboarding workflows.',
        'To improve model quality, product reliability, and user experience across the platform.',
        'To provide customer support, billing operations, and critical account communications.',
      ],
    },
    {
      title: 'Storage and Security',
      points: [
        'Data is stored using managed cloud infrastructure with access controls and encrypted transport.',
        'We apply security best practices for authentication, session handling, and internal access permissions.',
        'No security control is absolute, but we continuously review and improve safeguards.',
      ],
    },
    {
      title: 'Third-Party Services',
      points: [
        'Authentication and identity providers to secure access to your workspace.',
        'AI and infrastructure providers to process repository context and generate responses.',
        'Payment providers for subscriptions and billing workflows.',
      ],
    },
    {
      title: 'Retention and Deletion',
      points: [
        'We retain data only as long as needed to operate services, meet legal obligations, and resolve disputes.',
        'You may request account deletion or data deletion through support channels.',
        'Certain operational logs may be retained for security and compliance purposes for limited periods.',
      ],
    },
  ]

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />
      <main className="max-w-5xl mx-auto pt-32 pb-24 px-6 md:px-10">
        <header className="text-center mb-14">
          <p className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#f2ddbd]">
            Privacy and Data
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mt-8">Privacy Policy</h1>
          <p className="text-[#d6cebf] text-sm mt-4">Last updated: March 27, 2026</p>
        </header>

        <section className="mb-10 rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-7 md:p-9">
          <p className="text-[#d6cebf] leading-relaxed text-sm md:text-base">
            This Privacy Policy explains how RepoSage Prime collects, uses, and protects information when you use our services.
            By accessing the platform, you acknowledge this policy and consent to data handling practices described below.
          </p>
          <p className="text-[#d6cebf] leading-relaxed text-sm md:text-base mt-4">
            We do not sell personal information. We use data primarily to operate the product, secure user accounts,
            improve reliability, and provide customer support.
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
            <h2 className="font-display text-3xl text-[#f2ddbd]">6. Contact</h2>
            <p className="mt-4 text-[#d6cebf] text-sm md:text-base leading-relaxed">
              For privacy-related questions, requests, or concerns, contact us at support@reposageprime.com or visit the{' '}
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
