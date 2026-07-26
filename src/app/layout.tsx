import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Multiverse RPG',
  description: 'Dynamic Story Generator — Setiap permainan adalah kehidupan baru di semesta yang berbeda.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  )
}
