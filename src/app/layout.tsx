import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { AftersRadio } from "@/components/AftersRadio";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Afters - Event Ticketing for Nightlife",
  description:
    "Discover and book tickets to the best nightlife events and after-parties",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <RedirectHandler />
          {children}
          <AftersRadio />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

function RedirectHandler() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            if (window.location.hostname === 'afters.netlify.app') {
              // Show a temporary message while redirecting
              document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #000; color: white; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; text-align: center;"><div style="padding: 2rem; border-radius: 8px; background-color: rgba(30, 30, 30, 0.8); max-width: 90%; width: 500px;"><h1>We\'re moving you to our latest deployment!</h1><p>Please hold on while we redirect you to the official site.</p><div style="width: 40px; height: 40px; border: 4px solid rgba(255, 20, 147, 0.3); border-top: 4px solid #ff1493; border-radius: 50%; animation: spin 1s linear infinite; margin: 2rem auto;"></div><p>You\'ll be redirected in a few seconds, or <a href="https://afters.crativo.xyz" style="color: #ff1493;">click here</a> if you don\'t want to wait.</p></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></div>';

              // Redirect after a short delay
              setTimeout(function() {
                window.location.href = 'https://afters.crativo.xyz' + window.location.pathname + window.location.search + window.location.hash;
              }, 3000);
            }
          })();
        `,
      }}
    />
  );
}
