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

    // ===== NEW SYSTEMS INITIALIZATION =====
    // Companion / Party
    companions: [],
    party: {
      maxSize: 4,
      formation: 'standard',
      activeMembers: [],
      reserveMembers: [],
      sharedXp: true,
      sharedLoot: true,
      tactics: {
        focusFire: true,
        protectWeak: true,
        useConsumables: true,
        autoHealThreshold: 30,
        autoManaThreshold: 20,
        priorityTargets: ['caster', 'healer', 'leader'],
      },
    },

    // Codex / Lorebook
    codex: {
      entries: [],
      categories: [
        { id: 'world', name: 'Dunia', description: 'Lokasi, sejarah, dan geografi', icon: '🌍', color: 'text-emerald-400', order: 1 },
        { id: 'people', name: 'Tokoh', description: 'NPC, companion, dan musuh', icon: '👥', color: 'text-sky-400', order: 2 },
        { id: 'factions', name: 'Faksi', description: 'Guild, kerajaan, dan organisasi', icon: '🏰', color: 'text-amber-400', order: 3 },
        { id: 'items', name: 'Barang', description: 'Senjata, armor, item unik', icon: '⚔️', color: 'text-purple-400', order: 4 },
        { id: 'lore', name: 'Lore', description: 'Mitologi, sejarah, dan rahasia', icon: '📜', color: 'text-indigo-400', order: 5 },
        { id: 'bestiary', name: 'Bestiary', description: 'Monster dan makhluk', icon: '🐉', color: 'text-red-400', order: 6 },
        { id: 'magic', name: 'Magic', description: 'Sistem sihir dan spell', icon: '✨', color: 'text-pink-400', order: 7 },
      ],
      discoveredCount: 0,
      totalCount: 0,
    },

    // Journal / Notes
    journal: {
      entries: [],
      categories: ['Pribadi', 'Quest', 'Lore', 'Pertarungan', 'NPC', 'Rumor'],
      pinnedEntries: [],
    },

    // Faction / Reputation
    factions: {
      factions: [],
      playerReputation: {},
    },
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

// ============================================================
// COMPANION HELPERS
// ============================================================

export function calculateCompanionStats(companion: any): { maxHp: number; maxMana: number; attack: number; defense: number; speed: number } {
  const baseHp = 80
  const baseMana = 40
  const baseAttack = 8
  const baseDefense = 4
  const baseSpeed = 5
  
  const strBonus = (companion.stats?.str || 5) * 4
  const agiBonus = (companion.stats?.agi || 5) * 2
  const intBonus = (companion.stats?.int || 5) * 3
  const levelBonus = (companion.level || 1) * 8
  
  const weaponBonus = companion.equipment?.weapon?.attack || 0
  const armorBonus = companion.equipment?.armor?.defense || 0
  
  return {
    maxHp: baseHp + strBonus + levelBonus,
    maxMana: baseMana + intBonus + Math.floor(levelBonus / 2),
    attack: baseAttack + Math.floor(strBonus / 2) + weaponBonus,
    defense: baseDefense + Math.floor(agiBonus / 2) + armorBonus,
    speed: baseSpeed + Math.floor(agiBonus / 3),
  }
}

export function createCompanion(overrides: Partial<any> = {}): any {
  const baseStats = { str: 8, agi: 8, int: 8, cha: 8 }
  const derived = calculateCompanionStats({ stats: baseStats, level: 1, equipment: {} })
  
  return {
    id: crypto.randomUUID(),
    name: 'Companion',
    title: '',
    race: 'Human',
    class: 'Adventurer',
    level: 1,
    xp: 0,
    xpToNext: 100,
    stats: baseStats,
    maxHp: derived.maxHp,
    hp: derived.maxHp,
    maxMana: derived.maxMana,
    mana: derived.maxMana,
    attack: derived.attack,
    defense: derived.defense,
    speed: derived.speed,
    skills: [],
    equipment: { weapon: undefined, armor: undefined, accessory: undefined },
    personality: {
      traits: ['loyal', 'curious'],
      likes: ['adventure', 'good food'],
      dislikes: ['betrayal', 'cruelty'],
      fears: ['failure', 'loss'],
      values: ['friendship', 'honor'],
      speechStyle: 'casual',
      quirks: ['taps fingers when thinking'],
    },
    loyalty: 50,
    trust: 50,
    romanceLevel: 0,
    backstory: 'A wandering soul seeking purpose.',
    personalQuest: undefined,
    personalQuestCompleted: false,
    combatBehavior: 'balanced',
    preferredTarget: 'random',
    isActive: false,
    joinedAt: { year: 1024, month: 1, day: 1 },
    location: '',
    statusEffects: [],
    dialogueLines: [],
    ...overrides,
  }
}

export function addCompanionXp(companion: any, amount: number): { leveledUp: boolean; newLevel: number } {
  companion.xp = (companion.xp || 0) + amount
  let leveledUp = false
  while (companion.xp >= (companion.xpToNext || calculateXpToNext(companion.level || 1))) {
    companion.xp -= companion.xpToNext || calculateXpToNext(companion.level || 1)
    companion.level = (companion.level || 1) + 1
    companion.xpToNext = calculateXpToNext(companion.level)
    leveledUp = true
    // Stat gains on level up
    companion.stats.str += 1
    companion.stats.agi += 1
    companion.stats.int += 1
    companion.stats.cha += 1
    // Recalculate derived stats
    const derived = calculateCompanionStats(companion)
    companion.maxHp = derived.maxHp
    companion.hp = derived.maxHp
    companion.maxMana = derived.maxMana
    companion.mana = derived.maxMana
    companion.attack = derived.attack
    companion.defense = derived.defense
    companion.speed = derived.speed
  }
  return { leveledUp, newLevel: companion.level }
}

export function getActiveCompanions(state: any): any[] {
  if (!state.companions) return []
  return state.companions.filter((c: any) => c.isActive)
}

export function getPartyMemberCount(state: any): number {
  return 1 + getActiveCompanions(state).length // Player + companions
}

// ============================================================
// CODEX HELPERS
// ============================================================

export function discoverCodexEntry(state: any, entry: any): boolean {
  if (!state.codex) return false
  const existing = state.codex.entries.find((e: any) => e.id === entry.id)
  if (existing && existing.isDiscovered) return false
  
  const newEntry = {
    ...entry,
    isDiscovered: true,
    discoveredAt: state.currentDate,
  }
  
  if (existing) {
    state.codex.entries = state.codex.entries.map((e: any) => e.id === entry.id ? newEntry : e)
  } else {
    state.codex.entries = [...state.codex.entries, newEntry]
    state.codex.totalCount++
  }
  state.codex.discoveredCount = state.codex.entries.filter((e: any) => e.isDiscovered).length
  return true
}

export function getCodexEntriesByCategory(state: any, categoryId: string): any[] {
  if (!state.codex) return []
  return state.codex.entries.filter((e: any) => e.categoryId === categoryId)
}

export function getDiscoveredCodexEntries(state: any): any[] {
  if (!state.codex) return []
  return state.codex.entries.filter((e: any) => e.isDiscovered)
}

// ============================================================
// JOURNAL HELPERS
// ============================================================

export function addJournalEntry(state: any, entry: any): void {
  if (!state.journal) return
  const newEntry = {
    ...entry,
    id: entry.id || crypto.randomUUID(),
    createdAt: state.currentDate,
    updatedAt: state.currentDate,
  }
  state.journal.entries = [...state.journal.entries, newEntry]
}

export function updateJournalEntry(state: any, entryId: string, updates: any): void {
  if (!state.journal) return
  state.journal.entries = state.journal.entries.map((e: any) => 
    e.id === entryId ? { ...e, ...updates, updatedAt: state.currentDate } : e
  )
}

export function deleteJournalEntry(state: any, entryId: string): void {
  if (!state.journal) return
  state.journal.entries = state.journal.entries.filter((e: any) => e.id !== entryId)
  state.journal.pinnedEntries = state.journal.pinnedEntries.filter((id: string) => id !== entryId)
}

export function toggleJournalPin(state: any, entryId: string): void {
  if (!state.journal) return
  const entry = state.journal.entries.find((e: any) => e.id === entryId)
  if (!entry) return
  
  if (entry.isPinned) {
    entry.isPinned = false
    state.journal.pinnedEntries = state.journal.pinnedEntries.filter((id: string) => id !== entryId)
  } else {
    entry.isPinned = true
    state.journal.pinnedEntries = [...state.journal.pinnedEntries, entryId]
  }
}

// ============================================================
// FACTION HELPERS
// ============================================================

export function changeFactionReputation(state: any, factionId: string, amount: number): number {
  if (!state.factions) return 0
  const current = state.factions.playerReputation[factionId] || 0
  const newRep = Math.max(-100, Math.min(100, current + amount))
  state.factions.playerReputation[factionId] = newRep
  
  // Update faction reputation
  const faction = state.factions.factions.find((f: any) => f.id === factionId)
  if (faction) {
    faction.reputation = newRep
    // Update rank
    for (const rank of faction.ranks) {
      if (newRep >= rank.minReputation) {
        faction.currentRank = rank.name
      }
    }
  }
  
  return newRep
}

export function getFactionRank(faction: any, reputation: number): any {
  let currentRank = faction.ranks[0]
  for (const rank of faction.ranks) {
    if (reputation >= rank.minReputation) {
      currentRank = rank
    }
  }
  return currentRank
}

export function createFaction(overrides: Partial<any> = {}): any {
  return {
    id: crypto.randomUUID(),
    name: 'Faction',
    description: 'A group of like-minded individuals.',
    type: 'guild',
    alignment: 'true_neutral',
    territory: [],
    leader: undefined,
    members: [],
    reputation: 0,
    ranks: [
      { name: 'Outsider', minReputation: -100, benefits: [] },
      { name: 'Stranger', minReputation: -50, benefits: [] },
      { name: 'Neutral', minReputation: 0, benefits: [] },
      { name: 'Acquaintance', minReputation: 25, benefits: ['Basic access'] },
      { name: 'Friend', minReputation: 50, benefits: ['Discounts', 'Quests'] },
      { name: 'Ally', minReputation: 75, benefits: ['Training', 'Special items'] },
      { name: 'Hero', minReputation: 100, benefits: ['Safehouse', 'Leadership'] },
    ],
    currentRank: 'Neutral',
    benefits: [],
    relations: {},
    ...overrides,
  }
}
