'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('satu')
  const [prompt, setPrompt] = useState('Buat dunia fantasi. Balas SATU BARIS format: NAMA: | DESKRIPSI: | ERA: | TAHUN: | GENRE: | MUSIM:')
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const testAI = async () => {
    setLoading(true)
    setResult(null)
    setLog([])
    addLog(`Mulai test dengan model: ${model}`)

    const baseUrl = 'https://rphvgzw.abc-tunnel.us/v1'
    const apiKey = '' // kalo ada API key, isi disini

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }

      addLog(`POST ${baseUrl}/chat/completions`)
      addLog(`Model: ${model}`)

      const start = Date.now()
      const controller = new AbortController()
      const timeout = setTimeout(() => {
        addLog('⚠️ Request aborted after 60s timeout')
        controller.abort()
      }, 60000)

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Kamu adalah Dungeon Master RPG.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2048,
          temperature: 0.9,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const elapsed = Date.now() - start
      addLog(`Status: ${res.status} (${elapsed}ms)`)

      const text = await res.text()
      addLog(`Raw length: ${text.length} chars`)

      if (!res.ok) {
        addLog(`ERROR ${res.status}: ${text.slice(0, 500)}`)
        setResult({ error: true, status: res.status, body: text.slice(0, 2000) })
      } else {
        addLog('Response OK! Parsing JSON...')
        try {
          const data = JSON.parse(text)
          addLog(`Response keys: ${Object.keys(data).join(', ')}`)
          addLog(`Model used: ${data.model || 'N/A'}`)
          addLog(`Finish reason: ${data.choices?.[0]?.finish_reason || 'N/A'}`)

          const msg = data.choices?.[0]?.message || {}
          addLog(`Message keys: ${Object.keys(msg).join(', ')}`)
          addLog(`Content length: ${(msg.content || '').length}`)
          addLog(`Reasoning length: ${(msg.reasoning_content || '').length}`)
          addLog(`Content: ${(msg.content || '').slice(0, 500)}`)
          addLog(`Reasoning: ${(msg.reasoning_content || '').slice(0, 500)}`)

          setResult({ success: true, data })
        } catch (e: any) {
          addLog(`JSON parse error: ${e.message}`)
          addLog(`Raw text: ${text.slice(0, 1000)}`)
          setResult({ error: true, body: text.slice(0, 2000) })
        }
      }
    } catch (e: any) {
      addLog(`Fetch error: ${e.message}`)
      setResult({ error: true, message: e.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <h1 className="text-xl font-bold mb-4">🔧 AI Debug Console</h1>

      <div className="space-y-3 mb-6 max-w-2xl">
        <div>
          <label className="text-xs text-zinc-400">Model</label>
          <input value={model} onChange={e => setModel(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Prompt</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
        </div>
        <button onClick={testAI} disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 rounded text-sm font-medium">
          {loading ? 'Loading...' : '🚀 Test AI'}
        </button>
      </div>

      {/* Log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-w-4xl">
        <h2 className="text-sm font-medium text-zinc-400 mb-2">📋 Log</h2>
        <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
          {log.length === 0 ? (
            <p className="text-zinc-600">Belum ada log. Klik Test AI.</p>
          ) : (
            log.map((l, i) => (
              <div key={i} className={`${l.includes('ERROR') ? 'text-red-400' : l.includes('⚠️') ? 'text-yellow-400' : l.includes('✅') ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {l}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-w-4xl overflow-auto">
          <h2 className="text-sm font-medium text-zinc-400 mb-2">
            {result.success ? '✅ Response' : '❌ Error'}
          </h2>
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-all">
            {JSON.stringify(result, null, 2).slice(0, 5000)}
          </pre>
        </div>
      )}
    </div>
  )
}
