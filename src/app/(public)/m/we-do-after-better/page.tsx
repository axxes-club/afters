"use client"

import { Fragment } from "react"
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
            href="/overview"
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
              href="/overview"
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

      {/* The Manifesto */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="border-l-2 border-[#ff1493] pl-6 md:pl-10">
            <p className="text-xs font-mono text-[#ff1493] tracking-widest mb-4">
              WE&apos;VE BEEN IN THE PARKING LOT AT 3AM
            </p>
            <p className="text-xl md:text-2xl text-white/80 leading-relaxed mb-6">
              Refreshing for the address drop. Watching the best nights happen
              in spaces that weren&apos;t supposed to exist. Seeing what works when
              the sun comes up and the party&apos;s still going.
            </p>
            <p className="text-white/40 leading-relaxed">
              Afters wasn&apos;t built in a boardroom. It was built in warehouses,
              basements, rooftops, and a few places we probably shouldn&apos;t mention.
              Every feature exists because we&apos;ve felt the pain of not having it.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="relative z-10 py-20 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-headline tracking-tight mb-6">
            EVENTBRITE WASN&apos;T BUILT FOR THIS
          </h2>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto mb-6">
            They built for conferences with badge lanyards and sponsored coffee.
            For events that end at 10pm with a networking hour.
          </p>
          <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
            You&apos;re running something different. The lineup drops at midnight.
            The address is the secret. The party doesn&apos;t end when they say it does.
            And your ticketing platform should understand that.
          </p>
        </div>
      </section>

      {/* Section 01: Privacy & Secrecy */}
      <FeatureSection
        number="01"
        title="LOCATION PRIVACY"
        subtitle="The address drop is half the ritual. That moment your phone buzzes and you finally know where you're going? We built every feature to protect that feeling."
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

      {/* Observation 1 */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <p className="text-xs font-mono text-white/30 tracking-widest mb-3">OBSERVATION</p>
          <p className="text-lg text-white/70 leading-relaxed">
            &quot;The events that sell out fastest are the ones where nobody knows where
            it is until they&apos;ve committed. We&apos;ve seen it over and over. The mystery
            isn&apos;t a gimmick—it&apos;s half the draw.&quot;
          </p>
        </div>
      </div>

      {/* Section 02: Design & Vibe */}
      <FeatureSection
        number="02"
        title="AESTHETICS THAT HIT"
        subtitle="A generic event page kills the vibe before anyone walks in. The way your event looks online is the first hit of what's coming. Make it count."
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
        subtitle="It's 2am. Your door team is running on fumes. The line's getting restless. The bass is calling people in. Nobody has time for a crashing app. We built for that exact moment."
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
        subtitle="The promoter's phone is blowing up. Artist manager needs 4 more. Headliner's crew just landed and they're not on the list. This is how real doors actually work."
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
        subtitle="Early bird for the loyal ones. Secret tier for the inner circle. Price bump when word gets out. The underground has always had tiers—now your platform does too."
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

      {/* Observation 2 */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <p className="text-xs font-mono text-white/30 tracking-widest mb-3">OBSERVATION</p>
          <p className="text-lg text-white/70 leading-relaxed">
            &quot;People check their ticket 3x more when they&apos;re waiting for an address reveal.
            That anticipation isn&apos;t a bug—it&apos;s the whole point. We designed around it.&quot;
          </p>
        </div>
      </div>

      {/* Section 06: Analytics */}
      <FeatureSection
        number="06"
        title="KNOW YOUR NUMBERS"
        subtitle="You need to know if you're building something or burning money. Not vanity metrics. Real numbers that tell you what's working and what's not."
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
        subtitle="DJs and producers aren't 'vendors.' They're the reason people show up. We built profiles and lineup tools that treat them like it."
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
        subtitle="Some of you are building your own thing. Custom integrations, automated workflows, weird experimental stuff. We're not going to gatekeep—here's the API."
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
        subtitle="The small stuff that adds up. Features we built because we kept running into the same problems, over and over, at 4am."
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

      {/* The Shape of a Night */}
      <section className="relative z-10 py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-mono text-[#ff1493] tracking-widest mb-8">
            THE SHAPE OF A NIGHT
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-12">
            {["THE RUMOR", "THE SEARCH", "THE COMMIT", "THE WAIT",
              "THE ADDRESS", "THE ARRIVAL", "THE MOMENT", "THE MEMORY"].map((phase, i) => (
              <Fragment key={phase}>
                <span className="text-sm md:text-lg font-mono text-white/60">{phase}</span>
                {i < 7 && <span className="text-[#ff1493]">→</span>}
              </Fragment>
            ))}
          </div>

          <p className="text-white/40 max-w-2xl mx-auto">
            Every feature we build serves one of these moments.
            If it doesn&apos;t make the night better, we don&apos;t ship it.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-headline tracking-tight mb-6">
            READY TO DO <span className="text-[#ff1493]">AFTER</span> BETTER?
          </h2>
          <p className="text-white/50 mb-4 max-w-xl mx-auto">
            The underground doesn&apos;t wait. Neither should you.
          </p>
          <p className="text-white/40 mb-12 max-w-xl mx-auto text-sm">
            Your first event is free. No credit card. No corporate onboarding deck.
            Just you, your party, and a platform that actually gets it.
          </p>
          <Link
            href="/overview"
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
