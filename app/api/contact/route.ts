import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json(
        { success: false, error: 'Email service is not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(resendApiKey)
    const { name, email, message } = await req.json()
    
    await resend.emails.send({
      from: 'RepoSage Prime <onboarding@resend.dev>',
      to: 'jatindongre926@gmail.com',
      subject: `New Contact: ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
          <h2 style="color: #00e5a0;">New message from RepoSage Prime</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Message:</b></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}
