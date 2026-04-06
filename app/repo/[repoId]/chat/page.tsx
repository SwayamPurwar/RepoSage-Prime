'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, use } from 'react'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import Navbar from '@/components/Navbar'
import { LoadingPage, LoadingDots } from '@/components/LoadingSpinner'
import { toast } from 'sonner'
import { useChat } from '@ai-sdk/react' 

// --- DEFINED LOCALLY TO BYPASS UPSTREAM SDK TYPE MISMATCHES ---
export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  createdAt?: Date;
  sources?: string[];
};

type Repo = { id: string; repoName: string; repoUrl: string }
type ChatHistoryRow = { id: string; question: string; answer: string; createdAt?: string | Date | null }

function toDate(v: unknown) {
  const d = v instanceof Date ? v : new Date(typeof v === 'string' ? v : Date.now())
  return Number.isNaN(d.getTime()) ? new Date() : d
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
})

export default function RepoChatPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params)
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const canInteract = isLoaded && isSignedIn

  // 🚀 INSTANT CACHED DATA FETCHING
  const { data: repoData, error: repoError } = useSWR(canInteract ? `/api/repos/${repoId}` : null, fetcher)
  const { data: filesData, error: filesError } = useSWR(canInteract ? `/api/repos/${repoId}/files` : null, fetcher)

  const repo: Repo | null = repoData?.repo || null
  const fileList: string[] = filesData?.files || []

  const [loadingHistory, setLoadingHistory] = useState(true)
  const [preferredModel, setPreferredModel] = useState('llama-3.3-70b-versatile')
  const [userPlan, setUserPlan] = useState('hobby')

  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [activeFile, setActiveFile] = useState({ path: 'Select a file...', content: '' })
  const [isGeneratingTest, setIsGeneratingTest] = useState(false)
  
  // Track sources returned in the headers and map them to message IDs
  const [currentStreamSources, setCurrentStreamSources] = useState<string[]>([])
  const [messageSources, setMessageSources] = useState<Record<string, string[]>>({})

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const repoName = repo?.repoName || 'this repository'

  // --- NEW: VERCEL AI SDK INTEGRATION (Type-Safe Bypass) ---
  const { 
    messages, 
    setMessages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    append 
  } = useChat({
    api: '/api/chat',
    body: {
      repoId,
      repoName,
      preferredModel,
      branch: 'main'
    },
    fetch: async (inputUrl: RequestInfo | URL, init?: RequestInit) => {
      const parsedBody = JSON.parse(init?.body as string);
      const latestMessage = parsedBody.messages[parsedBody.messages.length - 1];
      
      const contextPrefix = activeFile.content && activeFile.path !== 'Select a file...' 
        ? `[Context: I am currently viewing ${activeFile.path}]\n` 
        : '';
      
      parsedBody.question = `${contextPrefix}${latestMessage.content}`;
      init!.body = JSON.stringify(parsedBody);
      
      return fetch(inputUrl, init);
    },
    onResponse: (response: Response) => {
      const sourcesHeader = response.headers.get('x-sources');
      if (sourcesHeader) {
        try {
          setCurrentStreamSources(JSON.parse(sourcesHeader));
        } catch (e) {
          console.error("Failed to parse sources", e);
        }
      }
    },
    onFinish: ({ message }: { message: any }) => {
      if (currentStreamSources.length > 0) {
        setMessageSources(prev => ({ ...prev, [message.id]: currentStreamSources }));
        setCurrentStreamSources([]); 
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'An error occurred during chat.');
    }
  } as any) as any; // <-- Escape hatch for broken SDK Generic inference

  // Auto-select the first file when the file list loads
  useEffect(() => {
    if (fileList.length > 0 && activeFile.path === 'Select a file...') {
      const firstFile = fileList[0];
      if (firstFile) {
        handleFileSelect(firstFile);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileList])

  const handleFileSelect = async (filePath: string) => {
    setIsLoadingFile(true)
    try {
      const res = await fetch(`/api/repos/${repoId}/files/content?path=${encodeURIComponent(filePath)}`)
      const data = await res.json()
      if (data.content) {
        setActiveFile({ path: filePath, content: data.content })
      }
    } catch (e) {
      toast.error("Failed to load file content") 
    } finally {
      setIsLoadingFile(false)
    }
  }

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
  }, [input]) 

  useEffect(() => {
    autosizeTextarea()
  }, [input, autosizeTextarea])

  const fetchHistory = useCallback(async () => {
    if (!canInteract) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/chat?repoId=${encodeURIComponent(repoId)}`)
      if (!res.ok) throw new Error(`Failed to fetch history`)
      
      const data = await res.json()
      if (data.plan) setUserPlan(data.plan)

      const rows: ChatHistoryRow[] = data.history || []
      const mapped: Message[] = rows.flatMap((r) => {
        const ts = toDate(r.createdAt)
        return [
          { id: `${r.id}-q`, role: 'user', content: r.question, createdAt: ts },
          { id: `${r.id}-a`, role: 'assistant', content: r.answer, createdAt: ts },
        ]
      })

      setMessages(mapped) 
    } catch (e) {
      toast.error("Failed to load chat history.") 
    } finally {
      setLoadingHistory(false)
    }
  }, [canInteract, repoId, setMessages])

  useEffect(() => {
    document.title = 'Repository Chat | RepoSage Prime'
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in')
      return
    }
    void fetchHistory()
  }, [fetchHistory, isLoaded, isSignedIn, router])

  const suggestions = useMemo(() => [
    'What does this codebase do?',
    'How is the project structured?',
    'What are the main dependencies?',
  ], [])

  const handleGenerateTest = async () => {
    if (!activeFile || activeFile.path === 'Select a file...') return
    setIsGeneratingTest(true)
    
    try {
      const res = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId,
          filePath: activeFile.path,
          codeContent: activeFile.content
        })
      })
      const data = await res.json()
      if (data.testCode) {
        append({
          role: 'assistant',
          content: `Here is the unit test suite for \`${activeFile.path}\`:\n\n\`\`\`typescript\n${data.testCode}\n\`\`\``,
        });
        toast.success("Unit test generated successfully!") 
      }
    } catch (e) {
      toast.error("Failed to generate tests. Please try again.") 
    } finally {
      setIsGeneratingTest(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    append({ role: 'user', content: suggestion });
  };

  if (!isLoaded || !isSignedIn) return null

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-40 px-4 sm:px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push(`/repo/${repoId}`)}
              className="text-sm px-4 py-2 rounded-full border border-[rgba(255,255,255,0.16)] text-[#d6cebf] hover:text-white hover:border-[rgba(215,180,127,0.45)] transition"
            >
              ← Back
            </button>

            <div className="text-right">
              <div className="font-display font-bold text-2xl">Repository Chat</div>
              <div className="text-xs text-[#b3ab9c] truncate max-w-[60vw] uppercase tracking-[0.14em] mt-1">
                {isLoadingFile ? 'Loading...' : repoName}
              </div>
            </div>
          </div>

          {(repoError || filesError) && (
            <div className="mt-5 rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.1)] p-4">
              <div className="text-sm text-[#fecaca]">Failed to load repository data.</div>
            </div>
          )}

          <div className="mt-6 rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)] overflow-hidden">
            
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
              <div className="flex items-center gap-3 w-1/2">
                <span className="text-xs text-[#b3ab9c] uppercase tracking-wider font-semibold">Focus:</span>
                
                <select 
                  value={activeFile.path}
                  onChange={(e) => handleFileSelect(e.target.value)}
                  className="bg-[rgba(0,0,0,0.3)] text-[#d7b47f] font-mono text-xs px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.1)] outline-none w-full max-w-[250px] truncate cursor-pointer hover:border-[rgba(255,255,255,0.2)] transition"
                >
                  {fileList.length === 0 && <option value="Select a file...">Loading files...</option>}
                  {fileList.map((file) => (
                    <option key={file} value={file}>
                      {file.split('/').pop()}
                    </option>
                  ))}
                </select>
                
                {isLoadingFile && <LoadingDots />}
              </div>
              
              <button 
                onClick={handleGenerateTest}
                disabled={isGeneratingTest || isLoading || fileList.length === 0}
                className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.16)] text-blue-200 hover:bg-[rgba(59,130,246,0.25)] transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isGeneratingTest ? <><LoadingDots /> Generating Test</> : '🧪 Generate Test'}
              </button>
            </div>

            <div ref={scrollRef} className="h-[50vh] md:h-[62vh] overflow-y-auto px-4 md:px-5 py-6 space-y-4 scroll-smooth">
              {loadingHistory ? (
                <LoadingPage text="Loading chat history..." />
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <div className="inline-flex items-center gap-2 border border-[rgba(215,180,127,0.35)] text-[#f2ddbd] text-[10px] tracking-[2px] uppercase px-3 py-1.5 rounded-full bg-[rgba(215,180,127,0.12)] w-fit mx-auto">
                    READY
                  </div>
                  <h2 className="font-display font-bold text-4xl mt-4 leading-tight">
                    Ask anything about {repoName}
                  </h2>
                  <p className="text-sm text-[#d6cebf] mt-3">
                    Grounded answers using your indexed code context.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        disabled={isLoading || !repo}
                        className="text-xs px-3 py-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] text-[#b3ab9c] hover:text-white hover:border-[rgba(215,180,127,0.45)] hover:bg-[rgba(215,180,127,0.12)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m: Message, index: number) => {
                  const isUser = m.role === 'user'
                  const isLastMessage = index === messages.length - 1;
                  const isActivelyStreaming = isLoading && isLastMessage && m.role === 'assistant';
                  
                  const displayContent = isUser ? m.content.replace(/\[Context: I am currently viewing .*?\]\n/, '') : m.content

                  const displaySources = messageSources[m.id] || (isActivelyStreaming ? currentStreamSources : []);

                  return (
                    <div key={m.id} className={isUser ? 'flex justify-end' : 'flex justify-start'}>
                      <div
                        className={[
                          'max-w-[84%] rounded-2xl border px-4 py-3',
                          isUser
                            ? 'bg-[rgba(59,130,246,0.16)] border-[rgba(59,130,246,0.35)]'
                            : 'bg-[rgba(15,15,18,0.88)] border-[rgba(255,255,255,0.12)]',
                        ].join(' ')}
                      >
                        {m.content.trim().length === 0 && isActivelyStreaming ? (
                          <LoadingDots />
                        ) : (
                          <div className="font-mono text-sm leading-7 whitespace-pre-wrap wrap-break-word">
                            {displayContent}
                          </div>
                        )}

                        {!isUser && displaySources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                            <div className="font-mono text-[10px] text-[#b3ab9c] mb-2 uppercase tracking-widest">Sources Context:</div>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(displaySources)).map((s, idx) => (
                                <span key={`${s}-${idx}`} className="font-mono text-[11px] px-2 py-1 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[#b3ab9c]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[rgba(255,255,255,0.12)] bg-[rgba(8,8,11,0.92)] backdrop-blur-xl z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          
          {userPlan !== 'hobby' && (
            <div className="flex justify-end mb-2">
              <select
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                disabled={isLoading}
                className="bg-[rgba(15,15,18,0.9)] text-[#b3ab9c] hover:text-[#f5f2ec] text-xs font-mono px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.14)] outline-none cursor-pointer transition disabled:opacity-50"
              >
                <option value="gpt-4o">GPT-4o (Pro)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }} 
            className="rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(15,15,18,0.9)] px-4 py-3 flex items-end gap-3"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!isLoading && input.trim()) {
                    const form = e.currentTarget.closest('form');
                    if (form) form.requestSubmit();
                  }
                }
              }}
              placeholder={repo ? `Message ${repoName}…` : 'Loading…'}
              disabled={isLoading || !repo}
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none font-mono text-sm leading-5 text-[#e8edf3] placeholder:text-[rgba(107,122,141,0.85)] disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={isLoading || !repo || !input.trim()}
              className="shrink-0 text-sm px-4 py-2 rounded-xl border border-[rgba(215,180,127,0.4)] bg-[rgba(215,180,127,0.16)] text-[#f2ddbd] hover:bg-[rgba(215,180,127,0.24)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
          <div className="mt-2 font-mono text-[11px] text-[#b3ab9c]">
            Enter to send • Shift+Enter for a new line
          </div>
        </div>
      </div>
    </div>
  )
}