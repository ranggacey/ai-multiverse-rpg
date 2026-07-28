'use client'

// Audio Manager — Web Audio API untuk ambient & SFX tanpa file eksternal
// Mendukung: musik ambient (prosedural), SFX (tone-based), volume, mute, persistensi

export type AudioCategory = 'master' | 'music' | 'sfx' | 'ambient'
export type AmbientTrack = 'peaceful' | 'mysterious' | 'tense' | 'combat' | 'town' | 'dungeon' | 'night' | 'storm'

export interface AudioSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  ambientVolume: number
  muted: boolean
  currentAmbientTrack: AmbientTrack | null
  ambientEnabled: boolean
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.5,
  musicVolume: 0.4,
  sfxVolume: 0.5,
  ambientVolume: 0.3,
  muted: false,
  currentAmbientTrack: 'peaceful',
  ambientEnabled: true,
}

const STORAGE_KEY = 'ai-multiverse-audio-settings'

// Web Audio API context
let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let musicGain: GainNode | null = null
let sfxGain: GainNode | null = null
let ambientGain: GainNode | null = null

// Ambient music generators
let ambientSource: AudioBufferSourceNode | null = null
let currentAmbientGain: GainNode | null = null
let currentAmbientTrack: AmbientTrack | null = null
let ambientInterval: number | null = null

// Load settings from localStorage
function loadSettings(): AudioSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch {}
  return DEFAULT_SETTINGS
}

function saveSettings(settings: AudioSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    masterGain = audioCtx.createGain()
    musicGain = audioCtx.createGain()
    sfxGain = audioCtx.createGain()
    ambientGain = audioCtx.createGain()

    masterGain.connect(audioCtx.destination)
    musicGain.connect(masterGain)
    sfxGain.connect(masterGain)
    ambientGain.connect(masterGain)
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function applyVolumes(settings: AudioSettings): void {
  if (!masterGain || !musicGain || !sfxGain || !ambientGain) return
  const master = settings.muted ? 0 : settings.masterVolume
  masterGain.gain.value = master
  musicGain.gain.value = settings.musicVolume
  sfxGain.gain.value = settings.sfxVolume
  ambientGain.gain.value = settings.ambientVolume
}

// Procedural ambient music generation using Web Audio API
function generateAmbientBuffer(ctx: AudioContext, track: AmbientTrack, duration: number = 30): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * duration
  const buffer = ctx.createBuffer(2, length, sampleRate)

  // Track configurations
  const configs: Record<AmbientTrack, {
    baseFreq: number
    harmonics: number[]
    tempo: number
    variation: number
    filterFreq: number
    filterQ: number
  }> = {
    peaceful: { baseFreq: 110, harmonics: [1, 2, 3, 4], tempo: 0.15, variation: 0.1, filterFreq: 800, filterQ: 0.5 },
    mysterious: { baseFreq: 82, harmonics: [1, 1.5, 2, 3], tempo: 0.1, variation: 0.2, filterFreq: 600, filterQ: 1 },
    tense: { baseFreq: 55, harmonics: [1, 2, 3, 5], tempo: 0.3, variation: 0.3, filterFreq: 400, filterQ: 2 },
    combat: { baseFreq: 73, harmonics: [1, 2, 4, 8], tempo: 0.5, variation: 0.4, filterFreq: 1000, filterQ: 3 },
    town: { baseFreq: 146, harmonics: [1, 2, 3, 4, 5], tempo: 0.2, variation: 0.15, filterFreq: 1200, filterQ: 0.7 },
    dungeon: { baseFreq: 65, harmonics: [1, 1.5, 2, 2.5], tempo: 0.08, variation: 0.1, filterFreq: 300, filterQ: 1.5 },
    night: { baseFreq: 98, harmonics: [1, 2, 3], tempo: 0.07, variation: 0.05, filterFreq: 500, filterQ: 0.3 },
    storm: { baseFreq: 44, harmonics: [1, 2, 3, 4, 6], tempo: 0.25, variation: 0.5, filterFreq: 800, filterQ: 1 },
  }

  const config = configs[track]
  const channelDataL = buffer.getChannelData(0)
  const channelDataR = buffer.getChannelData(1)

  // Generate procedural ambient using additive synthesis + noise
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate
    let sample = 0

    // Base drone with slow modulation
    for (const harmonic of config.harmonics) {
      const freq = config.baseFreq * harmonic
      const modFreq = config.tempo * harmonic * 0.5
      const modDepth = config.variation * 0.5
      const mod = Math.sin(2 * Math.PI * modFreq * t) * modDepth + 1
      sample += Math.sin(2 * Math.PI * freq * t * mod) * (0.15 / harmonic)
    }

    // Subtle noise texture
    const noise = (Math.random() * 2 - 1) * 0.02
    sample += noise

    // Stereo spread
    const spread = 0.1 * Math.sin(2 * Math.PI * 0.02 * t)
    channelDataL[i] = sample * (1 - spread)
    channelDataR[i] = sample * (1 + spread)
  }

  return buffer
}

function playAmbientTrack(track: AmbientTrack, settings: AudioSettings): void {
  const ctx = getAudioContext()

  // Stop current ambient
  stopAmbient()

  currentAmbientTrack = track

  // Generate buffer and play looping
  const buffer = generateAmbientBuffer(ctx, track, 60) // 60 second loop
  ambientSource = ctx.createBufferSource()
  ambientSource.buffer = buffer
  ambientSource.loop = true
  ambientSource.loopStart = 0
  ambientSource.loopEnd = 60

  currentAmbientGain = ctx.createGain()
  currentAmbientGain.gain.value = settings.ambientVolume * settings.masterVolume

  ambientSource.connect(currentAmbientGain)
  currentAmbientGain.connect(masterGain!)

  ambientSource.start(0)

  // Crossfade to new track every loop for variation
  ambientInterval = window.setInterval(() => {
    if (!ambientSource || !currentAmbientGain) return
    // Slight parameter variation on each loop for organic feel
    const newBuffer = generateAmbientBuffer(ctx, track, 60)
    const newSource = ctx.createBufferSource()
    newSource.buffer = newBuffer
    newSource.loop = true
    newSource.loopStart = 0
    newSource.loopEnd = 60

    const newGain = ctx.createGain()
    newGain.gain.value = 0

    newSource.connect(newGain)
    newGain.connect(masterGain!)

    // Crossfade
    const fadeTime = 5 // seconds
    const now = ctx.currentTime
    currentAmbientGain.gain.linearRampToValueAtTime(0, now + fadeTime)
    newGain.gain.linearRampToValueAtTime(settings.ambientVolume * settings.masterVolume, now + fadeTime)

    newSource.start(now, 0)

    // Cleanup old
    setTimeout(() => {
      ambientSource?.stop()
      ambientSource = newSource
      currentAmbientGain = newGain
    }, fadeTime * 1000)
  }, 60000)
}

function stopAmbient(): void {
  if (ambientSource) {
    ambientSource.stop()
    ambientSource.disconnect()
    ambientSource = null
  }
  if (currentAmbientGain) {
    currentAmbientGain.disconnect()
    currentAmbientGain = null
  }
  if (ambientInterval) {
    clearInterval(ambientInterval)
    ambientInterval = null
  }
  currentAmbientTrack = null
}

// SFX using simple tone synthesis
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  settings: AudioSettings = loadSettings()
): void {
  if (settings.muted || settings.sfxVolume === 0) return

  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.value = freq

  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume * settings.sfxVolume * settings.masterVolume, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  oscillator.connect(gain)
  gain.connect(sfxGain!)
  oscillator.start(now)
  oscillator.stop(now + duration)
}

function playChord(frequencies: number[], duration: number, settings: AudioSettings = loadSettings()): void {
  frequencies.forEach((f, i) => {
    setTimeout(() => playTone(f, duration, 'sine', 0.15, settings), i * 30)
  })
}

// === Public API ===

export function initAudio(): AudioSettings {
  const settings = loadSettings()
  getAudioContext() // Initialize
  applyVolumes(settings)

  // Resume on user interaction (required by browser policy)
  const resume = () => {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    document.removeEventListener('click', resume)
    document.removeEventListener('keydown', resume)
  }
  document.addEventListener('click', resume)
  document.addEventListener('keydown', resume)

  // Auto-start ambient if enabled
  const currentTrack = settings.currentAmbientTrack
  if (settings.ambientEnabled && currentTrack) {
    setTimeout(() => playAmbientTrack(currentTrack, settings), 1000)
  }

  return settings
}

export function playLevelUpSFX(): void { playSFX('levelup') }
export function playDamageSFX(): void { playSFX('damage') }
export function playHealSFX(): void { playSFX('heal') }
export function playQuestSFX(): void { playSFX('quest') }
export function playCombatStartSFX(): void { playSFX('combat_start') }
export function playCombatEndSFX(victory: boolean): void { playSFX(victory ? 'combat_end' : 'error') }
export function playCoinSFX(): void { playSFX('coin') }
export function playMagicSFX(): void { playSFX('magic') }
export function playClickSFX(): void { playSFX('click') }
export function playFootstepSFX(): void { playSFX('footstep') }
export function playNotificationSFX(): void { playSFX('notification') }

export function getSettings(): AudioSettings {
  return loadSettings()
}

export function updateSettings(partial: Partial<AudioSettings>): AudioSettings {
  const settings = { ...loadSettings(), ...partial }
  saveSettings(settings)
  applyVolumes(settings)

  // Handle ambient track change
  if (partial.currentAmbientTrack !== undefined) {
    if (settings.ambientEnabled && settings.currentAmbientTrack) {
      playAmbientTrack(settings.currentAmbientTrack, settings)
    } else {
      stopAmbient()
    }
  }

  if (partial.ambientEnabled === false) {
    stopAmbient()
  }

  return settings
}

export function playSFX(type: string, settings: AudioSettings = loadSettings()): void {
  if (settings.muted || settings.sfxVolume === 0) return

  switch (type) {
    case 'click': playTone(800, 0.05, 'sine', 0.15, settings); break
    case 'levelup': playChord([523, 659, 784, 1047], 0.8, settings); break
    case 'damage': playTone(200, 0.2, 'sawtooth', 0.25, settings); break
    case 'heal': playChord([440, 554, 659], 0.6, settings); break
    case 'quest': playChord([330, 415, 494, 659], 0.5, settings); break
    case 'coin': playTone(880, 0.1, 'sine', 0.2, settings); break
    case 'magic': {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => playTone(800 + Math.random() * 800, 0.15, 'sine', 0.1, settings), i * 50)
      }
      break
    }
    case 'footstep': playTone(100, 0.05, 'triangle', 0.15, settings); break
    case 'notification': playChord([659, 784], 0.3, settings); break
    case 'error': playTone(150, 0.3, 'sawtooth', 0.2, settings); break
    case 'success': playChord([523, 659, 784], 0.4, settings); break
  }
}

export function setAmbientTrack(track: AmbientTrack | null): void {
  const settings = loadSettings()
  if (track === null) {
    updateSettings({ ambientEnabled: false, currentAmbientTrack: null })
  } else {
    updateSettings({ ambientEnabled: true, currentAmbientTrack: track })
  }
}

export function getAmbientTrackForContext(world: any, combat?: { inCombat: boolean }): AmbientTrack {
  // Combat takes priority
  if (combat?.inCombat) return 'combat'

  const weather = world?.weather?.toLowerCase()
  const timeOfDay = world?.timeOfDay?.toLowerCase()
  const location = world?.name?.toLowerCase() || ''
  const genres = world?.genres || []

  // Weather-based
  if (weather === 'badai' || weather === 'hujan') return 'storm'
  if (weather === 'berkabut' || weather === 'mendung') return 'mysterious'

  // Time-based
  if (timeOfDay === 'malam' || timeOfDay === 'dini_hari') return 'night'

  // Location/genre-based
  if (genres.includes('horror') || genres.includes('dark')) return 'tense'
  if (location.includes('dungeon') || location.includes('gua') || location.includes('istana')) return 'dungeon'
  if (location.includes('desa') || location.includes('kota') || location.includes('pedesaan')) return 'town'
  if (location.includes('hutan') || location.includes('gunung') || location.includes('laut')) return 'peaceful'

  return 'peaceful'
}

export function autoSwitchAmbient(world: any, combat?: { inCombat: boolean }): void {
  const settings = loadSettings()
  if (!settings.ambientEnabled) return

  const track = getAmbientTrackForContext(world, combat)
  if (track !== settings.currentAmbientTrack) {
    updateSettings({ currentAmbientTrack: track })
  }
}

// Cleanup on unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopAmbient()
    if (audioCtx) {
      audioCtx.close()
      audioCtx = null
      masterGain = musicGain = sfxGain = ambientGain = null
    }
  })
}