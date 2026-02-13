"use client"

import Link from "next/link"
import {
  MapPinOff,
  Eye,
  EyeOff,
  Clock,
  Palette,
  QrCode,
  Users,
  ListChecks,
  Volume2,
  BarChart3,
  Shield,
  Zap,
  Sparkles,
  Map,
  Calendar,
  Ticket,
  ScanLine,
  Music,
  Globe,
  Code,
  UserPlus,
  Lock,
  Layers,
  Timer,
  Smartphone,
  ChevronRight,
} from "lucide-react"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  highlight?: boolean
}

function FeatureCard({ icon, title, description, highlight }: FeatureCardProps) {
  return (
    <div
      className={`group p-6 border transition-all hover:bg-white/[0.02] ${
        highlight
          ? "border-[#ff1493]/30 bg-[#ff1493]/5"
          : "border-white/10"
      }`}
    >
      <div className={`mb-4 ${highlight ? "text-[#ff1493]" : "text-white/60 group-hover:text-[#ff1493]"} transition-colors`}>
        {icon}
      </div>
      <h3 className="font-mono font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
    </div>
  )
}

interface FeatureSectionProps {
  number: string
  title: string
  subtitle: string
  children: React.ReactNode
}

function FeatureSection({ number, title, subtitle, children }: FeatureSectionProps) {
  return (
    <section className="py-20 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#ff1493] font-mono text-sm">{number}</span>
            <div className="w-12 h-px bg-[#ff1493]/30" />
          </div>
          <h2 className="text-3xl md:text-4xl font-headline tracking-tight mb-3">{title}</h2>
          <p className="text-white/40 max-w-2xl">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

export default function WeDoAfterBetterPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff1493]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#ff1493]/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 px-6 py-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-headline text-xl">
            <span className="text-[#ff1493]">.</span>
          </Link>
          <Link
            href="/d"
            className="px-6 py-2 bg-[#ff1493] text-black text-xs font-bold tracking-wider uppercase hover:bg-white transition-colors"
          >
            Start Hosting
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#ff1493]/30 bg-[#ff1493]/5 mb-8">
            <Sparkles className="w-4 h-4 text-[#ff1493]" />
            <span className="text-xs font-mono text-[#ff1493] tracking-wider">THE UNDERGROUND PLATFORM</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-headline tracking-tight mb-6">
            WE DO <span className="text-[#ff1493]">AFTER</span> BETTER
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
            Not another generic event platform. Afters is built from the ground up for afterparties,
            warehouse raves, secret shows, and the underground scene that doesn&apos;t fit the mold.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/d"
              className="group flex items-center gap-2 px-8 py-4 bg-[#ff1493] text-black font-bold tracking-wider uppercase hover:bg-white transition-all"
            >
              Create Your First Event
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/explore"
              className="px-8 py-4 border border-white/20 text-white font-bold tracking-wider uppercase hover:border-[#ff1493] hover:text-[#ff1493] transition-all"
            >
              See Events
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="relative z-10 py-20 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-headline tracking-tight mb-6">
            EVENTBRITE WASN&apos;T BUILT FOR THIS
          </h2>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
            Corporate ticketing platforms treat every event the same. But you&apos;re not running a conference.
            You need address privacy. You need vibe. You need a platform that understands that sometimes
            the location is the secret, the lineup drops at midnight, and the party doesn&apos;t end when they say it does.
          </p>
        </div>
      </section>

      {/* Section 01: Privacy & Secrecy */}
      <FeatureSection
        number="01"
        title="LOCATION PRIVACY"
        subtitle="Because sometimes the address IS the secret. Control exactly who sees what, and when."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<MapPinOff className="w-6 h-6" />}
            title="Hidden Address"
            description="Address stays hidden until ticket purchase. Only paying guests get the location."
            highlight
          />
          <FeatureCard
            icon={<EyeOff className="w-6 h-6" />}
            title="Location Precision"
            description="Show exact address, just the area, or city-only. You control how specific it gets."
          />
          <FeatureCard
            icon={<Map className="w-6 h-6" />}
            title="Map Blur"
            description="Blur the map from 0-10 levels. Gradually unblur as the event approaches."
          />
          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title="Timed Reveal"
            description="Auto-broadcast location to ticket holders when the event starts. No early leaks."
          />
          <FeatureCard
            icon={<Lock className="w-6 h-6" />}
            title="Ticket-Only Location"
            description="Show address on ticket but nowhere else. The public page stays mysterious."
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Map Customization"
            description="Dark mode maps, custom pins, radius circles, zoom levels. Make it look underground."
          />
        </div>
      </FeatureSection>

      {/* Section 02: Design & Vibe */}
      <FeatureSection
        number="02"
        title="AESTHETICS THAT HIT"
        subtitle="9 distinctive page templates designed for the underground. No corporate vibes here."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Palette className="w-6 h-6" />}
            title="9+ Page Themes"
            description="Brutalist, Neon, Minimal, Tilt, Lush, Nice, Editorial, Card, Vapor. Each with its own energy."
            highlight
          />
          <FeatureCard
            icon={<Layers className="w-6 h-6" />}
            title="Typography Selection"
            description="Mono, Headline, Elegant, Modern. Pick fonts that match your party's personality."
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Auto Color Extraction"
            description="Upload your flyer and we extract the perfect accent colors automatically."
          />
          <FeatureCard
            icon={<Eye className="w-6 h-6" />}
            title="Live Preview"
            description="See every change in real-time. No guessing how it'll look."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Event Gallery"
            description="Up to 10 images per event. Show the vibe, not just the flyer."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Lineup Display"
            description="Showcase your artists with photos, roles, and optional set times."
          />
        </div>

        {/* Theme showcase */}
        <div className="mt-12 grid grid-cols-3 md:grid-cols-9 gap-2">
          {["BRUTALIST", "NEON", "MINIMAL", "TILT", "LUSH", "NICE", "EDITORIAL", "CARD", "VAPOR"].map((theme) => (
            <div
              key={theme}
              className="aspect-square border border-white/10 bg-white/[0.02] flex items-center justify-center hover:border-[#ff1493]/30 hover:bg-[#ff1493]/5 transition-all cursor-default"
            >
              <span className="text-[8px] font-mono text-white/40">{theme}</span>
            </div>
          ))}
        </div>
      </FeatureSection>

      {/* Section 03: Check-in & Scanning */}
      <FeatureSection
        number="03"
        title="SCANNER THAT SLAPS"
        subtitle="Fast, reliable check-in with features that actually make sense for late-night events."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<ScanLine className="w-6 h-6" />}
            title="Multi-Scanner Support"
            description="Create unlimited scanner codes. One for each door, each staff member."
            highlight
          />
          <FeatureCard
            icon={<QrCode className="w-6 h-6" />}
            title="Instant QR Validation"
            description="Validates ticket authenticity, prevents duplicates, catches cancelled tickets."
          />
          <FeatureCard
            icon={<Volume2 className="w-6 h-6" />}
            title="Custom Scan Sounds"
            description="Basic beep, lasersword, pew-pew, cash register, or... farts. Your call."
          />
          <FeatureCard
            icon={<Timer className="w-6 h-6" />}
            title="Shift Tracking"
            description="Staff punch in/out. Track who scanned what and when. Full accountability."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Test Mode"
            description="Generate demo tickets to test your setup before doors open."
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Live Scan Logs"
            description="Real-time activity feed. See every scan, success or fail, as it happens."
          />
        </div>
      </FeatureSection>

      {/* Section 04: Guest Management */}
      <FeatureSection
        number="04"
        title="GUESTLIST & RSVP"
        subtitle="VIP comps, artist +1s, and RSVP events. Because not everything needs a ticket."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<ListChecks className="w-6 h-6" />}
            title="VIP Guestlist"
            description="Add names directly. No ticket needed. Phone, email, notes, plus-ones."
            highlight
          />
          <FeatureCard
            icon={<UserPlus className="w-6 h-6" />}
            title="Plus-One Support"
            description="Each guestlist entry can have custom plus-one limits. Artist +3? Done."
          />
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="RSVP-Only Events"
            description="Free events with RSVP tracking. Set capacity, enable waitlist."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Capacity Control"
            description="Set max RSVPs. Show count publicly or keep it hidden."
          />
          <FeatureCard
            icon={<ScanLine className="w-6 h-6" />}
            title="Guestlist Check-in"
            description="Search by name or phone. One tap to check in, +1s tracked."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="No Account Checkout"
            description="Guests can buy tickets without creating an account. Zero friction."
          />
        </div>
      </FeatureSection>

      {/* Section 05: Ticketing */}
      <FeatureSection
        number="05"
        title="FLEXIBLE TICKETING"
        subtitle="Multiple tiers, sales windows, and the flexibility underground events need."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Ticket className="w-6 h-6" />}
            title="Unlimited Tiers"
            description="Early bird, GA, VIP, whatever. Each with its own price, quantity, and window."
            highlight
          />
          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title="Sales Windows"
            description="Set start and end times per tier. Auto-release tiers on schedule."
          />
          <FeatureCard
            icon={<Smartphone className="w-6 h-6" />}
            title="Apple/Google Wallet"
            description="Tickets go straight to their phone wallet. No app download needed."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Purchase Limits"
            description="Min and max per order. Prevent scalpers, ensure access."
          />
          <FeatureCard
            icon={<Eye className="w-6 h-6" />}
            title="Hidden Tiers"
            description="Create tiers that aren't publicly visible. Perfect for secret links."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Instant Delivery"
            description="Tickets emailed immediately with QR code. No waiting."
          />
        </div>
      </FeatureSection>

      {/* Section 06: Analytics */}
      <FeatureSection
        number="06"
        title="KNOW YOUR NUMBERS"
        subtitle="Real analytics, not vanity metrics. Understand your events and grow."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Sales Dashboard"
            description="Revenue over time, ticket sales, conversion rates. All in one place."
            highlight
          />
          <FeatureCard
            icon={<Eye className="w-6 h-6" />}
            title="View Tracking"
            description="See how many people viewed your event page, by day."
          />
          <FeatureCard
            icon={<ScanLine className="w-6 h-6" />}
            title="Check-in Rates"
            description="How many tickets sold vs. how many showed up. Know your no-show rate."
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6" />}
            title="Referrer Breakdown"
            description="See where your traffic comes from. Instagram? Direct? Friend's link?"
          />
          <FeatureCard
            icon={<Layers className="w-6 h-6" />}
            title="Tier Performance"
            description="Which tiers sell fastest? What's still available? Visual breakdown."
          />
          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title="Time-Based Insights"
            description="Customizable date ranges. See trends over 7 days, 30 days, or all time."
          />
        </div>
      </FeatureSection>

      {/* Section 07: Artist Features */}
      <FeatureSection
        number="07"
        title="ARTIST-FIRST"
        subtitle="Built-in profiles, lineup management, and features DJs and producers actually want."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Music className="w-6 h-6" />}
            title="Artist Profiles"
            description="Full profiles with bio, socials, genres, booking email, press kit links."
            highlight
          />
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="Lineup Builder"
            description="Add artists with roles (DJ, Producer, Live), photos, and set times."
          />
          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title="Set Time Display"
            description="Show or hide set times. Build anticipation or keep it mysterious."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Verified Badges"
            description="Apply for verification. Stand out as a legitimate artist."
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Past Artists Library"
            description="Organizers get autocomplete from their lineup history. Build faster."
          />
          <FeatureCard
            icon={<Palette className="w-6 h-6" />}
            title="Profile Customization"
            description="Custom accent colors, header styles, and display preferences."
          />
        </div>
      </FeatureSection>

      {/* Section 08: Developer Features */}
      <FeatureSection
        number="08"
        title="BUILD ON TOP"
        subtitle="Full API access for developers. Integrate Afters into your own tools."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Code className="w-6 h-6" />}
            title="REST API"
            description="Full programmatic access to events, tickets, check-ins, and more."
            highlight
          />
          <FeatureCard
            icon={<Lock className="w-6 h-6" />}
            title="Scoped API Keys"
            description="Create keys with specific permissions. Read-only, write, or full access."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Rate Limiting"
            description="100 requests/minute per key. Headers tell you exactly where you stand."
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6" />}
            title="Webhooks"
            description="Get notified when tickets are purchased, checked in, or refunded."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Branded Docs"
            description="Full documentation with code examples. Built right into the dashboard."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Multi-Key Support"
            description="Up to 10 API keys per account. Separate keys for different apps."
          />
        </div>
      </FeatureSection>

      {/* Section 09: Extras */}
      <FeatureSection
        number="09"
        title="AND EVERYTHING ELSE"
        subtitle="The details that make a real difference when you're running events."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={<Globe className="w-6 h-6" />}
            title="4 Languages"
            description="English, Spanish (ES/LA), Portuguese (BR)."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Staff Management"
            description="Roles, permissions, and invite links."
          />
          <FeatureCard
            icon={<Timer className="w-6 h-6" />}
            title="Event Expiration"
            description="Auto-expire after 6h, 12h, 24h, or never."
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Date Shortcuts"
            description="'Tonight' and 'Tomorrow' buttons."
          />
        </div>
      </FeatureSection>

      {/* CTA */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-headline tracking-tight mb-6">
            READY TO DO <span className="text-[#ff1493]">AFTER</span> BETTER?
          </h2>
          <p className="text-white/50 mb-12 max-w-xl mx-auto">
            Join organizers who are tired of generic platforms. Create your first event in minutes.
            No credit card required to start.
          </p>
          <Link
            href="/d"
            className="inline-flex items-center gap-2 px-10 py-5 bg-[#ff1493] text-black font-bold tracking-wider uppercase hover:bg-white transition-all"
          >
            Start Hosting Free
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="font-headline text-xl">
            <span className="text-[#ff1493]">.</span>
          </Link>
          <p className="text-[10px] text-white/20 tracking-wider uppercase font-mono">
            &copy; {new Date().getFullYear()} Afters. The underground platform.
          </p>
        </div>
      </footer>
    </div>
  )
}
