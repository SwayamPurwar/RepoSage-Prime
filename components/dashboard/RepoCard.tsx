'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export type Repo = {
  id: string
  repoUrl: string
  repoName: string
  owner: string
  description: string | null
  language: string | null
  isIndexed: number | null
  totalFiles: number | null
  createdAt: string | Date | null
}

interface RepoCardProps {
  repo: Repo
  isIndexing: boolean
  onDelete: (id: string) => Promise<void>
}

function formatDate(value: Repo['createdAt']) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export function RepoCard({ repo, isIndexing, onDelete }: RepoCardProps) {
  const router = useRouter()
  const indexed = (repo.isIndexed ?? 0) === 1
  const statusLabel = indexed ? 'Indexed' : isIndexing ? 'Indexing' : 'Pending'

  return (
    <div className="group rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] p-5 hover:border-[rgba(215,180,127,0.45)] transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={() => router.push(`/repo/${repo.id}`)}
          className="text-left"
        >
          <div className="font-display font-semibold text-2xl leading-tight text-[#f5f2ec] group-hover:text-[#f2ddbd] transition">
            {repo.repoName}
          </div>
          <div className="text-xs text-[#b3ab9c] mt-1 uppercase tracking-[0.14em]">
            {repo.owner}
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span
            className={[
              'text-[10px] tracking-[1.6px] uppercase px-2.5 py-1 rounded-full border',
              indexed
                ? 'border-[rgba(215,180,127,0.35)] bg-[rgba(215,180,127,0.14)] text-[#f2ddbd]'
                : isIndexing
                  ? 'border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.14)] text-[#93c5fd]'
                  : 'border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.04)] text-[#b3ab9c]',
            ].join(' ')}
          >
            {statusLabel}
          </span>

          <button
            onClick={() => void onDelete(repo.id)}
            className="p-2 rounded-lg border border-[rgba(255,255,255,0.12)] text-[#b3ab9c] hover:text-[#ff4d4d] hover:border-[#ff4d4d]/30 hover:bg-[#ff4d4d]/5 transition"
            title="Delete repo"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-3">
          <div className="text-[10px] tracking-[2px] uppercase text-[#b3ab9c]">
            Language
          </div>
          <div className="mt-1 text-sm text-[#f5f2ec]">
            {repo.language || '—'}
          </div>
        </div>
        <div className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-3">
          <div className="text-[10px] tracking-[2px] uppercase text-[#b3ab9c]">
            Files
          </div>
          <div className="mt-1 text-sm text-[#f5f2ec] tabular-nums">
            {repo.totalFiles ?? 0}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="text-xs text-[#b3ab9c] truncate">
          {repo.repoUrl}
        </div>
        <div className="text-xs text-[#b3ab9c] whitespace-nowrap">
          {formatDate(repo.createdAt)}
        </div>
      </div>
    </div>
  )
}
