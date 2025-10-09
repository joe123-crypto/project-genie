import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Genie — AI Filters That Work Like Magic",
  description: "Create, remix, and share AI-powered photo filters that look amazing on any picture.",
  openGraph: {
    title: "Genie — AI Filters That Work Like Magic",
    description: "Create, remix, and share AI-powered photo filters that look amazing on any picture.",
    url: "https://project-genie-sigma.vercel.app",
    siteName: "Genie",
    images: [
      {
        url: "https://project-genie-sigma.vercel.app/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Genie — AI Filters That Work Like Magic",
    description: "Create, remix, and share AI-powered photo filters that look amazing on any picture.",
    images: ["https://project-genie-sigma.vercel.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-base-100 text-content-100 dark:bg-dark-base-100 dark:text-dark-content-100">
        {children}
      </body>
    </html>
  );
}