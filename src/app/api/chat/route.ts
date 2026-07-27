import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, model, maxTokens, temperature } = await request.json()

    const apiKey = process.env.NINEROUTER_API_KEY
    const baseUrl = process.env.NINEROUTER_BASE_URL || 'https://rphvgzw.abc-tunnel.us/v1'
    const activeModel = model || process.env.NINEROUTER_MODEL || 'story-combo'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key tidak dikonfigurasi. Set NINEROUTER_API_KEY di environment.' },
        { status: 500 }
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000) // 3 menit timeout

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: activeModel,
        messages,
        max_tokens: maxTokens || 4096,
        temperature: temperature ?? 0.8,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json(
        { error: `AI API error: ${res.status} - ${err.slice(0, 200)}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json({
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
      } : undefined,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}
