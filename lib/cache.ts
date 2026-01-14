// Simple in-memory cache with TTL support
// In production, consider using Redis or Supabase Edge Functions with KV storage

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get all keys for pattern matching
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }
}

// Global cache instance
const cache = new MemoryCache()

// Clean up cache every 10 minutes
if (typeof window === 'undefined') {
  setInterval(() => cache.cleanup(), 10 * 60 * 1000)
}

// Cache wrapper for database operations
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get from cache first
      const cached = cache.get<T>(key)
      if (cached !== null) {
        resolve(cached)
        return
      }

      // Fetch fresh data
      const data = await fetcher()
      
      // Cache the result
      cache.set(key, data, ttlMs)
      
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}

// Cache invalidation helper
export function invalidateCache(pattern: string): void {
  const keys = cache.getKeys()
  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

export default cache
