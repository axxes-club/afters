import Link from "next/link";
import {
  Crown,
  TrendingUp,
  Shield,
  Megaphone,
  BarChart3,
  Star,
  Users,
  Ticket,
  Check,
  ArrowRight,
  BadgeCheck,
  Globe,
  Palette,
  Percent,
  CircleDollarSign,
  Calculator,
  QrCode,
  Wallet,
  Radio,
  Languages,
  Heart,
  UserCircle,
  Music,
  ScanLine,
  Layers,
  Link2,
  Tag,
} from "lucide-react";

export const metadata = {
  title: "Pricing — Afters",
  description:
    "The lowest fees in nightlife ticketing. All features included for every organizer. 5% + $0.50 per paid ticket. Free events = $0 fees.",
};

const allFeatures = [
  {
    icon: TrendingUp,
    title: "Priority Placement",
    description: "Your events appear first in discovery feeds.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Real-time sales data and conversion tracking.",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    description: "Your logo, colors, and branded event pages.",
  },
  {
    icon: Megaphone,
    title: "Promo Tools",
    description: "Discount codes, early-bird, and referral links.",
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Team members with granular role permissions.",
  },
  {
    icon: Shield,
    title: "Priority Support",
    description: "Direct access to our team when you need help.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Badge",
    description: "Stand out with verified organizer status.",
  },
  {
    icon: Globe,
    title: "Multi-City Events",
    description: "Run events across cities from one dashboard.",
  },
  {
    icon: Link2,
    title: "Referral Tracking",
    description: "Track which links drive the most sales.",
  },
  {
    icon: Tag,
    title: "Custom URLs",
    description: "Branded short links for your events.",
  },
];

const allIncluded = [
  { text: "Unlimited events", icon: Layers },
  { text: "Event discovery listing", icon: Globe },
  { text: "Stripe Connect payouts", icon: CircleDollarSign },
  { text: "QR check-in scanner", icon: QrCode },
  { text: "Multi-tier ticketing", icon: Ticket },
  { text: "Apple Wallet passes", icon: Wallet },
  { text: "Advanced analytics", icon: BarChart3 },
  { text: "AFTERS RADIO access", icon: Radio },
  { text: "Organizer profiles", icon: UserCircle },
  { text: "Follow & save events", icon: Heart },
  { text: "Multi-language", icon: Languages },
  { text: "Flyer uploads", icon: Music },
  { text: "Mobile-optimized", icon: ScanLine },
  { text: "Staff management", icon: Users },
  { text: "Promo codes", icon: Tag },
  { text: "Custom branding", icon: Palette },
  { text: "Referral tracking", icon: Link2 },
  { text: "Priority support", icon: Shield },
];

const testimonials = [
  {
    name: "DJ KRAVE",
    role: "Charlotte, NC",
    quote: "Switched from Eventbrite and saved hundreds in fees our first month.",
  },
  {
    name: "NEON COLLECTIVE",
    role: "Raleigh, NC",
    quote: "Every feature we need, no paywall. This is how it should be.",
  },
  {
    name: "VIBE DISTRICT",
    role: "Miami, FL",
    quote: "Custom branding on event pages. Our brand finally looks right.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/5">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            AFTERS<span className="text-[#ff1493]">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-xs tracking-wider text-white/50 hover:text-white transition-colors uppercase"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-xs px-4 py-2 bg-[#ff1493] text-black font-medium uppercase tracking-wider"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-14">
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 border border-[#ff1493]/30 text-[#ff1493] text-xs uppercase tracking-wider">
              <Crown className="h-3 w-3" />
              <span>Lowest fees in nightlife</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 uppercase">
              One plan.<br />
              <span className="text-[#ff1493]">All features.</span>
            </h1>

            <p className="text-white/50 text-sm mb-4 max-w-lg mx-auto">
              Every organizer gets full access to every feature.
              No tiers. No paywalls. Just fair pricing.
            </p>

            <p className="text-white/30 text-xs uppercase tracking-wider">
              5% + $0.50 per paid ticket · Free events = $0 fees
            </p>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="max-w-md mx-auto px-4 pb-20">
          <div className="border border-[#ff1493]/30" style={{ borderLeftWidth: '2px', borderLeftColor: '#ff1493' }}>
            <div className="px-6 py-4 border-b border-white/5" style={{ backgroundColor: '#ff149310' }}>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                <Crown className="h-3 w-3 text-[#ff1493]" />
                <span className="text-[#ff1493]">Full Access</span>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <span className="text-4xl font-bold">Free</span>
                <span className="text-white/30 ml-2 text-sm">to start</span>
                <p className="text-white/30 text-xs mt-1">Only pay when you sell tickets</p>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3 text-sm">
                  <Percent className="h-4 w-4 text-[#ff1493]" />
                  <span>5% + $0.50 <span className="text-white/30">platform fee</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CircleDollarSign className="h-4 w-4 text-[#ff1493]" />
                  <span>2.9% + $0.30 <span className="text-white/30">Stripe</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calculator className="h-4 w-4 text-[#ff1493]" />
                  <span>~$2.67 on $30 ticket <span className="text-green-400 text-xs">(8.9%)</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Ticket className="h-4 w-4 text-[#ff1493]" />
                  <span>Free events = $0 fees</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {allIncluded.map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-[#ff1493] flex-shrink-0" />
                    <span className="text-white/70">{f.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/sign-up"
                className="flex items-center justify-center w-full h-12 text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: '#ff1493', color: '#000' }}
              >
                Get Started Free
              </Link>

              <p className="text-[10px] text-white/20 mt-3 text-center uppercase tracking-wider">
                No credit card · No monthly fees
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-5xl mx-auto px-4 py-20 border-t border-white/5">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">
              Everything included
            </h2>
            <p className="text-white/30 text-sm">
              No artificial limits. Every feature, unlocked.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {allFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                <feature.icon className="h-5 w-5 text-[#ff1493] mb-3" />
                <h3 className="text-sm font-bold mb-1">{feature.title}</h3>
                <p className="text-xs text-white/40">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-4xl mx-auto px-4 py-20 border-t border-white/5">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold uppercase tracking-tight">
              Organizers love it
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="p-4 border border-white/5">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-[#ff1493] text-[#ff1493]" />
                  ))}
                </div>
                <p className="text-sm text-white/70 mb-3">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-xs font-bold">{t.name}</p>
                <p className="text-[10px] text-white/30">{t.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-xl mx-auto px-4 py-20 border-t border-white/5">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-center mb-12">
            Questions?
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "What are the fees on free events?",
                a: "Zero. Free events have zero fees. Always.",
              },
              {
                q: "Who pays the fees?",
                a: "By default, fees are added at checkout. You can absorb them if you prefer.",
              },
              {
                q: "How do payouts work?",
                a: "Connect Stripe and receive payouts directly. Fast and secure.",
              },
              {
                q: "Can I use promo codes?",
                a: "Yes. Create discounts, early-bird pricing, and referral links. All included.",
              },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold mb-1">{faq.q}</h3>
                <p className="text-xs text-white/40">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 text-center border-t border-white/5">
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-4">
            Your next event<br />
            <span className="text-[#ff1493]">starts here.</span>
          </h2>
          <p className="text-white/30 text-sm mb-8">
            All features. No subscription. Just fair fees.
          </p>

          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: '#ff1493', color: '#000' }}
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-4">
        <div className="container mx-auto flex justify-between items-center text-[10px] text-white/20 uppercase tracking-wider">
          <span>&copy; {new Date().getFullYear()} Afters</span>
          <Link href="/" className="hover:text-white/40 transition-colors">
            afters.fm
          </Link>
        </div>
      </footer>
    </div>
  );
}
