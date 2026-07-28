// AI client — MIMO Anthropic-compatible API
// Cepat, gratis, gak pake slop

const API_BASE = 'https://token-plan-sgp.xiaomimimo.com/anthropic/v1'
const API_KEY = process.env.NEXT_PUBLIC_MIMO_API_KEY || ''
const DEFAULT_MODEL = 'mimo-v2.5-pro'

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
  const model = options?.model || process.env.NEXT_PUBLIC_MIMO_MODEL || DEFAULT_MODEL
  const apiKey = process.env.NEXT_PUBLIC_MIMO_API_KEY || API_KEY

  // Convert OpenAI format ke Anthropic format
  const systemMsg = messages.find(m => m.role === 'system')
  const userMsgs = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }))

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)

    try {
      const body: any = {
        model,
        max_tokens: options?.maxTokens || 4096,
        messages: userMsgs,
      }
      if (systemMsg) body.system = systemMsg.content
      if (options?.temperature !== undefined) body.temperature = options.temperature

      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const text = await res.text()

      if (!res.ok) {
        throw new Error(`MIMO API error: ${res.status} - ${text.slice(0, 200)}`)
      }

      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Invalid JSON: ${text.slice(0, 200)}`)
      }

      // Extract content from Anthropic format
      const contentBlock = data.content?.find((c: any) => c.type === 'text')
      const content = contentBlock?.text?.trim()
      const thinkingBlock = data.content?.find((c: any) => c.type === 'thinking')

      if (!content && thinkingBlock?.thinking) {
        // Fallback: pake thinking kalo content kosong
        return { content: thinkingBlock.thinking.trim() }
      }

      if (!content) {
        throw new Error(`MIMO ngasih respon kosong`)
      }

      return {
        content,
        usage: data.usage ? {
          promptTokens: data.usage.input_tokens || 0,
          completionTokens: data.usage.output_tokens || 0,
        } : undefined,
      }
    } catch (err: any) {
      clearTimeout(timeout)
      lastError = err
      if (err.name === 'AbortError') {
        console.log(`[MIMO] Attempt ${attempt} timeout, retrying...`)
        continue
      }
      throw err
    }
  }
  throw lastError || new Error('MIMO API gagal setelah 3 percobaan')
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