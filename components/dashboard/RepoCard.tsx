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

export function RepoCard({ repo, isIndexing, onDelete }: Readonly<RepoCardProps>) {
  const router = useRouter()
  const indexed = (repo.isIndexed ?? 0) === 1
  let statusText = 'Pending'
  if (indexed) {
    statusText = 'Indexed'
  } else if (isIndexing) {
    statusText = 'Indexing'
  }
  let statusClass = 'border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-(--muted)'

  if (indexed) {
    statusClass = 'border-(--accent)/30 bg-(--accent)/10 text-(--accent-soft)'
  } else if (isIndexing) {
    statusClass = 'border-[#9db8ff]/25 bg-[#9db8ff]/10 text-[#b7c9ff]'
  }

  return (
    <div className="group premium-card rounded-2xl p-5 transition hover:border-(--accent)/35">
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={() => router.push(`/repo/${repo.id}`)}
          className="text-left"
        >
          <div className="font-display text-2xl leading-none group-hover:text-(--accent-soft) transition">
            {repo.repoName}
          </div>
          <div className="font-mono text-xs text-(--muted) mt-1 uppercase tracking-[0.12em]">
            {repo.owner}
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span
            className={[
              'font-mono text-[10px] tracking-[1.6px] uppercase px-2.5 py-1 rounded-full border',
              statusClass,
            ].join(' ')}
          >
            {statusText}
          </span>

          <button
            onClick={() => void onDelete(repo.id)}
            className="p-2 rounded-lg border border-(--line) text-(--muted) hover:text-[#ffb1b1] hover:border-[#ffb1b1]/30 hover:bg-[#ffb1b1]/5 transition"
            title="Delete repo"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {repo.description && (
        <p className="mt-3 text-sm text-(--muted) line-clamp-2 leading-relaxed">{repo.description}</p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-3">
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-(--muted)">
            Language
          </div>
          <div className="mt-1 font-mono text-sm text-(--text)">
            {repo.language || '—'}
          </div>
        </div>
        <div className="rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-3">
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-(--muted)">
            Files
          </div>
          <div className="mt-1 font-mono text-sm text-(--text) tabular-nums">
            {repo.totalFiles ?? 0}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="font-mono text-xs text-(--muted) truncate">
          {repo.repoUrl}
        </div>
        <div className="font-mono text-xs text-(--muted) whitespace-nowrap">
          {formatDate(repo.createdAt)}
        </div>
      </div>
    </div>
  )
}
