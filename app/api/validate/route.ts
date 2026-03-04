import { NextRequest, NextResponse } from 'next/server'
import { validateCode } from '@/lib/rate-limiter'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, remaining: 0, error: 'Access code is required.' },
        { status: 400 }
      )
    }

    const result = await validateCode(code)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { valid: false, remaining: 0, error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
