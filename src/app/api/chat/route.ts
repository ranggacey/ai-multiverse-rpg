import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, model, maxTokens, temperature } = await request.json()

    // Gunakan OpenRouter langsung (bukan 9Router tunnel)
    const apiKey = process.env.OPENROUTER_API_KEY
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    const activeModel = model || process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'

    console.log('[AI] OPENROUTER_BASE_URL:', baseUrl)
    console.log('[AI] OPENROUTER_MODEL:', activeModel)
    console.log('[AI] API Key exists:', !!apiKey)

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key tidak dikonfigurasi. Set OPENROUTER_API_KEY di environment.' },
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
        'HTTP-Referer': 'https://ai-multiverse-rpg.vercel.app',
        'X-Title': 'AI Multiverse RPG',
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

    const raw = await res.text()

    console.log('[AI] Raw response length:', raw.length)
    console.log('[AI] Raw response preview:', raw.slice(0, 500))

    // Coba parse JSON - handle kemungkinan ada teks ekstra setelah JSON
    let result
    try {
      result = JSON.parse(raw)
    } catch {
      // Fallback: cari JSON object di dalam teks
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0])
        } catch {
          throw new Error(`Invalid JSON response: ${raw.slice(0, 300)}`)
        }
      } else {
        console.log('[AI] No JSON found in response')
        throw new Error(`Invalid JSON response: ${raw.slice(0, 300)}`)
      }
    }

    console.log('[AI] JSON parsed successfully')
    console.log('[AI] Content preview:', result.choices?.[0]?.message?.content?.slice(0, 200))

    return NextResponse.json({
      content: result.choices?.[0]?.message?.content || '',
      usage: result.usage ? {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
      } : undefined,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}