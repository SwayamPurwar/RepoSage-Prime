import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// --- NEW: Tiered Rate Limiter Factory ---
export const getAiRateLimiter = (plan: 'hobby' | 'pro' | 'enterprise' = 'hobby') => {
  // Define limits based on pricing tiers
  const limiters = {
    hobby: Ratelimit.slidingWindow(15, '1 m'),      // 15 requests per minute
    pro: Ratelimit.slidingWindow(100, '1 m'),       // 100 requests per minute
    enterprise: Ratelimit.slidingWindow(1000, '1 m'), // 1000 requests per minute
  }

  return new Ratelimit({
    redis: redis,
    limiter: limiters[plan] || limiters.hobby, // Fallback to hobby
    analytics: true, 
    prefix: `@upstash/ratelimit/ai/${plan}`, // Separate buckets per plan
  })
}