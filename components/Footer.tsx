import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import LogoCanvas from './LogoCanvas'

export default function Footer() {
  const productLinks = [
    { href: '/livedemo', label: 'Live Demo' },
    { href: '/capabilities', label: 'Capabilities' },
    { href: '/framework', label: 'Framework' },
    {
      href: '/pricing',
      label: 'Flagship Pricing',
    }
  ]

  const companyLinks = [
    { href: '/whyrespoSage', label: 'Why RespoSage' },
    { href: '/contact', label: 'Contact' },
    { href: '/changelog', label: 'Changelog' },
  ]

  const legalLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ]

  return (
    <footer className="bg-transparent pt-12 pb-8 px-5 md:px-10 relative border-t border-(--line)">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(216,164,93,0.5) 30%, rgba(115,184,187,0.45) 70%, transparent 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto">
       

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <LogoCanvas />
              <span className="font-display font-bold text-2xl leading-none cursor-pointer">
                <span className="text-(--text)">RespoSage</span>
                <span className="text-(--accent)"> Prime</span>
              </span>
            </Link>
            <p className="text-sm text-(--muted) mt-3 max-w-xs">
              The flagship intelligence suite for high-performing software organizations.
            </p>

            <a
              href="https://github.com/SwayamPurwar/RepoSage-Prime.git"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 rounded-lg border border-(--line) px-3 py-2 text-xs text-(--muted) hover:border-(--accent)/70 hover:text-(--text) transition font-mono"
            >
              <ExternalLink size={14} />
              Source Repository
            </a>
          </div>

          <FooterColumn title="Product">
            {productLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-(--muted) hover:text-(--text) transition">
                {item.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Company">
            {companyLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-(--muted) hover:text-(--text) transition">
                {item.label}
              </Link>
            ))}

            <a
              href="https://github.com/SwayamPurwar/RepoSage-Prime.git"
              
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-(--muted) hover:text-(--text) transition"
            >
              GitHub
            </a>
          </FooterColumn>

          <FooterColumn title="Legal">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-(--muted) hover:text-(--text) transition">
                {item.label}
              </Link>
            ))}

            <a
              href="mailto:swayampurwar111104@gmail.com"
              className="text-sm text-(--muted) hover:text-(--text) transition"
            >
              support@resposageprime.com
            </a>
          </FooterColumn>
        </div>

        <div className="border-t border-(--line) pt-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <p className="text-[11px] text-(--muted) font-mono">© 2026 RespoSage Prime. Built for premium engineering teams.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  children,
}: Readonly<{
  title: string
  children: React.ReactNode
}>) {
  return (
    <div>
      <h4 className="text-[10px] tracking-[0.22em] text-(--muted) uppercase mb-4 font-mono">{title}</h4>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}
