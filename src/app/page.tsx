'use client'

import { GameProvider, useGame } from '@/lib/game-provider'
import { formatTimePlayed } from '@/lib/game'
import { useEffect, useRef } from 'react'

// Animated starfield background
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const stars: { x: number; y: number; r: number; a: number; da: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random(),
        da: (Math.random() - 0.5) * 0.008,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        s.a += s.da
        if (s.a > 1 || s.a < 0.1) s.da = -s.da
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

function MainMenu() {
  const { newGame, isLoading, error, saves, refreshSaves, continueGame, deleteSaveGame, exportSave, importSave } = useGame()

  useEffect(() => { refreshSaves() }, [refreshSaves])

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        await importSave(text)
        await refreshSaves()
      } catch { alert('File save tidak valid!') }
    }
    input.click()
  }

  if (isLoading) return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping" />
          <div className="absolute inset-2 border-4 border-t-indigo-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
        </div>
        <p className="text-lg font-medium text-zinc-300 animate-pulse">Menciptakan semesta baru...</p>
        <p className="text-sm text-zinc-500">AI sedang membangun dunia, sejarah, dan takdir</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Animated Starfield */}
      <Starfield />
      
      {/* Background Ambiance */}
      <div className="fixed inset-0 bg-gradient-to-b from-zinc-950 via-indigo-950/20 to-zinc-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1 rounded-full text-xs text-indigo-300 mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            AI-Powered Dynamic Story
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-zinc-100 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
              AI Multiverse
            </span>
            <br />
            <span className="text-zinc-500">RPG</span>
          </h1>
          <p className="mt-4 text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
            Setiap permainan adalah kehidupan baru. Setiap dunia adalah semesta yang berbeda. 
            Takdir ditulis oleh AI, tak terbatas oleh naskah.
          </p>
        </div>

        {error && (
          <div className="mb-6 px-6 py-3 bg-red-950/50 border border-red-500/20 rounded-lg text-red-300 text-sm max-w-md">
            {error}
          </div>
        )}

        {/* Main Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12">
          <button onClick={newGame}
            className="group relative px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40"
          >
            <span className="relative z-10">Mulai Petualangan Baru</span>
          </button>
          <button onClick={() => document.getElementById('continue-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold rounded-lg transition-all"
          >
            Lanjutkan Permainan
          </button>
          <button onClick={handleImport}
            className="px-8 py-3 border border-zinc-800 hover:border-zinc-600 text-zinc-400 font-medium rounded-lg transition-all text-sm"
          >
            Import Save
          </button>
        </div>

        {/* Saves */}
        <div id="continue-section" className="w-full max-w-lg">
          <h2 className="text-sm font-medium text-zinc-400 mb-4 text-center">Save Files ({saves.length})</h2>
          {saves.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-zinc-600 text-sm">Belum ada save file</p>
              <p className="text-zinc-700 text-xs mt-1">Mulai petualangan baru untuk membuat save</p>
            </div>
          ) : (
            <div className="space-y-2">
              {saves.map(save => (
                <div key={save.id} className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 group transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${save.isAlive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <p className="font-medium text-sm truncate">{save.playerName}</p>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {save.worldName} · Usia {save.playerAge} · Bab {save.chapter}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-600">{formatTimePlayed(save.playTime)}</span>
                      <span className="text-[10px] text-zinc-600">·</span>
                      <span className="text-[10px] text-zinc-600">{new Date(save.updatedAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => continueGame(save.id)} className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-xs font-medium rounded transition-all">Main</button>
                    <button onClick={() => { const a = document.createElement('a'); a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(save, null, 2))}`; a.download = `ai-multiverse-${save.playerName}-${Date.now()}.json`; a.click(); }} className="px-3 py-1.5 border border-zinc-700 hover:border-zinc-500 text-xs rounded transition-all">Export</button>
                    <button onClick={() => deleteSaveGame(save.id)} className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800/70 text-xs rounded transition-all">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <GameProvider>
      <MainMenu />
    </GameProvider>
  )
}
