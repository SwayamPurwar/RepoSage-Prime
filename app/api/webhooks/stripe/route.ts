import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    if (!session?.metadata?.userId) {
      return new NextResponse('No user ID in metadata', { status: 400 })
    }

    // Grab the email the user entered during Stripe checkout
    const customerEmail = session.customer_details?.email || 'unknown@email.com'

    // NEW: Use an Upsert! This creates the user if they don't exist, or updates them if they do.
    await db.insert(users).values({
      id: session.metadata.userId,
      email: customerEmail,
      plan: 'pro',
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        plan: 'pro',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
      }
    })
  }

  // Handle subscription cancellations / downgrades
  if (event.type === 'customer.subscription.deleted') {
    const subscription = await stripe.subscriptions.retrieve(event.data.object.id)
    
    const userRecords = await db.select().from(users).where(eq(users.stripeCustomerId, subscription.customer as string)).limit(1)
    
    if (userRecords.length > 0) {
      await db.update(users).set({
        plan: 'hobby',
      }).where(eq(users.id, userRecords[0].id))
    }
  }

  return new NextResponse(null, { status: 200 })
}