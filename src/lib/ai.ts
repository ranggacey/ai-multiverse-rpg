// AI client — langsung panggil 9Router dari browser
// Progressive world building: minimal awal, nambah gradual

const API_BASE = process.env.NEXT_PUBLIC_AI_API_BASE || 'https://rphvgzw.abc-tunnel.us/v1'
const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || ''

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

export async function callAI(
  messages: { role: string; content: string }[],
  options?: {
    maxTokens?: number
    temperature?: number
    model?: string
  }
): Promise<AIResponse> {
  const model = options?.model || process.env.NEXT_PUBLIC_AI_MODEL || 'satu'
  const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_AI_API_BASE || 'https://rphvgzw.abc-tunnel.us/v1'

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options?.maxTokens || 4096,
          temperature: options?.temperature ?? 0.8,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const text = await res.text()

      if (!res.ok) {
        throw new Error(`AI API error: ${res.status} - ${text.slice(0, 200)}`)
      }

      let data
      try {
        data = JSON.parse(text)
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) data = JSON.parse(match[0])
        else throw new Error(`Invalid JSON: ${text.slice(0, 200)}`)
      }

      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
        } : undefined,
      }
    } catch (err: any) {
      clearTimeout(timeout)
      lastError = err
      if (err.name === 'AbortError' || String(err.message).includes('524')) {
        console.log(`[AI] Attempt ${attempt} timeout, retrying...`)
        continue
      }
      throw err
    }
  }
  throw lastError || new Error('AI API gagal setelah 3 percobaan')
}

// ============================================================
// SYSTEM PROMPTS — PROGRESSIVE WORLD BUILDING
// ============================================================
// Fase 1: Dunia lahir MINIMALIS — cuma esensi
// Fase 2+ : Nambah detail seiring pemain main
// System prompt untuk game master — narasi bebas, gak pake JSON
export const GAME_MASTER_PROMPT = `Kamu adalah Dungeon Master AI. Ceritakan kisah fantasi yang hidup dalam bahasa Indonesia.

ATURAN:
- Pemain MENGETIK BEBAS aksi apapun — tidak ada pilihan dialog
- Narasi puitis dan imersif seperti novel fantasi
- Dunia terus berjalan — konsekuensi realistis
- NPC punya kepribadian dan reaksi alami
- Kalau ada timeskip (bulan/tahun), ceritakan apa yang terjadi di dunia selama itu
- Kadang tampilkan adegan PARALLEL dari sudut dunia lain dengan SENSOR ███
- Kalau pemain meninggal, akhiri dengan epilog yang emosional

Pemain mulai umur 5 tahun — perlakukan sesuai umur.
Jangan dump semua lore — ungkap pelan-pelan.

Kalo ada timeskip, tulis "X tahun berlalu" di narasi.
Jika ada parallel story, mulai dengan "[DI TEMPAT LAIN]"
Jika game over, tulis "GAME OVER" di akhir narasi.`

export function buildGamePrompt(
  world: any,
  player: any,
  worldMemory: string,
  action: string,
  recentNarration: string
): { role: string; content: string }[] {
  return [
    { role: 'system', content: GAME_MASTER_PROMPT },
    { role: 'system', content: `DUNIA: ${world?.name || 'Unknown'} | ${world?.description || ''}` },
    { role: 'system', content: `PEMAIN: ${player?.name || 'Unknown'} (${player?.age || '?'} tahun) — ${player?.background?.type || ''} dari ${player?.location || '?'}` },
    { role: 'system', content: `CATATAN: ${worldMemory || ''}` },
    { role: 'system', content: `SEBELUMNYA: ${recentNarration.slice(-500)}` },
    { role: 'user', content: `${action}` },
  ]
}
