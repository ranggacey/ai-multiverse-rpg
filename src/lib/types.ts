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

// ============================================================
// COMPANION / PARTY SYSTEM
// ============================================================
export interface Companion {
  id: string
  name: string
  title?: string
  race: string
  class: string
  level: number
  xp: number
  xpToNext: number
  
  // Base stats
  stats: {
    str: number
    agi: number
    int: number
    cha: number
  }
  
  // Derived stats
  maxHp: number
  hp: number
  maxMana: number
  mana: number
  attack: number
  defense: number
  speed: number
  
  // Skills
  skills: Skill[]
  
  // Equipment
  equipment: {
    weapon?: Item
    armor?: Item
    accessory?: Item
  }
  
  // Personality & Relationship
  personality: CompanionPersonality
  loyalty: number // 0-100
  trust: number // 0-100
  romanceLevel: number // 0-100, unlocks at high trust
  backstory: string
  personalQuest?: Quest
  personalQuestCompleted: boolean
  
  // Combat AI
  combatBehavior: 'aggressive' | 'defensive' | 'support' | 'balanced' | 'tactical'
  preferredTarget: 'weakest' | 'strongest' | 'caster' | 'healer' | 'tank' | 'random'
  
  // Status
  isActive: boolean // In active party
  joinedAt: WorldDate
  location: string // Where they are if not in party
  statusEffects: StatusEffect[]
  
  // Dialogue
  dialogueLines: CompanionDialogue[]
}

export interface CompanionPersonality {
  traits: string[] // e.g., ['brave', 'cynical', 'loyal', 'greedy']
  likes: string[]
  dislikes: string[]
  fears: string[]
  values: string[]
  speechStyle: 'formal' | 'casual' | 'gruff' | 'cheerful' | 'mysterious' | 'sarcastic'
  quirks: string[]
}

export interface CompanionDialogue {
  trigger: 'greeting' | 'idle' | 'combat_start' | 'combat_victory' | 'combat_defeat' | 'level_up' | 'low_hp' | 'critical_hp' | 'camp' | 'morning' | 'night' | 'weather' | 'location' | 'quest_progress' | 'quest_complete' | 'loyalty_high' | 'loyalty_low' | 'trust_high' | 'romance' | 'personal_quest' | 'death_nearby'
  conditions?: string[] // e.g., ['loyalty > 80', 'romance > 50']
  lines: string[]
  weight: number // For random selection
}

export interface StatusEffect {
  id: string
  name: string
  type: 'buff' | 'debuff' | 'dot' | 'hot' | 'stun' | 'silence' | 'root' | 'fear' | 'charm' | 'poison' | 'burn' | 'freeze' | 'bleed'
  duration: number // turns remaining
  magnitude: number
  source: string
  description: string
}

export interface PartyState {
  maxSize: number // Default 4 (player + 3 companions)
  formation: 'standard' | 'defensive' | 'aggressive' | 'support' | 'custom'
  activeMembers: string[] // Companion IDs in party (max 3)
  reserveMembers: string[] // Companion IDs not in party
  sharedXp: boolean
  sharedLoot: boolean
  tactics: PartyTactics
}

export interface PartyTactics {
  focusFire: boolean
  protectWeak: boolean
  useConsumables: boolean
  autoHealThreshold: number // HP % to auto-heal
  autoManaThreshold: number // Mana % to auto-restore
  priorityTargets: string[] // Enemy types to prioritize
}

export interface CodexState {
  entries: CodexEntry[]
  categories: CodexCategory[]
  discoveredCount: number
  totalCount: number
}

export interface CodexEntry {
  id: string
  categoryId: string
  title: string
  content: string
  shortDescription: string
  isDiscovered: boolean
  discoveredAt?: WorldDate
  relatedEntries: string[] // Other entry IDs
  tags: string[]
  icon?: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  source: 'exploration' | 'dialogue' | 'book' | 'quest' | 'combat' | 'observation'
}

export interface CodexCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  parentId?: string
  order: number
}

export interface JournalState {
  entries: JournalEntry[]
  categories: string[]
  pinnedEntries: string[]
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: WorldDate
  updatedAt: WorldDate
  isPinned: boolean
  linkedEntities: { type: 'npc' | 'quest' | 'location' | 'item' | 'companion'; id: string; name: string }[]
}

export interface FactionState {
  factions: Faction[]
  playerReputation: Record<string, number> // factionId -> reputation
}

export interface Faction {
  id: string
  name: string
  description: string
  type: 'guild' | 'nation' | 'cult' | 'order' | 'family' | 'mercenary' | 'merchant' | 'other'
  alignment: 'lawful_good' | 'neutral_good' | 'chaotic_good' | 'lawful_neutral' | 'true_neutral' | 'chaotic_neutral' | 'lawful_evil' | 'neutral_evil' | 'chaotic_evil'
  territory: string[]
  leader?: string
  members: string[] // NPC/Companion IDs
  reputation: number // -100 to 100
  ranks: FactionRank[]
  currentRank: string
  benefits: FactionBenefit[]
  relations: Record<string, number> // factionId -> relation (-100 to 100)
}

export interface FactionRank {
  name: string
  minReputation: number
  benefits: string[]
  title?: string
}

export interface FactionBenefit {
  type: 'discount' | 'access' | 'quest' | 'item' | 'training' | 'safehouse'
  description: string
  requiredRank: string
  value?: number
}

export interface Quest {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'failed'
  type: 'main' | 'side' | 'personal'
  progress: number
  maxProgress: number
  giver?: string
  location?: string
  reward?: string
  timeLimit?: WorldDate
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

  // ===== NEW SYSTEMS =====
  // Companion / Party system
  companions?: Companion[]
  party?: PartyState

  // Codex / Lorebook
  codex?: CodexState

  // Journal / Notes
  journal?: JournalState

  // Faction / Reputation
  factions?: FactionState
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
