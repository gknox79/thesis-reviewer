/**
 * Access code validation and rate limiting.
 *
 * In production (Vercel): uses Vercel KV for persistent storage.
 * In development: falls back to in-memory Map.
 *
 * Access codes are stored in the ACCESS_CODES environment variable
 * as a comma-separated list: THESIS-ANNA-2026,THESIS-BOB-2026,...
 */

const MONTHLY_LIMIT = 10

// In-memory fallback for local development
const memoryStore = new Map<string, number>()

function getMonthKey(code: string): string {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return `usage:${code}:${month}`
}

function getValidCodes(): Set<string> {
  const codes = process.env.ACCESS_CODES || ''
  return new Set(
    codes
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 0)
  )
}

async function getKv() {
  // Only import Vercel KV if env vars are set (production)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv')
      return kv
    } catch {
      return null
    }
  }
  return null
}

export interface ValidationResult {
  valid: boolean
  remaining: number
  error?: string
}

export async function validateCode(code: string): Promise<ValidationResult> {
  const normalizedCode = code.trim().toUpperCase()
  const validCodes = getValidCodes()

  if (!validCodes.has(normalizedCode)) {
    return { valid: false, remaining: 0, error: 'Invalid access code.' }
  }

  const key = getMonthKey(normalizedCode)
  const kvStore = await getKv()

  let count: number
  if (kvStore) {
    count = (await kvStore.get<number>(key)) || 0
  } else {
    count = memoryStore.get(key) || 0
  }

  const remaining = Math.max(0, MONTHLY_LIMIT - count)

  if (remaining <= 0) {
    return {
      valid: true,
      remaining: 0,
      error: `You have used all ${MONTHLY_LIMIT} reviews for this month. Reviews reset on the 1st of each month.`,
    }
  }

  return { valid: true, remaining }
}

export async function incrementUsage(code: string): Promise<void> {
  const normalizedCode = code.trim().toUpperCase()
  const key = getMonthKey(normalizedCode)
  const kvStore = await getKv()

  if (kvStore) {
    const current = (await kvStore.get<number>(key)) || 0
    // Set with 60-day expiry so old months auto-clean
    await kvStore.set(key, current + 1, { ex: 60 * 24 * 60 * 60 })
  } else {
    const current = memoryStore.get(key) || 0
    memoryStore.set(key, current + 1)
  }
}
