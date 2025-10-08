// pages/_app.tsx
import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { Analytics } from "@vercel/analytics/react"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Your global UI (Navbars, Layouts, Providers, etc.) can go here */}
      <Component {...pageProps} />
      <Analytics /> {/* ✅ Enables Vercel Analytics */}
    </>
  )
}
