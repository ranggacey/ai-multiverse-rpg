'use client'

import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import type { GameState, StoryLog, CombatState, CombatEnemy, CombatLogEntry } from '@/lib/types'
import { createInitialState, calculatePlayerMaxHp, calculatePlayerMaxMana, calculatePlayerAttack, calculatePlayerDefense, calculateXpToNext, addXp } from '@/lib/game'
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
  // Combat
  startCombat: (enemy: CombatEnemy) => void
  combatAction: (action: 'attack' | 'skill' | 'item' | 'flee', skillId?: string, itemId?: string) => Promise<void>
  endCombat: (victory: boolean) => void
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
        { role: 'system', content: 'Kamu adalah Dungeon Master RPG dunia fantasi.' },
        { role: 'user', content: 'Buat dunia fantasi. Balas SATU BARIS format: NAMA: | DESKRIPSI: | ERA: | TAHUN: | GENRE: | MUSIM: . Contoh: NAMA: Aeloria | DESKRIPSI: Dunia kabut ajaib | ERA: Era Kabut | TAHUN: 1024 | GENRE: fantasy | MUSIM: semi. Langsung jawab, jangan jelaskan.' }
      ], { temperature: 0.9, maxTokens: 2048 })

      const wt = worldRaw.content
      const worldName = extract('NAMA', wt) || extract('WORLD', wt)
      const worldDesc = extract('DESKRIPSI', wt) || extract('DESC', wt) || 'Dunia misterius yang penuh petualangan.'
      const worldEra = extract('ERA', wt) || 'Era Awal'
      const worldYear = parseInt(extract('TAHUN', wt) || extract('YEAR', wt)) || 1024
      const worldGenre = extract('GENRE', wt) || 'fantasy'
      const worldSeason = extract('MUSIM', wt) || extract('SEASON', wt) || 'spring'

      if (!worldName) throw new Error(`Gagal parse nama dunia. Respon AI: ${wt.slice(0, 300)}`)

      // Step 2: Bikin player
      const playerRaw = await callAI([
        { role: 'system', content: `Kamu bikin karakter RPG untuk ${worldName}.` },
        { role: 'user', content: `Buat karakter. Balas SATU BARIS: NAMA: | GENDER: | LATAR: | KELUARGA: | DARI: . Contoh: NAMA: Kael | GENDER: Laki-laki | LATAR: anak petani | KELUARGA: anak bungsu petani miskin | DARI: Desa Oakvale. Langsung jawab, jangan jelaskan.` }
      ], { temperature: 0.8, maxTokens: 2048 })

      const pt = playerRaw.content
      const playerName = extract('NAMA', pt) || extract('NAME', pt)
      const playerGender = extract('GENDER', pt) || 'Laki-laki'
      const playerBgType = extract('LATAR', pt) || extract('BGTYPE', pt) || 'anak petani'
      const playerFamily = extract('KELUARGA', pt) || extract('FAMILY', pt) || 'keluarga sederhana'
      const playerFrom = extract('DARI', pt) || extract('FROM', pt) || 'desa terpencil'

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

      // Ekstrak cuaca & waktu
      const weatherMatch = content.match(/CUACA:\s*([^\n\s]+)/i)
      if (weatherMatch) {
        newState.world.weather = weatherMatch[1].trim().toLowerCase() as any
      }

      const timeMatch = content.match(/WAKTU:\s*([^\n\s]+)/i)
      if (timeMatch) {
        newState.world.timeOfDay = timeMatch[1].trim().toLowerCase() as any
      }

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

  // ── COMBAT FUNCTIONS ──

  const startCombat = useCallback((enemy: CombatEnemy) => {
    const state = gameRef.current
    if (!state) return

    const playerMaxHp = calculatePlayerMaxHp(state.player)
    const playerMaxMana = calculatePlayerMaxMana(state.player)

    // Ensure enemy has all required fields with defaults
    const fullEnemy: CombatEnemy = {
      id: enemy.id || crypto.randomUUID(),
      name: enemy.name || 'Musuh',
      description: enemy.description || '',
      level: enemy.level || 1,
      hp: enemy.hp || 50,
      maxHp: enemy.maxHp || 50,
      attack: enemy.attack || 10,
      defense: enemy.defense || 5,
      speed: enemy.speed || 5,
      xpReward: enemy.xpReward || 50,
      loot: enemy.loot || [],
      skills: enemy.skills || [],
      isBoss: enemy.isBoss || false,
    }

    const newCombat: CombatState = {
      inCombat: true,
      enemy: fullEnemy,
      turn: state.player.stats && (state.player.stats.agi || 5) >= (fullEnemy.speed || 5) ? 'player' : 'enemy',
      turnCount: 0,
      combatLog: [{
        id: crypto.randomUUID(),
        type: 'status',
        message: `Pertarungan dimulai! ${fullEnemy.name} (Lv.${fullEnemy.level}) muncul!`,
        timestamp: Date.now(),
      }],
      playerHp: state.player.health || playerMaxHp,
      playerMaxHp,
      enemyHp: fullEnemy.hp,
      enemyMaxHp: fullEnemy.maxHp,
      playerMana: state.player.mana || playerMaxMana,
      playerMaxMana,
      actionQueue: [],
    }

    const newState = { ...state, combat: newCombat, player: { ...state.player, health: state.player.health || playerMaxHp, maxHealth: playerMaxHp, mana: state.player.mana || playerMaxMana, maxMana: playerMaxMana } }
    setGameState(newState)
    saveGame(newState.id, newState)
  }, [])

  const addCombatLog = (combat: CombatState, entry: Omit<CombatLogEntry, 'id' | 'timestamp'>) => {
    combat.combatLog = [...combat.combatLog, { ...entry, id: crypto.randomUUID(), timestamp: Date.now() }]
    if (combat.combatLog.length > 50) combat.combatLog = combat.combatLog.slice(-50)
  }

  const combatAction = useCallback(async (action: 'attack' | 'skill' | 'item' | 'flee', skillId?: string, itemId?: string) => {
    const state = gameRef.current
    if (!state || !state.combat?.inCombat || !state.combat.enemy) return
    if (state.combat.turn !== 'player') return

    setIsLoading(true)
    setError(null)

    const combat = { ...state.combat }
    // Ensure enemy has all required fields with defaults
    const enemy = { 
      ...combat.enemy,
      hp: combat.enemy?.hp ?? 50,
      maxHp: combat.enemy?.maxHp ?? 50,
      attack: combat.enemy?.attack ?? 10,
      defense: combat.enemy?.defense ?? 5,
      speed: combat.enemy?.speed ?? 5,
      xpReward: combat.enemy?.xpReward ?? 50,
      loot: combat.enemy?.loot ?? [],
      skills: combat.enemy?.skills ?? [],
    } as CombatEnemy
    const player = { 
      ...state.player,
      health: state.player.health ?? 100,
      maxHealth: state.player.maxHealth ?? 100,
      mana: state.player.mana ?? 50,
      maxMana: state.player.maxMana ?? 50,
    }

    // Player turn
    let damage = 0
    let heal = 0
    let manaCost = 0
    let actionName = ''
    let actionType: CombatLogEntry['type'] = 'player_attack'

    if (action === 'attack') {
      const playerAtk = calculatePlayerAttack(player)
      const enemyDef = enemy.defense || 0
      const baseDamage = Math.max(1, playerAtk - Math.floor(enemyDef * 0.5))
      const isCrit = Math.random() < 0.1 * (1 + (player.stats?.agi || 5) / 100)
      damage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage
      // Variance
      damage = Math.floor(damage * (0.85 + Math.random() * 0.3))
      enemy.hp = Math.max(0, enemy.hp - damage)
      actionName = 'Serangan'
      actionType = isCrit ? 'player_crit' : 'player_attack'
      addCombatLog(combat, { type: actionType, message: `${player.name} menyerang ${enemy.name} untuk ${damage} damage!${isCrit ? ' 💥 CRITICAL!' : ''}`, damage })
    } else if (action === 'skill' && skillId) {
      const skill = player.skills?.find((s: any) => s.id === skillId)
      if (skill) {
        // Simple skill implementation
        const skillPower = 10 + skill.level * 5
        const playerAtk = calculatePlayerAttack(player)
        damage = Math.floor((playerAtk + skillPower) * (0.9 + Math.random() * 0.2))
        manaCost = 10 + skill.level * 2
        if ((player.mana || 0) < manaCost) {
          addCombatLog(combat, { type: 'status', message: 'Mana tidak cukup!' })
          setIsLoading(false)
          return
        }
        player.mana = (player.mana || 0) - manaCost
        enemy.hp = Math.max(0, enemy.hp - damage)
        actionName = skill.name
        actionType = 'player_skill'
        addCombatLog(combat, { type: actionType, message: `${player.name} menggunakan ${skill.name} pada ${enemy.name} untuk ${damage} damage!`, damage })
      }
    } else if (action === 'item' && itemId) {
      const inventory = player.inventory || []
      const itemIndex = inventory.findIndex((i: any) => i.id === itemId)
      if (itemIndex >= 0) {
        const item = inventory[itemIndex]
        if (item.healAmount) {
          heal = item.healAmount
          player.health = Math.min(player.maxHealth || combat.playerMaxHp, (player.health || 0) + heal)
          combat.playerHp = Math.min(combat.playerMaxHp, combat.playerHp + heal)
          actionName = item.name
          actionType = 'player_heal'
          addCombatLog(combat, { type: actionType, message: `${player.name} menggunakan ${item.name} dan memulihkan ${heal} HP!`, heal })
          // Consume item
          player.inventory = [...inventory]
          player.inventory.splice(itemIndex, 1)
        } else if (item.spellType && item.attack) {
          // Spell scroll
          manaCost = item.manaCost || 0
          if ((player.mana || 0) < manaCost) {
            addCombatLog(combat, { type: 'status', message: 'Mana tidak cukup!' })
            setIsLoading(false)
            return
          }
          player.mana = (player.mana || 0) - manaCost
          damage = item.attack
          enemy.hp = Math.max(0, enemy.hp - damage)
          actionName = item.name
          actionType = 'player_skill'
          addCombatLog(combat, { type: actionType, message: `${player.name} menggunakan ${item.name} pada ${enemy.name} untuk ${damage} damage!`, damage })
          // Consume spell scroll
          player.inventory = [...inventory]
          player.inventory.splice(itemIndex, 1)
        }
      }
    } else if (action === 'flee') {
      const fleeChance = 0.5 + (player.stats?.agi || 5) / 100
      if (Math.random() < fleeChance) {
        addCombatLog(combat, { type: 'flee', message: `${player.name} berhasil melarikan diri!` })
        endCombat(false)
        setIsLoading(false)
        return
      } else {
        addCombatLog(combat, { type: 'status', message: `${player.name} gagal melarikan diri!` })
      }
    }

    combat.turnCount++
    combat.playerHp = player.health || combat.playerHp
    combat.playerMana = player.mana || combat.playerMana
    combat.enemy = enemy
    combat.enemyHp = enemy.hp

    // Check victory
    if (enemy.hp <= 0) {
      // Victory!
      const xpReward = enemy.xpReward || 50
      const loot = enemy.loot || []
      addCombatLog(combat, { type: 'victory', message: `${enemy.name} dikalahkan! Mendapat ${xpReward} XP${loot.length > 0 ? ` dan ${loot.join(', ')}` : ''}!` })
      
      // Apply XP and loot
      const xpResult = addXp(player, xpReward)
      if (xpResult.leveledUp) {
        addCombatLog(combat, { type: 'status', message: `🎉 LEVEL UP! ${player.name} naik ke Level ${xpResult.newLevel}!` })
      }
      
      // Add loot to inventory
      if (loot.length > 0 && player.inventory) {
        for (const lootName of loot) {
          const existingItem = player.inventory.find((i: any) => i.name === lootName)
          if (existingItem) {
            // Stack if possible
          } else {
            player.inventory.push({
              id: crypto.randomUUID(),
              name: lootName,
              type: 'loot',
              rarity: 'common',
              description: `Dijatuhkan oleh ${enemy.name}`,
              value: 10,
              equipped: false,
            })
          }
        }
      }

      // Update player in state
      player.maxHealth = calculatePlayerMaxHp(player)
      player.maxMana = calculatePlayerMaxMana(player)
      player.health = player.maxHealth
      player.mana = player.maxMana

      const newState = { ...state, combat: { ...combat, inCombat: false, enemy: undefined }, player }
      setGameState(newState)
      await saveGame(newState.id, newState)
      setIsLoading(false)
      return
    }

    // Enemy turn
    combat.turn = 'enemy'
    
    // Simple enemy AI
    let enemyAction = 'attack'
    const enemySkills = enemy.skills || []
    const availableSkills = enemySkills.filter((s: any) => s.currentCooldown <= 0)
    
    if (enemy.hp < enemy.maxHp * 0.3 && availableSkills.some((s: any) => s.type === 'heal')) {
      enemyAction = 'heal'
    } else if (availableSkills.length > 0 && Math.random() < 0.3) {
      enemyAction = 'skill'
    }

    if (enemyAction === 'attack') {
      const enemyAtk = enemy.attack || 10
      const playerDef = calculatePlayerDefense(player)
      const baseDamage = Math.max(1, enemyAtk - Math.floor(playerDef * 0.5))
      const isCrit = Math.random() < 0.05
      damage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage
      damage = Math.floor(damage * (0.85 + Math.random() * 0.3))
      player.health = Math.max(0, (player.health || combat.playerHp) - damage)
      combat.playerHp = player.health
      addCombatLog(combat, { type: isCrit ? 'enemy_crit' : 'enemy_attack', message: `${enemy.name} menyerang ${player.name} untuk ${damage} damage!${isCrit ? ' 💥 CRITICAL!' : ''}`, damage })
    } else if (enemyAction === 'skill') {
      const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)]
      skill.currentCooldown = skill.cooldown
      if (skill.type === 'attack' && skill.damage) {
        damage = Math.floor(skill.damage * (0.9 + Math.random() * 0.2))
        player.health = Math.max(0, (player.health || combat.playerHp) - damage)
        combat.playerHp = player.health
        addCombatLog(combat, { type: 'enemy_skill', message: `${enemy.name} menggunakan ${skill.name} pada ${player.name} untuk ${damage} damage!`, damage })
      } else if (skill.type === 'buff') {
        addCombatLog(combat, { type: 'enemy_skill', message: `${enemy.name} menggunakan ${skill.name}! ${skill.description}` })
      }
    } else if (enemyAction === 'heal') {
      const skill = availableSkills.find((s: any) => s.type === 'heal')
      if (skill && skill.healAmount) {
        heal = skill.healAmount
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal)
        combat.enemyHp = enemy.hp
        addCombatLog(combat, { type: 'enemy_heal', message: `${enemy.name} menggunakan ${skill.name} dan memulihkan ${heal} HP!`, heal })
      }
    }

    // Reduce cooldowns
    enemySkills.forEach((s: any) => { if (s.currentCooldown > 0) s.currentCooldown-- })

    combat.enemy = enemy
    combat.enemyHp = enemy.hp

    // Check defeat
    if (player.health <= 0) {
      addCombatLog(combat, { type: 'defeat', message: `${player.name} dikalahkan oleh ${enemy.name}...` })
      
      const newState = { ...state, combat: { ...combat, inCombat: false, enemy: undefined }, player, isAlive: false }
      newState.deathRecord = {
        date: { ...state.currentDate },
        age: player.age,
        cause: `Dikalahkan oleh ${enemy.name} dalam pertarungan`,
        story: `Petualangan ${player.name} berakhir di tangan ${enemy.name}.`,
        achievements: [],
        legacy: `${player.name} diperingati sebagai pejuang yang berani menghadapi ${enemy.name}.`,
      }
      newState.storyLog.push({
        id: crypto.randomUUID(),
        date: { ...state.currentDate },
        playerAge: player.age,
        content: `☠️ ${player.name} dikalahkan oleh ${enemy.name}...`,
        type: 'battle',
        location: player.location,
      })
      setGameState(newState)
      await saveGame(newState.id, newState)
      setIsLoading(false)
      return
    }

    // Back to player turn
    combat.turn = 'player'

    const newState = { ...state, combat, player }
    setGameState(newState)
    await saveGame(newState.id, newState)
    setIsLoading(false)
  }, [])

  const endCombat = useCallback((victory: boolean) => {
    const state = gameRef.current
    if (!state || !state.combat?.inCombat) return

    const combat = { ...state.combat, inCombat: false, enemy: undefined }
    const newState = { ...state, combat }
    setGameState(newState)
    saveGame(newState.id, newState)
  }, [])

  return (
    <GameContext.Provider value={{
      gameState, isLoading, error, saves,
      newGame, continueGame, saveCurrentGame, deleteSaveGame,
      refreshSaves, submitAction, exportSave, importSave: importSaveFn,
      // Combat
      startCombat, combatAction, endCombat,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}
