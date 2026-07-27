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

export const SYSTEM_PROMPTS = {

  // ── FASE 1: CREATE WORLD (MINIMAL) ──
  createWorld: `Kamu adalah Dungeon Master AI. Ciptakan dunia RPG yang unik.

RESPON JSON INI SAJA — singkat, padat, tidak perlu terlalu detail:
{
  "name": "Nama Dunia (2 kata maks)",
  "description": "1 kalimat atmosfer dunia",
  "history": "2-3 kalimat sejarah singkat",
  "genres": ["genre utama"],
  "era": "nama era saat ini",
  "year": 1024,
  "season": "spring"
}
Buat yang menarik dan misterius. Tidak perlu benua/kerajaan/dll dulu.`,

  // ── FASE 1: CREATE PLAYER (MINIMAL) ──
  createPlayer: `Buat karakter pemain untuk dunia yang sudah diciptakan.
Pemain lahir sebagai anak usia 5 tahun dengan latar acak.

RESPON JSON:
{
  "name": "nama karakter (2 suku kata)",
  "gender": "Laki-laki/Perempuan",
  "background": {
    "type": "anak petani / anak bangsawan / anak yatim / anak pemburu / dll (acak)",
    "family": "deskripsi 1 kalimat",
    "location": "nama desa/kota tempat lahir"
  }
}

Tidak perlu stats/skill/dll dulu — akan bertambah seiring cerita.`,

  // ── FASE 2+: GAME MASTER (OPTIMIZED) ──
  gameMaster: `Kamu adalah Dungeon Master AI. Ceritakan kisah fantasi yang hidup.

ATURAN:
- Pemain MENGETIK BEBAS aksi apapun — tidak ada pilihan dialog
- Gunakan bahasa Indonesia yang puitis seperti novel fantasi
- Cerita mengalir natural — konsekuensi realistis
- NPC punya kepribadian dan reaksi alami
- Kadang tampilkan PARALLEL STORY dari sudut dunia lain (dengan ███)
- Jika timeskip (bulan/tahun), jalankan seluruh dunia — kerajaan bisa runtuh, perang terjadi, NPC mati

FORMAT RESPON JSON:
{
  "narration": "narasi imersif 2-5 paragraf — deskriptif, sensorik, emosional",
  "update": {
    "age": umur,

    "lokasi": "nama tempat saat ini (opsional, jika pindah)",
    
    "stats": { "str": 0, "agi": 0, "int": 0, "cha": 0 },
    "skill": { "nama": "", "level": 1 },

    "item": { "nama": "", "tipe": "senjata/baju/potion/dll", "raritas": "umum/langka/epic" },

    "gold": 0,
    "hp": 0,

    "npc": { "nama": "", "relasi": "teman/musuh/netral", "deskripsi": "" },
    "lokasiBaru": { "nama": "", "deskripsi": "", "tipe": "kota/desa/dungeon/kuil" }
  },
  "worldEvent": "jika ada peristiwa besar di dunia (string atau null)",
  "parallel": "jika ada adegan parallel story (string atau null) — SENSOR ███ bagian penting",
  "timeskip": { "tahun": 0, "bulan": 0 },
  "gameOver": null
}

CATATAN PENTING:
- Pemain mulai umur 5 — perlakukan sesuai umur
- Jangan dump semua lore — ungkap pelan-pelan lewat narasi
- HANYA kirim field update jika ada perubahan — sisanya null/0
- Jika ada parallel story, Sensor ███ bagian krusial biar penasaran
- Jika gameOver, tulis legacy karakter yang emosional`,
}

// ============================================================
// BUILD GAME PROMPT (OPTIMIZED — ringkas, gak dump semua data)
// ============================================================
export function buildGamePrompt(
  world: any,
  player: any,
  worldMemory: string,
  action: string,
  recentNarration: string
): { role: string; content: string }[] {
  // Kirim ringkasan aja — bukan full object
  const worldSummary = `${world.name} | ${world.description} | ${world.genres?.join(', ')}`
  const playerSummary = `${player.name} (${player.gender}, ${player.age} tahun) — ${player.background?.type} di ${player.background?.location || world.name}`

  return [
    { role: 'system', content: SYSTEM_PROMPTS.gameMaster },
    { role: 'system', content: `DUNIA: ${worldSummary}` },
    { role: 'system', content: `PEMAIN: ${playerSummary}` },
    { role: 'system', content: `STATUS: ${worldMemory}` },
    { role: 'system', content: `SEBELUMNYA: ${recentNarration.slice(-500)}` },
    { role: 'user', content: `"${action}"` },
  ]
}

// ============================================================
// EXPAND WORLD — dipanggil bertahap sesuai kebutuhan
// ============================================================
export const EXPAND_PROMPTS = {
  location: `Kamu adalah DM AI. Pemain baru saja tiba di lokasi baru.
Deskripsikan lokasi ini — suasananya, orang-orangnya, apa yang menarik di sini.
Respon JSON:
{
  "name": "nama lokasi",
  "description": "deskripsi atmosfer 1-2 paragraf",
  "type": "kota/desa/dungeon/kuil/hutan/istana/dll",
  "interest": "satu hal unik tentang tempat ini"
}`,

  npc: `Kamu adalah DM AI. Pemain bertemu karakter baru.
Ciptakan NPC yang hidup dan menarik.

Respon JSON:
{
  "name": "nama NPC",
  "age": umur,
  "gender": "L/P",
  "appearance": "penampilan 1 kalimat",
  "personality": "sifat 1 kalimat",
  "role": "pedagang/pengrajin/pengembara/dll",
  "attitude": "ramah/curiga/dingin/ceria"
}`,

  expandWorld: `Kamu adalah DM AI. Cerita sudah berjalan dan dunia perlu diperluas.
Tambahkan elemen baru ke dunia ini — benua, kerajaan, organisasi, atau sistem kekuatan.

Respon JSON (pilih 1-2 aja yang paling relevan):
{
  "newKingdoms": [{"name": "", "type": "kerajaan/sekete/guild", "description": "1 kalimat"}],
  "newPowerSystem": {"name": "", "source": "mana/ki/roh/dll", "description": "1 kalimat"},
  "newThreat": {"name": "", "description": "ancaman yang mulai muncul..."}
}`,
}
