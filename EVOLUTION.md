## [2026-07-28] 🧬 Siklus 11 — Save Slot System + Keyboard Shortcuts
- **Save Slot System**: 10 Quick Save slots (F1-F10), 5 Custom Save slots, 1 Auto Save slot (slot 99, every 60s when not in combat)
- **Keyboard Shortcuts**: F1-F10 = Quick Save, Shift+F1-F10 = Quick Load, Ctrl+S = Quick Save slot 1, Ctrl+L = Quick Load slot 1
- **Main Menu Save Slot UI**: Visual grid layout showing quick save slots (10), custom slots (5), and auto-save — with status badges, world info, level, chapter, play time
- **In-Game Keyboard Hint**: Desktop header shows compact keybind reminder (F1-F10, Shift+F1-F10, Ctrl+S, Ctrl+L)
- **Auto-Save**: Background timer saves to slot 99 every 60 seconds when alive and not in combat
- **Notification SFX**: Play notification sound on quick save/load actions
- **Load Auto Save Button**: Main menu has dedicated "Load Auto Save" button
- **Import/Export**: Keep existing import/export functionality alongside save slots
- **Build**: 0 error TypeScript, compilation clean

## [2026-07-26] Initial creation
- Project created by Yuna autonomous workflow
- Next.js 16 + App Router + TypeScript + Tailwind CSS v4
- AI API client untuk 9Router (https://rphvgzw.abc-tunnel.us/v1)
- Game engine: world generation, player creation, AI game master
- IndexedDB storage + export/import JSON
- Dark theme cinematic UI dengan glassmorphism
- Story log dengan typewriter effect
- Stat system, inventory, skills, relationships
- World timeline dengan konsekuensi
- Parallel story system dengan sensor ███
- Game over/death record

## [2026-07-27] 🧬 Siklus 1 — Biography Page, Quest Tracking, Mobile Drawer & Save UI
- **Death Record → Full Biography Modal**: Halaman biografi imersif dengan life stats grid, final stats, achievements, timeline hidup, legacy display
- **Quest Tracking dengan Progress Bar**: Quest aktif muncul di sidebar stats dengan progress bar visual dan difficulty badge
- **Mobile Responsive Sidebar Drawer**: Slide-out panel dengan backdrop overlay, bisa diakses via tombol menu di header mobile
- **Save Cards Enhanced**: Menampilkan play time dan tanggal save di main menu
- **Auto-scroll Story**: Smart auto-scroll yang cuma scroll kalo user di bagian bawah
- **Saved Toast Notification**: Notifikasi "✓ Tersimpan" setelah save
- **Better Death Record UI**: Tombol biografi + export + return di death record dengan layout lebih rapi
- **Lint Cleanup**: Fix all ESLint errors (0 errors, 0 warnings) — any types → proper types, unused vars removed, hook deps fixed, game-provider refactor

## [2026-07-27] 🧬 Siklus 2 — AI Prompt Enhancement, Quick Actions, World Event Toasts & NPC Visibility
- **AI Prompt Improvement**: Narrative directions enhanced — puitis, metafora sensorik, NPC hidup, variasi gaya, reward epic actions, gameOver legacy field
- **GameOver Legacy**: AI sekarang generates legacy yang emosional tentang bagaimana dunia mengingat karakter, ditampilkan di death record dan biography
- **Quick Action Buttons**: 5 tombol aksi cepat (Jelajahi, Bicara, Bertarung, Bersantai, Belanja) di atas input box — one-click RPG actions
- **World Event Toast Notifications**: Notifikasi slide-in yang muncul saat peristiwa dunia baru terjadi, dengan animasi masuk/keluar halus
- **NPC Visibility di World Tab**: Menampilkan NPC yang ada di lokasi player saat ini di sidebar world tab
- **Enhanced World Tab UI**: Icon dekorasi, badges, dan layout lebih rapi dengan separator visual
- **Story Narration Enhancement**: Prompt AI diperkaya dengan instruksi detail sensorik, variasi gaya, dan reward sistem
- **Animations & CSS**: World event toast animations, glow-pulse, quick action hover effects added to globals.css

## [2026-07-27] 🧬 Siklus 3 — Quest & NPC Tracking System + Mobile Sidebar Fix + Biography Stats Fix
- **Quest Tracking System**: AI prompt updated untuk generate quest labels (QUEST, QUEST_PROGRESS, QUEST_SELESAI). Game provider mem-parse labels dan menyimpan quests di game state. Sidebar menampilkan quest cards dengan progress bar, type badge, dan status.
- **NPC Relationship Tracking**: NPC labels diparse dari AI response dan disimpan di game state. World tab menampilkan NPC dikenal dengan relationship indicator (teman/musuh/netral).
- **Mobile Sidebar Enhanced**: Sidebar mobile sekarang menampilkan stats, skills, inventory, active quests — bukan placeholder text lagi.
- **Biography Stats Fix**: Stat keys diperbaiki dari strength/agility ke str/agi/int/cha sesuai actual game state. NPC count, quest count, parallel story count dihitung dari data nyata.
- **Game Master Prompt Rewrite**: Prompt sekarang menggunakan embedded labels (USIA, LOKASI, STAT, NPC, QUEST, dll) yang diselipkan di narasi, bukan JSON output — aligned dengan code parser yang sudah ada.

## [2026-07-27] 🧬 Siklus 4 — Weather & Time-of-Day Atmosphere System
- **CUACA/WAKTU Labels**: AI prompt ditambah label CUACA (cerah/berawan/hujan/dll) dan WAKTU (pagi/siang/sore/malam) untuk atmosfer dinamis
- **Weather Display**: Ikon cuaca dan waktu muncul di header (desktop) dan sidebar World tab
- **Atmosphere Box**: World tab menampilkan cuaca, waktu, dan season dalam chip visual
- **Weather & Time Types**: Tipe baru `Weather` dan `TimeOfDay` dengan ikon emoji mapping di types.ts
- **Auto-Save Timer**: Game auto-save setiap 60 detik dengan notifikasi "Auto-saved" di header
- **Default Initial State**: Dunia baru mulai dengan cuaca cerah waktu pagi
- **CSS Glow Enhancement**: Animasi pulse untuk elemen cuaca/waktu di globals.css

## [2026-07-27] 🧬 Siklus 5 — **MIGRASI KE OPENROUTER** (BREAKING CHANGE)
- **Hapus 9Router Tunnel**: Menghapus dependency pada tunnel Cloudflare `https://rphvgzw.abc-tunnel.us/v1` yang error 530/524
- **Backend API Route (`/api/chat`)**: Rewrite total menggunakan **OpenRouter langsung** dengan:
  - `OPENROUTER_API_KEY` (server-side)
  - `OPENROUTER_BASE_URL` default `https://openrouter.ai/api/v1`
  - `OPENROUTER_MODEL` default `google/gemini-2.0-flash-exp:free`
  - Timeout 3 menit + retry 3x + robust JSON parsing
  - Header `HTTP-Referer` & `X-Title` untuk tracking OpenRouter
- **Frontend Client (`src/lib/ai.ts`)**: Sudah pakai OpenRouter, cleanup hardcoded 9Router URL, fallback ke OpenRouter default
- **Environment Variables Update**:
  - **Server**: `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL`
  - **Client**: `NEXT_PUBLIC_AI_API_KEY`, `NEXT_PUBLIC_AI_BASE`, `NEXT_PUBLIC_AI_MODEL`
- **Documentation**: README.md updated dengan setup Vercel yang benar
- **Model Gratis Recommended**: Gemini 2.0 Flash, Llama 3.1 8B, Mistral 7B, Gemma 2 9B
- **Deploy ke Vercel**: Set 4 env vars di Vercel Settings → Environment Variables

## [2026-07-27] 🧬 Siklus 6 — **COOLDOWN SYSTEM UNTUK QUICK ACTIONS**
- **Quick Action Cooldowns**: Tombol aksi cepat sekarang punya cooldown setelah penggunaan
- **Visual Feedback**: Red badge cooldown muncul saat cooldown berjalan
- **Cooldown Duration**: 5 detik per tombol
- **Cooldowns Inisialisasi**: Reset setelah selesai, dimulai ulang saat tombol diklik
- **Button States**: Tombol otomatis disabled saat cooldown berjalan

## [2026-07-28] 🧬 Siklus 7 — **GAME UI REDESIGN TOTAL — FULL INTERAKTIF** ✅
- **GameUI Rewrite Total**: Dari stub jadi full game interface dengan:
  - **Input Box + Send Button**: Pemain bisa ngetik aksi bebas + Enter/submit
  - **Quick Action Bar**: 5 tombol aksi cepat (Jelajahi, Bicara, Bertarung, Bersantai, Belanja) dengan cooldown timer 5s dan visual countdown
  - **Story Area**: Auto-scroll, fade-in animation, typewriter effect untuk narasi terbaru
  - **Previous Narration Context**: 10 log sebelumnya tampil reduced opacity buat konteks
- **Sidebar Redesign**: HP/MP/XP progress bars, core stats grid (STR/AGI/INT/CHA), weather/time chips, wealth, chapter
  - **Collapsible Quest Tracker**: Quest aktif dengan progress bar, type badge, status
  - **NPC Known List**: Relationship indicator (teman/musuh/netral) dengan dot warna
  - **Inventory Panel**: Item list dengan rarity dot, ATK/DEF stats, equipped badge
  - **Skills Panel**: Skill dengan level display
- **Mobile Sidebar Drawer**: Slide-out panel dari kanan dengan backdrop overlay, hamburger button di header mobile
- **Combat UI Real-time**: Health bar musuh + player, combat log, turn indicator, attack/flee buttons, enemy turn animation
- **Game Over State**: Death card dengan cause + tombol biografi dan kembali ke menu
- **Header Bar**: World name, weather/time icons, current location dengan pulsing dot
- **World Event Toasts**: Notifikasi slide-in untuk peristiwa dunia
- **Build**: 0 error TypeScript, compilation clean

## [2026-07-28] 🧬 Siklus 8 — Chapter Tracking, Starfield Menu, Biography Fix
- **Chapter Progression**: Label CHP: [angka] ditambahkan ke AI prompt. Parser baru di game-provider untuk update `currentChapter` dinamis
- **AI Prompt Enhanced**: Label CHP didokumentasikan di system prompt biar AI bisa trigger chapter baru
- **Starfield Background**: Canvas animation bintang berkedip di main menu buat atmosfer lebih cinematic
- **Biography Double Overlay Fix**: Modal biography di game-ui dilepas wrapper duplikat — Biography component handle backdrop sendiri
- **Export Button Fix**: Export di main menu sekarang export data save (bukan panggil function tanpa argumen)
- **Build**: 0 error TypeScript, compilation clean

## [2026-07-28] 🧬 Siklus 9 — Achievement System + Audio Settings UI
- **Achievement Tracking System**: 16 achievements terdefinisi (first_step, first_blood, chapter_3/5, level_5/10, wealth_100/500, quest_3, npc_5, item_10, skill_5, death_first, stories_50/100) dengan auto-check di setiap submitAction dan combat victory
- **Achievement Unlock Notification**: Achievement baru muncul sebagai system story log dengan 🏆 prefix dan trigger SFX levelup
- **Biography Real Achievements**: Biography sekarang membaca dari `gameState.achievements` (bukan fallback computed) — menampilkan icon + nama + deskripsi
- **Audio Settings Button + Panel**: Tombol volume di header game — dropdown panel dengan:
  - Master volume slider + persentase
  - Mute toggle
  - Ambient music volume slider
  - SFX volume slider
  - 8 ambient track preset buttons (peaceful, mysterious, tense, combat, town, dungeon, night, storm)
  - Click-outside-to-close behavior
- **Build**: 0 error TypeScript, compilation clean

## [2026-07-28] 🧬 Siklus 10 — SKILL AI Parsing, Combat Action Buttons, Season Display, Bugfixes
- **SKILL Label Parser**: AI prompt + game-provider parser baru untuk label `SKILL: [nama] | [type] | [level] | [deskripsi]` — AI bisa mengajarkan skill ke pemain via narasi
- **Skill Type Added**: Tipe `Skill.id` ditambahkan di types.ts untuk tracking skill unik
- **Combat Skill Buttons**: Combat panel sekarang menampilkan tombol skill (combat/magic type) dan item usable (heal/spell) — terintegrasi dengan `combatAction('skill'|'item')`
- **Season Display**: Season/musim dari world state ditampilkan di header desktop dan sidebar weather chip
- **Biography Quest Count Fix**: `questsCompleted` sekarang cuma hitung `status === 'completed'` (sebelumnya include 'failed')
- **Export Save Fix**: Main menu export button sekarang pakai proper `loadGame()` dari storage — export data nyata bukan metadata card
- **Delete Confirmation**: Tombol hapus save sekarang pakai `confirm()` dialog — prevent accidental delete
- **Build**: 0 error TypeScript, compilation clean
