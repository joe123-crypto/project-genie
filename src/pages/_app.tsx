import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* ✅ Correct place for viewport meta (not in _document) */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* 🧠 Base SEO hygiene */}
        <meta name="description" content="Genie — create, share, and apply AI-powered filters and outfits" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />

        {/* ✅ Optional manifest (PWA support, safe even if you don't have it yet) */}
        <link rel="manifest" href="/manifest.json" />
      </Head>

      {/* ✅ App body */}
      <Component {...pageProps} />

      {/* ✅ Vercel Analytics for insights */}
      <Analytics />
    </>
  );
}
