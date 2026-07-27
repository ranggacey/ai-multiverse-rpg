'use client'

import { GameProvider, useGame } from '@/lib/game-provider'
import { formatDate, formatTimePlayed } from '@/lib/game'
import type { Quest } from '@/lib/types'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Biography from './biography'
import { ArrowLeft, BookOpen, User, Map, Scroll, Eye, Download, Upload, Menu, Trophy, ChevronDown, ChevronUp, X } from 'lucide-react'

type GameTab = 'story' | 'stats' | 'inventory' | 'world' | 'log'

function GameUI() {
  const { gameState, isLoading, error, submitAction, saveCurrentGame, exportSave } = useGame()
  const [action, setAction] = useState('')
  const [activeTab, setActiveTab] = useState<GameTab>('story')
  const [showParallel, setShowParallel] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showBiography, setShowBiography] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const storyEndRef = useRef<HTMLDivElement>(null)
  const storyContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { storyEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [gameState?.storyLog, gameState?.storyLog?.length])

  // Auto-scroll on new content
  useEffect(() => {
    if (storyContainerRef.current) {
      const el = storyContainerRef.current
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [gameState?.storyLog?.length])

  const showSavedToast = () => {
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2000)
  }

  const handleSave = async () => {
    await saveCurrentGame()
    showSavedToast()
  }

  if (!gameState) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-zinc-400">Loading...</p>
        <button onClick={() => router.push('/')} className="mt-4 text-indigo-400 hover:text-indigo-300">Kembali ke menu</button>
      </div>
    </div>
  )

  const { player, world, storyLog, parallelStories, isAlive, deathRecord } = gameState
  const hasParallelUnread = parallelStories.length > 0 && !showParallel

  // Player stats helper
  const statBars = [
    { label: 'HP', value: player.health.current, max: player.health.max, color: 'bg-red-500' },
    { label: 'STM', value: player.health.stamina, max: player.health.maxStamina, color: 'bg-amber-500' },
    { label: 'MP', value: player.magic.maxMana > 0 ? player.magic.currentMana : 0, max: player.magic.maxMana || 1, color: 'bg-indigo-500' },
  ]

  const mainStats = [
    { label: 'STR', value: player.stats.strength, icon: '💪' },
    { label: 'AGI', value: player.stats.agility, icon: '💨' },
    { label: 'VIT', value: player.stats.vitality, icon: '❤️' },
    { label: 'INT', value: player.stats.intelligence, icon: '🧠' },
    { label: 'WIS', value: player.stats.wisdom, icon: '👁️' },
    { label: 'CHA', value: player.stats.charisma, icon: '🎭' },
    { label: 'LUK', value: player.stats.luck, icon: '🍀' },
  ]

  const handleSubmit = async () => {
    if (!action.trim() || isLoading || !isAlive) return
    await submitAction(action.trim())
    setAction('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur px-4 py-2 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-medium">{world?.name || 'Multiverse'}</h1>
            <p className="text-xs text-zinc-500">{player.name}, {player.age} tahun · {player.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${isAlive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
            {isAlive ? 'Hidup' : 'Mati'}
          </div>
          <p className="text-xs text-zinc-500 hidden sm:block">{formatDate(world.currentDate)}</p>
          <div className="flex gap-1">
            <button onClick={handleSave} className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded" title="Simpan"><Download size={14} /></button>
            <button onClick={exportSave} className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded" title="Export"><Upload size={14} /></button>
            <button onClick={() => setShowMobileSidebar(true)} className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded md:hidden" title="Menu">
              <Menu size={14} />
            </button>
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hidden md:block" title="Toggle Sidebar">
              {showSidebar ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Story Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Story Log */}
          <div ref={storyContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {storyLog.map((log) => {
              const isParallel = log.type === 'parallel'
              const isTimeSkip = log.type === 'timeSkip'
              const isSystem = log.type === 'system'
              
              return (
                <div key={log.id} className="story-fade-in">               
                  {isTimeSkip ? (
                    <div className="flex items-center gap-3 py-4 text-zinc-600">
                      <div className="flex-1 h-px bg-zinc-800" />
                      <span className="text-xs italic">{log.content}</span>
                      <div className="flex-1 h-px bg-zinc-800" />
                    </div>
                  ) : (
                    <div className={`${isParallel ? 'pl-3 border-l-2 parallel-glow border-indigo-500/30' : ''} ${isSystem ? 'text-zinc-500 italic text-sm' : ''} ${log.type === 'battle' ? 'bg-red-950/20 -mx-4 px-4 py-2 border-y border-red-900/20' : ''}`}>
                      {isParallel && (
                        <div className="flex items-center gap-2 mb-1">
                          <Eye size={12} className="text-indigo-400" />
                          <span className="text-xs font-medium text-indigo-400">Parallel Story</span>
                          <span className="text-xs text-zinc-600">{log.location}</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed text-zinc-200">{log.content}</p>
                      <p className="text-xs text-zinc-600 mt-1">{formatDate(log.date)}</p>
                    </div>
                  )}
                </div>
              )
            })}
            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-500 animate-pulse py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">Semesta sedang merespon...</span>
              </div>
            )}
            <div ref={storyEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 px-4 py-2 bg-red-950/50 border border-red-500/20 rounded-lg text-red-300 text-sm">{error}</div>
          )}

          {/* Input Box */}
          <div className="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur px-4 py-3">
            {!isAlive && deathRecord && (
              <div className="mb-3 p-4 bg-red-950/30 border border-red-800/30 rounded-lg">
                <p className="text-red-300 font-medium mb-1">☠️ {player.name} telah tiada</p>
                <p className="text-sm text-zinc-400">{deathRecord.cause}</p>
                <p className="text-xs text-zinc-500 mt-2">Usia {deathRecord.age} tahun · Bab {gameState.currentChapter} · {formatDate(deathRecord.date)}</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button onClick={() => setShowBiography(true)} className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded">
                    📜 Lihat Biografi
                  </button>
                  <button onClick={exportSave} className="text-xs px-3 py-1.5 border border-zinc-700 hover:border-zinc-500 rounded">
                    💾 Simpan Biografi
                  </button>
                  <button onClick={() => router.push('/')} className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded">
                    🏠 Kembali ke menu
                  </button>
                </div>
              </div>
            )}
            {isAlive && (
              <div className="flex gap-2">
                <input
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik aksi atau dialog..."
                  disabled={isLoading}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-zinc-600 disabled:opacity-50"
                />
                <button onClick={handleSubmit} disabled={isLoading || !action.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-sm font-medium transition-all"
                >Kirim</button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-72 border-l border-zinc-800 bg-zinc-900/50 overflow-y-auto hidden md:block shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {[
                { key: 'stats' as GameTab, label: 'Status', icon: User },
                { key: 'inventory' as GameTab, label: 'Item', icon: BookOpen },
                { key: 'world' as GameTab, label: 'Dunia', icon: Map },
                { key: 'log' as GameTab, label: 'Catatan', icon: Scroll },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${activeTab === tab.key ? 'text-indigo-300 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                ><tab.icon size={12} /> {tab.label}</button>
              ))}
            </div>

            <div className="p-4 space-y-4">
              {/* All tab content */}
              <div className={activeTab === 'stats' ? '' : 'hidden'}>
                <div className="space-y-3">
                  {/* HP/STM/MP Bars */}
                  {statBars.filter(s => s.max > 0).map(bar => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">{bar.label}</span>
                        <span className="text-zinc-500">{bar.value}/{bar.max}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${bar.color}`} style={{ width: `${Math.min(100, (bar.value / bar.max) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    {mainStats.map(stat => (
                      <div key={stat.label} className="bg-zinc-800/50 rounded px-2 py-1.5 flex items-center justify-between">
                        <span className="text-xs text-zinc-400">{stat.label}</span>
                        <span className="text-xs font-medium text-zinc-200">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  {player.skills.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-zinc-400 mb-2">Skill</p>
                      <div className="space-y-1.5">
                        {player.skills.slice(0, 8).map((skill, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-zinc-300">{skill.name}</span>
                            <span className="text-xs text-indigo-400">Lv.{skill.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wealth */}
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
                    <span className="text-xs text-amber-400">💰 {player.wealth}</span>
                    <span className="text-xs text-zinc-500">Rep: {player.reputation}</span>
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className={activeTab === 'inventory' ? '' : 'hidden'}>
                {player.inventory.length === 0 ? (
                  <p className="text-xs text-zinc-600">Tidak ada item</p>
                ) : (
                  <div className="space-y-1.5">
                    {player.inventory.map((item, i) => (
                      <div key={item.id || i} className="flex items-center justify-between bg-zinc-800/30 rounded px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${item.rarity === 'legendary' ? 'text-amber-400' : item.rarity === 'epic' ? 'text-purple-400' : item.rarity === 'rare' ? 'text-indigo-400' : 'text-zinc-300'}`}>
                            {item.name}
                          </span>
                        </div>
                        {item.equipped && <span className="text-xs text-emerald-400">◆</span>}
                      </div>
                    ))}
                  </div>
                )}
                {player.relationships.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs font-medium text-zinc-400 mb-2">Relasi</p>
                    <div className="space-y-1.5">
                      {player.relationships.slice(0, 5).map((rel, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300">{rel.npcName}</span>
                          <span className={`${rel.affinity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {rel.affinity} · {rel.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* World */}
              <div className={activeTab === 'world' ? '' : 'hidden'}>
                <p className="text-xs font-medium text-zinc-400 mb-2">{world?.name}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{world?.description?.slice(0, 200)}</p>
                
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-zinc-400 font-medium">Sistem Kekuatan</p>
                  {world?.powerSystems?.map((ps, i) => (
                    <div key={i} className="text-xs text-zinc-500">
                      • {ps.name} — {ps.description?.slice(0, 80)}
                    </div>
                  ))}
                </div>

                {gameState.worldEvents.filter(e => !e.resolved).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-red-400 font-medium mb-1">Peristiwa Aktif</p>
                    {gameState.worldEvents.filter(e => !e.resolved).slice(0, 3).map((ev, i) => (
                      <div key={ev.id || i} className="text-xs text-zinc-400 mb-1">• {ev.title}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Log */}
              <div className={activeTab === 'log' ? '' : 'hidden'}>
                {player.quests.filter((q: Quest) => q.status === 'active').length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-amber-400 mb-2">Quest Aktif</p>
                    {player.quests.filter((q: Quest) => q.status === 'active').map((q: Quest, i: number) => (
                      <div key={q.id || i} className="text-xs text-zinc-300 mb-1">• {q.title}</div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Bab {gameState.currentChapter} · Waktu bermain: {formatTimePlayed(gameState.playTime)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parallel Story Overlay */}
      {hasParallelUnread && (
        <div className="fixed bottom-20 right-4 z-30">
          <button onClick={() => { setShowParallel(true); setActiveTab('log') }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-500 rounded-full text-xs font-medium shadow-lg shadow-indigo-900/40 animate-pulse"
          >
            <Eye size={14} /> Parallel Story
          </button>
        </div>
      )}

      {/* Saved Toast */}
      {savedToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="px-4 py-2 bg-emerald-900/80 border border-emerald-700/50 rounded-full text-xs text-emerald-300 shadow-lg">
            ✓ Tersimpan
          </div>
        </div>
      )}

      {/* Biography Modal */}
      {showBiography && deathRecord && (
        <Biography 
          gameState={gameState} 
          onClose={() => setShowBiography(false)}
          onExport={exportSave}
          onReturn={() => router.push('/')}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-zinc-900 border-l border-zinc-800 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-medium text-zinc-300">Menu</span>
              <button onClick={() => setShowMobileSidebar(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={18} />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {[
                { key: 'stats' as GameTab, label: 'Status', icon: User },
                { key: 'inventory' as GameTab, label: 'Item', icon: BookOpen },
                { key: 'world' as GameTab, label: 'Dunia', icon: Map },
                { key: 'log' as GameTab, label: 'Catatan', icon: Scroll },
              ].map(tab => (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key) }}
                  className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${activeTab === tab.key ? 'text-indigo-300 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                ><tab.icon size={12} /> {tab.label}</button>
              ))}
            </div>

            <div className="p-4 space-y-4">
              {/* Stats Tab */}
              <div className={activeTab === 'stats' ? '' : 'hidden'}>
                <div className="space-y-3">
                  {statBars.filter(s => s.max > 0).map(bar => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">{bar.label}</span>
                        <span className="text-zinc-500">{bar.value}/{bar.max}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${bar.color}`} style={{ width: `${Math.min(100, (bar.value / bar.max) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    {mainStats.map(stat => (
                      <div key={stat.label} className="bg-zinc-800/50 rounded px-2 py-1.5 flex items-center justify-between">
                        <span className="text-xs text-zinc-400">{stat.label}</span>
                        <span className="text-xs font-medium text-zinc-200">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {player.skills.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-zinc-400 mb-2">Skill</p>
                      <div className="space-y-1.5">
                        {player.skills.slice(0, 8).map((skill, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-zinc-300">{skill.name}</span>
                            <span className="text-xs text-indigo-400">Lv.{skill.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quests in Stats */}
                  {player.quests.filter(q => q.status === 'active').length > 0 && (
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1">
                        <Trophy size={12} /> Quest Aktif
                      </p>
                      {player.quests.filter(q => q.status === 'active').map((q, i) => (
                        <div key={q.id || i} className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-zinc-300 truncate">{q.title}</span>
                            <span className={`text-zinc-500 ${
                              q.difficulty === 'legendary' ? 'text-amber-400' :
                              q.difficulty === 'hard' ? 'text-red-400' :
                              q.difficulty === 'medium' ? 'text-yellow-400' : 'text-green-400'
                            }`}>{q.difficulty}</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, q.progress || 0)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
                    <span className="text-xs text-amber-400">💰 {player.wealth}</span>
                    <span className="text-xs text-zinc-500">Rep: {player.reputation}</span>
                  </div>
                </div>
              </div>

              {/* Inventory Tab */}
              <div className={activeTab === 'inventory' ? '' : 'hidden'}>
                {player.inventory.length === 0 ? (
                  <p className="text-xs text-zinc-600">Tidak ada item</p>
                ) : (
                  <div className="space-y-1.5">
                    {player.inventory.map((item, i) => (
                      <div key={item.id || i} className="flex items-center justify-between bg-zinc-800/30 rounded px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${item.rarity === 'legendary' ? 'text-amber-400' : item.rarity === 'epic' ? 'text-purple-400' : item.rarity === 'rare' ? 'text-indigo-400' : 'text-zinc-300'}`}>
                            {item.name}
                          </span>
                        </div>
                        {item.equipped && <span className="text-xs text-emerald-400">◆</span>}
                      </div>
                    ))}
                  </div>
                )}
                {player.relationships.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs font-medium text-zinc-400 mb-2">Relasi</p>
                    <div className="space-y-1.5">
                      {player.relationships.slice(0, 5).map((rel, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300">{rel.npcName}</span>
                          <span className={`${rel.affinity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {rel.affinity} · {rel.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* World Tab */}
              <div className={activeTab === 'world' ? '' : 'hidden'}>
                <p className="text-xs font-medium text-zinc-400 mb-2">{world?.name}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{world?.description?.slice(0, 200)}</p>
                
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-zinc-400 font-medium">Sistem Kekuatan</p>
                  {world?.powerSystems?.map((ps, i) => (
                    <div key={i} className="text-xs text-zinc-500">
                      • {ps.name} — {ps.description?.slice(0, 80)}
                    </div>
                  ))}
                </div>

                {gameState.worldEvents.filter(e => !e.resolved).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-red-400 font-medium mb-1">Peristiwa Aktif</p>
                    {gameState.worldEvents.filter(e => !e.resolved).slice(0, 3).map((ev, i) => (
                      <div key={ev.id || i} className="text-xs text-zinc-400 mb-1">• {ev.title}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Log Tab */}
              <div className={activeTab === 'log' ? '' : 'hidden'}>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Bab {gameState.currentChapter} · Waktu bermain: {formatTimePlayed(gameState.playTime)}
                </p>
                {parallelStories.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-indigo-400 mb-2 flex items-center gap-1">
                      <Eye size={12} /> Cerita Paralel
                    </p>
                    <div className="space-y-2">
                      {parallelStories.slice(-5).reverse().map((ps, i) => (
                        <div key={ps.id || i} className="p-2 bg-zinc-800/30 rounded text-xs">
                          <p className="text-indigo-300 font-medium mb-0.5">{ps.title}</p>
                          <p className="text-zinc-500 line-clamp-2">{ps.content.slice(0, 100)}{ps.censored ? ' ███' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GamePage() {
  return (
    <GameProvider>
      <GameUI />
    </GameProvider>
  )
}
