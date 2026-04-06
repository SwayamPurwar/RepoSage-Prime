'use client'

import React from 'react'

export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[rgba(215,180,127,0.1)]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#d7b47f] animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-[#f2ddbd] animate-spin [animation-duration:0.6s]" />
      </div>
      <p className="font-mono text-sm text-[#b3ab9c] animate-pulse">{text}</p>
    </div>
  )
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-[#d7b47f] animate-bounce [animation-delay:0ms]" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#d7b47f] animate-bounce [animation-delay:150ms]" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#d7b47f] animate-bounce [animation-delay:300ms]" />
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(15,15,18,0.72)] p-6 animate-pulse">
      <div className="h-4 w-1/3 rounded-full bg-[rgba(255,255,255,0.06)] mb-4" />
      <div className="h-3 w-2/3 rounded-full bg-[rgba(255,255,255,0.04)] mb-2" />
      <div className="h-3 w-1/2 rounded-full bg-[rgba(255,255,255,0.04)]" />
    </div>
  )
}

export function LoadingPage({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-[40vh] md:min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-[rgba(215,180,127,0.1)]" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-[#d7b47f] animate-spin" />
        <div className="absolute inset-3 w-10 h-10 rounded-full border-2 border-transparent border-t-[#f2ddbd] animate-spin [animation-duration:0.7s]" />
      </div>
      <div className="text-center">
        <p className="font-mono text-sm text-[#b3ab9c] animate-pulse">{text}</p>
      </div>
    </div>
  )
}