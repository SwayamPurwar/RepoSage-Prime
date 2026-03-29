'use client'

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Mail, ExternalLink, Sparkles } from 'lucide-react'

type FormState = {
  name: string
  email: string
  message: string
}

const touchpoints = [
  {
    label: 'Founder Profile',
    value: 'github.com/swayampurwar',
    href: 'https://github.com/swayampurwar',
  },
  {
    label: 'Project Repository',
    value: 'RespoSage Prime Source',
    href: 'https://github.com/SwayamPurwar/RepoSage-Prime.git',
  },
  {
    label: 'Professional Network',
    value: 'linkedin.com/in/swayam-purwar',
    href: 'https://www.linkedin.com/in/swayam-purwar',
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      <main className="relative pt-30 pb-24 px-5 md:px-10">
        <div className="premium-grid absolute inset-0 opacity-35 pointer-events-none" />

        <section className="relative max-w-6xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-(--accent-soft) font-mono">
            <Sparkles size={12} />
            Private Contact Channel
          </span>

          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.9] tracking-tight text-glow">
            <span>Connect with the</span>
            <span className="block text-(--accent)">RespoSage Prime team.</span>
          </h1>

          <p className="mt-6 max-w-3xl text-(--muted) text-base md:text-lg leading-relaxed">
            For partnerships, product advisory, premium onboarding, or enterprise workflows, share your context and we will respond with a clear next path.
          </p>
        </section>

        <section className="relative max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start">
          <div className="space-y-6">
            <article className="premium-card rounded-3xl p-7 md:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-(--accent-soft)">Communication Standards</p>
              <ul className="mt-4 space-y-2 text-sm text-(--muted)">
                <li>Response window: within one business day</li>
                <li>Priority routing for collaboration opportunities</li>
                <li>Clear technical and strategic follow-up</li>
              </ul>

              <div className="mt-6 rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--accent-soft)">Direct Email</p>
                <a href="mailto:swayampurwar111104@gmail.com" className="mt-2 inline-flex items-center gap-2 text-(--text) hover:text-(--accent-soft) transition">
                  <Mail size={15} />
                  support@reposageprime.com
                </a>
              </div>
            </article>

            <article className="premium-card rounded-3xl p-7 md:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-(--accent-soft)">Touchpoints</p>
              <div className="mt-4 space-y-3">
                {touchpoints.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] px-4 py-3 text-(--muted) hover:text-(--text) hover:border-(--accent)/35 transition"
                  >
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em]">{item.label}</p>
                      <p className="text-sm mt-1">{item.value}</p>
                    </div>
                    <ExternalLink size={16} />
                  </a>
                ))}
              </div>
            </article>
          </div>

          <article className="premium-card rounded-3xl p-7 md:p-8">
            {status === 'success' ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-(--accent)/15 text-(--accent) mx-auto flex items-center justify-center">✓</div>
                <h2 className="font-display text-3xl mt-4">Message Received</h2>
                <p className="mt-3 text-(--muted)">
                  Thank you for reaching out. We will follow up shortly with a thoughtful response.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 border border-(--line) text-(--text) text-sm font-mono hover:bg-[rgba(247,239,221,0.06)] transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={`space-y-5 transition-opacity ${isSubmitting ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-(--accent-soft)">Secure Contact Form</p>

                <div className="space-y-2">
                  <label htmlFor="name" className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--muted)">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] text-(--text) p-3 text-sm focus:border-(--accent) focus:outline-none transition"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--muted)">
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] text-(--text) p-3 text-sm focus:border-(--accent) focus:outline-none transition"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--muted)">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    disabled={isSubmitting}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Share your goals, collaboration idea, or enterprise requirement..."
                    className="w-full rounded-xl border border-(--line) bg-[rgba(247,239,221,0.03)] text-(--text) p-3 text-sm focus:border-(--accent) focus:outline-none transition resize-none"
                  />
                </div>

                {status === 'error' && <p className="text-xs text-red-300 font-mono">Unable to send your message right now. Please try again.</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 bg-(--accent) text-[#1b1307] font-mono text-sm font-semibold hover:brightness-110 transition disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending Message...' : 'Send Premium Inquiry'}
                </button>
              </form>
            )}
          </article>
        </section>
      </main>

      <Footer />
    </div>
  )
}
