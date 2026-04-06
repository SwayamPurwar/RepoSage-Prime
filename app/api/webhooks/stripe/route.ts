import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// Initialize Stripe with strict API versioning
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 apiVersion: '2026-02-25.clover', // Always hardcode your API version in production
  typescript: true,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    // 1. Get the raw body as text (REQUIRED for signature verification)
    const body = await req.text()
    
    // 2. Get the Stripe signature from headers
   // 2. Get the Stripe signature from headers
    const headersList = await headers()
    const signature = headersList.get('Stripe-Signature')

    if (!signature) {
      return new NextResponse('Missing Stripe signature', { status: 400 })
    }

    // 3. Cryptographically verify the event
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`⚠️  Webhook signature verification failed:`, err.message)
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // 4. Handle specific events safely
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Example: Update user plan in database
        if (session.client_reference_id) {
          await db.update(users)
            .set({ 
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              plan: 'pro' // Update based on your logic
            })
            .where(eq(users.id, session.client_reference_id))
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await db.update(users)
            .set({ plan: 'hobby' })
            .where(eq(users.stripeSubscriptionId, subscription.id))
        break
      }
      // Add other events as needed...
    }

    // 5. Always return a 200 quickly so Stripe doesn't retry
    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('Unhandled Stripe Webhook Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}