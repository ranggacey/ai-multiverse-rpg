// AI client — langsung ke OpenRouter
// API_BASE akan otomatis kosong di Vercel, jadi pake default OpenRouter

const API_BASE = process.env.NEXT_PUBLIC_AI_API_BASE || 'https://openrouter.ai/api/v1'
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
  const model = options?.model || process.env.NEXT_PUBLIC_AI_MODEL || 'google/gemini-2.0-flash-exp:free'
  const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_AI_API_BASE || 'https://openrouter.ai/api/v1'

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

      // Debug: log struktur response
      console.log('[AI] response keys:', Object.keys(data))
      if (data.choices?.[0]) {
        console.log('[AI] choice[0] keys:', Object.keys(data.choices[0]))
        console.log('[AI] message:', JSON.stringify(data.choices[0].message).slice(0, 300))
      }

      const content = data.choices?.[0]?.message?.content?.trim()
      const finishReason = data.choices?.[0]?.finish_reason

      if (!content) {
        const reasoning = data.choices?.[0]?.message?.reasoning_content?.trim() || ''
        const textAlt = data.choices?.[0]?.text || data.response || data.content || ''

        // DeepSeek: reasoning_content biasanya berisi proses mikir,
        // content asli kadang kosong kalo finish_reason = "length"
        // Split: ambil bagian setelah "Answer:" atau "Jawaban:" di reasoning
        if (reasoning) {
          const answerMatch = reasoning.match(/(?:Answer|Jawaban|Output|RESPON|WORLD|NAME):?([\s\S]+)/i)
          if (answerMatch) {
            return { content: answerMatch[1].trim() }
          }
          // Fallback: reasoning_content itu content aslinya
          return { content: reasoning }
        }

        throw new Error(`AI ngasih respon kosong (finish: ${finishReason})`)
      }

      return {
        content,
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
// System prompt untuk game master — narasi puitis + embedded labels
export const GAME_MASTER_PROMPT = `Kamu adalah Dungeon Master AI. Ceritakan kisah fantasi yang hidup dalam bahasa Indonesia.

ATURAN NARASI:
- Pemain MENGETIK BEBAS aksi apapun — tidak ada pilihan dialog
- Narasi puitis dan imersif seperti novel fantasi (minimal 3 paragraf)
- Dunia terus berjalan — konsekuensi realistis
- NPC punya kepribadian dan reaksi alami
- Kalau ada timeskip (bulan/tahun), tulis "X tahun berlalu" di narasi
- Kadang tampilkan adegan PARALLEL dari sudut dunia lain dengan SENSOR ███
- Pemain mulai umur 5 tahun — perlakukan sesuai umur
- Jangan dump semua lore — ungkap pelan-pelan
- QUEST: Pemain bisa menerima dan menyelesaikan misi dari NPC

LABEL YANG HARUS DISELIPKAN DI NARASI (jika ada perubahan):
USIA: [umur baru] — saat usia berubah
LOKASI: [nama tempat baru] — saat pindah lokasi
CUACA: [cerah/berawan/hujan/badai/salju/berkabut] — saat cuaca berubah
WAKTU: [pagi/siang/sore/malam/dini_hari] — saat waktu berganti
STAT:str:[angka],agi:[angka],int:[angka],cha:[angka] — saat stats berubah
NPC: [nama] | [teman/musuh/netral] | [deskripsi singkat] — saat bertemu NPC baru
QUEST: [nama quest] | [deskripsi] | [main/side/personal] — saat mulai quest baru
QUEST_PROGRESS: [nama quest] | [progress] | [max] — saat quest progress maju
QUEST_SELESAI: [nama quest] — saat quest selesai

Contoh label di tengah narasi:
"...Kael berjalan menyusuri jalan setapak. CUACA: hujan WAKTU: malam USIA: 10 LOKASI: Desa Oakvale STAT:str:6,agi:5,int:5,cha:5 NPC: Sersan Varian | netral | Seorang veteran perang berjanggut tebal QUEST: Berburu Serigala | Bunuh 3 serigala di hutan utara | side QUEST_PROGRESS: Berburu Serigala | 1 | 3"

PENTING:
- Label cukup diselipkan di baris mana saja dalam narasi
- Jangan selalu kasih label — kasih cuma kalo ada perubahan berarti
- Usahakan setiap respon punya minimal CUACA dan WAKTU biar dunia terasa hidup
- Kalo pemain meninggal, tulis "GAME OVER" di akhir narasi dan tulis legacy yang emosional`

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