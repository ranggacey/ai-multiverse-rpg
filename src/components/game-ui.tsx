'use client'

import type { GameState, Weather, TimeOfDay, Quest, NPC, Item, Skill, CombatState, CombatEnemy, CombatLogEntry } from '@/lib/types'
import { WEATHER_ICONS, TIME_ICONS } from '@/lib/types'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useGame } from '@/lib/game-provider'
import Biography from '@/app/game/biography'
import { Heart, Zap, Swords, Users, Scroll, Star, Package, Skull, Trophy, Clock, Sparkles, ChevronRight, Menu, X, Coins, Volume2, VolumeX, Music, Speaker } from 'lucide-react'
import { getSettings, updateSettings, setAmbientTrack } from '@/lib/audio'
import type { AudioSettings } from '@/lib/audio'

interface GameUIProps {
  gameState: GameState
  error: string | null
}

// ── Story auto-scroll hook ──
function useAutoScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const isAtBottom = useRef(true)

  const handleScroll = useCallback(() => {
    if (!ref.current) return
    const { scrollTop, scrollHeight, clientHeight } = ref.current
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 80
  }, [])

  const scrollToBottom = useCallback((force = false) => {
    if (ref.current && (force || isAtBottom.current)) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [])

  return { ref, handleScroll, scrollToBottom }
}

// ── Quest badge color ──
function questBadgeColor(type: string) {
  switch (type) {
    case 'main': return 'bg-amber-600/30 text-amber-300 border-amber-600/40'
    case 'personal': return 'bg-purple-600/30 text-purple-300 border-purple-600/40'
    default: return 'bg-sky-600/30 text-sky-300 border-sky-600/40'
  }
}

// ── World event toast ──
function WorldEventToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="world-event-toast fixed top-4 right-4 z-50 px-4 py-3 bg-indigo-900/80 border border-indigo-500/30 rounded-lg backdrop-blur-md shadow-lg shadow-indigo-900/30 max-w-sm">
      <p className="text-xs text-indigo-200 font-medium mb-0.5">🌍 Peristiwa Dunia</p>
      <p className="text-sm text-zinc-100">{message}</p>
    </div>
  )
}

// ── Audio Settings Button + Panel ──
function AudioSettingsButton() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<AudioSettings>(getSettings())
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const update = (partial: Partial<AudioSettings>) => {
    const s = updateSettings(partial)
    setSettings(s)
  }

  const trackOptions: { value: string; label: string }[] = [
    { value: 'peaceful', label: '🌿 Damai' },
    { value: 'mysterious', label: '🌫️ Misterius' },
    { value: 'tense', label: '⚡ Tegang' },
    { value: 'combat', label: '⚔️ Bertarung' },
    { value: 'town', label: '🏘️ Kota' },
    { value: 'dungeon', label: '🏚️ Gua' },
    { value: 'night', label: '🌙 Malam' },
    { value: 'storm', label: '⛈️ Badai' },
  ]

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`p-1.5 rounded-lg transition-colors ${
          settings.muted ? 'text-red-400 hover:text-red-300' : 'text-zinc-500 hover:text-zinc-200'
        }`}
        title="Pengaturan Audio"
      >
        {settings.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl shadow-black/40 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="text-xs font-medium text-zinc-300 mb-3">🎵 Pengaturan Audio</p>

          {/* Master Volume */}
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
              <span>Volume</span>
              <span>{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.muted ? 0 : settings.masterVolume}
              onChange={e => update({ masterVolume: parseFloat(e.target.value), muted: false })}
              className="w-full h-1 appearance-none bg-zinc-700 rounded-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Mute */}
          <button
            onClick={() => update({ muted: !settings.muted })}
            className={`w-full text-xs px-2 py-1.5 rounded-lg mb-2 transition-colors ${
              settings.muted
                ? 'bg-red-900/30 text-red-300 border border-red-800/30'
                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {settings.muted ? '🔇 Matikan Mute' : '🔊 Mute'}
          </button>

          {/* Separate volumes */}
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center gap-2">
              <Music size={12} className="text-indigo-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.ambientVolume}
                onChange={e => update({ ambientVolume: parseFloat(e.target.value) })}
                className="flex-1 h-1 appearance-none bg-zinc-700 rounded-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[9px] text-zinc-500 w-7 text-right">{Math.round(settings.ambientVolume * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Speaker size={12} className="text-emerald-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={e => update({ sfxVolume: parseFloat(e.target.value) })}
                className="flex-1 h-1 appearance-none bg-zinc-700 rounded-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[9px] text-zinc-500 w-7 text-right">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
          </div>

          {/* Ambient Track Select */}
          <div className="border-t border-zinc-800 pt-2">
            <p className="text-[10px] text-zinc-500 mb-1.5">🎼 Suasana</p>
            <div className="grid grid-cols-2 gap-1">
              {trackOptions.map(t => (
                <button
                  key={t.value}
                  onClick={() => setAmbientTrack(t.value as any)}
                  className={`text-[10px] px-1.5 py-1 rounded transition-colors text-left ${
                    settings.currentAmbientTrack === t.value
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-600/30'
                      : 'bg-zinc-800/30 text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Combat UI ──
function CombatPanel({ combat, enemy, playerSkills, playerInventory }: { combat: CombatState; enemy: CombatEnemy; playerSkills: Skill[]; playerInventory: Item[] }) {
  const { combatAction } = useGame()

  const enemyHpPct = (combat.enemyHp / combat.enemyMaxHp) * 100
  const playerHpPct = (combat.playerHp / combat.playerMaxHp) * 100
  const playerManaPct = combat.playerMaxMana > 0 ? (combat.playerMana / combat.playerMaxMana) * 100 : 0

  const logEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [combat.combatLog.length])

  return (
    <div className="flex flex-col h-full">
      {/* Enemy info */}
      <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-red-400" />
            <span className="font-medium text-sm text-red-200">{enemy.name}</span>
          </div>
          <span className="text-xs text-zinc-500">Lv.{enemy.level}</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${enemyHpPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-0.5">
          <span>HP</span>
          <span>{combat.enemyHp}/{combat.enemyMaxHp}</span>
        </div>
      </div>

      {/* Combat log */}
      <div className="flex-1 overflow-y-auto space-y-1 mb-3 text-xs pr-1">
        {combat.combatLog.map((entry, i) => (
          <div key={entry.id || i} className={`px-2 py-1 rounded ${
            entry.type === 'victory' ? 'bg-emerald-900/20 text-emerald-300' :
            entry.type === 'defeat' ? 'bg-red-900/20 text-red-300' :
            entry.type.includes('crit') ? 'bg-yellow-900/20 text-yellow-300' :
            entry.type.includes('heal') ? 'bg-green-900/20 text-green-300' :
            entry.type === 'status' ? 'text-zinc-400' : 'text-zinc-300'
          }`}>
            {entry.message}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Player HP/MP */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${playerHpPct}%` }} />
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">HP {combat.playerHp}/{combat.playerMaxHp}</p>
        </div>
        <div className="flex-1">
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${playerManaPct}%` }} />
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">MP {combat.playerMana}/{combat.playerMaxMana}</p>
        </div>
      </div>

      {/* Actions */}
      {combat.turn === 'player' ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => combatAction('attack')} className="px-3 py-2 bg-red-600/40 hover:bg-red-600/60 border border-red-600/30 rounded text-xs text-red-200 font-medium transition-all active:scale-95">
              ⚔️ Serang
            </button>
            <button onClick={() => combatAction('flee')} className="px-3 py-2 bg-zinc-700/40 hover:bg-zinc-700/60 border border-zinc-600/30 rounded text-xs text-zinc-300 transition-all active:scale-95">
              🏃 Kabur
            </button>
          </div>
          {/* Skills */}
          {(() => {
            const combatSkills = playerSkills.filter(s => s.type === 'combat' || s.type === 'magic')
            if (combatSkills.length === 0) return null
            return (
              <div className="grid grid-cols-2 gap-1">
                {combatSkills.slice(0, 4).map((s: any) => (
                  <button key={s.id || s.name} onClick={() => combatAction('skill', s.id)} className="px-2 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-600/30 rounded text-[10px] text-purple-200 transition-all active:scale-95 truncate">
                    ✨ {s.name}
                  </button>
                ))}
              </div>
            )
          })()}
          {/* Items */}
          {(() => {
            const usable = playerInventory.filter((i: any) => i.healAmount || i.spellType)
            if (usable.length === 0) return null
            return (
              <div className="grid grid-cols-2 gap-1">
                {usable.slice(0, 4).map((item: any) => (
                  <button key={item.id} onClick={() => combatAction('item', item.id)} className="px-2 py-1.5 bg-green-600/30 hover:bg-green-600/50 border border-green-600/30 rounded text-[10px] text-green-200 transition-all active:scale-95 truncate">
                    🧪 {item.name}
                  </button>
                ))}
              </div>
            )
          })()}
        </div>
      ) : (
        <p className="text-center text-xs text-zinc-500 animate-pulse">Musuh sedang bergerak...</p>
      )}
    </div>
  )
}

// ── Main Game UI ──
export function GameUI({ gameState, error }: GameUIProps) {
  const { submitAction, saveCurrentGame } = useGame()
  const [showBiography, setShowBiography] = useState(false)
  const [input, setInput] = useState('')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [worldEvents, setWorldEvents] = useState<string[]>([])
  const [showInventory, setShowInventory] = useState(false)
  const [showSkills, setShowSkills] = useState(false)
  const [showQuests, setShowQuests] = useState(false)

  // Quick action cooldowns
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})

  // Typewriter state for latest narration
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typewriterRef = useRef<number | null>(null)

  const { ref: storyRef, handleScroll, scrollToBottom } = useAutoScroll()
  const prevStoryLen = useRef(gameState.storyLog.length)

  // Auto-scroll when new story
  useEffect(() => {
    if (gameState.storyLog.length > prevStoryLen.current) {
      scrollToBottom()
      prevStoryLen.current = gameState.storyLog.length
    }
  }, [gameState.storyLog.length, scrollToBottom])

  // Typewriter effect on latest narration
  useEffect(() => {
    const latestLog = gameState.storyLog[gameState.storyLog.length - 1]
    if (!latestLog || latestLog.content === displayedText) return

    setIsTyping(true)
    setDisplayedText('')
    let idx = 0
    const chars = latestLog.content

    typewriterRef.current = window.setInterval(() => {
      idx++
      setDisplayedText(chars.slice(0, idx))
      scrollToBottom()
      if (idx >= chars.length) {
        clearInterval(typewriterRef.current!)
        setIsTyping(false)
      }
    }, 15)

    return () => { if (typewriterRef.current) clearInterval(typewriterRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.storyLog.length])

  // Detect world events from story
  useEffect(() => {
    const latestLog = gameState.storyLog[gameState.storyLog.length - 1]
    if (latestLog && latestLog.type === 'world') {
      setWorldEvents(prev => [...prev, latestLog.content])
    }
  }, [gameState.storyLog])

  const removeWorldEvent = (idx: number) => {
    setWorldEvents(prev => prev.filter((_, i) => i !== idx))
  }

  // Submit action
  const handleSubmit = async (action?: string) => {
    const cmd = (action || input).trim()
    if (!cmd) return
    setInput('')
    await submitAction(cmd)
    scrollToBottom(true)
  }

  // Quick action with cooldown
  const quickAction = async (label: string) => {
    if (cooldowns[label]) return
    setCooldowns(prev => ({ ...prev, [label]: 5 }))
    const timer = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev }
        if (next[label] <= 1) {
          clearInterval(timer)
          delete next[label]
        } else {
          next[label]--
        }
        return next
      })
    }, 1000)
    await handleSubmit(label)
  }

  // Key handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const { player, world, storyLog, combat, npcs, quests } = gameState
  const inCombat = combat?.inCombat && combat.enemy
  const w = world
  const weatherIcon = w?.weather ? WEATHER_ICONS[w.weather as Weather] || '☀️' : '☀️'
  const timeIcon = w?.timeOfDay ? TIME_ICONS[w.timeOfDay as TimeOfDay] || '🌅' : '🌅'

  const latestNarration = storyLog[storyLog.length - 1]
  const prevLogs = storyLog.slice(0, -5).reverse()

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* World event toasts */}
      {worldEvents.map((evt, i) => (
        <WorldEventToast key={`${evt}-${i}`} message={evt} onDone={() => removeWorldEvent(i)} />
      ))}

      {/* ── MAIN PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1 text-zinc-400 hover:text-zinc-200" onClick={() => setShowMobileSidebar(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-bold text-indigo-300 truncate">{world?.name || 'AI Multiverse RPG'}</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-500">
              <span>{weatherIcon}</span>
              <span>{timeIcon}</span>
              <span className="capitalize">{w?.weather || 'cerah'}</span>
              <span className="text-zinc-700">·</span>
              <span className="capitalize">{w?.timeOfDay || 'pagi'}</span>
              <span className="text-zinc-700">·</span>
              <span className="capitalize">{w?.season || ''}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!inCombat && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {player.location}
              </span>
            )}
            {/* Audio Settings Toggle */}
            <AudioSettingsButton />
          </div>
        </div>

        {/* Story area */}
        <div
          ref={storyRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
        >
          {/* Error banner */}
          {error && (
            <div className="bg-red-950/40 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Combat UI */}
          {inCombat && combat.enemy ? (
            <div className="bg-zinc-900/70 border border-red-900/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Swords size={18} className="text-red-400" />
                <span className="text-sm font-semibold text-red-300">⚔️ Pertarungan!</span>
                <span className="text-xs text-zinc-500">Giliran ke-{combat.turnCount + 1}</span>
              </div>
              <CombatPanel combat={combat} enemy={combat.enemy} playerSkills={gameState.player.skills || []} playerInventory={gameState.player.inventory || []} />
            </div>
          ) : null}

          {/* Previous story logs (reversed, showing recent) */}
          {prevLogs.slice(0, 10).map((log, i) => (
            <div key={log.id || i} className="text-sm text-zinc-400 leading-relaxed story-fade-in opacity-60">
              {log.content.slice(0, 300)}
            </div>
          ))}

          {/* Latest narration with typewriter */}
          {latestNarration && (
            <div className="text-sm text-zinc-200 leading-relaxed story-fade-in">
              <span>
                {isTyping ? displayedText : latestNarration.content}
              </span>
              {isTyping && <span className="typewriter-cursor" />}
            </div>
          )}

          {!latestNarration && (
            <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
              <p>Ketik aksi untuk memulai petualangan...</p>
            </div>
          )}
        </div>

        {/* Input area */}
        {!inCombat && (
          <div className="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm px-4 py-3">
            {/* Quick actions */}
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { label: 'Jelajahi', icon: '🗺️' },
                { label: 'Bicara', icon: '💬' },
                { label: 'Bertarung', icon: '⚔️' },
                { label: 'Bersantai', icon: '🧘' },
                { label: 'Belanja', icon: '🛒' },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => quickAction(label)}
                  disabled={!!cooldowns[label]}
                  className={`quick-action-btn px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    cooldowns[label]
                      ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                      : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-600/20'
                  }`}
                >
                  {cooldowns[label] ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {cooldowns[label]}s
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      {icon} {label}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik aksi karakter kamu..."
                className="flex-1 bg-zinc-800/60 border border-zinc-700 hover:border-zinc-600 focus:border-indigo-500/50 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                disabled={!gameState.isAlive}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!input.trim() || !gameState.isAlive}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg transition-all active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Game over / dead state */}
        {!gameState.isAlive && (
          <div className="border-t border-red-900/30 bg-red-950/20 px-4 py-4 text-center">
            <Skull size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-300 font-medium mb-1">☠️ Karakter telah gugur</p>
            <p className="text-xs text-zinc-500 mb-3">{gameState.deathRecord?.cause}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setShowBiography(true)} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded transition-colors">
                📖 Biografi
              </button>
              <button onClick={() => window.location.reload()} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs rounded transition-colors">
                🔄 Kembali ke Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="hidden md:flex w-72 lg:w-80 border-l border-zinc-800 bg-zinc-900/30 flex-col overflow-hidden">
        <SidebarContent
          gameState={gameState}
          showBiography={showBiography}
          setShowBiography={setShowBiography}
          showInventory={showInventory}
          setShowInventory={setShowInventory}
          showSkills={showSkills}
          setShowSkills={setShowSkills}
          showQuests={showQuests}
          setShowQuests={setShowQuests}
          weatherIcon={weatherIcon}
          timeIcon={timeIcon}
        />
      </div>

      {/* ── MOBILE SIDEBAR (drawer) ── */}
      {showMobileSidebar && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setShowMobileSidebar(false)} />
          <div className="fixed right-0 top-0 z-50 h-full w-72 max-w-[80vw] bg-zinc-900 border-l border-zinc-800 overflow-y-auto md:hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-3 border-b border-zinc-800">
              <span className="text-sm font-medium text-zinc-300">Menu</span>
              <button onClick={() => setShowMobileSidebar(false)} className="p-1 text-zinc-400 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>
            <SidebarContent
              gameState={gameState}
              showBiography={showBiography}
              setShowBiography={setShowBiography}
              showInventory={showInventory}
              setShowInventory={setShowInventory}
              showSkills={showSkills}
              setShowSkills={setShowSkills}
              showQuests={showQuests}
              setShowQuests={setShowQuests}
              weatherIcon={weatherIcon}
              timeIcon={timeIcon}
            />
          </div>
        </>
      )}

      {/* ── BIOGRAPHY MODAL ── */}
      {showBiography && (
        <Biography gameState={gameState} onClose={() => setShowBiography(false)} onExport={() => {}} onReturn={() => window.location.reload()} />
      )}
    </div>
  )
}

// ── Sidebar content shared between mobile & desktop ──
function SidebarContent({
  gameState,
  showBiography,
  setShowBiography,
  showInventory,
  setShowInventory,
  showSkills,
  setShowSkills,
  showQuests,
  setShowQuests,
  weatherIcon,
  timeIcon,
}: {
  gameState: GameState
  showBiography: boolean
  setShowBiography: (v: boolean) => void
  showInventory: boolean
  setShowInventory: (v: boolean) => void
  showSkills: boolean
  setShowSkills: (v: boolean) => void
  showQuests: boolean
  setShowQuests: (v: boolean) => void
  weatherIcon: string
  timeIcon: string
}) {
  const { player, world, npcs, quests, combat, currentChapter, playTime } = gameState
  const inCombat = combat?.inCombat

  const hpPct = player.maxHealth ? (player.health || 0) / player.maxHealth * 100 : 100
  const manaPct = player.maxMana ? (player.mana || 0) / player.maxMana * 100 : 0
  const xpPct = player.xpToNext ? ((player.xp || 0) / player.xpToNext) * 100 : 0

  const activeQuests = (quests || []).filter(q => q.status === 'active')
  const knownNpcs = (npcs || []).slice(0, 10)

  return (
    <div className="p-3 space-y-4 overflow-y-auto h-full">
      {/* Player portrait + name */}
      <div className="text-center pb-2 border-b border-zinc-800">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-1.5 flex items-center justify-center text-lg">
          {player.name?.charAt(0) || '?'}
        </div>
        <p className="font-semibold text-sm text-zinc-200">{player.name}</p>
        <p className="text-[10px] text-zinc-500">{player.background?.type} — Lv.{player.level || 1}</p>
      </div>

      {/* Weather / Time chip */}
      <div className="flex items-center gap-2 justify-center text-xs text-zinc-400 flex-wrap">
        <span>{weatherIcon} <span className="capitalize">{world?.weather || 'cerah'}</span></span>
        <span className="text-zinc-700">|</span>
        <span>{timeIcon} <span className="capitalize">{world?.timeOfDay || 'pagi'}</span></span>
        {world?.season && (
          <>
            <span className="text-zinc-700">|</span>
            <span className="capitalize">{world.season}</span>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {/* HP */}
        <div>
          <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
            <span className="flex items-center gap-1"><Heart size={10} className="text-red-400" /> HP</span>
            <span>{player.health || 0}/{player.maxHealth || 100}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all" style={{ width: `${hpPct}%` }} />
          </div>
        </div>
        {/* Mana */}
        <div>
          <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
            <span className="flex items-center gap-1"><Zap size={10} className="text-blue-400" /> MP</span>
            <span>{player.mana || 0}/{player.maxMana || 100}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: `${manaPct}%` }} />
          </div>
        </div>
        {/* XP */}
        {player.xp !== undefined && (
          <div>
            <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
              <span className="flex items-center gap-1"><Star size={10} className="text-amber-400" /> XP</span>
              <span>{player.xp}/{player.xpToNext || 100}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Core stats */}
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div className="px-2 py-1.5 bg-zinc-800/40 rounded flex justify-between">
          <span className="text-zinc-500">STR</span>
          <span className="text-zinc-200 font-medium">{player.stats?.str ?? 5}</span>
        </div>
        <div className="px-2 py-1.5 bg-zinc-800/40 rounded flex justify-between">
          <span className="text-zinc-500">AGI</span>
          <span className="text-zinc-200 font-medium">{player.stats?.agi ?? 5}</span>
        </div>
        <div className="px-2 py-1.5 bg-zinc-800/40 rounded flex justify-between">
          <span className="text-zinc-500">INT</span>
          <span className="text-zinc-200 font-medium">{player.stats?.int ?? 5}</span>
        </div>
        <div className="px-2 py-1.5 bg-zinc-800/40 rounded flex justify-between">
          <span className="text-zinc-500">CHA</span>
          <span className="text-zinc-200 font-medium">{player.stats?.cha ?? 5}</span>
        </div>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="flex items-center gap-1 text-zinc-500">
          <Coins size={10} /> {player.wealth || 0}
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <Clock size={10} /> Bab {currentChapter}
        </div>
      </div>

      {/* Biography button */}
      <button onClick={() => setShowBiography(true)} className="w-full px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/20 rounded text-xs text-indigo-200 transition-colors">
        📖 Biografi & Statistik
      </button>

      {/* ── QUESTS ── */}
      <div>
        <button onClick={() => setShowQuests(!showQuests)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-2 w-full text-left">
          <Scroll size={14} className="text-amber-400" /> Quest {activeQuests.length > 0 && <span className="text-amber-400">({activeQuests.length})</span>}
          <ChevronRight size={12} className={`ml-auto transition-transform ${showQuests ? 'rotate-90' : ''}`} />
        </button>
        {showQuests && (
          <div className="space-y-1.5">
            {activeQuests.length === 0 ? (
              <p className="text-[10px] text-zinc-600 italic">Belum ada quest aktif</p>
            ) : activeQuests.map((q, i) => (
              <div key={q.id || i} className="px-2 py-1.5 bg-zinc-800/40 rounded border border-zinc-800">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-zinc-200 truncate">{q.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${questBadgeColor(q.type)}`}>{q.type}</span>
                </div>
                <p className="text-[10px] text-zinc-500 line-clamp-1">{q.description}</p>
                <div className="w-full h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(q.progress / Math.max(q.maxProgress, 1)) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-zinc-600 mt-0.5">
                  <span>Progress</span>
                  <span>{q.progress}/{q.maxProgress}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── NPCs ── */}
      {knownNpcs.length > 0 && (
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-2">
            <Users size={14} className="text-sky-400" /> NPC Dikenal ({knownNpcs.length})
          </h4>
          <div className="space-y-1">
            {knownNpcs.map((npc, i) => (
              <div key={npc.id || i} className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  npc.relationship === 'teman' ? 'bg-emerald-400' :
                  npc.relationship === 'musuh' ? 'bg-red-400' : 'bg-zinc-500'
                }`} />
                <span className="text-zinc-200 flex-1 truncate">{npc.name}</span>
                <span className="text-[9px] text-zinc-500 capitalize">{npc.relationship}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INVENTORY ── */}
      <div>
        <button onClick={() => setShowInventory(!showInventory)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-2 w-full text-left">
          <Package size={14} className="text-emerald-400" /> Inventory ({(player.inventory || []).length})
          <ChevronRight size={12} className={`ml-auto transition-transform ${showInventory ? 'rotate-90' : ''}`} />
        </button>
        {showInventory && (
          <div className="space-y-1">
            {(player.inventory || []).length === 0 ? (
              <p className="text-[10px] text-zinc-600 italic">Kosong</p>
            ) : (player.inventory || []).map((item, i) => (
              <div key={item.id || i} className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  item.rarity === 'rare' ? 'bg-blue-400' :
                  item.rarity === 'epic' ? 'bg-purple-400' :
                  item.rarity === 'legendary' ? 'bg-amber-400' : 'bg-zinc-500'
                }`} />
                <span className="text-zinc-200 flex-1 truncate">{item.name}</span>
                {item.equipped && <span className="text-[9px] text-indigo-400">[equipped]</span>}
                {item.attack && <span className="text-[9px] text-red-400">ATK+{item.attack}</span>}
                {item.defense && <span className="text-[9px] text-blue-400">DEF+{item.defense}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SKILLS ── */}
      <div>
        <button onClick={() => setShowSkills(!showSkills)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-2 w-full text-left">
          <Star size={14} className="text-amber-400" /> Skills ({(player.skills || []).length})
          <ChevronRight size={12} className={`ml-auto transition-transform ${showSkills ? 'rotate-90' : ''}`} />
        </button>
        {showSkills && (
          <div className="space-y-1">
            {(player.skills || []).length === 0 ? (
              <p className="text-[10px] text-zinc-600 italic">Belum ada skill</p>
            ) : (player.skills || []).map((skill, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded text-xs">
                <Sparkles size={12} className="text-indigo-400" />
                <span className="text-zinc-200 flex-1">{skill.name}</span>
                <span className="text-[9px] text-zinc-500">Lv.{skill.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}