import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server' // <-- Import clerkClient
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// Ensure you add STRIPE_SECRET_KEY to your .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    // Check if user already exists in your DB
    let userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    // If this is their first time clicking upgrade, create their DB profile with REAL data
    if (userRecord.length === 0) {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      
      // Extract the primary email address from Clerk
      const primaryEmail = clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress
      
      if (!primaryEmail) {
        return new NextResponse("User email not found", { status: 400 })
      }

      const inserted = await db.insert(users).values({
        id: userId,
        email: primaryEmail,
        plan: 'hobby'
      }).returning()
      
      userRecord = inserted
    }

    const user = userRecord[0]

    if (!user) {
      return new NextResponse("User record could not be found or created", { status: 500 })
    }

    if (user.plan === 'pro') {
      return new NextResponse("You are already on the Pro plan.", { status: 400 })
    }

    // Generate the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_email: user.email, // Securely uses their real email
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID, 
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing-soon`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe Checkout Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}