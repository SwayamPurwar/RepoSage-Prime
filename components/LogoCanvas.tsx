'use client'

import React from 'react'

export default function LogoCanvas() {
  return (
    <span
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(216,164,93,0.4)] bg-[linear-gradient(135deg,rgba(216,164,93,0.22),rgba(115,184,187,0.18))] shadow-[0_10px_26px_rgba(0,0,0,0.38)]"
      aria-hidden="true"
    >
      <span className="absolute inset-[2px] rounded-[10px] border border-[rgba(247,239,221,0.24)] bg-[radial-gradient(circle_at_30%_25%,rgba(247,239,221,0.26),rgba(8,10,16,0.7))]" />
      <svg viewBox="0 0 40 40" className="relative h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Geometric R in the style of the original W */}
        <path d="M10 31V9H22Q28 9 28 16Q28 23 22 23H10M20 23L30 31" stroke="#F7EFDD" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="16.5" stroke="rgba(216,164,93,0.55)" strokeWidth="0.9" />
      </svg>
    </span>
  )
}
