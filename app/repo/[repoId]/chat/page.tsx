'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ArrowRight, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LoadingPage, LoadingDots } from '@/components/LoadingSpinner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
}

type Repo = {
  id: string
  repoName: string
  repoUrl: string
}

type ChatHistoryRow = {
  id: string
  question: string
  answer: string
  createdAt?: string | Date | null
}

function toDate(v: unknown) {
  let valueForDate: string | number | Date = Date.now()
  if (v instanceof Date || typeof v === 'string') {
    valueForDate = v
  }

  const d = new Date(valueForDate)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

export default function RepoChatPage() {
  const params = useParams()
  const repoId = params.repoId as string

  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const [repo, setRepo] = useState<Repo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [preferredModel, setPreferredModel] = useState('gpt-4o')
  const [userPlan, setUserPlan] = useState('hobby')

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const canInteract = isLoaded && isSignedIn
  const repoName = repo?.repoName || 'this repository'

  const suggestions = useMemo(
    () => [
      'What does this codebase do end-to-end?',
      'How is this project structured by layer?',
      'What are the most important dependencies?',
    ],
    [],
  )

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const autosizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = 20
    const max = lineHeight * 4 + 18
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
  }, [])

  useEffect(() => {
    autosizeTextarea()
  }, [input, autosizeTextarea])

  const fetchRepo = useCallback(async () => {
    if (!canInteract) return

    const repoRes = await fetch(`/api/repos/${repoId}`)
    if (!repoRes.ok) {
      if (repoRes.status === 404) throw new Error('Repo not found')
      const body = (await repoRes.json().catch(() => null)) as { error?: string } | null
      throw new Error(body?.error || 'Something went wrong, please try again')
    }

    const data = (await repoRes.json()) as { repo: Repo & { isIndexed?: number } }
    if (data.repo && data.repo.isIndexed === 0) {
      throw new Error('Please index repo first')
    }

    setRepo(data.repo)
  }, [canInteract, repoId])

  const fetchHistory = useCallback(async () => {
    if (!canInteract) return
    setLoadingHistory(true)

    const res = await fetch(`/api/chat?repoId=${encodeURIComponent(repoId)}`)
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      throw new Error(body?.error || `Failed to fetch history (${res.status})`)
    }

    const data = (await res.json()) as { history: ChatHistoryRow[]; plan?: string }
    if (data.plan) setUserPlan(data.plan)

    const rows = data.history || []
    const mapped: Message[] = rows.flatMap((r) => {
      const ts = toDate(r.createdAt)
      return [
        {
          id: `${r.id}-q`,
          role: 'user',
          content: r.question,
          timestamp: ts,
        },
        {
          id: `${r.id}-a`,
          role: 'assistant',
          content: r.answer,
          timestamp: ts,
        },
      ]
    })

    setMessages(mapped)
    setLoadingHistory(false)
  }, [canInteract, repoId])

  useEffect(() => {
    document.title = 'Chat | RespoSage Prime'
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    setError(null)

    void (async () => {
      try {
        await fetchRepo()
        await fetchHistory()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load chat'
        setError(msg)
        setLoadingHistory(false)
      }
    })()
  }, [fetchHistory, fetchRepo, isLoaded, isSignedIn])

  const sendMessage = useCallback(
    async (question: string) => {
      const trimmed = question.trim()
      if (!trimmed || sending || !repo) return

      setError(null)
      setSending(true)
      setInput('')

      const userMsg: Message = {
        id: `u-${crypto.randomUUID()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }
      const loadingMsg: Message = {
        id: `l-${crypto.randomUUID()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, loadingMsg])

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoId,
            repoName: repo.repoName,
            question: trimmed,
            preferredModel,
          }),
        })

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error || `Chat failed (${res.status})`)
        }

        const data = (await res.json()) as { answer: string; sources?: string[] }
        const assistantMsg: Message = {
          id: `a-${crypto.randomUUID()}`,
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          timestamp: new Date(),
        }

        setMessages((prev) => {
          const next = [...prev]
          const idx = next.findIndex((m) => m.id === loadingMsg.id)
          if (idx >= 0) next.splice(idx, 1, assistantMsg)
          else next.push(assistantMsg)
          return next
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Chat failed'
        setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id))
        setError(msg)
      } finally {
        setSending(false)
      }
    },
    [preferredModel, repo, repoId, sending],
  )

  let chatBody: React.ReactNode
  if (loadingHistory) {
    chatBody = <LoadingPage text="Loading chat history..." />
  } else if (messages.length === 0) {
    chatBody = (
      <div className="py-10 text-center">
        <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-(--accent-soft)">
          <Sparkles size={11} />
          Ready
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold">Ask anything about {repoName}</h2>
        <p className="mt-2 font-mono text-sm uppercase tracking-[0.08em] text-(--muted)">
          Grounded answers generated from indexed repository context.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => void sendMessage(s)}
              disabled={sending || !repo}
              className="rounded-full border border-(--line) bg-[rgba(247,239,221,0.03)] px-3 py-2 font-mono text-xs text-(--muted) transition hover:border-(--accent)/35 hover:bg-(--accent)/10 hover:text-(--text) disabled:cursor-not-allowed disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    )
  } else {
    chatBody = (
      <>
        {messages.map((m) => {
          const isUser = m.role === 'user'
          const isLoadingBubble = m.role === 'assistant' && m.content.trim().length === 0 && sending
          const bubbleClass = isUser
            ? 'border-[#9db8ff]/35 bg-[#9db8ff]/15'
            : 'border-(--line) bg-[rgba(247,239,221,0.03)]'

          return (
            <div key={m.id} className={isUser ? 'flex justify-end' : 'flex justify-start'}>
              <div className={`max-w-[84%] rounded-2xl border px-4 py-3 ${bubbleClass}`}>
                {isLoadingBubble ? (
                  <LoadingDots />
                ) : (
                  <div className="wrap-break-word whitespace-pre-wrap font-mono text-sm leading-7">{m.content}</div>
                )}

                {!isUser && !isLoadingBubble && m.sources && m.sources.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-(--muted)">Sources</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(m.sources)).map((s, idx) => (
                        <span
                          key={`${s}-${idx}`}
                          className="rounded-full border border-(--line) bg-[rgba(247,239,221,0.03)] px-2 py-1 font-mono text-[11px] text-(--muted)"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-30" />
      <Navbar />

      <main className="relative px-4 pb-32 pt-30 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push(`/repo/${repoId}`)}
              className="rounded-xl border border-(--line) px-4 py-2 font-mono text-sm text-(--muted) transition hover:border-[rgba(255,255,255,0.18)] hover:text-(--text)"
            >
              ← Back
            </button>

            <div className="text-right">
              <div className="font-display text-2xl font-bold">Repository Chat</div>
              <div className="max-w-[60vw] truncate font-mono text-xs uppercase tracking-widest text-(--muted)">{repoName}</div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-[rgba(255,120,120,0.25)] bg-[rgba(255,120,120,0.08)] p-4">
              <div className="font-mono text-xs text-[#ffc4c4]">{error}</div>
            </div>
          )}

          <div className="premium-card mt-6 overflow-hidden rounded-3xl">
            <div ref={scrollRef} className="h-[50vh] space-y-4 overflow-y-auto px-4 py-6 md:h-[62vh] md:px-5">
              {chatBody}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-(--line) bg-[rgba(12,9,7,0.92)] backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          {userPlan !== 'hobby' && (
            <div className="mb-2 flex justify-end">
              <select
                aria-label="Select chat model"
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                disabled={sending}
                className="cursor-pointer rounded-lg border border-(--line) bg-[rgba(247,239,221,0.03)] px-3 py-1.5 font-mono text-xs text-(--muted) outline-none transition hover:text-(--text) disabled:opacity-50"
              >
                <option value="gpt-4o">GPT-4o (Pro)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>
          )}

          <div className="flex items-end gap-3 rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage(input)
                }
              }}
              placeholder={repo ? `Message ${repoName}…` : 'Loading…'}
              disabled={sending || !repo}
              rows={1}
              className="flex-1 resize-none bg-transparent font-mono text-sm leading-5 text-(--text) outline-none placeholder:text-(--muted) disabled:opacity-60"
            />

            <button
              onClick={() => void sendMessage(input)}
              disabled={sending || !repo || !input.trim()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-(--accent)/35 bg-(--accent)/10 px-4 py-2 font-mono text-sm text-(--accent-soft) transition hover:bg-(--accent)/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="mt-2 font-mono text-[11px] text-(--muted)">Enter to send • Shift+Enter for a new line</div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
