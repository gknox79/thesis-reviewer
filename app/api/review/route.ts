import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { parseFile } from '@/lib/file-parser'
import { validateCode, incrementUsage } from '@/lib/rate-limiter'
import { getSystemPrompt } from '@/lib/review-prompt'

export const maxDuration = 60 // Vercel Pro allows up to 300s; Hobby is 60s

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const code = formData.get('code') as string | null
    const stage = formData.get('stage') as string | null

    // Validate inputs
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!code) {
      return new Response(JSON.stringify({ error: 'Access code is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!stage || !['proposal', 'draft', 'final'].includes(stage)) {
      return new Response(
        JSON.stringify({ error: 'Please select a submission stage.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate access code and rate limit
    const validation = await validateCode(code)
    if (!validation.valid || validation.remaining <= 0) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Access denied.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse the uploaded file
    let parsed
    try {
      parsed = await parseFile(file)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not read file.'
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured. Contact the administrator.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call Claude API with streaming
    const client = new Anthropic({ apiKey })
    const systemPrompt = getSystemPrompt(stage as 'proposal' | 'draft' | 'final')

    const userMessage = `Submission stage: ${stage}
Filename: ${parsed.filename}
Word count: ${parsed.wordCount} words (~${parsed.pageEstimate} pages)

---

${parsed.text}`

    // Create a streaming response
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    // Increment usage after successful API call initiation
    await incrementUsage(code)

    // Convert the Anthropic stream to a ReadableStream for the browser
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
              controller.enqueue(chunk)
            }
          }
          // Send metadata at the end
          const metadata = encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              filename: parsed.filename,
              stage,
              wordCount: parsed.wordCount,
              pageEstimate: parsed.pageEstimate,
            })}\n\n`
          )
          controller.enqueue(metadata)
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const errChunk = encoder.encode(
            `data: ${JSON.stringify({ error: 'An error occurred during the review. Please try again.' })}\n\n`
          )
          controller.enqueue(errChunk)
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Review error:', error)
    return new Response(
      JSON.stringify({ error: 'Server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
