'use client'

import { GameProvider, useGame } from '@/lib/game-provider'
import { formatDate, formatTimePlayed } from '@/lib/game'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Map, Scroll, Download, Upload, Menu, X, Swords, Compass, Heart, ShoppingBag, Handshake, Eye } from 'lucide-react'

type GameTab = 'stats' | 'inventory' | 'world' | 'log'

function GameUI() {
  const { gameState, isLoading, error, submitAction, saveCurrentGame, exportSave } = useGame()
  const [action, setAction] = useState('')
  const [activeTab, setActiveTab] = useState<GameTab>('stats')
  const [showSidebar, setShowSidebar] = useState(true)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showToast, setShowToast] = useState('')
  const storyEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { storyEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [gameState?.storyLog?.length])

  if (!gameState) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400">Loading...</p>
    </div>
  )

  const { player, world, storyLog, isAlive, deathRecord } = gameState

  const quickActions = [
    { label: 'Jelajahi', icon: Compass, act: 'Aku ingin menjelajahi daerah sekitar' },
    { label: 'Bicara', icon: Handshake, act: 'Aku mencari seseorang untuk diajak bicara' },
    { label: 'Latihan', icon: Swords, act: 'Aku ingin berlatih' },
    { label: 'Istirahat', icon: Heart, act: 'Aku beristirahat sebentar' },
    { label: 'Beli', icon: ShoppingBag, act: 'Aku mencari tempat berdagang' },
  ]

  const handleSubmit = async (text?: string) => {
    const a = text || action.trim()
    if (!a || isLoading || !isAlive) return
    await submitAction(a)
    setAction('')
  }

  const showT = (msg: string) => { setShowToast(msg); setTimeout(() => setShowToast(''), 2000) }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur px-4 py-2 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-zinc-200"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-sm font-medium">{world?.name || 'Multiverse'}</h1>
            <p className="text-xs text-zinc-500">{player.name}, {player.age} tahun · {player.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${isAlive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
            {isAlive ? 'Hidup' : `Mati (${deathRecord?.age} thn)`}
          </div>
          <p className="text-xs text-zinc-500 hidden sm:block">{formatDate(world)}</p>
          <button onClick={() => { saveCurrentGame(); showT('Tersimpan!') }} className="p-1.5 text-zinc-400 hover:text-zinc-200" title="Simpan"><Download size={14} /></button>
          <button onClick={exportSave} className="p-1.5 text-zinc-400 hover:text-zinc-200" title="Export"><Upload size={14} /></button>
          <button onClick={() => setShowMobileSidebar(true)} className="p-1.5 text-zinc-400 hover:text-zinc-200 md:hidden"><Menu size={14} /></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* STORY AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {storyLog.map((log, i) => (
              <div key={log.id || i}>
                {log.type === 'timeSkip' ? (
                  <div className="flex items-center gap-3 py-3 text-zinc-600">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-xs italic">{log.content}</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                ) : log.type === 'parallel' ? (
                  <div className="pl-3 border-l-2 border-indigo-500/30 text-sm leading-relaxed text-zinc-300">
                    <div className="flex items-center gap-1 mb-1">
                      <Eye size={12} className="text-indigo-400" />
                      <span className="text-xs font-medium text-indigo-400">Parallel Story</span>
                    </div>
                    <p>{log.content}</p>
                  </div>
                ) : (
                  <p className={`text-sm leading-relaxed ${log.type === 'system' ? 'text-zinc-500 italic' : 'text-zinc-200'}`}>
                    {log.content}
                  </p>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-500 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">Semesta merespon...</span>
              </div>
            )}
            <div ref={storyEndRef} />
          </div>

          {error && <div className="mx-4 mb-2 px-4 py-2 bg-red-950/50 border border-red-500/20 rounded-lg text-red-300 text-sm">{error}</div>}

          {/* INPUT */}
          <div className="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur px-4 py-3">
            {!isAlive && deathRecord ? (
              <div className="p-4 bg-red-950/30 border border-red-800/30 rounded-lg text-center">
                <p className="text-red-300 font-medium mb-1">☠️ {player.name} telah tiada</p>
                <p className="text-sm text-zinc-400">{deathRecord.cause}</p>
                {deathRecord.legacy && <p className="text-xs text-zinc-500 mt-1 italic">"{deathRecord.legacy}"</p>}
                <button onClick={() => router.push('/')} className="mt-3 text-xs px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg">Kembali ke menu</button>
              </div>
            ) : isAlive && (
              <>
                <div className="flex gap-2">
                  <input value={action} onChange={e => setAction(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
                    placeholder="Ketik aksi atau dialog..."
                    disabled={isLoading}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 placeholder:text-zinc-600 disabled:opacity-50"
                  />
                  <button onClick={() => handleSubmit()} disabled={isLoading || !action.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-sm font-medium"
                  >Kirim</button>
                </div>
                <div className="flex gap-1.5 mt-2 overflow-x-auto">
                  {quickActions.map((qa, i) => (
                    <button key={i} onClick={() => handleSubmit(qa.act)} disabled={isLoading}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/50 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 shrink-0"
                    ><qa.icon size={12} /> {qa.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        {showSidebar && (
          <div className="w-64 border-l border-zinc-800 bg-zinc-900/50 overflow-y-auto hidden md:block shrink-0">
            <div className="flex border-b border-zinc-800">
              {[
                { key: 'stats' as GameTab, label: 'Status', icon: User },
                { key: 'inventory' as GameTab, label: 'Item', icon: Scroll },
                { key: 'world' as GameTab, label: 'Dunia', icon: Map },
                { key: 'log' as GameTab, label: 'Log', icon: Scroll },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeTab === tab.key ? 'text-indigo-300 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                ><tab.icon size={12} />{tab.label}</button>
              ))}
            </div>

            <div className="p-3 space-y-3">
              {/* STATS */}
              {activeTab === 'stats' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400">HP</span>
                    <span className="text-xs text-zinc-500">{player.health ?? 100}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${player.health ?? 100}%` }} />
                  </div>

                  {player.stats && Object.entries(player.stats).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs py-1">
                      <span className="text-zinc-400 uppercase">{k}</span>
                      <span className="text-zinc-200">{String(v)}</span>
                    </div>
                  ))}

                  <div className="flex justify-between text-xs py-1 border-t border-zinc-800 mt-2 pt-2">
                    <span className="text-amber-400">💰 {player.wealth ?? 0}</span>
                  </div>

                  {player.skills && player.skills.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-zinc-400 mb-1">Skill</p>
                      {player.skills.map((s, i) => (
                        <div key={i} className="flex justify-between text-xs py-0.5">
                          <span className="text-zinc-300">{s.name}</span>
                          <span className="text-indigo-400">Lv.{s.level}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* INVENTORY */}
              {activeTab === 'inventory' && (
                <div>
                  {!player.inventory || player.inventory.length === 0 ? (
                    <p className="text-xs text-zinc-600">Kosong</p>
                  ) : (
                    player.inventory.map((item, i) => (
                      <div key={item.id || i} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/50 last:border-0">
                        <span className={`${item.rarity === 'legendary' ? 'text-amber-400' : item.rarity === 'epic' ? 'text-purple-400' : 'text-zinc-300'}`}>
                          {item.name}
                        </span>
                        {item.equipped && <span className="text-emerald-400">◆</span>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* WORLD */}
              {activeTab === 'world' && (
                <div>
                  <p className="text-xs font-medium text-indigo-400 mb-1">{world?.name}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{world?.description}</p>
                  {world?.history && <p className="text-xs text-zinc-600 mt-2 italic">{world.history}</p>}
                </div>
              )}

              {/* LOG */}
              {activeTab === 'log' && (
                <div>
                  <p className="text-xs text-zinc-500">Bab {gameState.currentChapter}</p>
                  <p className="text-xs text-zinc-600">Dimainkan: {formatTimePlayed(gameState.playTime)}</p>
                  <p className="text-xs text-zinc-600 mt-2">{storyLog.length} kejadian tercatat</p>
                  {gameState.worldMemory && (
                    <p className="text-xs text-zinc-500 mt-3 leading-relaxed">{gameState.worldMemory.slice(0, 200)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TOAST */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 bg-emerald-900/80 border border-emerald-700/50 rounded-full text-xs text-emerald-300">{showToast}</div>
        </div>
      )}

      {/* MOBILE SIDEBAR */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-zinc-900 border-l border-zinc-800 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-medium">Menu</span>
              <button onClick={() => setShowMobileSidebar(false)}><X size={16} /></button>
            </div>
            <div className="p-4 text-xs text-zinc-500">
              <p>Tambah fitur mobile sidebar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GamePage() {
  return <GameProvider>
    <GameUI />
  </GameProvider>
}
