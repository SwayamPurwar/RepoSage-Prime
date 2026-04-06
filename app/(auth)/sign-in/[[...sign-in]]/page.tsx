import { SignIn } from '@clerk/nextjs'

export default function SignInPage({
  params,
}: {
  params: Promise<{ 'sign-in'?: string[] }>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080b10]">
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  )
}