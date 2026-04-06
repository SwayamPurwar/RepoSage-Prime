'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { ArrowUpRight, FolderGit2, Menu, Sparkles, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import LogoCanvas from './LogoCanvas'

const BRAND_NAME = 'RepoSage'
const BRAND_SUFFIX = ' Prime'

export default function Navbar() {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const navLinks = [
    { href: '/demo', label: 'Demo' },
     { href: '/features', label: 'Feature' },
    { href: '/method', label: 'Method' },
   
  ]

  useEffect(() => {
    const controlNavbar = () => {
      if (globalThis.window !== undefined) {
        setIsScrolled(globalThis.window.scrollY > 12)
        if (globalThis.window.scrollY > lastScrollY && globalThis.window.scrollY > 100) {
          setIsVisible(false)
        } else {
          setIsVisible(true)
        }
        setLastScrollY(globalThis.window.scrollY)
      }
    }

    window.addEventListener('scroll', controlNavbar)
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [lastScrollY])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className={`max-w-7xl mx-auto flex items-center justify-between rounded-2xl border px-4 md:px-6 py-3 backdrop-blur-xl transition-all duration-300 ${
        isScrolled
          ? 'border-[rgba(215,180,127,0.35)] bg-[rgba(11,11,14,0.82)] shadow-[0_14px_40px_rgba(0,0,0,0.52)]'
          : 'border-[rgba(255,255,255,0.1)] bg-[rgba(11,11,14,0.7)] shadow-[0_12px_36px_rgba(0,0,0,0.45)]'
      }`}>
        <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="h-9 w-9 flex items-center justify-center shrink-0">
            <LogoCanvas />
          </div>
          <span className="font-display text-2xl leading-none tracking-wide cursor-pointer">
            <span className="text-[#f5f2ec]">{BRAND_NAME}</span>
            <span className="text-[#d7b47f]">{BRAND_SUFFIX}</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-full px-3 py-1.5 text-sm font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'text-[#f5f2ec] bg-[rgba(215,180,127,0.14)] border border-[rgba(215,180,127,0.35)]'
                      : 'text-[#b3ab9c] hover:text-[#f5f2ec]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://github.com/SwayamPurwar/RepoSage-Prime.git"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] px-3 py-1.5 text-xs text-[#d6cebf] hover:text-[#f5f2ec] hover:border-[rgba(215,180,127,0.45)] transition"
            aria-label="Open GitHub repository"
          >
            <FolderGit2 size={14} />
            Star
          </a>
          {isSignedIn && (
            <Link
              href="/dashboard"
              className={`inline-flex items-center justify-center rounded-full text-xs font-medium transition-colors h-9 px-4 ${
                pathname === '/dashboard' ? 'text-[#f5f2ec]' : 'text-[#d6cebf] hover:text-[#f5f2ec]'
              }`}
            >
              Workspace
            </Link>
          )}
          {isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-full text-xs font-medium transition-colors bg-transparent text-[#d6cebf] hover:text-[#f5f2ec] h-9 px-4"
              >
                Member Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-full text-xs font-semibold tracking-wide transition-colors bg-[#d7b47f] text-[#141317] hover:bg-[#f2ddbd] h-9 px-4 gap-1"
              >
                Start Premium Trial
                <ArrowUpRight size={14} />
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-[#d6cebf] hover:text-[#f5f2ec] transition"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 rounded-2xl border border-[rgba(255,255,255,0.1)] p-4 bg-[rgba(11,11,14,0.96)] backdrop-blur-xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 shadow-[0_20px_44px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#d7b47f]">
            <Sparkles size={12} />
            Curated Access
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm transition-colors ${
                pathname === link.href ? 'text-[#f5f2ec]' : 'text-[#b3ab9c] hover:text-[#f5f2ec]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-[rgba(255,255,255,0.1)] pt-4 flex flex-col gap-3">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors bg-transparent text-[#f5f2ec] border border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.06)] h-10 px-4"
                >
                  Open Workspace
                </Link>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#b3ab9c]">Account</div>
                  <UserButton />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors bg-transparent text-[#f5f2ec] border border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.06)] h-10 px-4"
                >
                  Member Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors bg-[#d7b47f] text-[#141317] hover:bg-[#f2ddbd] h-10 px-4"
                >
                  Start Premium Trial
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
