'use client'

import { useRouter } from 'next/navigation'

interface AddRepoModalProps {
  isOpen: boolean
  onClose: () => void
  repoUrl: string
  setRepoUrl: (url: string) => void
  onStartIndexing: () => Promise<void>
  isIndexing: boolean
  indexingMessage: string
  indexingProgress: number
  // NEW PROPS for Billing
  currentPlan: string
  repoCount: number
}

export function AddRepoModal({
  isOpen,
  onClose,
  repoUrl,
  setRepoUrl,
  onStartIndexing,
  isIndexing,
  indexingMessage,
  indexingProgress,
  currentPlan,
  repoCount,
}: AddRepoModalProps) {
  const router = useRouter()
  if (!isOpen) return null

  const displayProgress = Math.max(0, Math.min(100, indexingProgress))
  
  // Enforce Limit Logic
  const isAtLimit = currentPlan === 'hobby' && repoCount >= 3

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <button
        className="absolute inset-0 bg-[rgba(0,0,0,0.6)]"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(15,15,18,0.95)] p-6 shadow-2xl overflow-hidden">
        
        {/* Top Glow */}
        {isAtLimit && (
           <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#febb2e] to-transparent opacity-80" />
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display font-bold text-2xl text-[#f5f2ec]">
              {isAtLimit ? 'Repository Limit Reached' : 'Add a GitHub repository'}
            </div>
            <div className="text-xs text-[#b3ab9c] mt-1 tracking-[0.12em] uppercase">
              {isAtLimit 
                ? 'You are currently on the free Hobby plan.'
                : 'We will ingest code files, create embeddings, and enable repository intelligence.'}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isIndexing}
            className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.14)] text-[#b3ab9c] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>

        {isAtLimit ? (
          <div className="mt-8 mb-4 border border-[rgba(254,187,46,0.2)] bg-[rgba(254,187,46,0.08)] rounded-xl p-6 text-center">
             <div className="text-4xl mb-4">🚀</div>
             <p className="text-[#f5f2ec] text-sm leading-relaxed mb-4">
               You have reached the limit of 3 repositories on the Hobby plan. Upgrade to Pro to unlock unlimited repositories and Gemini 1.5 Pro.
             </p>
          </div>
        ) : (
          <div className="mt-5">
            <label className="block text-[10px] tracking-[2px] uppercase text-[#b3ab9c]">
              GitHub URL
            </label>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/vercel/next.js"
              disabled={isIndexing}
              className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[#f5f2ec] placeholder:text-[#8f8778] outline-none focus:border-[rgba(215,180,127,0.6)]"
            />
          </div>
        )}

        {isIndexing && !isAtLimit && (
          <div className="mt-5 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-[#b3ab9c]">{indexingMessage}</div>
              <div className="text-sm text-[#f2ddbd] tabular-nums">
                {displayProgress}%
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#d7b47f] transition-[width] duration-300 ease-out"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            disabled={isIndexing}
            className="text-sm px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.14)] text-[#b3ab9c] hover:text-white hover:border-[rgba(255,255,255,0.25)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          {isAtLimit ? (
            <button
              onClick={() => router.push('/pricing')}
              className="font-mono text-sm px-6 py-3 rounded-xl border border-[#febb2e]/50 bg-[#febb2e] text-black hover:bg-[#febb2e]/90 hover:-translate-y-0.5 transition shadow-[0_0_15px_rgba(254,187,46,0.3)] font-bold"
            >
              Upgrade to Pro →
            </button>
          ) : (
            <button
              onClick={() => void onStartIndexing()}
              disabled={!repoUrl.trim() || isIndexing}
              className="text-sm px-6 py-3 rounded-xl border border-[rgba(215,180,127,0.45)] bg-[rgba(215,180,127,0.16)] text-[#f2ddbd] hover:bg-[rgba(215,180,127,0.22)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isIndexing ? 'Indexing...' : 'Start indexing'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}