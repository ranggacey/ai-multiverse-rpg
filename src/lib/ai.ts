// AI client — langsung ke Google Gemini API (AI Studio)
// Format: OpenAI-compatible via OpenRouter removed, now direct Gemini

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash-001'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

// Convert OpenAI format messages to Gemini format
function convertToGemini(messages: { role: string; content: string }[]) {
  const systemPrompt = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')
  
  return {
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    contents: userMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
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
  const model = options?.model || process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash'
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const baseUrl = `${GEMINI_BASE}/${model}:generateContent`

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY tidak diset. Set NEXT_PUBLIC_GEMINI_API_KEY di env.')
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)

    try {
      const { systemInstruction, contents } = convertToGemini(messages)
      
      const body: any = { contents }
      if (systemInstruction) body.systemInstruction = systemInstruction
      if (options?.temperature !== undefined) {
        body.generationConfig = { temperature: options.temperature }
      }
      if (options?.maxTokens) {
        body.generationConfig = { ...body.generationConfig, maxOutputTokens: options.maxTokens }
      }

      const res = await fetch(`${baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const text = await res.text()

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status} - ${text.slice(0, 200)}`)
      }

      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Invalid JSON: ${text.slice(0, 200)}`)
      }

      console.log('[Gemini] response:', JSON.stringify(data).slice(0, 300))

      // Extract content from Gemini response format
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      
      if (!content) {
        throw new Error(`Gemini ngasih respon kosong: ${JSON.stringify(data).slice(0, 200)}`)
      }

      return {
        content,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        } : undefined,
      }
    } catch (err: any) {
      clearTimeout(timeout)
      lastError = err
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        console.log(`[Gemini] Attempt ${attempt} timeout, retrying...`)
        continue
      }
      throw err
    }
  }
  throw lastError || new Error('Gemini API gagal setelah 3 percobaan')
}

// ============================================================
// SYSTEM PROMPTS — PROGRESSIVE WORLD BUILDING
// ============================================================
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