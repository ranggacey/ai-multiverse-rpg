'use client'

import { useState } from 'react'

export default function ModelListPage() {
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [raw, setRaw] = useState<string>('')

  const fetchModels = async () => {
    setLoading(true)
    setError(null)
    setRaw('')
    setModels([])
    
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      setError('GEMINI_API_KEY tidak diset di env')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      const text = await res.text()
      setRaw(text)
      
      if (!res.ok) {
        setError(`Error ${res.status}: ${text}`)
        return
      }

      const data = JSON.parse(text)
      const modelNames = data.models?.map((m: any) => m.name) || []
      setModels(modelNames)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">
      <h1 className="text-2xl mb-6">📋 Gemini Available Models</h1>
      
      <button 
        onClick={fetchModels}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 rounded mb-4"
      >
        {loading ? 'Loading...' : '🔍 Fetch Models'}
      </button>

      {error && <div className="text-red-400 mb-4">Error: {error}</div>}

      <div className="grid gap-2 max-w-2xl">
        {models.map((m, i) => (
          <div key={i} className="bg-zinc-900 p-3 rounded border border-zinc-800">
            <code className="text-indigo-300">{m}</code>
          </div>
        ))}
      </div>

      {raw && (
        <details className="mt-8">
          <summary className="text-zinc-500 cursor-pointer">Raw Response</summary>
          <pre className="mt-2 bg-zinc-900 p-4 rounded text-xs overflow-auto max-h-96">{raw}</pre>
        </details>
      )}
    </div>
  )
}