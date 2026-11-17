import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rangkai — Rencana menuju selamanya',
  description: 'Satu tempat untuk merangkai rencana lamaran dan pernikahan, memantau kebutuhan, dan menabung bersama.',
  generator: 'v0.app',
  // Ikon diambil otomatis dari app/favicon.ico, app/icon.svg, dan app/apple-icon.png (buat ulang: pnpm icons).
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
