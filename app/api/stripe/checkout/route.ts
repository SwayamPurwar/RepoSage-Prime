import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

// Initialize Stripe (Make sure you add STRIPE_SECRET_KEY to your .env.local)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover', // Use the latest API version
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { plan, isAnnual } = body // e.g., plan: 'pro'

    // Get the base URL for redirects (localhost in dev, your domain in prod)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Fetch the user from your database
    const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const user = userRecords[0]

    // Define your Stripe Price IDs (You get these from your Stripe Dashboard)
    // You should put these in your .env.local file ideally
    const priceId = isAnnual 
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID 
      : process.env.STRIPE_PRO_MONTHLY_PRICE_ID

    if (!priceId) {
      return new NextResponse('Stripe Price IDs are not configured', { status: 500 })
    }

    // Create the Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_email: user?.email, // Pre-fill email if available
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId, // CRITICAL: We need this in the webhook to know who paid!
        plan: plan,
      },
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}