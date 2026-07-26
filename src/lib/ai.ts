// AI API client for 9Router
// Uses the provided API endpoint: https://rphvgzw.abc-tunnel.us/v1

const API_BASE = 'https://rphvgzw.abc-tunnel.us/v1'
const API_KEY = 'sk-placeholder' // 9Router might not need auth or use different auth

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
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model || 'gpt-4o-mini',
      messages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.8,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI API error: ${res.status} - ${err}`)
  }

  const data = await res.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
    } : undefined,
  }
}

// System prompts for different game phases
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
    "description": "deskripsi背景 karakter",
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
- Respons harus dalam bahasa Indonesia.
- Beri petunjuk halus jika pemain melakukan hal berbahaya.

Format respons JSON:
{
  "narration": "narasi cerita yang imersif...",
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
  "gameOver": null | {"cause": "...", "story": "...", "achievements": ["..."]}
}

Jika ada timeskip, jalankan seluruh dunia selama periode itu. Kerajaan bisa runtuh, NPC bisa mati, perang bisa terjadi.`,

  worldAdvance: `Kamu adalah Dungeon Master AI. Sejumlah waktu telah berlalu di dunia ini.
Jalankan simulasi dunia selama periode waktu yang ditentukan.

Berikan ringkasan tentang:
1. Apa yang terjadi pada karakter pemain (jika ada training/aktivitas)
2. Perubahan politik dan kekuasaan
3. Nasib NPC-NPC penting
4. Peristiwa dunia yang signifikan
5. Perubahan kekuatan dan aliansi

Gunakan bahasa seperti kronik sejarah.
Respon dalam JSON dengan format yang sama seperti gameMaster.`
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
