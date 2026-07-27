import type { GameState } from './types'

export function createInitialState(): GameState {
  return {
    id: '',
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    playTime: 0,
    currentChapter: 1,
    isAlive: true,
    world: { name: '', description: '', year: 1024 },
    player: { id: '', name: '', age: 5, gender: 'Laki-laki', background: { type: '', family: '', location: '' }, location: '', title: null },
    currentDate: { year: 1024, month: 1, day: 1 },
    storyLog: [],
    worldMemory: '',
    narrationBuffer: '',
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
