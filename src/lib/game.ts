import type { GameState, CombatState, SaveSlotMeta } from './types'

export type { SaveSlotMeta }

export function createInitialState(): GameState {
  const initialCombat: CombatState = {
    inCombat: false,
    turn: 'player',
    turnCount: 0,
    combatLog: [],
    playerHp: 100,
    playerMaxHp: 100,
    enemyHp: 0,
    enemyMaxHp: 0,
    playerMana: 50,
    playerMaxMana: 50,
    actionQueue: [],
  }

  return {
    id: '',
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    playTime: 0,
    currentChapter: 1,
    isAlive: true,
    world: { name: '', description: '', year: 1024, weather: 'cerah', timeOfDay: 'pagi' },
    player: { id: '', name: '', age: 5, gender: 'Laki-laki', background: { type: '', family: '', location: '' }, location: '', title: null, stats: { str: 5, agi: 5, int: 5, cha: 5 }, health: 100, maxHealth: 100, mana: 50, maxMana: 50, wealth: 0, skills: [], inventory: [], xp: 0, level: 1, xpToNext: 100 },
    currentDate: { year: 1024, month: 1, day: 1 },
    storyLog: [],
    worldMemory: '',
    narrationBuffer: '',
    combat: initialCombat,
    achievements: [],
  }
}

export function generateSaveName(player: any): string {
  if (!player) return 'New World'
  return `${player.name || 'Unknown'} — ${player.background?.type || 'Unknown'} (Usia ${player.age || '?'})`
}

export function formatDate(date: any): string {
  const seasons: Record<string, string> = { spring: 'Musim Semi', summer: 'Musim Panas', autumn: 'Musim Gugur', winter: 'Musim Dingin' }
  return `${seasons[date?.season] || date?.season || ''} Tahun ${date?.year || 0} ${date?.era || ''}`
}

export function formatTimePlayed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}j ${minutes}m`
  return `${minutes}m`
}

// Combat helpers
export function calculatePlayerMaxHp(player: any): number {
  const baseHp = 100
  const strBonus = (player.stats?.str || 5) * 5
  const levelBonus = (player.level || 1) * 10
  return baseHp + strBonus + levelBonus
}

export function calculatePlayerMaxMana(player: any): number {
  const baseMana = 50
  const intBonus = (player.stats?.int || 5) * 3
  const levelBonus = (player.level || 1) * 5
  return baseMana + intBonus + levelBonus
}

export function calculatePlayerAttack(player: any): number {
  const baseAttack = 10
  const strBonus = (player.stats?.str || 5) * 2
  const weaponBonus = player.inventory?.filter((i: any) => i.equipped && i.attack).reduce((sum: number, i: any) => sum + (i.attack || 0), 0) || 0
  return baseAttack + strBonus + weaponBonus
}

export function calculatePlayerDefense(player: any): number {
  const baseDefense = 5
  const agiBonus = (player.stats?.agi || 5) * 1.5
  const armorBonus = player.inventory?.filter((i: any) => i.equipped && i.defense).reduce((sum: number, i: any) => sum + (i.defense || 0), 0) || 0
  return Math.floor(baseDefense + agiBonus + armorBonus)
}

export function calculateXpToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function addXp(player: any, amount: number): { leveledUp: boolean; newLevel: number } {
  player.xp = (player.xp || 0) + amount
  let leveledUp = false
  while (player.xp >= (player.xpToNext || calculateXpToNext(player.level || 1))) {
    player.xp -= player.xpToNext || calculateXpToNext(player.level || 1)
    player.level = (player.level || 1) + 1
    player.xpToNext = calculateXpToNext(player.level)
    leveledUp = true
    // Stat gains on level up
    player.stats = player.stats || { str: 5, agi: 5, int: 5, cha: 5 }
    player.stats.str += 1
    player.stats.agi += 1
    player.stats.int += 1
    player.stats.cha += 1
    // HP/Mana increase
    player.maxHealth = calculatePlayerMaxHp(player)
    player.health = player.maxHealth
    player.maxMana = calculatePlayerMaxMana(player)
    player.mana = player.maxMana
  }
  return { leveledUp, newLevel: player.level }
}
