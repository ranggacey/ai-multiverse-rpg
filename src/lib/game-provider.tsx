'use client'

import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import type { GameState, StoryLog } from '@/lib/types'
import { createInitialState } from '@/lib/game'
import { callAI, buildGamePrompt } from '@/lib/ai'
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

function extract(label: string, text: string): string {
  const re = new RegExp(`${label}:\\s*([^\\n]+)`)
  const m = text.match(re)
  return m ? m[1].trim() : ''
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

  // ── NEW GAME ──
  const newGame = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Step 1: Bikin dunia
      const worldRaw = await callAI([
        { role: 'system', content: `Kamu adalah Dungeon Master RPG. Ciptakan dunia fantasi unik.

RESPON DENGAN FORMAT INI PERSIS (satu baris):
WORLD: [nama dunia maks 2 kata] | DESC: [deskripsi 1-2 kalimat] | ERA: [nama era] | YEAR: [angka tahun] | GENRE: [genre] | SEASON: [spring/summer/autumn/winter]

Contoh: WORLD: Aeloria | DESC: Dunia yang diselimuti kabut ajaib, tempat para dewa berbisik lewat angin. | ERA: Era Kabut | YEAR: 1024 | GENRE: fantasy | SEASON: spring

HANYA ITU. SATU BARIS. TIDAK ADA TEKS LAIN.` }
      ], { temperature: 0.9, maxTokens: 2048 })

      const wt = worldRaw.content
      const worldName = extract('WORLD', wt)
      const worldDesc = extract('DESC', wt) || 'Dunia misterius yang penuh petualangan.'
      const worldEra = extract('ERA', wt) || 'Era Awal'
      const worldYear = parseInt(extract('YEAR', wt)) || 1024
      const worldGenre = extract('GENRE', wt) || 'fantasy'
      const worldSeason = extract('SEASON', wt) || 'spring'

      if (!worldName) throw new Error(`Gagal parse nama dunia. Respon AI: ${wt.slice(0, 300)}`)

      // Step 2: Bikin player — pake format label
      const playerRaw = await callAI([
        { role: 'system', content: `Buat karakter untuk dunia ${worldName}: ${worldDesc}

RESPON DENGAN FORMAT INI PERSIS (satu baris):
NAME: [nama 2 suku kata] | GENDER: [Laki-laki/Perempuan] | BGTYPE: [anak petani/bangsawan/yatim/pemburu/dll] | FAMILY: [deskripsi keluarga] | FROM: [nama desa/kota lahir]

Contoh: NAME: Kael | GENDER: Laki-laki | BGTYPE: anak petani | FAMILY: Anak bungsu petani miskin | FROM: Desa Oakvale

HANYA ITU. SATU BARIS.` }
      ], { temperature: 0.8, maxTokens: 500 })

      const pt = playerRaw.content
      const playerName = extract('NAME', pt)
      const playerGender = extract('GENDER', pt) || 'Laki-laki'
      const playerBgType = extract('BGTYPE', pt) || 'anak petani'
      const playerFamily = extract('FAMILY', pt) || 'keluarga sederhana'
      const playerFrom = extract('FROM', pt) || 'desa terpencil'

      if (!playerName) throw new Error(`Gagal parse nama player. Respon AI: ${pt.slice(0, 300)}`)

      // Step 3: Narasi opening
      const birthRaw = await callAI([
        { role: 'system', content: `Kamu narator RPG fantasi. Tulis 1 paragraf kelahiran ${playerName} di dunia ${worldName}. ${playerName} lahir sebagai ${playerBgType} dari ${playerFrom}. ${worldDesc}. 
Suasana puitis, epik, emosional. Bahasa Indonesia yang indah.` }
      ], { temperature: 0.9, maxTokens: 800 })

      const state = createInitialState()
      state.id = crypto.randomUUID()
      state.world = {
        name: worldName,
        description: worldDesc,
        history: '',
        genres: [worldGenre],
        year: worldYear,
        era: worldEra,
        season: worldSeason,
      }
      state.player = {
        id: crypto.randomUUID(),
        name: playerName,
        age: 5,
        gender: playerGender,
        background: { type: playerBgType, family: playerFamily, location: playerFrom },
        location: playerFrom,
        stats: { str: 5, agi: 5, int: 5, cha: 5 },
        health: 100,
        wealth: 0,
        skills: [],
        inventory: [],
        title: null,
      }
      state.currentDate = { year: worldYear, month: 1, day: 1, era: worldEra, season: worldSeason }
      state.storyLog = [{
        id: crypto.randomUUID(),
        date: { ...state.currentDate },
        playerAge: 5,
        content: birthRaw.content || `${playerName} lahir ke dunia ${worldName} sebagai ${playerBgType} dari ${playerFrom}.`,
        type: 'system',
        location: playerFrom,
      }]
      state.worldMemory = `${worldName} — ${worldDesc}`
      state.narrationBuffer = birthRaw.content || ''

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
      const content = res.content

      // Parse narasi utama — ambil teks sampe ketemu label khusus
      const narration = content.replace(/\n?```[\s\S]*?```/g, '').trim()

      const newState = { ...state, player: { ...state.player } }

      // Ekstrak update age/lokasi dari narasi
      const ageMatch = content.match(/USIA:\s*(\d+)/i)
      if (ageMatch) newState.player.age = parseInt(ageMatch[1])

      const locMatch = content.match(/LOKASI:\s*([^\n]+)/i)
      if (locMatch) newState.player.location = locMatch[1].trim()

      const statMatch = content.match(/STAT:([^|]+)/i)
      if (statMatch) {
        const st = newState.player.stats || { str: 5, agi: 5, int: 5, cha: 5 }
        statMatch[1].split(',').forEach((p: string) => {
          const [k, v] = p.trim().split(':')
          if (k && v) st[k.trim().toLowerCase()] = parseInt(v) || 5
        })
        newState.player.stats = st
      }

      // Log narasi
      const logEntry: StoryLog = {
        id: crypto.randomUUID(),
        date: { ...(state.currentDate || { year: 1024, month: 1, day: 1 }) },
        playerAge: newState.player.age,
        content: narration.slice(0, 2000),
        type: 'main',
        location: newState.player.location,
      }
      newState.storyLog = [...newState.storyLog, logEntry]
      newState.narrationBuffer = narration

      // Detect timeskip
      if (content.match(/(\d+)\s*tahun\s*berlalu/i)) {
        const years = parseInt(content.match(/(\d+)\s*tahun\s*berlalu/i)![1]) || 1
        newState.player.age += years
        newState.storyLog.push({
          id: crypto.randomUUID(),
          date: { ...logEntry.date },
          playerAge: newState.player.age,
          content: `${years} tahun berlalu...`,
          type: 'timeSkip',
          location: newState.player.location,
        })
      }

      // Detect NPC
      const npcMatch = content.match(/NPC:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\n]+)/i)
      if (npcMatch) {
        const npcName = npcMatch[1].trim()
        const npcRel = npcMatch[2].trim()
        const npcDesc = npcMatch[3].trim()
        if (!newState.npcs) newState.npcs = []
        if (!newState.npcs.find(n => n.name === npcName)) {
          newState.npcs = [...newState.npcs, {
            id: crypto.randomUUID(),
            name: npcName,
            relationship: npcRel,
            description: npcDesc,
            location: newState.player.location,
          }]
        }
      }

      // Detect QUEST start
      const questMatch = content.match(/QUEST:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\S+)/i)
      if (questMatch) {
        const qName = questMatch[1].trim()
        const qDesc = questMatch[2].trim()
        const qType = questMatch[3].trim()
        if (!newState.quests) newState.quests = []
        if (!newState.quests.find(q => q.name === qName)) {
          newState.quests = [...newState.quests, {
            id: crypto.randomUUID(),
            name: qName,
            description: qDesc,
            status: 'active' as const,
            type: (qType as 'main' | 'side' | 'personal') || 'side',
            progress: 0,
            maxProgress: 3,
          }]
        }
      }

      // Detect QUEST progress
      const qpMatch = content.match(/QUEST_PROGRESS:\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)/i)
      if (qpMatch) {
        const qName = qpMatch[1].trim()
        const qProg = parseInt(qpMatch[2])
        const qMax = parseInt(qpMatch[3])
        if (newState.quests) {
          newState.quests = newState.quests.map(q =>
            q.name === qName
              ? { ...q, progress: Math.min(qMax, qProg), maxProgress: qMax }
              : q
          )
        }
      }

      // Detect QUEST completion
      const qsMatch = content.match(/QUEST_SELESAI:\s*([^\n]+)/i)
      if (qsMatch) {
        const qName = qsMatch[1].trim()
        if (newState.quests) {
          newState.quests = newState.quests.map(q =>
            q.name === qName ? { ...q, status: 'completed' as const, progress: q.maxProgress } : q
          )
        }
      }

      // Detect game over
      if (content.match(/GAME OVER/i)) {
        newState.isAlive = false
        newState.deathRecord = {
          date: { ...logEntry.date },
          age: newState.player.age,
          cause: 'Kematian dalam petualangan',
          story: narration.slice(0, 500),
          achievements: [],
          legacy: '',
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
