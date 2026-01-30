import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Crown,
  Zap,
  TrendingUp,
  Shield,
  Megaphone,
  BarChart3,
  Star,
  Users,
  Ticket,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Clock,
  BadgeCheck,
  Globe,
  Palette,
  Headphones,
} from "lucide-react";

export const metadata = {
  title: "VIP for Organizers — Afters",
  description:
    "Unlock the full power of Afters. Priority placement, advanced analytics, custom branding, and more. $45/month.",
};

const vipFeatures = [
  {
    icon: TrendingUp,
    title: "Priority Placement",
    description:
      "Your events appear first in discovery feeds. More eyeballs. More tickets sold.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Real-time sales data, demographic breakdowns, conversion funnels, and ROI tracking.",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    description:
      "Your logo, your colors, your vibe. Fully branded event pages that match your identity.",
  },
  {
    icon: Megaphone,
    title: "Promo Tools",
    description:
      "Create discount codes, early-bird pricing, and referral links. Built-in marketing engine.",
  },
  {
    icon: Shield,
    title: "Priority Support",
    description:
      "Skip the line. Direct access to our team when you need help — day or night.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Badge",
    description:
      "Stand out with a verified organizer badge. Builds trust. Sells tickets.",
  },
  {
    icon: Globe,
    title: "Multi-City Events",
    description:
      "Run events across multiple cities from a single dashboard. Tour management made easy.",
  },
  {
    icon: Headphones,
    title: "AFTERS RADIO Feature",
    description:
      "Get your artists featured on AFTERS RADIO. Reach thousands of listeners before the event.",
  },
];

const comparisonRows = [
  { feature: "Event Listings", free: true, vip: true },
  { feature: "Stripe Payouts", free: true, vip: true },
  { feature: "QR Check-in Scanner", free: true, vip: true },
  { feature: "Basic Analytics", free: true, vip: true },
  { feature: "Priority Event Placement", free: false, vip: true },
  { feature: "Advanced Analytics & Funnels", free: false, vip: true },
  { feature: "Custom Branding & Colors", free: false, vip: true },
  { feature: "Promo Codes & Discounts", free: false, vip: true },
  { feature: "Verified Organizer Badge", free: false, vip: true },
  { feature: "Priority Support (24/7)", free: false, vip: true },
  { feature: "Multi-City Management", free: false, vip: true },
  { feature: "AFTERS RADIO Feature", free: false, vip: true },
  { feature: "Referral Link Tracking", free: false, vip: true },
  { feature: "Custom Event URLs", free: false, vip: true },
];

const testimonials = [
  {
    name: "DJ KRAVE",
    role: "Charlotte, NC",
    quote:
      "Since going VIP, my ticket sales doubled. The priority placement alone is worth it.",
  },
  {
    name: "NEON COLLECTIVE",
    role: "Raleigh, NC",
    quote:
      "The analytics helped us understand our audience. We stopped guessing and started selling.",
  },
  {
    name: "VIBE DISTRICT",
    role: "Miami, FL",
    quote:
      "Custom branding on our event pages? Our brand finally looks as good online as it does on the dancefloor.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-black pt-16">
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-pink/5 blur-[120px]" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-pink/3 blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-purple-600/5 blur-[80px]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-pink/30 bg-pink/5 text-pink text-sm font-medium">
              <Crown className="size-4" />
              <span className="font-display tracking-wide">
                FOR ORGANIZERS
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">GO </span>
              <span className="text-gradient">VIP</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Stop competing for attention. Start commanding it.
              <br className="hidden sm:block" />
              Everything you need to sell out every event.
            </p>

            <p className="text-muted-foreground/60 text-sm mb-12">
              Join the organizers who stopped leaving money on the table.
            </p>

            {/* Price card */}
            <div className="relative inline-block">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-pink/60 via-pink/20 to-transparent" />
              <div className="relative bg-[#0a0a0a] rounded-2xl px-12 py-10">
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-6xl sm:text-7xl font-bold text-white font-display">
                    $45
                  </span>
                  <span className="text-muted-foreground text-lg">/mo</span>
                </div>
                <p className="text-muted-foreground/60 text-sm mb-8">
                  Cancel anytime · No contracts · No setup fees
                </p>

                <Link href="/dashboard/settings">
                  <Button
                    size="lg"
                    className="w-full text-base font-bold px-12 py-6 glow-pink hover:scale-[1.02] transition-transform"
                  >
                    <Zap className="size-5 mr-2" />
                    Upgrade to VIP
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground/40 mt-4">
                  Billed monthly · Stripe secure checkout
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ FEATURES GRID ═══════════════ */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you get with{" "}
              <span className="text-gradient">VIP</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built for organizers who are serious about growing their events.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vipFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:border-pink/20 hover:bg-pink/[0.02] transition-all duration-300"
              >
                <div className="size-10 rounded-lg bg-pink/10 flex items-center justify-center mb-4 group-hover:bg-pink/20 transition-colors">
                  <feature.icon className="size-5 text-pink" />
                </div>
                <h3 className="font-display text-white font-bold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ COMPARISON TABLE ═══════════════ */}
        <section className="max-w-3xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Free vs <span className="text-gradient">VIP</span>
            </h2>
            <p className="text-muted-foreground">See exactly what you unlock.</p>
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-3 bg-white/[0.03] border-b border-white/10">
              <div className="p-4 text-sm font-medium text-muted-foreground">
                Feature
              </div>
              <div className="p-4 text-center text-sm font-medium text-muted-foreground">
                Free
              </div>
              <div className="p-4 text-center text-sm font-medium">
                <span className="text-pink font-display font-bold flex items-center justify-center gap-1.5">
                  <Crown className="size-3.5" /> VIP
                </span>
              </div>
            </div>

            {/* Feature rows */}
            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 border-b border-white/5 ${
                  !row.free
                    ? "bg-pink/[0.015]"
                    : ""
                } hover:bg-white/[0.02] transition-colors`}
              >
                <div className="p-4 text-sm text-white/80">{row.feature}</div>
                <div className="p-4 flex justify-center">
                  {row.free ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <X className="size-4 text-white/20" />
                  )}
                </div>
                <div className="p-4 flex justify-center">
                  <Check className="size-4 text-pink" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ SOCIAL PROOF ═══════════════ */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Organizers{" "}
              <span className="text-gradient">love it</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-pink text-pink"
                    />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-white font-bold text-sm font-display">
                    {t.name}
                  </p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ ROI SECTION ═══════════════ */}
        <section className="max-w-4xl mx-auto px-4 py-20">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink/10 via-transparent to-purple-600/5" />
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-pink/30 via-pink/5 to-transparent pointer-events-none" />

            <div className="relative p-8 sm:p-12 text-center">
              <Sparkles className="size-8 text-pink mx-auto mb-6" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                Do the math
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                Sell <span className="text-white font-bold">just 3 extra tickets</span> per
                event from priority placement alone and VIP pays for itself.
                Most organizers see{" "}
                <span className="text-pink font-bold">10–25% more sales</span>{" "}
                in their first month.
              </p>

              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-10">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white font-display">
                    2×
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    More visibility
                  </p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-pink font-display">
                    10%+
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sales increase
                  </p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white font-display">
                    24h
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Support response
                  </p>
                </div>
              </div>

              <Link href="/dashboard/settings">
                <Button
                  size="lg"
                  className="text-base font-bold px-10 py-6 glow-pink hover:scale-[1.02] transition-transform"
                >
                  Start VIP Now
                  <ArrowRight className="size-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════ FAQ ═══════════════ */}
        <section className="max-w-2xl mx-auto px-4 py-20">
          <h2 className="font-display text-3xl font-bold text-white text-center mb-12">
            Questions?
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. No contracts, no cancellation fees. Cancel from your dashboard whenever you want. Your VIP perks stay active until the end of your billing period.",
              },
              {
                q: "Do I keep my existing events?",
                a: "Of course. All your events, analytics, and data stay exactly as they are. VIP just unlocks more features on top.",
              },
              {
                q: "What happens to my events if I downgrade?",
                a: "Your events stay live. You just lose VIP perks like priority placement and custom branding. No data is deleted.",
              },
              {
                q: "Is there a free trial?",
                a: "Not right now — but at $45/mo with no commitment, there's zero risk. Try it for a month. If it doesn't pay for itself, cancel.",
              },
              {
                q: "How does priority placement work?",
                a: "VIP events are boosted to the top of discovery feeds, search results, and city pages. Your event gets seen first.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="border-b border-white/5 pb-6"
              >
                <h3 className="text-white font-bold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <section className="max-w-3xl mx-auto px-4 pt-10 pb-32 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-white">Your next event</span>
            <br />
            <span className="text-gradient">deserves VIP.</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            $45/mo. No contracts. Cancel anytime.
            <br />
            The only question is why you haven&apos;t started yet.
          </p>

          <Link href="/dashboard/settings">
            <Button
              size="lg"
              className="text-lg font-bold px-14 py-7 glow-pink hover:scale-[1.02] transition-transform"
            >
              <Crown className="size-5 mr-2" />
              Go VIP
            </Button>
          </Link>
        </section>
      </main>
    </>
  );
}
