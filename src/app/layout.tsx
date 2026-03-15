import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"
import { Cormorant_Garamond, Outfit } from "next/font/google"
import NotificationManager from "../components/NotificationManager"
import { AuthProvider } from '@/context/AuthContext';
import { TemplateProvider } from '@/context/TemplateContext';

import "./globals.css?v=2"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={`${outfit.variable} ${cormorant.variable}`}>
      <body className="font-sans min-h-screen relative">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900" />
          <div className="absolute inset-0 opacity-60 backdrop-blur-3xl" />
        </div>
        <div className="relative z-10 min-h-screen">
          <AuthProvider>
            <TemplateProvider>
              {children}
            </TemplateProvider>
          </AuthProvider>
          <Analytics />
          <NotificationManager />
        </div>
      </body>
    </html>
  )
}
