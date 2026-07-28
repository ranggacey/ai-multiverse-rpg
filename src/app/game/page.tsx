'use client'

import { GameProvider, useGame } from '@/lib/game-provider'
import { GameUI } from '@/components/game-ui'
import { useEffect, useState } from 'react'

function GamePageInner() {
  const { gameState, isLoading, error, refreshSaves } = useGame()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    refreshSaves()
  }, [refreshSaves])
  
  // Don't render anything on server or before client hydration
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border-4 border-t-indigo-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
          </div>
          <p className="text-lg font-medium text-zinc-300 animate-pulse">Memuat dunia...</p>
        </div>
      </div>
    )
  }
  
  if (!gameState) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Tak ada dunia yang dimuat.</p>
      </div>
    )
  }
  
  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <GameUI gameState={gameState} error={error} />
    </div>
  )
}

export default function GamePage() {
  return (
    <GameProvider>
      <GamePageInner />
    </GameProvider>
  )
}

export const dynamic = 'force-dynamic'