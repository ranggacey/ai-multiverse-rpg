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

export interface GameState {
  id: string
  version: string
  createdAt: number
  updatedAt: number
  playTime: number
  currentChapter: number
  isAlive: boolean

  // Dunia — minimal awal, nambah bertahap
  world: {
    name: string
    description: string
    history?: string
    genres?: string[]
    year: number
    era?: string
    season?: string
  }

  // Player — minimal
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
    wealth?: number
    skills?: Skill[]
    inventory?: Item[]
  }

  currentDate: WorldDate

  storyLog: StoryLog[]
  deathRecord?: DeathRecord

  // Context buat AI — ringkasan
  worldMemory?: string
  narrationBuffer?: string
}
