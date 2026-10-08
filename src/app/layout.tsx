import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { GhostBanner } from "@/components/GhostBanner";
import { UIPreferencesProvider } from "@/components/providers";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Prevent FOIT (Flash of Invisible Text)
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Afters - Nightlife Events & After-Parties",
    template: "%s | Afters",
  },
  description:
    "Discover and book tickets to the best nightlife events, after-parties, and underground raves. Create and manage events with our free platform.",
  keywords: ["nightlife", "events", "tickets", "after-party", "rave", "club", "electronic music", "DJ"],
  authors: [{ name: "Afters" }],
  creator: "Afters",
  publisher: "Afters",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://afters.am"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Afters",
    title: "Afters - Nightlife Events & After-Parties",
    description: "Discover and book tickets to the best nightlife events and after-parties.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Afters - Nightlife Events & After-Parties",
    description: "Discover and book tickets to the best nightlife events and after-parties.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="dns-prefetch" href="https://api.stripe.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <UIPreferencesProvider>
            <GhostBanner />
            <RedirectHandler />
            {children}
            <Toaster />
          </UIPreferencesProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function RedirectHandler() {
  // Redirect legacy domains to afters.am
  const primaryDomain = "afters.am";
  const legacyDomains = ["afters.netlify.app", "afters.xxx"];
  
  return (
    <Script
      id="legacy-redirect"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var legacyDomains = ${JSON.stringify(legacyDomains)};
            var primaryDomain = "${primaryDomain}";
            var isLegacy = legacyDomains.some(function(d) { return window.location.hostname.includes(d); });
            
            if (isLegacy) {
              // Show a temporary message while redirecting
              document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #000; color: white; font-family: -apple-system, BlinkMacSystemFont, \\'Segoe UI\\', Roboto, sans-serif; text-align: center;"><div style="padding: 2rem; border-radius: 8px; background-color: rgba(30, 30, 30, 0.8); max-width: 90%; width: 500px;"><h1>We\\'re moving you to our new home!</h1><p>Please hold on while we redirect you to ' + primaryDomain + '.</p><div style="width: 40px; height: 40px; border: 4px solid rgba(255, 20, 147, 0.3); border-top: 4px solid #ff1493; border-radius: 50%; animation: spin 1s linear infinite; margin: 2rem auto;"></div><p>You\\'ll be redirected in a few seconds, or <a href="https://' + primaryDomain + '" style="color: #ff1493;">click here</a> if you don\\'t want to wait.</p></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></div>';

              // Redirect after a short delay
              setTimeout(function() {
                window.location.href = 'https://' + primaryDomain + window.location.pathname + window.location.search + window.location.hash;
              }, 3000);
            }
          })();
        `,
      }}
    />
  )
}
