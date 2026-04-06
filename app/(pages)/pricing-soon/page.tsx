'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@clerk/nextjs'
import { Check, Sparkles } from 'lucide-react'

type PlanName = 'Hobby' | 'Pro' | 'Enterprise'

export default function PricingPage() {
  const { isSignedIn } = useAuth()
  const [isAnnual, setIsAnnual] = useState(true)
  const [animatePrice, setAnimatePrice] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<PlanName | null>(null)

  useEffect(() => {
    setAnimatePrice(true)
    const timeout = setTimeout(() => setAnimatePrice(false), 220)
    return () => clearTimeout(timeout)
  }, [isAnnual])

  const handleCheckout = async (planName: string) => {
    try {
      setLoadingPlan('Pro')
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planName,
          isAnnual,
        }),
      })

      const data = await response.json()
      if (data.url) {
        globalThis.window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to checkout', error)
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans = [
    {
      name: 'Hobby' as const,
      price: { monthly: 'Free', annual: 'Free' },
      description: 'For individual developers evaluating the platform.',
      features: ['Up to 3 repositories', 'Core chat experience', 'Community support', 'Basic onboarding summaries'],
      cta: isSignedIn ? 'Open Workspace' : 'Get Started',
      link: isSignedIn ? '/dashboard' : '/sign-up',
      highlight: false,
    },
    {
      name: 'Pro' as const,
      price: { monthly: '$29', annual: '$19' },
      description: 'For teams that require premium review speed and quality.',
      features: ['Unlimited repositories', 'Advanced review intelligence', 'Semantic bug detection', 'Priority support'],
      cta: isSignedIn ? 'Upgrade to Pro' : 'Start Free Trial',
      link: isSignedIn ? '/dashboard' : '/sign-up',
      highlight: true,
    },
    {
      name: 'Enterprise' as const,
      price: { monthly: 'Custom', annual: 'Custom' },
      description: 'For organizations with strict governance and scale needs.',
      features: ['SSO and security controls', 'Dedicated onboarding partner', 'Custom deployment options', 'Enterprise SLA'],
      cta: 'Talk to Sales',
      link: '/contact',
      highlight: false,
    },
  ]

  const faqs = [
    {
      q: 'Is private code used for model training?',
      a: 'No. Private repositories are processed only for your workspace context and are never used to train base models.',
    },
    {
      q: 'Can we change billing cadence later?',
      a: 'Yes. You can switch between monthly and annual plans from your billing settings at any time.',
    },
    {
      q: 'Do you offer startup or student support?',
      a: 'Yes. Contact our team with your details and we can review eligibility for discounted access.',
    },
  ]

  return (
    <div className="min-h-screen text-[#f5f2ec]">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-10 max-w-7xl mx-auto">
        <header className="text-center mb-16">
          <p className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#f2ddbd] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] rounded-full px-4 py-2">
            <Sparkles size={12} />
            Pricing
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mt-8">Premium plans for serious engineering teams.</h1>
          <p className="text-[#d6cebf] text-base md:text-lg max-w-3xl mx-auto leading-relaxed mt-6">
            Start free, scale confidently, and upgrade when your team needs advanced operational intelligence.
          </p>

          <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-4 py-2">
            <span className={`text-xs ${isAnnual ? 'text-[#b3ab9c]' : 'text-[#f5f2ec]'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual((value) => !value)}
              className="relative w-14 h-7 rounded-full bg-[rgba(255,255,255,0.14)] p-1"
              aria-label="Toggle annual billing"
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-[#d7b47f] transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-xs ${isAnnual ? 'text-[#f5f2ec]' : 'text-[#b3ab9c]'}`}>Annual</span>
            <span className="ml-1 text-[10px] uppercase tracking-[0.14em] rounded-full bg-[rgba(215,180,127,0.16)] border border-[rgba(215,180,127,0.3)] px-2 py-1 text-[#f2ddbd]">
              Save 35%
            </span>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-3xl p-8 border transition ${
                plan.highlight
                  ? 'border-[rgba(215,180,127,0.55)] bg-[rgba(215,180,127,0.08)] shadow-[0_18px_45px_rgba(0,0,0,0.35)]'
                  : 'border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.72)]'
              }`}
            >
              {plan.highlight && (
                <p className="inline-block text-[10px] uppercase tracking-[0.16em] rounded-full border border-[rgba(215,180,127,0.45)] bg-[rgba(215,180,127,0.15)] px-3 py-1 text-[#f2ddbd]">
                  Recommended
                </p>
              )}

              <h2 className="font-display text-4xl mt-4 text-[#f2ddbd]">{plan.name}</h2>
              <p className="mt-2 text-sm text-[#d6cebf] leading-relaxed min-h-10">{plan.description}</p>

              <div className="mt-6 mb-7">
                <p className={`font-display text-5xl text-[#f5f2ec] transition-all ${animatePrice ? 'opacity-60 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                  {isAnnual ? plan.price.annual : plan.price.monthly}
                </p>
                {plan.price.monthly !== 'Free' && plan.price.monthly !== 'Custom' && (
                  <p className="text-xs text-[#b3ab9c] mt-2">per seat / month</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#d6cebf]">
                    <Check size={15} className="text-[#d7b47f] mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {plan.name === 'Pro' && isSignedIn ? (
                <button
                  onClick={() => handleCheckout('pro')}
                  disabled={loadingPlan === 'Pro'}
                  className="w-full rounded-full bg-[#d7b47f] px-6 py-3 text-sm font-semibold text-[#141317] hover:bg-[#f2ddbd] transition disabled:opacity-60"
                >
                  {loadingPlan === 'Pro' ? 'Redirecting...' : 'Upgrade to Pro'}
                </button>
              ) : (
                <Link
                  href={plan.link}
                  className={`w-full inline-flex justify-center rounded-full px-6 py-3 text-sm transition ${
                    plan.highlight
                      ? 'bg-[#d7b47f] text-[#141317] hover:bg-[#f2ddbd] font-semibold'
                      : 'border border-[rgba(255,255,255,0.16)] text-[#f5f2ec] hover:bg-[rgba(255,255,255,0.08)]'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </article>
          ))}
        </section>

        <section className="max-w-3xl mx-auto mt-20">
          <h3 className="font-display text-4xl text-center">Frequently Asked Questions</h3>
          <div className="mt-8 space-y-4">
            {faqs.map((faq) => (
              <article key={faq.q} className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,15,18,0.7)] p-6">
                <h4 className="text-[#f5f2ec] font-medium">{faq.q}</h4>
                <p className="text-sm text-[#d6cebf] mt-2 leading-relaxed">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
