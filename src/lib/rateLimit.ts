import { Redis } from '@upstash/redis'

// Fallback en mémoire si Upstash pas configuré
const memoryStore = new Map<string, { count: number; reset: number }>()

function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = memoryStore.get(key)
  if (!entry || now > entry.reset) {
    memoryStore.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

let redis: Redis | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!redis) return memoryRateLimit(key, limit, windowMs)

  const windowSec = Math.ceil(windowMs / 1000)
  const current = await redis.incr(key)
  if (current === 1) await redis.expire(key, windowSec)
  return current <= limit
}
