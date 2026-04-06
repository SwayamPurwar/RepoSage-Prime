'use client'

import { type FormEvent, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { BriefcaseBusiness, FolderGit2, Mail, Sparkles } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error('Contact form submission error:', error)
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <section className="space-y-7">
            <p className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#f2ddbd] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] rounded-full px-4 py-2">
              <Sparkles size={12} />
              Concierge Contact
            </p>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">Let&apos;s talk about your engineering goals.</h1>
            <p className="text-[#d6cebf] text-base md:text-lg max-w-md leading-relaxed">
              Questions about setup, pricing, or enterprise support? Reach out and we will respond with tailored guidance.
            </p>

            <div className="space-y-3 mt-8">
              <a
                href="https://github.com/swayampurwar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(15,15,18,0.72)] p-4 text-sm text-[#d6cebf] hover:text-[#f5f2ec] hover:border-[rgba(215,180,127,0.45)] transition"
              >
                <FolderGit2 size={18} className="text-[#d7b47f]" />
                Founder GitHub
              </a>
              <a
                href="https://github.com/SwayamPurwar/RepoSage-Prime.git"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(15,15,18,0.72)] p-4 text-sm text-[#d6cebf] hover:text-[#f5f2ec] hover:border-[rgba(215,180,127,0.45)] transition"
              >
                <BriefcaseBusiness size={18} className="text-[#d7b47f]" />
                Project Repository
              </a>
              <div className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(15,15,18,0.72)] p-4 text-sm text-[#d6cebf]">
                <Mail size={18} className="text-[#d7b47f]" />
                support@reposageprime.com
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(155deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-8 md:p-10">
            {status === 'success' ? (
              <div className="text-center py-10">
                <h2 className="font-display text-4xl text-[#f2ddbd]">Message sent</h2>
                <p className="text-[#d6cebf] leading-relaxed mt-4 max-w-sm mx-auto">
                  Thank you for reaching out. We received your message and will get back to you shortly.
                </p>
                <Button
                  onClick={() => setStatus('idle')}
                  variant="outline"
                  className="mt-8 border-[rgba(215,180,127,0.5)] text-[#f2ddbd] hover:bg-[#d7b47f] hover:text-[#141317]"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={`space-y-6 ${isSubmitting ? 'opacity-60 pointer-events-none' : 'opacity-100'} transition`}>
                <div>
                  <label htmlFor="name" className="text-[11px] uppercase tracking-[0.18em] text-[#b3ab9c]">Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    placeholder="Your Name"
                    className="w-full mt-2 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] p-3 text-sm text-[#f5f2ec] placeholder:text-[#8f8778] focus:outline-none focus:border-[rgba(215,180,127,0.6)] transition"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="text-[11px] uppercase tracking-[0.18em] text-[#b3ab9c]">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    placeholder="name@example.com"
                    className="w-full mt-2 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] p-3 text-sm text-[#f5f2ec] placeholder:text-[#8f8778] focus:outline-none focus:border-[rgba(215,180,127,0.6)] transition"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="text-[11px] uppercase tracking-[0.18em] text-[#b3ab9c]">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    disabled={isSubmitting}
                    value={formData.message}
                    onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                    placeholder="Tell us how we can help."
                    className="w-full mt-2 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] p-3 text-sm text-[#f5f2ec] placeholder:text-[#8f8778] focus:outline-none focus:border-[rgba(215,180,127,0.6)] resize-none transition"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-400">Unable to send your message right now. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#d7b47f] px-6 py-3 text-sm font-semibold text-[#141317] hover:bg-[#f2ddbd] transition disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
