// Simplified types for AI Multiverse RPG — progressive world building

export interface WorldDate {
  year: number
  month: number
  day: number
  era?: string
  season?: string
}

export interface Background {
  type: string
  family: string
  location: string
  description?: string
  traits?: string[]
  secret?: string
}

export interface Skill {
  id: string
  name: string
  level: number
  maxLevel?: number
  type?: string
  description?: string
}

export interface Item {
  id: string
  name: string
  type: string
  rarity: string
  description: string
  value: number
  equipped: boolean
  // Combat-related properties
  attack?: number
  defense?: number
  healAmount?: number
  manaCost?: number
  spellType?: 'fire' | 'ice' | 'lightning' | 'heal' | 'buff' | 'debuff'
}

export interface NPC {
  id: string
  name: string
  relationship: string
  description: string
  location: string
  // Combat stats for NPCs
  level?: number
  hp?: number
  maxHp?: number
  attack?: number
  defense?: number
  isHostile?: boolean
  xpReward?: number
  loot?: string[]
}

export interface Quest {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'failed'
  type: 'main' | 'side' | 'personal'
  progress: number
  maxProgress: number
}

export interface StoryLog {
  id: string
  date: WorldDate
  playerAge: number
  content: string
  type: 'main' | 'system' | 'parallel' | 'npc' | 'battle' | 'dialogue' | 'event' | 'timeSkip' | 'world'
  location: string
}

export interface DeathRecord {
  date: WorldDate
  age: number
  cause: string
  story: string
  achievements: string[]
  legacy: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: number
  condition: string // description of how to unlock
}

export type Weather = 'cerah' | 'berawan' | 'hujan' | 'badai' | 'salju' | 'berkabut' | 'mendung' | 'angin_kencang'
export type TimeOfDay = 'pagi' | 'siang' | 'sore' | 'malam' | 'dini_hari'

export const WEATHER_ICONS: Record<Weather, string> = {
  cerah: '☀️',
  berawan: '☁️',
  hujan: '🌧️',
  badai: '⛈️',
  salju: '❄️',
  berkabut: '🌫️',
  mendung: '☁️',
  angin_kencang: '💨',
}

export const TIME_ICONS: Record<TimeOfDay, string> = {
  pagi: '🌅',
  siang: '☀️',
  sore: '🌆',
  malam: '🌙',
  dini_hari: '🌃',
}

// Combat types
export interface CombatState {
  inCombat: boolean
  enemy?: CombatEnemy
  turn: 'player' | 'enemy'
  turnCount: number
  combatLog: CombatLogEntry[]
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyMaxHp: number
  playerMana: number
  playerMaxMana: number
  actionQueue: CombatAction[]
}

export interface CombatEnemy {
  id: string
  name: string
  description: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  xpReward: number
  loot: string[]
  skills: EnemySkill[]
  isBoss?: boolean
}

export interface EnemySkill {
  name: string
  type: 'attack' | 'spell' | 'heal' | 'buff'
  damage?: number
  healAmount?: number
  description: string
  cooldown: number
  currentCooldown: number
}

export interface CombatLogEntry {
  id: string
  type: 'player_attack' | 'enemy_attack' | 'player_skill' | 'enemy_skill' | 'player_heal' | 'enemy_heal' | 'player_dodge' | 'enemy_dodge' | 'player_crit' | 'enemy_crit' | 'status' | 'victory' | 'defeat' | 'flee'
  message: string
  damage?: number
  heal?: number
  timestamp: number
}

export interface CombatAction {
  type: 'attack' | 'skill' | 'item' | 'flee'
  skillId?: string
  itemId?: string
  target?: 'enemy' | 'self'
}

export interface GameState {
  id: string
  version: string
  createdAt: number
  updatedAt: number
  playTime: number
  currentChapter: number
  isAlive: boolean

  // Dunia
  world: {
    name: string
    description: string
    history?: string
    genres?: string[]
    year: number
    era?: string
    season?: string
    weather?: Weather
    timeOfDay?: TimeOfDay
  }

  // Player
  player: {
    id: string
    name: string
    age: number
    gender: string
    background: Background
    location: string
    title?: string | null
    stats?: Record<string, number>
    health?: number
    maxHealth?: number
    mana?: number
    maxMana?: number
    wealth?: number
    skills?: Skill[]
    inventory?: Item[]
    xp?: number
    level?: number
    xpToNext?: number
  }

  currentDate: WorldDate

  storyLog: StoryLog[]
  deathRecord?: DeathRecord

  // NPC relationships
  npcs?: NPC[]

  // Active quests
  quests?: Quest[]

  // Combat state
  combat?: CombatState

  // Context buat AI — ringkasan
  worldMemory?: string
  narrationBuffer?: string

  // Achievements
  achievements?: Achievement[]

  // Save slot metadata
  saveSlot?: SaveSlotMeta
}

export interface SaveSlotMeta {
  slotIndex: number // 0-9 for quick save slots
  name: string // User-defined name
  thumbnail?: string // Base64 encoded thumbnail (optional)
  isAutoSave: boolean
  isQuickSave: boolean
  lastAction?: string // Last player action for context
}

export interface SaveSlot extends SaveSlotMeta {
  id: string // Game save ID
  createdAt: number
  updatedAt: number
  playerName: string
  playerAge: number
  worldName: string
  chapter: number
  playTime: number
  isAlive: boolean
  location?: string
  level?: number
  season?: string
  weather?: string
}
