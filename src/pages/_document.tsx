// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Character encoding */}
        <meta charSet="UTF-8" />

        {/* ✅ Viewport fix for mobile scaling */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* ✅ App description (SEO + social previews) */}
        <meta
          name="description"
          content="Genie — Create, share, and apply magical AI filters that transform your photos instantly."
        />

        {/* ✅ Open Graph tags */}
        <meta property="og:title" content="Genie — AI Filters That Work Like Magic" />
        <meta
          property="og:description"
          content="Create, remix, and share AI-powered photo filters that look amazing on any picture."
        />
        <meta
          property="og:url"
          content="https://project-genie-sigma.vercel.app/"
        />
        <meta
          property="og:image"
          content="https://project-genie-sigma.vercel.app/favicon.ico"
        />

        {/* ✅ Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Genie — AI Filters That Work Like Magic" />
        <meta
          name="twitter:description"
          content="Create, remix, and share AI-powered photo filters that look amazing on any picture."
        />

        {/* ✅ Favicons and manifest */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <body className="antialiased bg-base-100 text-content-100 dark:bg-dark-base-100 dark:text-dark-content-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
