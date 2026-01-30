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
  DollarSign,
  Percent,
  CircleDollarSign,
  Calculator,
} from "lucide-react";

export const metadata = {
  title: "Pricing — Afters",
  description:
    "The lowest fees in nightlife ticketing. Free to start. VIP at $45/mo. Compare us to Posh, Eventbrite, DICE, and Luma.",
};

/* ─── data ─── */

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
  { feature: "Reduced Platform Fees", free: false, vip: true },
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

const competitors = [
  {
    name: "Posh",
    fee: "10% + $0.99",
    on30: "$3.99",
    pct: "13.3%",
    note: "No paid tier — everyone pays the same high fees",
  },
  {
    name: "Eventbrite",
    fee: "3.7% + $1.79 + 2.9% + $0.30",
    on30: "$3.77",
    pct: "12.6%",
    note: "Processing fee added on top of service fee",
  },
  {
    name: "Luma",
    fee: "5% + 2.9% + $0.30",
    on30: "$2.67",
    pct: "8.9%",
    note: "$59/mo to remove 5% — still pay processing",
  },
  {
    name: "Humanitix",
    fee: "2.1% + $0.99 + 2.9% + $0.30",
    on30: "$2.79",
    pct: "9.3%",
    note: "Charity model — limited nightlife features",
  },
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
      "We switched from Eventbrite and saved hundreds in fees our first month. The analytics are way better too.",
  },
  {
    name: "VIBE DISTRICT",
    role: "Miami, FL",
    quote:
      "Custom branding on our event pages? Our brand finally looks as good online as it does on the dancefloor.",
  },
];

/* ─── page ─── */

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-black pt-16">
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-pink/5 blur-[120px]" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-pink/3 blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-purple-600/5 blur-[80px]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-pink/30 bg-pink/5 text-pink text-sm font-medium">
              <Crown className="size-4" />
              <span className="font-display tracking-wide">
                LOWEST FEES IN NIGHTLIFE
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">Keep more.</span>
              <br />
              <span className="text-gradient">Sell more.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Other platforms take 10–13% of every ticket.
              <br className="hidden sm:block" />
              We start at 5%. VIP drops it to 2%.
            </p>

            <p className="text-muted-foreground/60 text-sm mb-12">
              Free to start · No contracts · No setup fees
            </p>
          </div>
        </section>

        {/* ═══════════════ PRICING CARDS ═══════════════ */}
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FREE TIER */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground font-display tracking-wide uppercase mb-2">
                  Starter
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white font-display">
                    Free
                  </span>
                </div>
                <p className="text-muted-foreground/60 text-sm mt-2">
                  Forever. No credit card required.
                </p>
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-3 py-2 border-b border-white/5">
                  <Percent className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      5% + $0.50{" "}
                      <span className="text-muted-foreground">
                        platform fee
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-white/5">
                  <CircleDollarSign className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      2.9% + $0.30{" "}
                      <span className="text-muted-foreground">
                        Stripe processing
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-white/5">
                  <Calculator className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      ~$2.67 on a $30 ticket{" "}
                      <span className="text-green-400 text-xs font-display">
                        (8.9%)
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Ticket className="size-4 text-muted-foreground shrink-0" />
                  <p className="text-white text-sm font-medium">
                    Free events = $0 fees
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  "Unlimited events",
                  "Event discovery listing",
                  "Stripe payouts",
                  "QR check-in scanner",
                  "Basic analytics",
                  "Mobile-optimized pages",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span className="text-sm text-white/80">{f}</span>
                  </div>
                ))}
              </div>

              <Link href="/sign-up">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full py-6 text-base font-bold"
                >
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* VIP TIER */}
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-pink/60 via-pink/20 to-pink/5" />
              <div className="relative rounded-2xl bg-[#0a0a0a] p-8">
                {/* Popular badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-pink text-black text-xs font-bold font-display tracking-wide">
                    MOST POPULAR
                  </span>
                </div>

                <div className="mb-6 mt-2">
                  <p className="text-sm text-pink font-display tracking-wide uppercase mb-2 flex items-center gap-1.5">
                    <Crown className="size-3.5" /> VIP
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white font-display">
                      $45
                    </span>
                    <span className="text-muted-foreground text-lg">/mo</span>
                  </div>
                  <p className="text-muted-foreground/60 text-sm mt-2">
                    Cancel anytime. Pays for itself in one event.
                  </p>
                </div>

                <div className="space-y-2 mb-8">
                  <div className="flex items-center gap-3 py-2 border-b border-white/5">
                    <Percent className="size-4 text-pink shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">
                        2% + $0.50{" "}
                        <span className="text-muted-foreground">
                          platform fee
                        </span>
                        <span className="text-pink text-xs ml-2 font-display">
                          60% OFF
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-2 border-b border-white/5">
                    <CircleDollarSign className="size-4 text-pink shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">
                        2.9% + $0.30{" "}
                        <span className="text-muted-foreground">
                          Stripe processing
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-2 border-b border-white/5">
                    <Calculator className="size-4 text-pink shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">
                        ~$1.77 on a $30 ticket{" "}
                        <span className="text-pink text-xs font-display">
                          (5.9%)
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <Ticket className="size-4 text-pink shrink-0" />
                    <p className="text-white text-sm font-medium">
                      Free events = $0 fees
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Everything in Free, plus:",
                    "Reduced platform fees (2%)",
                    "Priority event placement",
                    "Advanced analytics & funnels",
                    "Custom branding & colors",
                    "Promo codes & discounts",
                    "Verified organizer badge",
                    "Priority support (24/7)",
                    "Multi-city management",
                    "AFTERS RADIO feature",
                    "Referral link tracking",
                    "Custom event URLs",
                  ].map((f, i) => (
                    <div key={f} className="flex items-center gap-2.5">
                      {i === 0 ? (
                        <Sparkles className="size-4 text-pink shrink-0" />
                      ) : (
                        <Check className="size-4 text-pink shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          i === 0
                            ? "text-pink font-bold font-display"
                            : "text-white/80"
                        }`}
                      >
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                <Link href="/dashboard/settings">
                  <Button
                    size="lg"
                    className="w-full py-6 text-base font-bold glow-pink hover:scale-[1.02] transition-transform"
                  >
                    <Zap className="size-5 mr-2" />
                    Upgrade to VIP
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground/40 mt-4 text-center">
                  Billed monthly · Stripe secure checkout
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ COMPETITOR COMPARISON ═══════════════ */}
        <section className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Compare the{" "}
              <span className="text-gradient">real cost</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Total fees on a $30 ticket. Stripe processing included.
              <br />
              See why organizers are switching to Afters.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 bg-white/[0.03] border-b border-white/10">
              <div className="col-span-3 p-4 text-sm font-medium text-muted-foreground">
                Platform
              </div>
              <div className="col-span-4 p-4 text-sm font-medium text-muted-foreground">
                Fee Structure
              </div>
              <div className="col-span-2 p-4 text-center text-sm font-medium text-muted-foreground">
                On $30
              </div>
              <div className="col-span-3 p-4 text-sm font-medium text-muted-foreground">
                Note
              </div>
            </div>

            {/* Afters VIP — highlighted */}
            <div className="grid grid-cols-12 border-b border-pink/20 bg-pink/[0.04]">
              <div className="col-span-3 p-4">
                <span className="text-pink font-bold font-display text-sm flex items-center gap-1.5">
                  <Crown className="size-3.5" /> Afters VIP
                </span>
              </div>
              <div className="col-span-4 p-4 text-sm text-white/80">
                2% + $0.50 + processing
              </div>
              <div className="col-span-2 p-4 text-center">
                <span className="text-pink font-bold font-display">$1.77</span>
              </div>
              <div className="col-span-3 p-4 text-xs text-green-400">
                + $45/mo · Lowest total cost
              </div>
            </div>

            {/* Afters Free */}
            <div className="grid grid-cols-12 border-b border-pink/10 bg-pink/[0.02]">
              <div className="col-span-3 p-4">
                <span className="text-white font-bold text-sm">
                  Afters Free
                </span>
              </div>
              <div className="col-span-4 p-4 text-sm text-white/80">
                5% + $0.50 + processing
              </div>
              <div className="col-span-2 p-4 text-center">
                <span className="text-white font-bold font-display">
                  $2.67
                </span>
              </div>
              <div className="col-span-3 p-4 text-xs text-green-400">
                No subscription needed
              </div>
            </div>

            {/* Competitors */}
            {competitors.map((c) => (
              <div
                key={c.name}
                className="grid grid-cols-12 border-b border-white/5 hover:bg-white/[0.01] transition-colors"
              >
                <div className="col-span-3 p-4">
                  <span className="text-white/60 text-sm">{c.name}</span>
                </div>
                <div className="col-span-4 p-4 text-sm text-white/40">
                  {c.fee}
                </div>
                <div className="col-span-2 p-4 text-center">
                  <span className="text-white/60 font-display">{c.on30}</span>
                </div>
                <div className="col-span-3 p-4 text-xs text-muted-foreground/60">
                  {c.note}
                </div>
              </div>
            ))}
          </div>

          {/* Savings callout */}
          <div className="mt-8 rounded-xl border border-pink/10 bg-pink/[0.02] p-6 text-center">
            <p className="text-white text-sm">
              <span className="font-bold">Sell 200 tickets at $30?</span>{" "}
              <span className="text-muted-foreground">
                On Posh you&apos;d pay{" "}
              </span>
              <span className="text-white/60 line-through">$798 in fees</span>
              <span className="text-muted-foreground">. On Afters VIP: </span>
              <span className="text-pink font-bold font-display">
                $354 + $45 sub
              </span>
              <span className="text-muted-foreground">.</span>
            </p>
            <p className="text-pink font-bold font-display text-lg mt-2">
              That&apos;s $399 saved. Every single event.
            </p>
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

        {/* ═══════════════ FREE VS VIP TABLE ═══════════════ */}
        <section className="max-w-3xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Free vs <span className="text-gradient">VIP</span>
            </h2>
            <p className="text-muted-foreground">
              See exactly what you unlock.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
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

            {comparisonRows.map((row) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 border-b border-white/5 ${
                  !row.free ? "bg-pink/[0.015]" : ""
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
              Organizers <span className="text-gradient">love it</span>
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
                    <Star key={i} className="size-4 fill-pink text-pink" />
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
                VIP pays for itself. Fast.
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                The fee savings alone cover the $45/mo. Priority placement on
                top of that means{" "}
                <span className="text-pink font-bold">
                  more tickets sold at lower cost
                </span>
                . It&apos;s not an expense — it&apos;s a raise.
              </p>

              <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-10">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white font-display">
                    60%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower platform fees
                  </p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-pink font-display">
                    2×
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    More visibility
                  </p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white font-display">
                    $399
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Saved per 200 tickets vs Posh
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
                q: "What are the fees on free events?",
                a: "Zero. Free events have zero platform fees and zero processing fees. Always.",
              },
              {
                q: "Who pays the fees — me or the attendee?",
                a: "By default, fees are passed to the attendee (added at checkout). You can choose to absorb them if you prefer clean round-number pricing.",
              },
              {
                q: "How do you compare to Posh?",
                a: "Posh charges 10% + $0.99 per ticket with no way to reduce it. Our free tier is already cheaper (5% + $0.50), and VIP drops it to just 2% + $0.50. On a 200-ticket event at $30, you'd save ~$399 vs Posh.",
              },
              {
                q: "Can I cancel VIP anytime?",
                a: "Yes. No contracts, no cancellation fees. Cancel from your dashboard whenever you want. Your VIP perks stay active until the end of your billing period.",
              },
              {
                q: "What happens if I downgrade?",
                a: "Your events stay live. You go back to 5% + $0.50 platform fees and lose VIP perks like priority placement and custom branding. No data is deleted.",
              },
              {
                q: "Is there a free trial?",
                a: "Not right now — but at $45/mo with no commitment, there's zero risk. The fee savings alone usually cover the subscription after a single event.",
              },
              {
                q: "How does priority placement work?",
                a: "VIP events are boosted to the top of discovery feeds, search results, and city pages. Your event gets seen first — more impressions, more sales.",
              },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-white/5 pb-6">
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
            <span className="text-gradient">deserves better fees.</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start free. Upgrade when you&apos;re ready.
            <br />
            Either way, you&apos;re paying less than anywhere else.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button
                variant="outline"
                size="lg"
                className="text-base font-bold px-10 py-6"
              >
                Start Free
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button
                size="lg"
                className="text-base font-bold px-10 py-6 glow-pink hover:scale-[1.02] transition-transform"
              >
                <Crown className="size-5 mr-2" />
                Go VIP — $45/mo
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
