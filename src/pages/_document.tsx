import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>

        {/* ✅ Character encoding */}
        <meta charSet="UTF-8" />

        {/* ✅ App description (fallback for SEO and link previews) */}
        <meta
          name="description"
          content="Genie — Create, share, and apply magical AI filters that transform your photos instantly."
        />

        {/* ✅ Open Graph / WhatsApp link previews */}
        <meta property="og:site_name" content="Genie" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Genie — AI Filters That Work Like Magic" />
        <meta
          property="og:description"
          content="Create, remix, and share AI-powered photo filters that look amazing on any picture."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://project-genie-sigma.vercel.app" />

        {/* ✅ Twitter preview cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@genie" />
        <meta name="twitter:title" content="Genie — AI Filters That Work Like Magic" />
        <meta
          name="twitter:description"
          content="Create, remix, and share AI-powered photo filters that look amazing on any picture."
        />
        <meta name="twitter:image" content="/og-image.png" />

        {/* ✅ Theme color for browser UI (light/dark) */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0d0d0d" media="(prefers-color-scheme: dark)" />

        {/* ✅ iOS safe area support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* ✅ Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* ✅ Optional: PWA / Web App manifest */}
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <body className="antialiased bg-base-100 text-content-100 dark:bg-dark-base-100 dark:text-dark-content-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

