// Build-safe database wrapper
// This utility provides conditional database imports for build-time compatibility

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
  (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_URL)

export function getDb() {
  if (isBuildTime) {
    return require("@/lib/db-build-safe").db
  }
  return require("@/lib/db").db
}

export function getSupabase() {
  if (isBuildTime) {
    return require("@/lib/db-build-safe").supabase
  }
  return require("@/lib/db").supabase
}

export function getSupabaseAdmin() {
  if (isBuildTime) {
    return require("@/lib/db-build-safe").supabaseAdmin
  }
  return require("@/lib/db").supabaseAdmin
}

export function skipDuringBuild<T>(fallback: T): T | Promise<T> {
  if (isBuildTime) {
    return fallback as T
  }
  return null as T
}
