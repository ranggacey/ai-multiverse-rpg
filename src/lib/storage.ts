"use client"

// IndexedDB storage for game saves
// More stable than localStorage for large data

import type { GameState } from './types'

const DB_NAME = 'ai-multiverse-rpg'
const DB_VERSION = 2
const STORE_NAME = 'saves'
const SLOT_STORE_NAME = 'save_slots'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(SLOT_STORE_NAME)) {
        const slotStore = db.createObjectStore(SLOT_STORE_NAME, { keyPath: 'slotIndex' })
        slotStore.createIndex('isQuickSave', 'isQuickSave', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export interface SaveMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  playerName: string
  playerAge: number
  worldName: string
  chapter: number
  playTime: number
  isAlive: boolean
  // Enhanced metadata
  saveSlot?: {
    slotIndex: number
    name: string
    isAutoSave: boolean
    isQuickSave: boolean
    lastAction?: string
  }
  location?: string
  level?: number
  season?: string
  weather?: string
}

export interface SaveSlot extends SaveMeta {
  slotIndex: number
  name: string
  isAutoSave: boolean
  isQuickSave: boolean
  lastAction?: string
  thumbnail?: string
}

export async function listSaves(): Promise<SaveMeta[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const req = store.getAll()
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const saves = (req.result as GameState[]).map(s => {
        const slotMeta = s.saveSlot
        return {
          id: s.id,
          name: s.player?.name || 'Unknown',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          playerName: s.player?.name || 'Unknown',
          playerAge: s.player?.age || 0,
          worldName: s.world?.name || 'Unknown',
          chapter: s.currentChapter || 0,
          playTime: s.playTime || 0,
          isAlive: s.isAlive !== false,
          // Enhanced metadata
          saveSlot: slotMeta ? {
            slotIndex: slotMeta.slotIndex,
            name: slotMeta.name,
            isAutoSave: slotMeta.isAutoSave,
            isQuickSave: slotMeta.isQuickSave,
            lastAction: slotMeta.lastAction,
          } : undefined,
          location: s.player?.location,
          level: s.player?.level,
          season: s.world?.season,
          weather: s.world?.weather,
        }
      })
      resolve(saves)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function saveGame(id: string, data: GameState): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.put({ ...data, id, updatedAt: Date.now() })
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadGame(id: string): Promise<GameState | undefined> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const req = store.get(id)
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteSave(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function exportSave(id: string): Promise<string> {
  const data = await loadGame(id)
  if (!data) throw new Error('Save not found')
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-multiverse-${data.player?.name || 'save'}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  return json
}

export async function importSave(json: string): Promise<string> {
  const data = JSON.parse(json)
  if (!data.id || !data.player) throw new Error('Invalid save file')
  await saveGame(data.id, data)
  return data.id
}

// ============================================================
// SAVE SLOT SYSTEM
// ============================================================

const QUICK_SAVE_SLOTS = 10 // 0-9 for quick saves (F1-F10 or Ctrl+0-9)
const CUSTOM_SAVE_SLOTS = 5 // 10-14 for custom named saves
const AUTO_SAVE_SLOT = 99 // Special slot for auto-saves

function getSlotKey(slotIndex: number): number {
  return slotIndex
}

export async function saveToSlot(
  slotIndex: number,
  gameState: GameState,
  options?: { name?: string; isAutoSave?: boolean; isQuickSave?: boolean; lastAction?: string }
): Promise<void> {
  const db = await openDB()
  const tx = db.transaction([STORE_NAME, SLOT_STORE_NAME], 'readwrite')
  
  // Save the game state
  const saveId = gameState.id
  const saveStore = tx.objectStore(STORE_NAME)
  const stateToSave = { 
    ...gameState, 
    id: saveId, 
    updatedAt: Date.now(),
    saveSlot: {
      slotIndex,
      name: options?.name || (slotIndex < QUICK_SAVE_SLOTS ? `Quick Save ${slotIndex + 1}` : `Custom Save ${slotIndex - QUICK_SAVE_SLOTS + 1}`),
      isAutoSave: options?.isAutoSave || false,
      isQuickSave: options?.isQuickSave || slotIndex < QUICK_SAVE_SLOTS,
      lastAction: options?.lastAction,
    }
  }
  saveStore.put(stateToSave)

  // Save slot metadata
  const slotStore = tx.objectStore(SLOT_STORE_NAME)
  const slotMeta = {
    slotIndex,
    id: saveId,
    name: stateToSave.saveSlot.name,
    createdAt: gameState.createdAt,
    updatedAt: Date.now(),
    playerName: gameState.player.name,
    playerAge: gameState.player.age,
    worldName: gameState.world.name,
    chapter: gameState.currentChapter,
    playTime: gameState.playTime,
    isAlive: gameState.isAlive,
    isAutoSave: options?.isAutoSave || false,
    isQuickSave: options?.isQuickSave || slotIndex < QUICK_SAVE_SLOTS,
    lastAction: options?.lastAction,
    location: gameState.player.location,
    level: gameState.player.level,
    season: gameState.world.season,
    weather: gameState.world.weather,
  }
  slotStore.put(slotMeta)

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadFromSlot(slotIndex: number): Promise<GameState | undefined> {
  const db = await openDB()
  const tx = db.transaction(SLOT_STORE_NAME, 'readonly')
  const slotStore = tx.objectStore(SLOT_STORE_NAME)
  const req = slotStore.get(slotIndex)
  
  return new Promise((resolve, reject) => {
    req.onsuccess = async () => {
      const slotMeta = req.result
      if (!slotMeta) {
        resolve(undefined)
        return
      }
      const gameState = await loadGame(slotMeta.id)
      resolve(gameState)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function listSaveSlots(): Promise<SaveSlot[]> {
  const db = await openDB()
  const tx = db.transaction(SLOT_STORE_NAME, 'readonly')
  const store = tx.objectStore(SLOT_STORE_NAME)
  const req = store.getAll()
  
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const slots = (req.result as SaveSlot[]).sort((a, b) => a.slotIndex - b.slotIndex)
      resolve(slots)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteSaveSlot(slotIndex: number): Promise<void> {
  const db = await openDB()
  const tx = db.transaction([STORE_NAME, SLOT_STORE_NAME], 'readwrite')
  
  // Get slot meta first to find the save ID
  const slotStore = tx.objectStore(SLOT_STORE_NAME)
  const getReq = slotStore.get(slotIndex)
  
  getReq.onsuccess = () => {
    const slotMeta = getReq.result
    if (slotMeta) {
      // Delete the save game
      const saveStore = tx.objectStore(STORE_NAME)
      saveStore.delete(slotMeta.id)
      // Delete the slot metadata
      slotStore.delete(slotIndex)
    }
  }
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQuickSaveSlots(): Promise<SaveSlot[]> {
  const allSlots = await listSaveSlots()
  return allSlots.filter(s => s.slotIndex < QUICK_SAVE_SLOTS)
}

export async function getCustomSaveSlots(): Promise<SaveSlot[]> {
  const allSlots = await listSaveSlots()
  return allSlots.filter(s => s.slotIndex >= QUICK_SAVE_SLOTS && s.slotIndex < QUICK_SAVE_SLOTS + CUSTOM_SAVE_SLOTS)
}

export async function getAutoSaveSlot(): Promise<SaveSlot | undefined> {
  const allSlots = await listSaveSlots()
  return allSlots.find(s => s.slotIndex === AUTO_SAVE_SLOT)
}

export async function quickSave(gameState: GameState, lastAction?: string): Promise<void> {
  // Find the oldest quick save slot or first empty
  const quickSlots = await getQuickSaveSlots()
  let targetSlot = 0
  
  if (quickSlots.length < QUICK_SAVE_SLOTS) {
    // Find first empty slot
    for (let i = 0; i < QUICK_SAVE_SLOTS; i++) {
      if (!quickSlots.find(s => s.slotIndex === i)) {
        targetSlot = i
        break
      }
    }
  } else {
    // All slots full, overwrite oldest
    quickSlots.sort((a, b) => a.updatedAt - b.updatedAt)
    targetSlot = quickSlots[0].slotIndex
  }
  
  await saveToSlot(targetSlot, gameState, { isQuickSave: true, lastAction })
}

export async function autoSave(gameState: GameState): Promise<void> {
  await saveToSlot(AUTO_SAVE_SLOT, gameState, { isAutoSave: true, name: 'Auto Save' })
}

export function formatSlotName(slotIndex: number, defaultName?: string): string {
  if (slotIndex === AUTO_SAVE_SLOT) return 'Auto Save'
  if (slotIndex < QUICK_SAVE_SLOTS) return `Quick Save ${slotIndex + 1} (F${slotIndex + 1})`
  return `Custom Save ${slotIndex - QUICK_SAVE_SLOTS + 1}`
}
