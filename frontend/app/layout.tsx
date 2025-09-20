import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'German Buddy - DayZero',
  description: 'Master German with cinema-quality learning',
  manifest: '/manifest.json',
  themeColor: '#1F2937',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/icon-192x192.svg',
    apple: '/icon-192x192.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.svg" type="image/svg+xml" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
