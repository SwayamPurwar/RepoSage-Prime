// app/repo/[repoId]/readme/page.tsx
'use client'

import { useState, useEffect, use } from 'react' // Added use
import { useRouter } from 'next/navigation' // Removed useParams
import { useUser } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LoadingDots } from '@/components/LoadingSpinner'
import { FileText, Copy, Check } from 'lucide-react'

export default function RepoReadmePage({ 
  params 
}: { 
  params: Promise<{ repoId: string }> 
}) {
  const { repoId } = use(params) // Unwrapped params
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const [readme, setReadme] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    document.title = 'README Generator | RepoSage Prime'
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
    await globalThis.window.navigator.clipboard.writeText(readme)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isLoaded || !isSignedIn) return null

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => router.push(`/repo/${repoId}`)}
            className="text-sm px-4 py-2 rounded-full border border-[rgba(255,255,255,0.16)] text-[#d6cebf] hover:text-white hover:border-[rgba(215,180,127,0.45)] transition"
          >
            ← Back to Repo
          </button>
        </div>

        <div className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="w-16 h-16 bg-[rgba(215,180,127,0.14)] text-[#f2ddbd] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[rgba(215,180,127,0.35)]">
              <FileText size={32} />
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight mb-4">AI README Generator</h1>
            <p className="text-sm text-[#d6cebf] leading-relaxed">
              We&apos;ll analyze your indexed files, dependencies, and structure to write a beautiful, professional README.md for your project.
            </p>
            
            <button
              onClick={generateReadme}
              disabled={isGenerating}
              className="mt-8 bg-[rgba(215,180,127,0.16)] border border-[rgba(215,180,127,0.45)] text-[#f2ddbd] font-semibold px-8 py-4 rounded-xl hover:bg-[rgba(215,180,127,0.24)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <span className="flex items-center gap-2"><LoadingDots /> Reading codebase...</span> : 'Generate README'}
            </button>

            {error && <p className="mt-4 text-red-300 text-xs">{error}</p>}
          </div>

          {readme && (
            <div className="mt-12 border-t border-[rgba(255,255,255,0.12)] pt-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-xl text-white">Generated Output</h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 font-mono text-xs px-4 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.14)] rounded-lg text-[#d6cebf] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition"
                >
                  {copied ? <Check size={14} className="text-[#f2ddbd]" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
              </div>
              
              <div className="bg-[rgba(8,8,11,0.8)] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 overflow-x-auto">
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