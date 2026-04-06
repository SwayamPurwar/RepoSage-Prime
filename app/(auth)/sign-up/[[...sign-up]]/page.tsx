import { SignUp } from '@clerk/nextjs'

export default function SignUpPage({
  params,
}: {
  params: Promise<{ 'sign-up'?: string[] }>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080b10]">
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  )
}