'use client'

import { useEffect, useRef, useState } from 'react'

export function CounterItem({ target, label, suffix = '' }: Readonly<{ target: number; label: string; suffix?: string }>) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {

if (entry?.isIntersecting) setIsVisible(true);
    }, { threshold: 0.2 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let start = 0
    const duration = 1800
    const incrementSize = target / (duration / 16)

    const timer = setInterval(() => {
      start += incrementSize
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isVisible, target])

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-5xl md:text-6xl text-[#f2ddbd] leading-none">{count.toLocaleString()}{suffix}</p>
      <p className="text-xs uppercase tracking-[0.2em] text-[#b3ab9c] mt-3">{label}</p>
    </div>
  )
}