import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { TRPCProvider } from "@/components/providers/trpc-provider"


const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Muxai',
  description: 'Chat with multiple AI models including GPT-4, Claude, and Gemini'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
          <TRPCProvider>
            {children}
            <Analytics />
          </TRPCProvider>
      </body>
    </html>
  )
}
