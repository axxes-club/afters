import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { GhostBanner } from "@/components/GhostBanner";
import { UIPreferencesProvider } from "@/components/providers";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/lib/uploadthing";
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

  const isDummyKey = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "YOUR_PUBLISHABLE_KEY" || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_Y2xlc");

  const bodyContent = (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://utfs.io" />
        <link rel="dns-prefetch" href="https://clerk.afters.am" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <UIPreferencesProvider>
            <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
            <GhostBanner />
            <RedirectHandler />
            {children}
            <Toaster />
          </UIPreferencesProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );

  if (isDummyKey) {
    return bodyContent;
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#ff1493",
          colorBackground: "#000000",
          colorInputBackground: "#0a0a0a",
          colorInputText: "#ffffff",
          colorTextOnPrimaryBackground: "#000000",
          colorTextSecondary: "#888888",
          borderRadius: "0px",
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
        },
        elements: {
          // Card and layout
          rootBox: "w-full",
          card: "bg-black border border-white/10 shadow-2xl shadow-[#ff1493]/5 rounded-none",
          cardBox: "bg-black",
          // Header
          headerTitle: "text-white font-mono text-xl tracking-wider",
          headerSubtitle: "text-white/50 font-mono text-sm",
          // Social buttons
          socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#ff1493]/30 transition-all font-mono rounded-none",
          socialButtonsBlockButtonText: "text-white font-mono",
          socialButtonsIconButton: "bg-white/5 border border-white/10 hover:bg-white/10 rounded-none",
          // Divider
          dividerLine: "bg-white/10",
          dividerText: "text-white/30 font-mono text-xs",
          // Form fields
          formFieldLabel: "text-white/50 font-mono text-xs uppercase tracking-wider",
          formFieldInput: "bg-black border-white/10 text-white font-mono focus:border-[#ff1493] focus:ring-[#ff1493]/20 rounded-none",
          formFieldInputShowPasswordButton: "text-white/30 hover:text-white",
          // Buttons
          formButtonPrimary: "bg-[#ff1493] hover:bg-[#ff1493]/90 text-black font-mono font-bold uppercase tracking-wider rounded-none",
          formButtonReset: "text-[#ff1493] hover:text-[#ff1493]/80 font-mono",
          // Links
          footerActionLink: "text-[#ff1493] hover:text-[#ff1493]/80 font-mono",
          footerActionText: "text-white/40 font-mono",
          identityPreviewEditButton: "text-[#ff1493]",
          formFieldAction: "text-[#ff1493] font-mono text-xs",
          // Alerts
          alert: "bg-red-500/10 border border-red-500/30 rounded-none",
          alertText: "text-red-400 font-mono text-sm",
          // OTP
          otpCodeFieldInput: "bg-black border-white/20 text-white font-mono rounded-none",
          // User button
          userButtonBox: "rounded-none",
          userButtonTrigger: "rounded-none",
          userButtonPopoverCard: "bg-black border border-white/10 rounded-none",
          userButtonPopoverActionButton: "hover:bg-white/5 font-mono",
          userButtonPopoverActionButtonText: "text-white/70 font-mono",
          userButtonPopoverFooter: "border-white/10",
          // Avatar
          avatarBox: "rounded-none",
          // Modal
          modalBackdrop: "bg-black/80",
          modalContent: "bg-black border border-white/10 rounded-none",
        },
      }}
    >
      {bodyContent}
    </ClerkProvider>
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
