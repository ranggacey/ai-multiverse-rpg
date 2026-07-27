# AI Multiverse RPG 🎮

Dynamic Story Generator berbasis AI. Setiap permainan adalah kehidupan baru di semesta yang berbeda.

## Tech Stack
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- IndexedDB (lokal storage)
- AI: **OpenRouter** (Google Gemini 2.0 Flash, DeepSeek, dll.)

## Fitur
- Dunia dan cerita digenerate AI secara dinamis
- Pemain memulai usia 5 tahun dengan latar acak
- NPC memiliki kehidupan sendiri
- Parallel Story dengan informasi tersensor
- World timeline — dunia terus berjalan
- Sistem kekuatan, skill, item, quest
- Game over = akhir hayat karakter
- Save/load via IndexedDB
- Export/import save file JSON
- Dark theme sinematik

## Environment Variables

### Server-side (API Route: `/api/chat`)
- `OPENROUTER_API_KEY` — API Key OpenRouter (wajib)
- `OPENROUTER_BASE_URL` — Default: `https://openrouter.ai/api/v1`
- `OPENROUTER_MODEL` — Default: `google/gemini-2.0-flash-exp:free`

### Client-side (Frontend: `src/lib/ai.ts`)
- `NEXT_PUBLIC_AI_API_KEY` — API Key OpenRouter (wajib)
- `NEXT_PUBLIC_AI_API_BASE` — Default: `https://openrouter.ai/api/v1`
- `NEXT_PUBLIC_AI_MODEL` — Default: `google/gemini-2.0-flash-exp:free`

## Cara Develop
```bash
cp .env.example .env.local
# Edit .env.local dengan API key lo
npm run dev
```

## Deploy ke Vercel
1. Push ke GitHub
2. Import di Vercel
3. Settings → Environment Variables:
   - `OPENROUTER_API_KEY` = key OpenRouter lo
   - `NEXT_PUBLIC_AI_API_KEY` = key OpenRouter lo (sama)
   - `OPENROUTER_MODEL` = `google/gemini-2.0-flash-exp:free` (atau model gratis lain)
   - `NEXT_PUBLIC_AI_MODEL` = sama
4. Deploy!

## Model Gratis Recommended (OpenRouter)
- `google/gemini-2.0-flash-exp:free` — Cepat, bagus narasi
- `meta-llama/llama-3.1-8b-instruct:free` — Cukup bagus
- `mistralai/mistral-7b-instruct:free` — Ringan
- `google/gemma-2-9b-it:free` — Alternatif

## Struktur Proyek
```
src/
├── app/
│   ├── api/chat/route.ts    # Server-side AI proxy (OpenRouter)
│   ├── game/page.tsx        # Main gameplay UI
│   └── page.tsx             # Menu utama
├── lib/
│   ├── ai.ts                # Client-side AI client
│   ├── game-provider.tsx    # React Context state management
│   ├── types.ts             # TypeScript interfaces
│   ├── game.ts              # Helpers
│   └── storage.ts           # IndexedDB persistence
```