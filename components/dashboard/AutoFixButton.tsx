"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Github, Loader2 } from "lucide-react"

interface AutoFixButtonProps {
  repoId: string
  filePath: string
  issueDescription: string
  badCode: string
}

export function AutoFixButton({ repoId, filePath, issueDescription, badCode }: AutoFixButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAutoFix = async () => {
    try {
      setLoading(true)
      
      // 1. Ask Groq to generate the fix based on the bad code
      toast({ title: "🧠 Agent is analyzing and writing the fix..." })
      
      const groqRes = await fetch('/api/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filePath, 
          codeContent: badCode, 
          issueDescription 
        })
      })
      
      if (!groqRes.ok) throw new Error("Failed to generate code fix")
      const { refactoredCode } = await groqRes.json()

      // 2. Send the newly generated code to your PR route
      toast({ title: "🌿 Branching and opening Pull Request..." })
      
      const prRes = await fetch(`/api/repos/${repoId}/pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          refactoredCode,
          issue: issueDescription
        })
      })

      if (!prRes.ok) {
        const err = await prRes.json()
        throw new Error(err.error || "Failed to open PR")
      }

      const { prUrl } = await prRes.json()

      toast({
        title: "✅ Pull Request Created!",
        description: "The agent has successfully submitted the fix.",
        action: (
          <a href={prUrl} target="_blank" rel="noreferrer" className="bg-white text-black px-3 py-1 rounded text-sm font-medium">
            View PR
          </a>
        )
      })

    } catch (error: any) {
      toast({
        title: "Agent Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleAutoFix} 
      disabled={loading}
      className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
      {loading ? "Agent working..." : "Auto-Fix via PR"}
    </Button>
  )
}