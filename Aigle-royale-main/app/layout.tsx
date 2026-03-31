import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { MainContentWrapper } from '@/components/layout/MainContentWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aigle Royale - Réservation de Billets de Bus',
  description: 'Plateforme de réservation et vente de billets de bus & gestion de fret',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Aigle Royale',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: '#1e293b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <MainContentWrapper>
            {children}
          </MainContentWrapper>
        </Providers>
      </body>
    </html>
  )
}
