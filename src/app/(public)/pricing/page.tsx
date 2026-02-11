import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { CompetitorComparison } from "@/components/pricing/CompetitorComparison";
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
  Sparkles,
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

/* ─── data ─── */

const allFeatures = [
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
    icon: Users,
    title: "Staff Management",
    description:
      "Add team members with roles — ticket scanners, event editors, customer support, finance. Full access control.",
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
    icon: Link2,
    title: "Referral Tracking",
    description:
      "Track which links drive the most ticket sales. Know exactly where your audience comes from.",
  },
  {
    icon: Tag,
    title: "Custom Event URLs",
    description:
      "Branded short links for your events. Clean URLs that match your brand.",
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
  { text: "Organizer & artist profiles", icon: UserCircle },
  { text: "Follow & save events", icon: Heart },
  { text: "Multi-language (EN/ES/PT)", icon: Languages },
  { text: "Flyer uploads", icon: Music },
  { text: "Mobile-optimized pages", icon: ScanLine },
  { text: "Staff management (5 roles)", icon: Users },
  { text: "Promo codes & discounts", icon: Tag },
  { text: "Custom branding & colors", icon: Palette },
  { text: "Referral link tracking", icon: Link2 },
  { text: "Priority support", icon: Shield },
];

const testimonials = [
  {
    name: "DJ KRAVE",
    role: "Charlotte, NC",
    quote:
      "We switched from Eventbrite and saved hundreds in fees our first month. The analytics are way better too.",
  },
  {
    name: "NEON COLLECTIVE",
    role: "Raleigh, NC",
    quote:
      "Every feature we need, no paywall. Staff management and analytics included? This is how it should be.",
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
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-pink/5 blur-[80px]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-pink/30 bg-pink/5 text-pink text-sm font-medium">
              <Crown className="size-4" />
              <span className="font-display tracking-wide">
                LOWEST FEES IN NIGHTLIFE
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">One plan.</span>
              <br />
              <span className="text-gradient">All features.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Every organizer gets full access to every feature.
              <br className="hidden sm:block" />
              No tiers. No paywalls. Just fair pricing.
            </p>

            <p className="text-muted-foreground/60 text-sm mb-12">
              5% + $0.50 per paid ticket · Free events = $0 fees · No monthly subscription
            </p>
          </div>
        </section>

        {/* ═══════════════ SINGLE PRICING CARD ═══════════════ */}
        <section className="max-w-xl mx-auto px-4 pb-20">
          <div className="relative">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-pink/60 via-pink/20 to-pink/5" />
            <div className="relative rounded-2xl bg-[#0a0a0a] p-8">
              <div className="mb-6">
                <p className="text-sm text-pink font-display tracking-wide uppercase mb-2 flex items-center gap-1.5">
                  <Crown className="size-3.5" /> Full Access
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white font-display">
                    Free
                  </span>
                  <span className="text-muted-foreground text-lg">to start</span>
                </div>
                <p className="text-muted-foreground/60 text-sm mt-2">
                  Only pay when you sell tickets.
                </p>
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-3 py-2 border-b border-white/5">
                  <Percent className="size-4 text-pink shrink-0" />
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
                      ~$2.67 on a $30 ticket{" "}
                      <span className="text-green-400 text-xs font-display">
                        (8.9% total)
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

              <div className="grid grid-cols-2 gap-2 mb-8">
                {allIncluded.map((f) => (
                  <div key={f.text} className="flex items-center gap-2">
                    <Check className="size-4 text-pink shrink-0" />
                    <span className="text-sm text-white/80">{f.text}</span>
                  </div>
                ))}
              </div>

              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="w-full py-6 text-base font-bold glow-pink hover:scale-[1.02] transition-transform"
                >
                  <Zap className="size-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>

              <p className="text-xs text-muted-foreground/40 mt-4 text-center">
                No credit card required · No monthly fees · Pay only when you sell
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════ COMPETITOR COMPARISON ═══════════════ */}
        <CompetitorComparison />

        {/* ═══════════════ ALL FEATURES GRID ═══════════════ */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything included for{" "}
              <span className="text-gradient">every organizer</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No artificial limits. No premium tiers. Every feature, unlocked.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {allFeatures.map((feature) => (
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

        {/* ═══════════════ WHY NO TIERS ═══════════════ */}
        <section className="max-w-4xl mx-auto px-4 py-20">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink/10 via-transparent to-pink/5" />
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-pink/30 via-pink/5 to-transparent pointer-events-none" />

            <div className="relative p-8 sm:p-12 text-center">
              <Sparkles className="size-8 text-pink mx-auto mb-6" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                Why no subscription tiers?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                We believe every organizer deserves the same tools to succeed. 
                Premium tiers create artificial barriers.{" "}
                <span className="text-pink font-bold">
                  We&apos;d rather compete on quality than lock features behind paywalls.
                </span>
              </p>

              <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-10">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white font-display">
                    5%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Simple platform fee
                  </p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-pink font-display">
                    $0
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monthly subscription
                  </p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white font-display">
                    100%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Features unlocked
                  </p>
                </div>
              </div>

              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="text-base font-bold px-10 py-6 glow-pink hover:scale-[1.02] transition-transform"
                >
                  Start Selling Tickets
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
                q: "Why did you remove the subscription tiers?",
                a: "We believe every organizer should have access to the same tools. Premium tiers create artificial barriers. Our business model works on transaction fees, so we don't need to gate features behind monthly subscriptions.",
              },
              {
                q: "Is AFTERS RADIO free?",
                a: "Yes. Artists can submit tracks and listeners can stream. It's a core part of the Afters experience.",
              },
              {
                q: "How does staff management work?",
                a: "Invite team members by email and assign them roles: Admin (full access), Scanner (ticket check-in), Editor (event posts), Support (customer messaging), or Finance (analytics & reports). Each role has granular permissions.",
              },
              {
                q: "Can I use promo codes?",
                a: "Yes! Create discount codes, early-bird pricing, and referral links. All included, no extra charge.",
              },
              {
                q: "What about analytics?",
                a: "Full analytics dashboard with real-time sales data, demographic breakdowns, and conversion tracking. All organizers get the same insights.",
              },
              {
                q: "How do payouts work?",
                a: "Connect your Stripe account and receive payouts directly. We use Stripe Connect for secure, fast transfers.",
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
            <span className="text-gradient">starts here.</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            All features. No subscription. Just fair fees.
            <br />
            Create your first event in minutes.
          </p>

          <Link href="/sign-up">
            <Button
              size="lg"
              className="text-base font-bold px-10 py-6 glow-pink hover:scale-[1.02] transition-transform"
            >
              <Crown className="size-5 mr-2" />
              Get Started Free
            </Button>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
