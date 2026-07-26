"use client"

// IndexedDB storage for game saves
// More stable than localStorage for large data

const DB_NAME = 'ai-multiverse-rpg'
const DB_VERSION = 1
const STORE_NAME = 'saves'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
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
}

export async function listSaves(): Promise<SaveMeta[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const req = store.getAll()
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const saves = (req.result as any[]).map(s => ({
        id: s.id,
        name: s.name || s.player?.name || 'Unknown',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        playerName: s.player?.name || 'Unknown',
        playerAge: s.player?.age || 0,
        worldName: s.world?.name || 'Unknown',
        chapter: s.currentChapter || 0,
        playTime: s.playTime || 0,
        isAlive: s.isAlive !== false,
      }))
      resolve(saves)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function saveGame(id: string, data: any): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.put({ ...data, id, updatedAt: Date.now() })
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadGame(id: string): Promise<any> {
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
