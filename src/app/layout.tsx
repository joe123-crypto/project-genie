import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import NotificationManager from "../components/NotificationManager"
import UpdateChecker from "../components/UpdateChecker"
import { AuthProvider } from '@/context/AuthContext';

import "./globals.css?v=2"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "GenAIe - AI Template Generator",
  description: "Create and share amazing AI-powered templates with GenAIe.",
  openGraph: {
    title: "GenAIe - AI Template Generator",
    description: "Create and share amazing AI-powered templates with GenAIe.",
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
    title: "GenAIe - AI Template Generator",
    description: "Create and share amazing AI-powered templates with GenAIe.",
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
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <NotificationManager />
        <UpdateChecker />
      </body>
    </html>
  )
}
