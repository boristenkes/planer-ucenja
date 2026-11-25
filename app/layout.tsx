import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin', 'latin-ext'], variable: '--font-geist' })
const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bricolage',
})

export const metadata: Metadata = {
  title: 'Plan učenja – rasporedi gradivo do ispita',
  description:
    'Unesi predmet, datum ispita i koliko sati nedeljno možeš da učiš. Aplikacija raspoređuje vreme za učenje od danas do ispita.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#f4f6fb',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="sr" className="bg-background">
      <body className={`${geist.variable} ${bricolage.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
