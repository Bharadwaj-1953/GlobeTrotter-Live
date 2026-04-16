import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'GlobeTrotter — Smart Travel Planning for Students',
  description:
    'Plan smart, travel better. GlobeTrotter is the all-in-one travel planning app built for students — compare flights, hotels, coordinate group trips, and discover local events.',
  keywords: ['travel', 'student travel', 'trip planning', 'group travel', 'budget travel'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
