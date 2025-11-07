import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"

import "./globals.css?v=2"

export const metadata: Metadata = {
  title: "Vana Demo",
  description: "Vana Demo",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
