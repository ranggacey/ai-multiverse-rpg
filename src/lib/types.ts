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

export interface NPC {
  id: string
  name: string
  relationship: string
  description: string
  location: string
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
    weather?: Weather
    timeOfDay?: TimeOfDay
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

  // NPC relationships
  npcs?: NPC[]

  // Active quests
  quests?: Quest[]

  // Context buat AI — ringkasan
  worldMemory?: string
  narrationBuffer?: string
}
