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
}: Readonly<AddRepoModalProps>) {
  const router = useRouter()
  if (!isOpen) return null

  const displayProgress = Math.max(0, Math.min(100, indexingProgress))
  
  // Enforce Limit Logic
  const isAtLimit = currentPlan === 'hobby' && repoCount >= 3

  return (
    <dialog open className="fixed inset-0 z-60 flex items-center justify-center bg-transparent px-4 backdrop-blur-sm" aria-modal="true">
      <button
        className="absolute inset-0 bg-[rgba(0,0,0,0.6)]"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-(--line) bg-[rgba(20,16,11,0.88)] p-6 shadow-2xl">
        
        {/* Top Glow */}
        {isAtLimit && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-(--accent) to-transparent opacity-80" />
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-2xl leading-none">
              {isAtLimit ? 'Repository Limit Reached' : 'Add a GitHub repository'}
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-(--muted)">
              {isAtLimit 
                ? 'Current tier: Maison'
                : 'We will index source files and prepare retrieval context for high-speed analysis.'}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isIndexing}
            className="font-mono text-xs px-3 py-1.5 rounded-lg border border-(--line) text-(--muted) hover:text-(--text) transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>

        {isAtLimit ? (
          <div className="mt-8 mb-4 rounded-xl border border-(--accent)/30 bg-(--accent)/10 p-6 text-center">
             <div className="text-4xl mb-4">🚀</div>
             <p className="font-mono text-sm leading-relaxed mb-4 text-(--text)">
               You have reached the 3 repository limit on Maison. Upgrade to Atelier for unlimited repositories and flagship analysis depth.
             </p>
          </div>
        ) : (
          <div className="mt-5">
            <label htmlFor="repo-url-input" className="block font-mono text-[10px] tracking-[2px] uppercase text-(--muted)">
              GitHub URL
            </label>
            <input
              id="repo-url-input"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/vercel/next.js"
              disabled={isIndexing}
              className="mt-2 w-full rounded-xl border border-(--line) bg-[rgba(0,0,0,0.24)] px-4 py-3 font-mono text-sm text-(--text) placeholder:text-(--muted) outline-none focus:border-(--accent)/35"
            />
          </div>
        )}

        {isIndexing && !isAtLimit && (
          <div className="mt-5 rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="font-mono text-xs text-(--muted)">{indexingMessage}</div>
              <div className="font-mono text-sm text-(--accent-soft) tabular-nums">
                {displayProgress}%
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div
                className="h-full rounded-full bg-(--accent) transition-[width] duration-300 ease-out"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            disabled={isIndexing}
            className="font-mono text-sm px-4 py-3 rounded-xl border border-(--line) text-(--muted) hover:text-(--text) hover:border-[rgba(255,255,255,0.18)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          {isAtLimit ? (
            <button
              onClick={() => router.push('/pricing')}
              className="font-mono text-sm px-6 py-3 rounded-xl border border-(--accent)/40 bg-(--accent) text-[#1b1307] hover:brightness-110 hover:-translate-y-0.5 transition shadow-[0_0_15px_rgba(216,164,93,0.3)] font-bold"
            >
              Upgrade to Atelier →
            </button>
          ) : (
            <button
              onClick={() => void onStartIndexing()}
              disabled={!repoUrl.trim() || isIndexing}
              className="font-mono text-sm px-6 py-3 rounded-xl border border-(--accent)/30 bg-(--accent)/10 text-(--accent-soft) hover:bg-(--accent)/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isIndexing ? 'Indexing...' : 'Start indexing'}
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}