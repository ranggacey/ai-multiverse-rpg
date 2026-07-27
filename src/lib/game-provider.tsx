'use client'

import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import type { GameState, StoryLog } from '@/lib/types'
import { createInitialState } from '@/lib/game'
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

function cleanJSON(text: string): string {
  let t = text.replace(/```json\n?/gi, '').replace(/\n?```/g, '').trim()
  const first = t.indexOf('{')
  const last = t.lastIndexOf('}')
  if (first === -1 || last === -1) throw new Error('AI tidak menghasilkan JSON valid')
  return t.slice(first, last + 1)
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saves, setSaves] = useState<SaveMeta[]>([])
  const gameRef = useRef(gameState)

  useEffect(() => { gameRef.current = gameState }, [gameState])

  const refreshSaves = useCallback(async () => {
    setSaves(await listSaves())
  }, [])

  // ── NEW GAME — MINIMALIS ──
  const newGame = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Step 1: Bikin dunia minimal
      const worldRes = await callAI(
        [{ role: 'system', content: SYSTEM_PROMPTS.createWorld }],
        { temperature: 0.9, maxTokens: 1024 }
      )
      const worldData = JSON.parse(cleanJSON(worldRes.content))

      // Step 2: Bikin player minimal
      const playerRes = await callAI([
        { role: 'system', content: SYSTEM_PROMPTS.createPlayer },
        { role: 'system', content: `Dunia ini: ${worldData.name} — ${worldData.description}` },
      ], { temperature: 0.8, maxTokens: 1024 })
      const playerData = JSON.parse(cleanJSON(playerRes.content))

      // Step 3: Generate narasi kelahiran
      const birthRes = await callAI([
        { role: 'system', content: `Kamu narator RPG. Buat 1 paragraf kelahiran ${playerData.name} di dunia ${worldData.name}. ${worldData.description}. Latar: ${playerData.background.type} dari ${playerData.background.location}. Suasana puitis.` },
        { role: 'user', content: 'Tulis opening yang epik dan emosional.' },
      ], { temperature: 0.9, maxTokens: 1024 })
      const birthNarration = birthRes.content

      const state = createInitialState()
      state.id = crypto.randomUUID()
      state.world = worldData
      state.player = {
        id: crypto.randomUUID(),
        name: playerData.name,
        age: 5,
        gender: playerData.gender || 'Laki-laki',
        background: playerData.background || { type: 'anak petani', family: 'keluarga sederhana', location: 'desa terpencil' },
        location: playerData.background?.location || 'Unknown',
        stats: { str: 5, agi: 5, int: 5, cha: 5 },
        health: 100,
        wealth: 0,
        skills: [],
        inventory: [],
        title: null,
      }
      state.currentDate = { year: worldData.year || 1024, month: 1, day: 1, era: worldData.era || 'Era Baru', season: worldData.season || 'spring' }

      state.storyLog = [{
        id: crypto.randomUUID(),
        date: { ...state.currentDate },
        playerAge: 5,
        content: birthNarration || `Kamu terlahir sebagai ${playerData.background.type} di ${playerData.background.location} di dunia ${worldData.name}.`,
        type: 'system',
        location: playerData.background?.location || 'Unknown',
      }]
      state.worldMemory = `[${worldData.name}] ${worldData.history || worldData.description}`
      state.narrationBuffer = birthNarration || ''

      setGameState(state)
      await saveGame(state.id, state)
    } catch (e: unknown) {
      setError(`Gagal membuat dunia: ${e instanceof Error ? e.message : String(e)}`)
    }
    setIsLoading(false)
  }, [])

  // ── SUBMIT ACTION ──
  const submitAction = useCallback(async (action: string) => {
    const state = gameRef.current
    if (!state || !state.isAlive) return
    setIsLoading(true)
    setError(null)
    try {
      const messages = buildGamePrompt(
        state.world,
        { name: state.player.name, gender: state.player.gender, age: state.player.age, background: state.player.background, location: state.player.location },
        state.worldMemory || '',
        action,
        state.narrationBuffer || ''
      )
      const res = await callAI(messages, { temperature: 0.85, maxTokens: 2048 })
      const parsed = JSON.parse(cleanJSON(res.content))

      const newState = { ...state, player: { ...state.player } }
      const upd = parsed.update || {}

      // Update player dari response
      if (upd.age) newState.player.age = upd.age
      if (upd.lokasi) newState.player.location = upd.lokasi
      if (upd.stats) {
        newState.player.stats = { ...newState.player.stats, ...upd.stats }
      }
      if (upd.gold) newState.player.wealth = (newState.player.wealth || 0) + upd.gold
      if (upd.hp) newState.player.health = Math.max(0, Math.min(100, upd.hp))
      if (upd.skill && upd.skill.nama) {
        if (!newState.player.skills) newState.player.skills = []
        const exist = (newState.player.skills || []).findIndex((s: any) => s.name === upd.skill.nama)
        if (exist >= 0) newState.player.skills[exist] = { ...newState.player.skills[exist], level: (newState.player.skills[exist].level || 1) + (upd.skill.level || 1) }
        else newState.player.skills = [...(newState.player.skills || []), { name: upd.skill.nama, level: upd.skill.level || 1 }]
      }
      if (upd.item && upd.item.nama) {
        newState.player.inventory = [...(newState.player.inventory || []), { id: crypto.randomUUID(), name: upd.item.nama, type: upd.item.tipe || 'material', rarity: upd.item.raritas || 'common', description: '', value: 0, equipped: false }]
      }
      if (upd.lokasiBaru && upd.lokasiBaru.nama) {
        newState.player.location = upd.lokasiBaru.nama
      }

      // NPC
      const npcEntry = upd.npc?.nama ? `[NPC] ${upd.npc.nama}: ${upd.npc.relasi} — ${upd.npc.deskripsi}` : null

      // Log narasi
      const logEntry: StoryLog = {
        id: crypto.randomUUID(),
        date: { ...(state.currentDate || { year: 1024, month: 1, day: 1 }) },
        playerAge: newState.player.age,
        content: parsed.narration || action,
        type: 'main',
        location: newState.player.location,
      }
      newState.storyLog = [...newState.storyLog, logEntry]
      if (npcEntry) {
        newState.storyLog.push({
          id: crypto.randomUUID(),
          date: { ...logEntry.date },
          playerAge: newState.player.age,
          content: npcEntry,
          type: 'npc',
          location: newState.player.location,
        })
      }

      // Timeskip
      if (parsed.timeskip) {
        const ts = parsed.timeskip
        newState.player.age += ts.tahun || 0
        newState.storyLog.push({
          id: crypto.randomUUID(),
          date: { ...logEntry.date },
          playerAge: newState.player.age,
          content: `${ts.tahun || 0} tahun berlalu...`,
          type: 'timeSkip',
          location: newState.player.location,
        })
      }

      // Parallel story
      if (parsed.parallel) {
        newState.storyLog.push({
          id: crypto.randomUUID(),
          date: { ...logEntry.date },
          playerAge: newState.player.age,
          content: `[DI TEMPAT LAIN] ${parsed.parallel}`,
          type: 'parallel',
          location: '???',
        })
      }

      // World event
      if (parsed.worldEvent) {
        newState.storyLog.push({
          id: crypto.randomUUID(),
          date: { ...logEntry.date },
          playerAge: newState.player.age,
          content: `[PERISTIWA DUNIA] ${parsed.worldEvent}`,
          type: 'world',
          location: '???',
        })
        newState.worldMemory = (newState.worldMemory || '') + ` | ${parsed.worldEvent}`
      }

      // Narration buffer buat context next turn
      newState.narrationBuffer = parsed.narration || action

      // Game over
      if (parsed.gameOver) {
        newState.isAlive = false
        newState.deathRecord = {
          date: { ...logEntry.date },
          age: newState.player.age,
          cause: parsed.gameOver.cause || 'Unknown',
          story: parsed.gameOver.story || '',
          achievements: [],
          legacy: parsed.gameOver.legacy || '',
        }
      }

      newState.updatedAt = Date.now()
      newState.playTime += 1000

      setGameState(newState)
      await saveGame(newState.id, newState)
    } catch (e: unknown) {
      setError(`AI error: ${e instanceof Error ? e.message : String(e)}`)
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
