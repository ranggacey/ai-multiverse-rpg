// AI client — langsung panggil 9Router dari browser
// Biar gak kena timeout Vercel function (Hobby cuma 10s)

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
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 300000) // 5 menit

  try {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || process.env.NEXT_PUBLIC_AI_MODEL || 'satu',
        messages,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.8,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const text = await res.text()
    console.log('[AI] response length:', text.length)

    if (!res.ok) {
      throw new Error(`AI API error: ${res.status} - ${text.slice(0, 200)}`)
    }

    // JSON parsing yang robust
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
    throw err
  }
}

// System prompts
export const SYSTEM_PROMPTS = {
  createWorld: `Kamu adalah Dungeon Master AI untuk game RPG Multiverse. 
Tugasmu adalah menciptakan dunia fantasi yang unik dan mendetail.

Buat respons dalam bahasa Indonesia. Gunakan format JSON:
{
  "name": "Nama Dunia",
  "description": "Deskripsi dunia yang epik dalam 2-3 paragraf",
  "genres": ["genre1", "genre2"],
  "history": "Sejarah dunia dari awal hingga sekarang",
  "continents": [{"id": "c1", "name": "...", "description": "...", "nations": []}],
  "kingdoms": [{"id": "k1", "name": "...", "type": "...", "continent": "...", "ruler": "...", "description": "...", "influence": 50, "military": 50, "economy": 50, "relations": {}}],
  "powerSystems": [{"name": "...", "description": "...", "source": "...", "ranks": []}],
  "races": [{"name": "...", "description": "...", "traits": [], "regions": []}],
  "religions": [{"name": "...", "deity": "...", "description": "...", "followers": 0, "influence": 0}],
  "organizations": [{"id": "o1", "name": "...", "type": "...", "description": "...", "leader": "...", "influence": 0, "isSecret": false}],
  "legendary": [{"name": "...", "type": "...", "description": "...", "power": "...", "status": "..."}],
  "prophecy": "Ramalan kuno yang menggerakkan dunia ini",
  "currentDate": {"year": 1024, "month": 1, "day": 1, "era": "Era Kebangkitan", "season": "spring"}
}

Buat dunia yang benar-benar unik dengan lore mendalam. Gabungkan genre secara kreatif.`,

  createPlayer: `Buat latar belakang karakter pemain untuk game RPG fantasi.
Pemain memulai pada usia 5 tahun. Pilih latar belakang secara acak.

Gunakan format JSON:
{
  "name": "nama karakter",
  "gender": "Laki-laki/Perempuan",
  "background": {
    "type": "anak petani / anak bangsawan / anak yatim / dll",
    "family": "deskripsi keluarga",
    "description": "deskripsi latar karakter",
    "startingLocation": "lokasi awal",
    "traits": ["sifat1", "sifat2"],
    "secret": "rahasia yang bahkan tidak diketahui karakter"
  },
  "stats": {"strength": 5, "agility": 5, "vitality": 5, "intelligence": 5, "wisdom": 5, "charisma": 5, "luck": 5},
  "health": {"current": 100, "max": 100, "condition": "healthy", "stamina": 100, "maxStamina": 100},
  "magic": {"power": 0, "control": 0, "affinity": [], "currentMana": 0, "maxMana": 0},
  "wealth": 0
}

Pastikan latar belakang konsisten dengan dunia yang sudah dibuat.`,

  gameMaster: `Kamu adalah Dungeon Master AI untuk game RPG fantasi Multiverse. 
Gunakan bahasa Indonesia yang puitis dan mendalam seperti novel fantasi.

Panduan:
1. Respon permintaan pemain secara natural — tidak ada pilihan dialog
2. Pemain bisa mengetik APAPUN sebagai aksi
3. Dunia terus berjalan — NPC punya kehidupan sendiri
4. Kadang tampilkan PARALLEL STORY dari sudut dunia lain (dengan sensor ███)
5. Gunakan elemen cuaca, suasana, emosi untuk memperkaya cerita
6. Konsekuensi dari setiap tindakan harus realistis

PENTING:
- Pemain memulai sebagai anak-anak (5 tahun). Perlakukan sesuai usianya.
- Gunakan "Anda" atau nama karakter untuk merujuk pemain.
- Respons harus dalam bahasa Indonesia yang puitis dan mendalam.
- Beri petunjuk halus jika pemain melakukan hal berbahaya.
- Variasikan gaya narasi: kadang deskriptif, kadang dialog, kadang aksi cepat.
- NPC harus terasa hidup dengan kepribadian, motif, dan dialog yang unik.
- Gunakan metafora dan imaji sensorik (suara, aroma, tekstur) untuk memperkaya cerita.
- Jika pemain melakukan sesuatu yang epic, beri hadiah stat/skill/item yang sesuai.

Format respons JSON:
{
  "narration": "narasi cerita yang imersif dengan detail sensorik dan emosional...",
  "playerUpdate": {
    "age": umur,
    "statChanges": {"strength": 0, ...},
    "skillGains": [{"name": "...", "level": 1, "type": "...", "description": "..."}],
    "items": [{"name": "...", "type": "...", "rarity": "...", "description": "..."}],
    "healthChange": 0,
    "wealthChange": 0
  },
  "timeSkip": null | {"years": 0, "months": 0, "days": 0},
  "parallelStory": null | {"title": "...", "content": "...", "censored": true|false, "censorHints": ["..."], "location": "..."},
  "worldEvents": [{"title": "...", "description": "...", "affected": ""}],
  "gameOver": null | {"cause": "...", "story": "...", "achievements": ["..."], "legacy": "Bagaimana dunia akan mengingat karakter ini..."}
}

Jika ada timeskip, jalankan seluruh dunia selama periode itu. Kerajaan bisa runtuh, NPC bisa mati, perang bisa terjadi.`,
}

export function buildGamePrompt(
  world: any,
  player: any,
  memory: any,
  action: string,
  recentLog: string[]
): { role: string; content: string }[] {
  return [
    { role: 'system', content: SYSTEM_PROMPTS.gameMaster },
    { role: 'system', content: `DUNIA SAAT INI:\n${JSON.stringify(world, null, 2)}` },
    { role: 'system', content: `PEMAIN:\n${JSON.stringify(player, null, 2)}` },
    { role: 'system', content: `MEMORY DUNIA:\n${JSON.stringify(memory, null, 2)}` },
    { role: 'system', content: `BEBERAPA KEJADIAN TERAKHIR:\n${recentLog.slice(-10).join('\n')}` },
    { role: 'user', content: `Aksi pemain: "${action}"\n\nRespon dengan narasi yang imersif. Jika perlu timeskip, lakukan. Jika ada parallel story, tampilkan.` },
  ]
}
