'use client'

import { formatDate, formatTimePlayed } from '@/lib/game'
import type { GameState } from '@/lib/types'
import { X, Scroll, Skull, Trophy, Clock, Map, Heart, Star, Swords, Users } from 'lucide-react'

interface BiographyProps {
  gameState: GameState
  onClose: () => void
  onExport: () => void
  onReturn: () => void
}

export default function Biography({ gameState, onClose, onExport, onReturn }: BiographyProps) {
  const { player, world, storyLog, deathRecord, currentChapter, playTime } = gameState

  if (!deathRecord) return null

  // Calculate lifetime stats
  const storiesTold = storyLog.length
  const parallelCount = storyLog.filter(l => l.type === 'parallel').length
  const relationshipsCount = gameState.npcs?.length || 0
  const itemsCollected = (player.inventory || []).length
  const skillsLearned = (player.skills || []).length
  const questsCompleted = gameState.quests?.filter(q => q.status === 'completed').length || 0
  const questsFailed = gameState.quests?.filter(q => q.status === 'failed').length || 0

  // Timeline: filter significant events
  const timeline = storyLog.filter(l => 
    l.type === 'event' || l.type === 'battle' || l.type === 'timeSkip' || l.type === 'main'
  ).slice(-20)

  // Achievements based on gameplay
  const gameAchievements = gameState.achievements || []
  const achievements = gameAchievements.length > 0 
    ? gameAchievements.map(a => `${a.icon} ${a.name} — ${a.description}`)
    : deathRecord.achievements.length > 0 ? deathRecord.achievements : [
    ...(currentChapter >= 3 ? [`Bertahan hingga Bab ${currentChapter}`] : []),
    ...(storiesTold >= 20 ? ['Menulis lebih dari 20 catatan sejarah'] : []),
    ...(skillsLearned >= 3 ? [`Menguasai ${skillsLearned} skill`] : []),
    ...(relationshipsCount >= 3 ? [`Menjalin ${relationshipsCount} hubungan`] : []),
    ...(relationshipsCount >= 1 ? [`Bertemu ${relationshipsCount} karakter`] : []),
    ...(itemsCollected >= 5 ? [`Mengoleksi ${itemsCollected} item`] : []),
    ...(parallelCount >= 2 ? [`Menyingkap ${parallelCount} cerita paralel`] : []),
    ...(questsCompleted >= 2 ? [`Menyelesaikan ${questsCompleted} quest`] : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-red-900/20">
        {/* Header */}
        <div className="relative px-6 py-8 text-center border-b border-zinc-800 bg-gradient-to-b from-red-950/30 to-transparent">
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <Skull size={40} className="text-red-400/80" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Skull size={40} className="text-red-500" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">Biografi {player.name}</h2>
          <p className="text-zinc-500 text-sm mt-1">Telah gugur di dunia {world?.name}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-zinc-500">
            <span>Usia {deathRecord.age} tahun</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>{formatDate(deathRecord.date)}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Bab {currentChapter}</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          {/* Cause of Death */}
          <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Skull size={16} className="text-red-400" />
              <span className="text-sm font-medium text-red-300">Penyebab Kematian</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{deathRecord.cause}</p>
          </div>

          {/* Life Story */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scroll size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-zinc-200">Kisah Hidup</span>
            </div>
            <div className="p-4 bg-zinc-800/30 border border-zinc-800 rounded-xl">
              <p className="text-sm text-zinc-400 leading-relaxed italic">
                &ldquo;{deathRecord.story}&rdquo;
              </p>
            </div>
          </div>

          {/* Legacy */}
          {deathRecord.legacy && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} className="text-amber-400" />
                <span className="text-sm font-medium text-zinc-200">Warisan</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{deathRecord.legacy}</p>
            </div>
          )}

          {/* Life Stats Grid */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-red-400" />
              <span className="text-sm font-medium text-zinc-200">Statistik Hidup</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Cerita', value: storiesTold, icon: Scroll, color: 'text-indigo-400' },
                { label: 'Skill', value: skillsLearned, icon: Star, color: 'text-amber-400' },
                { label: 'Item', value: itemsCollected, icon: Swords, color: 'text-emerald-400' },
                { label: 'Relasi', value: relationshipsCount, icon: Users, color: 'text-sky-400' },
                { label: 'Quest Selesai', value: questsCompleted, icon: Trophy, color: 'text-yellow-400' },
                { label: 'Quest Gagal', value: questsFailed, icon: Trophy, color: 'text-red-400' },
                { label: 'Cerita Paralel', value: parallelCount, icon: Map, color: 'text-purple-400' },
                { label: 'Waktu Bermain', value: formatTimePlayed(playTime), icon: Clock, color: 'text-zinc-400' },
              ].map((stat, i) => (
                <div key={i} className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-lg text-center">
                  <stat.icon size={18} className={`${stat.color} mx-auto mb-1`} />
                  <p className="text-lg font-bold text-zinc-200">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Final Stats */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-indigo-400" />
              <span className="text-sm font-medium text-zinc-200">Status Akhir</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'STR', value: player.stats?.str ?? 0 },
                { label: 'AGI', value: player.stats?.agi ?? 0 },
                { label: 'INT', value: player.stats?.int ?? 0 },
                { label: 'CHA', value: player.stats?.cha ?? 0 },
                { label: 'HP', value: player.health ?? 0 },
                { label: 'Lv. Skill', value: skillsLearned },
                { label: 'Item', value: itemsCollected },
                { label: 'Kekayaan', value: `${player.wealth ?? 0}` },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-800/30 rounded text-xs">
                  <span className="text-zinc-500">{stat.label}</span>
                  <span className="text-zinc-200 font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} className="text-yellow-400" />
              <span className="text-sm font-medium text-zinc-200">Pencapaian</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {achievements.map((ach, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/30 border border-zinc-800 rounded-lg">
                  <Trophy size={14} className="text-yellow-500 shrink-0" />
                  <span className="text-xs text-zinc-300">{ach}</span>
                </div>
              ))}
              {achievements.length === 0 && (
                <p className="text-xs text-zinc-600 col-span-2">Belum ada pencapaian</p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-indigo-400" />
              <span className="text-sm font-medium text-zinc-200">Garis Waktu</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {timeline.map((log, i) => (
                <div key={log.id || i} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1 ${
                      log.type === 'battle' ? 'bg-red-500' : 
                      log.type === 'timeSkip' ? 'bg-zinc-600' : 'bg-indigo-500'
                    }`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-zinc-800" />}
                  </div>
                  <div className="pb-2 flex-1 min-w-0">
                    <p className="text-zinc-600">{formatDate(log.date)}</p>
                    <p className="text-zinc-300 truncate">{typeof log.content === 'string' ? log.content.slice(0, 120) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 flex gap-3 justify-center">
          <button onClick={onExport}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
          >
            Simpan Biografi
          </button>
          <button onClick={onReturn}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  )
}
