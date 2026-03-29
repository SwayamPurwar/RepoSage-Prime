'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { ArrowRight, ExternalLink, Menu, Sparkles, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import LogoCanvas from './LogoCanvas'

export default function Navbar() {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const lastScrollYRef = useRef(0)

  const navLinks = [
    { href: '/livedemo', label: 'Live Demo' },
    { href: '/whyrespoSage', label: 'Why RespoSage' },
    { href: '/framework', label: 'Framework' },
  ]

  useEffect(() => {
    const controlNavbar = () => {
      const currentY = globalThis.window.scrollY
      const delta = currentY - lastScrollYRef.current

      if (currentY < 40) {
        setIsVisible(true)
      } else if (delta > 4) {
        setIsVisible(false)
        setIsMobileMenuOpen(false)
      } else if (delta < -4) {
        setIsVisible(true)
      }

      lastScrollYRef.current = currentY
    }

    globalThis.window.addEventListener('scroll', controlNavbar, { passive: true })
    return () => globalThis.window.removeEventListener('scroll', controlNavbar)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-5 md:px-8 py-2.5 transition-transform duration-300 backdrop-blur-xl border-b border-(--line) bg-[rgba(9,10,16,0.86)] ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      aria-label="Primary"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between rounded-2xl px-4 md:px-6 py-2 border border-[rgba(247,239,221,0.14)] bg-[linear-gradient(130deg,rgba(247,239,221,0.08),rgba(115,184,187,0.03))] shadow-[0_18px_44px_rgba(0,0,0,0.46)]">
        {/* LEFT — Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="hidden md:block">
            <LogoCanvas />
          </div>
          <div className="leading-tight flex flex-col">
            <span className="font-display font-semibold text-2xl cursor-pointer tracking-wide">
              <span className="text-(--text)">RespoSage</span>
              <span className="text-(--accent)"> Prime</span>
            </span>
            <span className="hidden md:inline font-mono text-[9px] uppercase tracking-[0.24em] text-(--muted) mt-0.5">
              Precision Engineering Intelligence
            </span>
           
          </div>
        </Link>

        {/* CENTER — Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-2 rounded-full border border-[rgba(247,239,221,0.13)] px-2 py-1.5 bg-[linear-gradient(130deg,rgba(247,239,221,0.06),rgba(247,239,221,0.02))]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-xs font-mono uppercase tracking-[0.12em] rounded-full px-3 py-1.5 transition-all ${
                    isActive
                      ? 'text-(--text) bg-[rgba(216,164,93,0.16)] border border-[rgba(216,164,93,0.35)]'
                      : 'text-(--muted) border border-transparent hover:text-(--text) hover:bg-[rgba(247,239,221,0.04)]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-(--accent)" aria-hidden="true" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* RIGHT — Actions */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://github.com/SwayamPurwar/RepoSage-Prime.git"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--line) text-(--muted) hover:text-(--text) hover:border-(--accent)/40 transition"
            aria-label="Open GitHub repository"
          >
            <ExternalLink size={16} />
          </a>
          {isSignedIn && (
            <Link
              href="/dashboard"
              className={`inline-flex items-center justify-center rounded-lg font-mono text-xs font-medium transition-colors h-8 px-3 border ${
                pathname === '/dashboard'
                  ? 'text-(--text) border-(--accent)/40 bg-[rgba(216,164,93,0.1)]'
                  : 'text-(--muted) border-(--line) hover:text-(--text) hover:border-(--accent)/30'
              }`}
            >
              Open Console
            </Link>
          )}
          {isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-lg font-mono text-xs font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-(--line) text-(--muted) hover:text-(--text) hover:border-(--accent)/30 h-8 px-3"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg font-mono text-xs font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-(--accent) text-[#181106] hover:brightness-110 h-8 px-3.5 shadow-[0_10px_28px_rgba(216,164,93,0.45)]"
              >
                Start Premium Access
                <ArrowRight size={12} />
              </Link>
            </>
          )}
        </div>

        {/* MOBILE — Hamburger */}
        <div className="md:hidden flex items-center gap-4">
          <span className="text-[9px] uppercase tracking-[0.2em] text-(--accent-soft) font-mono border border-[rgba(216,164,93,0.35)] bg-[rgba(216,164,93,0.08)] rounded-full px-2 py-1">
            VIP
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--line) text-(--muted) hover:text-(--text) transition"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav"
          className="md:hidden absolute top-full left-4 right-4 mt-2 p-4 rounded-2xl bg-(--bg-elevated) border border-(--line) flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm font-mono transition-colors ${
                pathname === link.href
                  ? 'text-(--text) rounded-lg bg-[rgba(216,164,93,0.12)] border border-[rgba(216,164,93,0.32)] px-3 py-2'
                  : 'text-(--muted) hover:text-(--text) px-3 py-2'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-(--line) pt-4 flex flex-col gap-3">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center rounded-lg font-mono text-sm font-medium transition-colors bg-transparent text-(--text) border border-(--line) hover:bg-[rgba(247,239,221,0.06)] h-10 px-4"
                >
                  Open Console
                </Link>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-(--muted)">Account</div>
                  <UserButton />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center rounded-lg font-mono text-sm font-medium transition-colors bg-transparent text-(--text) border border-(--line) hover:bg-[rgba(247,239,221,0.06)] h-10 px-4"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-mono text-sm font-semibold transition-colors bg-(--accent) text-[#181106] hover:brightness-110 h-10 px-4"
                >
                  Start Premium Access
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
