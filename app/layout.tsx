import type { Metadata } from "next"

import "./globals.css"

import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "Soajery",
  description: "Soajery application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
