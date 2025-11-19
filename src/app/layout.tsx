import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"

import "./globals.css?v=2"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "GenAIe - AI Filter Generator",
  description: "Create and share amazing AI-powered filters with GenAIe.",
  openGraph: {
    title: "GenAIe - AI Filter Generator",
    description: "Create and share amazing AI-powered filters with GenAIe.",
    url: "https://project-genie-sigma.vercel.app",
    siteName: "GenAIe",
    images: [
      {
        url: "https://project-genie-sigma.vercel.app/lamp.png",
        width: 1200,
        height: 630,
        alt: "GenAIe Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GenAIe - AI Filter Generator",
    description: "Create and share amazing AI-powered filters with GenAIe.",
    images: ["https://project-genie-sigma.vercel.app/lamp.png"],
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
      <body className={`${outfit.variable} font-sans`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
