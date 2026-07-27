import type { GameState, WorldSettings, Player, WorldMemory } from './types'

export function createInitialState(): GameState {
  return {
    id: '',
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    playTime: 0,
    player: null as unknown as Player,
    world: null as unknown as WorldSettings,
    npcs: [],
    storyLog: [],
    parallelStories: [],
    currentChapter: 1,
    worldEvents: [],
    isAlive: true,
  }
}

export function buildWorldMemory(gameState: GameState): WorldMemory {
  return {
    worldState: summarizeWorld(gameState.world),
    playerSummary: summarizePlayer(gameState.player),
    recentEvents: gameState.storyLog.slice(-20).map(l => `[Usia ${l.playerAge}] ${String(l.content).slice(0, 200)}`).join('\n'),
    activeQuests: (gameState.player?.quests || [])
      .filter(q => q.status === 'active')
      .map(q => `${q.title} (${q.difficulty}): ${q.description}`).join('; '),
    relationships: (gameState.player?.relationships || [])
      .map(r => `${r.npcName}: ${r.affinity} (${r.type})`)
      .slice(0, 10).join('; '),
    timeline: gameState.storyLog
      .filter(l => l.type === 'event' || l.type === 'timeSkip')
      .slice(-10)
      .map(l => `[${l.date.year}] ${String(l.content).slice(0, 100)}`).join('\n'),
  }
}

function summarizeWorld(world: WorldSettings): string {
  if (!world) return 'Belum ada dunia'
  return `${world.name} — ${world.genres.join(', ')}
Periode: ${world.currentDate?.era || 'Era Awal'} Tahun ${world.currentDate?.year || 0}
Kerajaan: ${world.kingdoms?.map(k => `${k.name} (${k.type})`).join(', ') || 'N/A'}
Organisasi: ${world.organizations?.map(o => o.name).join(', ') || 'N/A'}
Sistem Kekuatan: ${world.powerSystems?.map(ps => ps.name).join(', ') || 'N/A'}`
}

function summarizePlayer(player: Player): string {
  if (!player) return 'Belum ada pemain'
  return `${player.name}, ${player.age} tahun
Latar: ${player.background?.type || 'N/A'}
Lokasi: ${player.location || 'N/A'}
Kesehatan: ${player.health?.condition || 'N/A'}
Kekuatan: ${player.stats?.strength || 0} | Kelincahan: ${player.stats?.agility || 0}
Kecerdasan: ${player.stats?.intelligence || 0} | Karisma: ${player.stats?.charisma || 0}`
}

export function generateSaveName(player?: Player): string {
  if (!player) return `New World ${new Date().toLocaleDateString('id-ID')}`
  return `${player.name} — ${player.background?.type || 'Unknown'} (Usia ${player.age})`
}

export function formatDate(date: { year: number; month: number; day: number; season: string; era: string }): string {
  const seasons: Record<string, string> = {
    spring: 'Musim Semi',
    summer: 'Musim Panas',
    autumn: 'Musim Gugur',
    winter: 'Musim Dingin',
  }
  return `${seasons[date.season] || date.season}, ${date.day} Bulan ${date.month} Tahun ${date.year} ${date.era}`
}

export function formatTimePlayed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours} jam ${minutes} menit`
  return `${minutes} menit`
}
