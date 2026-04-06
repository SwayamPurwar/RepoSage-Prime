import Link from 'next/link'
import { FolderGit2 } from 'lucide-react'

const BRAND_NAME = 'RepoSage'
const BRAND_SUFFIX = ' Prime'

export default function Footer() {
  const trustPillars = ['Private by Default', 'Enterprise-Ready', 'Built for Teams']

  return (
    <footer className="pt-20 pb-10 px-6 md:px-10 relative">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(215,180,127,0.6) 40%, rgba(242,221,189,0.55) 60%, transparent 100%)'
        }}
      />

      <div className="max-w-7xl mx-auto rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.66)] backdrop-blur-xl px-8 py-10 md:px-12 md:py-14 shadow-[0_18px_48px_rgba(0,0,0,0.45)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div>
          <Link href="/">
            <span className="font-display text-3xl cursor-pointer tracking-wide">
              <span className="text-[#f5f2ec]">{BRAND_NAME}</span>
              <span className="text-[#d7b47f]">{BRAND_SUFFIX}</span>
            </span>
          </Link>
          <p className="text-sm text-[#b3ab9c] mt-3 leading-relaxed">
            Premium intelligence for modern engineering organizations that value velocity, confidence, and craftsmanship.
          </p>
          <a
            href="https://github.com/SwayamPurwar/RepoSage-Prime.git"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-fit border border-[rgba(255,255,255,0.15)] rounded-full px-4 py-2 text-xs text-[#d6cebf] hover:border-[rgba(215,180,127,0.5)] hover:text-[#f5f2ec] transition mt-5"
          >
            <FolderGit2 size={14} />
            {' '}
            Explore on GitHub
          </a>
        </div>

        <div>
          <h4 className="text-[11px] tracking-[0.2em] text-[#d7b47f] uppercase mb-4">Platform</h4>
          <div className="flex flex-col gap-2">
            <Link href="/demo" className="text-sm text-[#b3ab9c] hover:text-[#f5f2ec] transition">
              Interactive Demo
            </Link>
            <Link href="/features" className="text-sm text-[#b3ab9c] hover:text-[#f5f2ec] transition">
              Feature Suite
            </Link>
            <Link href="/method" className="text-sm text-[#b3ab9c] hover:text-[#f5f2ec] transition">
              Delivery Method
            </Link>
            <Link href="#" className="text-sm text-[#b3ab9c] hover:text-[#f5f2ec] transition">
              Pricing
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[11px] tracking-[0.2em] text-[#d7b47f] uppercase mb-4">Company</h4>
          <div className="flex flex-col gap-2">
            <Link href="/about" className="text-sm text-[#b3ab9c] hover:text-[#f5f2ec] transition">
              About {BRAND_NAME}
            </Link>
            <Link href="/contact" className="text-sm text-[#b3ab9c] hover:text-[#f5f2ec] transition">
              Concierge Contact
            </Link>
            <Link href="/release-notes" className="text-sm text-[#b3ab9c] hover:text-[#f5f2ec] transition">
              Release Notes
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[11px] tracking-[0.2em] text-[#d7b47f] uppercase mb-4">Policies</h4>
          <div className="flex flex-col gap-2">
            <Link href="/privacy" className="text-sm text-[#b3ab9c] hover:text-[#f5f2ec] transition">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-[#b3ab9c] hover:text-[#f5f2ec] transition">
              Terms
            </Link>
          </div>
        </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.12)] my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#b3ab9c]">
            Copyright 2026 {BRAND_NAME} Prime. All rights reserved.
          </p>

          <div className="flex gap-2 flex-wrap justify-center">
            {trustPillars.map((item) => (
              <span
                key={item}
                className="border border-[rgba(255,255,255,0.14)] text-[#d6cebf] text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>

          
        </div>
      </div>
    </footer>
  )
}
