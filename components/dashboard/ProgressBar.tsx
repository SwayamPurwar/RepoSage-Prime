'use client'

interface ProgressBarProps {
  progress: number
  message: string
}

export function ProgressBar({ progress, message }: Readonly<ProgressBarProps>) {
  const displayProgress = Math.max(0, Math.min(100, progress))
  
  return (
    <div className="mt-6 premium-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-display text-2xl leading-none">Indexing in progress</div>
          <div className="font-mono text-xs text-(--muted) mt-2 uppercase tracking-widest">{message}</div>
        </div>
        <div className="font-mono text-sm text-(--accent-soft) tabular-nums">{displayProgress}%</div>
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="h-full rounded-full bg-(--accent) transition-[width] duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      <div className="mt-2 h-px w-full bg-[rgba(255,255,255,0.05)]" />
      <div className="mt-2 font-mono text-[11px] text-(--muted)">
        Tip: larger repositories can take a few minutes. Keep this tab open until indexing completes.
      </div>
    </div>
  )
}