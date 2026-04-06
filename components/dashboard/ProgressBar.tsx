'use client'

interface ProgressBarProps {
  progress: number
  message: string
}

export function ProgressBar({ progress, message }: ProgressBarProps) {
  const displayProgress = Math.max(0, Math.min(100, progress))
  
  return (
    <div className="mt-6 border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-display font-semibold text-[#f5f2ec] text-xl">Indexing in progress</div>
          <div className="text-xs text-[#b3ab9c] mt-1">{message}</div>
        </div>
        <div className="text-sm text-[#f2ddbd] tabular-nums">{displayProgress}%</div>
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#d7b47f] transition-[width] duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      <div className="mt-2 h-[1px] w-full bg-[rgba(255,255,255,0.05)]" />
      <div className="mt-2 text-[11px] text-[#b3ab9c]">
        Tip: larger repos can take a few minutes — keep this tab open.
      </div>
    </div>
  )
}