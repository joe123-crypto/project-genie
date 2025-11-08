import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"

import "./globals.css?v=2"

export const metadata: Metadata = {
  title: "Genie",
  description: "Genie: Create, Share, and Reuse AI-Powered Photo Filters",
  openGraph: {
    title: "Genie",
    description: "Genie: Create, Share, and Reuse AI-Powered Photo Filters",
    url: "https://project-genie-sigma.vercel.app", // Replace with your actual app URL
    siteName: "Genie",
    images: [
      {
        url: "https://project-genie-sigma.vercel.app/lamp.png", // Replace with your actual logo URL
        width: 64,
        height: 64,
        alt: "Genie Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Genie",
    description: "Genie: Create, Share, and Reuse AI-Powered Photo Filters",
    images: ["https://project-genie-sigma.vercel.app/lamp.png"], // Replace with your actual logo URL
  },
  icons: {
    icon: '/lamp.png',
  },
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
