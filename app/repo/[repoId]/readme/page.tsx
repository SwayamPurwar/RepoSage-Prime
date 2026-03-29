// app/repo/[repoId]/readme/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LoadingDots } from '@/components/LoadingSpinner'
import { FileText, Copy, Check } from 'lucide-react'

export default function RepoReadmePage() {
  const params = useParams()
  const repoId = params.repoId as string
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const [readme, setReadme] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    document.title = "Generate README | RespoSage Prime"
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  const generateReadme = async () => {
    setIsGenerating(true)
    setError(null)
    setReadme(null)

    try {
      const res = await fetch('/api/readme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Generation failed')
      
      setReadme(data.readme)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!readme) return
    await navigator.clipboard.writeText(readme)
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
            <div className="w-16 h-16 bg-[#00e5a0]/10 text-[#00e5a0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText size={32} />
            </div>
            <h1 className="font-display font-bold text-3xl mb-4">AI README Generator</h1>
            <p className="font-mono text-sm text-[#6b7a8d] leading-relaxed">
              We'll analyze your indexed files, dependencies, and structure to write a beautiful, professional README.md for your project.
            </p>
            
            <button
              onClick={generateReadme}
              disabled={isGenerating}
              className="mt-8 bg-[#00e5a0] text-black font-bold font-mono px-8 py-4 rounded-xl hover:bg-[#00ffb3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <span className="flex items-center gap-2"><LoadingDots /> Reading codebase...</span> : 'Generate README'}
            </button>

            {error && <p className="mt-4 text-red-400 font-mono text-xs">{error}</p>}
          </div>

          {readme && (
            <div className="mt-12 border-t border-[rgba(255,255,255,0.05)] pt-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-xl text-white">Generated Output</h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 font-mono text-xs px-4 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition"
                >
                  {copied ? <Check size={14} className="text-[#00e5a0]" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
              </div>
              
              <div className="bg-[#080b10] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 overflow-x-auto">
                <pre className="font-mono text-sm text-[#c5d0de] whitespace-pre-wrap">
                  {readme}
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