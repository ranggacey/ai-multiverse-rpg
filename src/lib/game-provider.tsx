'use client'

import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import type { GameState, StoryLog } from '@/lib/types'
import { createInitialState, buildWorldMemory } from '@/lib/game'
import { callAI, SYSTEM_PROMPTS, buildGamePrompt } from '@/lib/ai'
import { saveGame, loadGame, listSaves, deleteSave, type SaveMeta } from '@/lib/storage'

interface GameContextType {
  gameState: GameState | null
  isLoading: boolean
  error: string | null
  saves: SaveMeta[]
  newGame: () => Promise<void>
  continueGame: (id: string) => Promise<void>
  saveCurrentGame: () => Promise<void>
  deleteSaveGame: (id: string) => Promise<void>
  refreshSaves: () => Promise<void>
  submitAction: (action: string) => Promise<void>
  exportSave: () => Promise<void>
  importSave: (json: string) => Promise<void>
}

const GameContext = createContext<GameContextType>(null!)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saves, setSaves] = useState<SaveMeta[]>([])
  const gameRef = useRef(gameState)

  // Sync ref with state outside render
  useEffect(() => {
    gameRef.current = gameState
  }, [gameState])

  const refreshSaves = useCallback(async () => {
    const s = await listSaves()
    setSaves(s)
  }, [])

  const newGame = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const worldRes = await callAI([{ role: 'system', content: SYSTEM_PROMPTS.createWorld }], { temperature: 0.9, maxTokens: 4096 })
      const worldData = JSON.parse(worldRes.content.replace(/```json\n?|\n?```/g, '').trim())
      
      const playerRes = await callAI([
        { role: 'system', content: SYSTEM_PROMPTS.createPlayer },
        { role: 'system', content: `Dunia: ${JSON.stringify(worldData)}` },
      ], { temperature: 0.8, maxTokens: 2048 })
      const playerData = JSON.parse(playerRes.content.replace(/```json\n?|\n?```/g, '').trim())

      const state = createInitialState()
      state.world = worldData
      state.player = {
        id: crypto.randomUUID(),
        name: playerData.name,
        age: 5,
        gender: playerData.gender,
        birthDate: { ...worldData.currentDate, year: worldData.currentDate.year - 5 },
        background: playerData.background,
        location: playerData.background.startingLocation,
        kingdom: worldData.kingdoms?.[0]?.id || '',
        title: 'Anak-anak',
        reputation: 0,
        stats: playerData.stats,
        skills: [],
        inventory: [],
        relationships: [],
        quests: [],
        health: playerData.health,
        wealth: playerData.wealth || 0,
        magic: playerData.magic || { power: 0, control: 0, affinity: [], currentMana: 0, maxMana: 0 },
      }

      const intro: StoryLog = {
        id: crypto.randomUUID(),
        date: { ...worldData.currentDate },
        playerAge: 5,
        content: `Kamu terlahir di dunia ${worldData.name}. ${worldData.description}. ${playerData.background.description}. Kamu tinggal bersama ${playerData.background.family}.`,
        type: 'system',
        location: playerData.background.startingLocation,
      }
      state.storyLog = [intro]
      state.npcs = []
      state.id = crypto.randomUUID()
      
      setGameState(state)
      await saveGame(state.id, state)
    } catch (e: unknown) {
      setError(`Gagal membuat dunia: ${e instanceof Error ? e.message : String(e)}`)
    }
    setIsLoading(false)
  }, [])

  const submitAction = useCallback(async (action: string) => {
    const state = gameRef.current
    if (!state || !state.isAlive) return
    setIsLoading(true)
    setError(null)
    try {
      const memory = buildWorldMemory(state)
      const recentLogs = state.storyLog.slice(-10).map(l => `[${l.type}] ${l.content}`)
      const messages = buildGamePrompt(state.world, state.player, memory, action, recentLogs)
      const res = await callAI(messages, { temperature: 0.85, maxTokens: 4096 })
      
      const parsed = JSON.parse(res.content.replace(/```json\n?|\n?```/g, '').trim())
      const newState = { ...state }
      
      // Update player
      if (parsed.playerUpdate) {
        const upd = parsed.playerUpdate
        newState.player = { ...newState.player }
        if (upd.age) newState.player.age = upd.age
        if (upd.statChanges) {
          newState.player.stats = { ...newState.player.stats }
          Object.entries(upd.statChanges).forEach(([k, v]) => {
            if (typeof v === 'number') {
              const s = newState.player.stats as unknown as Record<string, number>
              s[k] = Math.max(0, Math.min(100, s[k] + v))
            }
          })
        }
        if (upd.skillGains) {
          newState.player.skills = [...(newState.player.skills || [])]
          upd.skillGains.forEach((sg: { name: string; level?: number; type?: string; description?: string }) => {
            const existing = newState.player.skills.find(s => s.name === sg.name)
            if (existing) existing.level += sg.level || 1
            else newState.player.skills.push({ name: sg.name, level: sg.level || 1, maxLevel: 100, type: (sg.type || 'combat') as 'combat' | 'magic' | 'craft' | 'social' | 'knowledge', description: sg.description || '' })
          })
        }
        if (upd.items) {
          newState.player.inventory = [...(newState.player.inventory || [])]
          upd.items.forEach((it: { name: string; type?: string; rarity?: string; description?: string; value?: number }) => {
            newState.player.inventory.push({
              id: crypto.randomUUID(),
              name: it.name,
              type: (it.type || 'material') as 'weapon' | 'armor' | 'potion' | 'scroll' | 'artifact' | 'material' | 'food' | 'treasure' | 'quest',
              rarity: (it.rarity || 'common') as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
              description: it.description || '',
              value: it.value || 0,
              equipped: false,
            })
          })
        }
        if (upd.healthChange) newState.player.health.current = Math.max(0, Math.min(newState.player.health.max, newState.player.health.current + upd.healthChange))
        if (upd.wealthChange) newState.player.wealth += upd.wealthChange
      }

      const logEntry: StoryLog = {
        id: crypto.randomUUID(),
        date: { ...newState.world.currentDate },
        playerAge: newState.player.age,
        content: parsed.narration || action,
        type: 'main',
        location: newState.player.location,
      }
      newState.storyLog = [...newState.storyLog, logEntry]

      if (parsed.timeSkip) {
        const ts = parsed.timeSkip
        newState.world.currentDate.year += ts.years || 0
        newState.world.currentDate.month += ts.months || 0
        newState.world.currentDate.day += ts.days || 0
        newState.player.age += ts.years || 0
        newState.storyLog.push({
          id: crypto.randomUUID(),
          date: { ...newState.world.currentDate },
          playerAge: newState.player.age,
          content: `${ts.years || 0} tahun, ${ts.months || 0} bulan, ${ts.days || 0} hari telah berlalu...`,
          type: 'timeSkip',
          location: newState.player.location,
        })
      }

      if (parsed.parallelStory) {
        newState.parallelStories = [...newState.parallelStories, {
          id: crypto.randomUUID(),
          title: parsed.parallelStory.title,
          content: parsed.parallelStory.content,
          censored: parsed.parallelStory.censored || false,
          censorHints: parsed.parallelStory.censorHints || [],
          location: parsed.parallelStory.location || 'Unknown',
          date: { ...newState.world.currentDate },
        }]
      }

      if (parsed.worldEvents) {
        newState.worldEvents = [...newState.worldEvents, ...parsed.worldEvents.map((we: { title: string; description: string; affected?: string }) => ({
          id: crypto.randomUUID(),
          date: { ...newState.world.currentDate },
          title: we.title,
          description: we.description,
          affectedKingdoms: we.affected ? [we.affected] : [],
          affectedNPCs: [] as string[],
          severity: 'major' as const,
          type: 'political' as const,
          resolved: false,
        }))]
      }

      if (parsed.gameOver) {
        newState.isAlive = false
        newState.deathRecord = {
          date: { ...newState.world.currentDate },
          age: newState.player.age,
          cause: parsed.gameOver.cause,
          story: parsed.gameOver.story,
          achievements: parsed.gameOver.achievements || [],
          legacy: '',
        }
      }

      newState.updatedAt = Date.now()
      newState.playTime += 1000
      newState.currentChapter++
      
      setGameState(newState)
      await saveGame(newState.id, newState)
    } catch (e: unknown) {
      setError(`AI merespon: ${e instanceof Error ? e.message : String(e)}`)
    }
    setIsLoading(false)
  }, [])

  const saveCurrentGame = useCallback(async () => {
    if (!gameRef.current) return
    await saveGame(gameRef.current.id, gameRef.current)
  }, [])

  const continueGame = useCallback(async (id: string) => {
    const data = await loadGame(id)
    if (data) setGameState(data)
  }, [])

  const deleteSaveGame = useCallback(async (id: string) => {
    await deleteSave(id)
    await refreshSaves()
  }, [refreshSaves])

  const exportSave = useCallback(async () => {
    if (!gameRef.current) return
    const json = JSON.stringify(gameRef.current, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-multiverse-${gameRef.current.player?.name || 'save'}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const importSaveFn = useCallback(async (json: string) => {
    const data = JSON.parse(json)
    if (!data.id || !data.player) throw new Error('Invalid save file')
    await saveGame(data.id, data)
    setGameState(data)
  }, [])

  return (
    <GameContext.Provider value={{
      gameState, isLoading, error, saves,
      newGame, continueGame, saveCurrentGame, deleteSaveGame,
      refreshSaves, submitAction, exportSave, importSave: importSaveFn,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}
