import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/demo(.*)',
  '/about(.*)',
  '/features(.*)',
  '/how-it-works(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/contact(.*)',
  '/api/demo(.*)',
  '/api/analytics',
  '/pricing', 
  '/release-notes',
  '/api/webhooks/stripe',
 '/api/refactor(.*)',
 '/api/agent(.*)',
 '/api/inngest(.*)'
])
export default clerkMiddleware(async (auth, req) => {
  // 🚨 THE BULLETPROOF BYPASS 🚨
  // If the request is for our VS Code extension, let it through immediately!
  if (req.nextUrl.pathname.startsWith('/api/refactor')) {
    return; 
  }

  // Otherwise, use the normal Clerk security rules
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}