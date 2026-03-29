'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { ArrowRight, Check, Shield, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Plan = {
  id: 'hobby' | 'atelier' | 'sovereign'
  name: string
  monthly: string
  annual: string
  annualSubtext?: string
  audience: string
  summary: string
  features: string[]
  cta: string
  href: string
  highlighted?: boolean
  custom?: boolean
}

type ComparisonRow = {
  id: string
  feature: string
  hobby: string
  atelier: string
  sovereign: string
}

const plans: Plan[] = [
  {
    id: 'hobby',
    name: 'Hobby',
    monthly: 'Free',
    annual: 'Free',
    audience: 'For curious builders',
    summary: 'Start with repository intelligence and validate value inside your own codebase.',
    features: [
      'Up to 3 repositories',
      'Core repository chat and retrieval',
      'Baseline review insights',
      'Community support',
    ],
    cta: 'Begin Free',
    href: '/sign-up',
  },
  {
    id: 'atelier',
    name: 'Atelier',
    monthly: '$39',
    annual: '$29',
    annualSubtext: '$348 billed yearly',
    audience: 'For serious developers',
    summary: 'Flagship plan for teams that want faster review cycles and higher confidence releases.',
    features: [
      'Unlimited repositories',
      'Advanced pull request intelligence',
      'Semantic bug and risk analysis',
      'Priority support response',
      'Premium model access',
    ],
    cta: 'Upgrade To Atelier',
    href: '/dashboard',
    highlighted: true,
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    monthly: 'Custom',
    annual: 'Custom',
    custom: true,
    audience: 'For engineering organizations',
    summary: 'Custom onboarding, governance, and support for scaled and regulated teams.',
    features: [
      'Dedicated onboarding architecture',
      'Security and governance controls',
      'SAML SSO and enterprise access',
      'Private deployment options',
      'Contracted support SLAs',
    ],
    cta: 'Talk To Sales',
    href: '/contact',
  },
]

const comparisonRows: ComparisonRow[] = [
  {
    id: 'repos',
    feature: 'Repository Capacity',
    hobby: '3',
    atelier: 'Unlimited',
    sovereign: 'Unlimited + governance',
  },
  {
    id: 'review',
    feature: 'Review Intelligence Depth',
    hobby: 'Standard',
    atelier: 'Advanced semantic',
    sovereign: 'Custom tuned',
  },
  {
    id: 'security',
    feature: 'Security Analysis',
    hobby: 'Basic checks',
    atelier: 'Priority risk analysis',
    sovereign: 'Policy-aligned controls',
  },
  {
    id: 'support',
    feature: 'Support Model',
    hobby: 'Community',
    atelier: 'Priority support',
    sovereign: 'Dedicated success channel',
  },
]

const faqs = [
  {
    id: 'training',
    q: 'Do you train models on our private code?',
    a: 'No. Repository context is used only for your own workspace analysis and is never used to train foundational models.',
  },
  {
    id: 'billing',
    q: 'Can we switch billing cadence later?',
    a: 'Yes. You can move between monthly and annual billing from account settings with prorated adjustments.',
  },
  {
    id: 'enterprise',
    q: 'What is included in Sovereign?',
    a: 'Sovereign includes custom onboarding, governance controls, and deployment flexibility for enterprise environments.',
  },
]

export default function PricingPage() {
  const { isSignedIn } = useAuth()
  const [isAnnual, setIsAnnual] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleCheckout = async () => {
    try {
      setLoadingPlan('atelier')
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'pro',
          isAnnual,
        }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to checkout', error)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="premium-grid absolute inset-0 opacity-35 pointer-events-none" />
      <Navbar />

      <main className="relative pt-30 pb-24 px-5 md:px-10">
        <section className="relative max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-(--line) bg-[rgba(247,239,221,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-(--accent-soft) font-mono">
            <Sparkles size={12} />
            Pricing Architecture
          </span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.9] tracking-tight text-glow">
            Premium pricing for teams that ship
            <span className="block text-(--accent)">with precision, not guesswork.</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-(--muted) text-base md:text-lg leading-relaxed">
            Choose the tier that matches your engineering ambition. Start free, scale confidently, and move to custom governance when needed.
          </p>

          <div className="mt-10 inline-flex items-center gap-4 font-mono text-sm rounded-full border border-(--line) bg-[rgba(247,239,221,0.03)] px-4 py-3">
            <span className={!isAnnual ? 'text-(--text)' : 'text-(--muted)'}>Monthly</span>
            <button
              type="button"
              onClick={() => setIsAnnual((prev) => !prev)}
              className="relative h-8 w-16 rounded-full border border-(--line) bg-[rgba(247,239,221,0.08)] p-1"
              aria-label="Toggle annual billing"
            >
              <span
                className={`block h-6 w-6 rounded-full bg-(--accent) transition-transform duration-300 ${
                  isAnnual ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={isAnnual ? 'text-(--text)' : 'text-(--muted)'}>Annual</span>
            <span className="rounded-full bg-(--accent) px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1b1307]">
              Save 26%
            </span>
          </div>
        </section>

        <section className="relative max-w-6xl mx-auto mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = isAnnual ? plan.annual : plan.monthly
            const isAtelier = plan.id === 'atelier'
            const isLoading = loadingPlan === plan.id

            return (
              <article
                key={plan.id}
                className={`premium-card rounded-3xl p-7 md:p-8 flex flex-col ${
                  plan.highlighted ? 'ring-1 ring-(--accent)/40 shadow-[0_0_50px_rgba(216,164,93,0.14)]' : ''
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-flex w-fit rounded-full border border-(--accent)/40 bg-(--accent)/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-(--accent-soft) font-mono">
                    Most Chosen Tier
                  </span>
                )}

                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-(--muted)">{plan.audience}</p>
                <h2 className="mt-2 font-display text-4xl leading-none">{plan.name}</h2>
                <p className="mt-3 text-sm text-(--muted) leading-relaxed">{plan.summary}</p>

                <div className="mt-7 border-t border-(--line) pt-6">
                  <div className="flex items-end gap-2">
                    <span className="font-display text-5xl leading-none">{price}</span>
                    {!plan.custom && price !== 'Free' && <span className="font-mono text-xs text-(--muted) pb-1">/ month</span>}
                  </div>
                  {isAnnual && plan.annualSubtext && <p className="mt-2 font-mono text-xs text-(--accent-soft)">{plan.annualSubtext}</p>}
                </div>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-(--text)/90">
                      <Check size={16} className="mt-0.5 text-(--accent-soft)" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {isAtelier && isSignedIn ? (
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={isLoading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--accent) px-5 py-3.5 font-mono text-sm font-semibold text-[#1b1307] transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Redirecting...' : plan.cta}
                      {!isLoading && <ArrowRight size={14} />}
                    </button>
                  ) : (
                    <Link
                      href={isAtelier && !isSignedIn ? '/sign-up' : plan.href}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-mono text-sm transition ${
                        plan.highlighted
                          ? 'bg-(--accent) text-[#1b1307] hover:brightness-110'
                          : 'border border-(--line) text-(--text) hover:bg-[rgba(247,239,221,0.06)]'
                      }`}
                    >
                      {isAtelier && !isSignedIn ? 'Start Free And Upgrade' : plan.cta}
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </section>

        <section className="relative max-w-6xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="premium-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-(--accent-soft)">
              <Shield size={16} />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Security</span>
            </div>
            <p className="mt-3 text-sm text-(--text)/90">Private repository context is isolated to your workspace and never sold for third-party use.</p>
          </div>
          <div className="premium-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-(--accent-soft)">
              <Sparkles size={16} />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">ROI Focused</span>
            </div>
            <p className="mt-3 text-sm text-(--text)/90">Teams usually recover plan cost quickly by reducing review cycles and preventing late-stage regressions.</p>
          </div>
          <div className="premium-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-(--accent-soft)">
              <Check size={16} />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Switch Anytime</span>
            </div>
            <p className="mt-3 text-sm text-(--text)/90">Move between billing cadences as your engineering motion changes. Prorated adjustments apply automatically.</p>
          </div>
        </section>

        <section className="relative max-w-5xl mx-auto mt-16 premium-card rounded-3xl overflow-hidden">
          <div className="border-b border-(--line) px-6 md:px-8 py-5 flex items-center justify-between gap-3">
            <h3 className="font-display text-3xl leading-none">Feature comparison</h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--muted)">At a glance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--muted)">
                <tr>
                  <th className="px-6 py-4">Capability</th>
                  <th className="px-6 py-4">Maison</th>
                  <th className="px-6 py-4 text-(--accent-soft)">Atelier</th>
                  <th className="px-6 py-4">Sovereign</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.id} className="border-t border-(--line)">
                    <td className="px-6 py-4 text-sm text-(--text)">{row.feature}</td>
                    <td className="px-6 py-4 text-sm text-(--muted)">{row.hobby}</td>
                    <td className="px-6 py-4 text-sm text-(--text)">{row.atelier}</td>
                    <td className="px-6 py-4 text-sm text-(--muted)">{row.sovereign}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="relative max-w-4xl mx-auto mt-16 premium-card rounded-3xl p-8 md:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--accent-soft)">Frequently asked</p>
          <h3 className="mt-3 font-display text-4xl leading-none">Decision support before you choose</h3>
          <div className="mt-7 space-y-4">
            {faqs.map((faq) => (
              <article key={faq.id} className="rounded-2xl border border-(--line) bg-[rgba(247,239,221,0.03)] p-5">
                <h4 className="font-mono text-xs uppercase tracking-[0.12em] text-(--text)">{faq.q}</h4>
                <p className="mt-2 text-sm text-(--muted) leading-relaxed">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative max-w-4xl mx-auto mt-14 text-center premium-card rounded-3xl p-8 md:p-11">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--accent-soft)">Custom Engagement</p>
          <h3 className="mt-4 font-display text-4xl md:text-5xl leading-none">Need a tailored rollout plan?</h3>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto">
            We support private deployments, enterprise security requirements, and structured onboarding for larger engineering organizations.
          </p>
          <Link
            href="/contact"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-(--line) px-6 py-3.5 font-mono text-sm text-(--text) transition hover:bg-[rgba(247,239,221,0.06)]"
          >
            Speak With Sales
            <ArrowRight size={14} />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
