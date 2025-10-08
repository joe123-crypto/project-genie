// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Character encoding */}
        <meta charSet="UTF-8" />

        {/* ✅ Enforce HTTPS for all subrequests (avoids blocked CSS/fonts on mobile) */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />

        {/* ✅ Viewport settings for mobile */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />

        {/* ✅ Canonical URL for SEO */}
        <link rel="canonical" href="https://project-genie-sigma.vercel.app/" />

        {/* ✅ App description (SEO + social previews) */}
        <meta
          name="description"
          content="Genie — Create, share, and apply magical AI filters that transform your photos instantly."
        />

        {/* ✅ Open Graph tags for WhatsApp, Discord, Facebook */}
        <meta property="og:site_name" content="Genie" />
        <meta property="og:type" content="website" />
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
        <meta
          property="og:image:secure_url"
          content="https://project-genie-sigma.vercel.app/favicon.ico"
        />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="Preview of Genie app showing AI filters" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* ✅ Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@genie" />
        <meta name="twitter:creator" content="@genie" />
        <meta name="twitter:title" content="Genie — AI Filters That Work Like Magic" />
        <meta
          name="twitter:description"
          content="Create, remix, and share AI-powered photo filters that look amazing on any picture."
        />
        <meta
          name="twitter:image"
          content="https://project-genie-sigma.vercel.app/favicon.ico"
        />

        {/* ✅ Theme colors for browser bars (light + dark) */}
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0d0d0d"
          media="(prefers-color-scheme: dark)"
        />

        {/* ✅ Favicon and PWA manifest */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="manifest" href="/manifest.json" />

        {/* ✅ Optional: Apple touch icon for iOS home screen */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>

      <body className="antialiased bg-base-100 text-content-100 dark:bg-dark-base-100 dark:text-dark-content-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
