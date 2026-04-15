import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prs.md"),
  title: {
    default: "PRs.md — Turing Test for Pull Requests",
    template: "%s — PRs.md",
  },
  description:
    "Prove you actually read your own PR. Answer 3 questions about your diff to earn a 100% Human Verified badge.",
  keywords: [
    "pull request verification",
    "code review",
    "AI code detection",
    "developer accountability",
    "PR badge",
    "GitHub PR",
    "human verified",
    "open source",
    "bring your own key",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "PRs.md — Turing Test for Pull Requests",
    description:
      "Stop AI-generated slop. Prove you understand your own code. 3 questions. 3 minutes. One verified badge.",
    type: "website",
    url: "https://prs.md",
    siteName: "PRs.md",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRs.md — Turing Test for Pull Requests",
    description:
      "Stop AI-generated slop. Prove you understand your own code. 3 questions. 3 minutes. One verified badge.",
    site: "@prs_md",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}</Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
