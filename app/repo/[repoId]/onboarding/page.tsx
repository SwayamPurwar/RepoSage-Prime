// app/repo/[repoId]/onboarding/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LoadingDots } from '@/components/LoadingSpinner'
import { BookOpen, Copy, Check } from 'lucide-react'

export default function RepoOnboardingPage() {
  const params = useParams()
  const repoId = params.repoId as string
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const [onboarding, setOnboarding] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    document.title = "Generate Onboarding | RespoSage Prime"
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  const generateOnboarding = async () => {
    setIsGenerating(true)
    setError(null)
    setOnboarding(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Generation failed')
      
      setOnboarding(data.onboarding)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!onboarding) return
    await navigator.clipboard.writeText(onboarding)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isLoaded || !isSignedIn) return null

  return (
    <div className="min-h-screen bg-[#080b10] text-[#e8edf3]">
      <Navbar />

      <main className="pt-28 pb-24 px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => router.push(`/repo/${repoId}`)}
            className="font-mono text-sm px-4 py-2 rounded-xl border border-[rgba(255,255,255,0.07)] text-[#6b7a8d] hover:text-white hover:border-[rgba(255,255,255,0.18)] transition"
          >
            ← Back to Repo
          </button>
        </div>

        <div className="bg-[#0f1520] border border-[rgba(255,255,255,0.07)] rounded-3xl p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="w-16 h-16 bg-[#a855f7]/10 text-[#a855f7] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} />
            </div>
            <h1 className="font-display font-bold text-3xl mb-4">AI Onboarding Guide</h1>
            <p className="font-mono text-sm text-[#6b7a8d] leading-relaxed">
              We'll analyze your repository's architecture, dependencies, and setup scripts to generate a comprehensive onboarding manual for new developers joining your team.
            </p>
            
            <button
              onClick={generateOnboarding}
              disabled={isGenerating}
              className="mt-8 bg-[#a855f7] text-white font-bold font-mono px-8 py-4 rounded-xl hover:bg-[#a855f7]/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              {isGenerating ? <span className="flex items-center gap-2"><LoadingDots /> Analyzing Architecture...</span> : 'Generate Guide'}
            </button>

            {error && <p className="mt-4 text-red-400 font-mono text-xs">{error}</p>}
          </div>

          {onboarding && (
            <div className="mt-12 border-t border-[rgba(255,255,255,0.05)] pt-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-xl text-white">Generated Guide</h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 font-mono text-xs px-4 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition"
                >
                  {copied ? <Check size={14} className="text-[#a855f7]" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
              </div>
              
              <div className="bg-[#080b10] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 overflow-x-auto">
                <pre className="font-mono text-sm text-[#c5d0de] whitespace-pre-wrap">
                  {onboarding}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}