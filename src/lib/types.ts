// Core game types for AI Multiverse RPG

export interface WorldSettings {
  name: string
  description: string
  genres: string[]
  history: string
  continents: Continent[]
  kingdoms: Kingdom[]
  powerSystems: PowerSystem[]
  races: Race[]
  religions: Religion[]
  organizations: Organization[]
  legendary: Legendary[]
  prophecy: string
  currentDate: WorldDate
}

export interface Continent {
  id: string
  name: string
  description: string
  nations: string[]
}

export interface Kingdom {
  id: string
  name: string
  type: 'kingdom' | 'empire' | 'republic' | 'theocracy' | 'sect'
  continent: string
  ruler: string
  description: string
  influence: number // 0-100
  military: number
  economy: number
  relations: Record<string, number> // kingdomId -> -100 to 100
}

export interface PowerSystem {
  name: string
  description: string
  source: string
  ranks: string[]
}

export interface Race {
  name: string
  description: string
  traits: string[]
  regions: string[]
}

export interface Religion {
  name: string
  deity: string
  description: string
  followers: number
  influence: number
}

export interface Organization {
  id: string
  name: string
  type: 'guild' | 'sect' | 'order' | 'clan' | 'cult' | 'secret'
  description: string
  leader: string
  influence: number
  isSecret: boolean
}

export interface Legendary {
  name: string
  type: 'artifact' | 'hero' | 'monster' | 'location' | 'event'
  description: string
  power: string
  status: 'lost' | 'hidden' | 'active' | 'destroyed'
}

export interface WorldDate {
  year: number
  month: number
  day: number
  era: string
  season: 'spring' | 'summer' | 'autumn' | 'winter'
}

export interface Player {
  id: string
  name: string
  age: number
  gender: string
  birthDate: WorldDate
  background: Background
  location: string
  kingdom: string
  title: string
  reputation: number
  stats: Stats
  skills: Skill[]
  inventory: Item[]
  relationships: Relationship[]
  quests: Quest[]
  health: Health
  wealth: number
  magic: MagicStats
}

export interface Background {
  type: string
  family: string
  description: string
  startingLocation: string
  traits: string[]
  secret: string
}

export interface Stats {
  strength: number
  agility: number
  vitality: number
  intelligence: number
  wisdom: number
  charisma: number
  luck: number
}

export interface Skill {
  name: string
  level: number
  maxLevel: number
  type: 'combat' | 'magic' | 'craft' | 'social' | 'knowledge'
  description: string
}

export interface Item {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'artifact' | 'material' | 'food' | 'treasure' | 'quest'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  description: string
  value: number
  equipped: boolean
  stats?: Partial<Stats>
}

export interface Relationship {
  npcId: string
  npcName: string
  affinity: number // -100 to 100
  type: 'family' | 'friend' | 'rival' | 'enemy' | 'lover' | 'mentor' | 'ally'
  status: string
}

export interface Quest {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'failed'
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  reward: string
  progress: number
}

export interface Health {
  current: number
  max: number
  condition: 'healthy' | 'injured' | 'poisoned' | 'cursed' | 'dying'
  stamina: number
  maxStamina: number
}

export interface MagicStats {
  power: number
  control: number
  affinity: string[]
  currentMana: number
  maxMana: number
}

export interface NPC {
  id: string
  name: string
  age: number
  gender: string
  race: string
  occupation: string
  location: string
  kingdom: string
  description: string
  personality: string[]
  goals: string[]
  secrets: string[]
  power: number
  reputation: number
  relationships: Record<string, number> // npcId -> affinity
  isAlive: boolean
  lastKnownDate: WorldDate
  history: NPCEvent[]
  family: string[]
  trauma: string[]
}

export interface NPCEvent {
  date: WorldDate
  event: string
  impact: string
}

export interface StoryLog {
  id: string
  date: WorldDate
  playerAge: number
  content: string
  type: 'main' | 'parallel' | 'battle' | 'dialogue' | 'event' | 'timeSkip' | 'system'
  location: string
}

export interface ParallelStory {
  id: string
  title: string
  content: string
  censored: boolean
  censorHints: string[]
  location: string
  date: WorldDate
  connectedTo?: string // quest id or event id that will connect later
}

export interface GameState {
  id: string
  version: string
  createdAt: number
  updatedAt: number
  playTime: number
  player: Player
  world: WorldSettings
  npcs: NPC[]
  storyLog: StoryLog[]
  parallelStories: ParallelStory[]
  currentChapter: number
  worldEvents: WorldEvent[]
  isAlive: boolean
  deathRecord?: DeathRecord
}

export interface WorldEvent {
  id: string
  date: WorldDate
  title: string
  description: string
  affectedKingdoms: string[]
  affectedNPCs: string[]
  severity: 'minor' | 'major' | 'catastrophic'
  type: 'war' | 'disaster' | 'political' | 'economic' | 'magical' | 'social'
  resolved: boolean
}

export interface DeathRecord {
  date: WorldDate
  age: number
  cause: string
  story: string
  achievements: string[]
  legacy: string
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface WorldMemory {
  worldState: string
  playerSummary: string
  recentEvents: string
  activeQuests: string
  relationships: string
  timeline: string
}
