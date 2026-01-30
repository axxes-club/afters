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
  X,
  Sparkles,
  ArrowRight,
  Clock,
  BadgeCheck,
  Globe,
  Palette,
  Headphones,
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
    "The lowest fees in nightlife ticketing. Free to start. Signature at $45/mo with a 7-day free trial. Compare us to Posh, Eventbrite, DICE, and Luma.",
};

/* ─── data ─── */

const signatureFeatures = [
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

const comparisonRows = [
  // ── Free features ──
  { feature: "Unlimited Events", free: true, signature: true },
  { feature: "Event Discovery & Listings", free: true, signature: true },
  { feature: "Stripe Connect Payouts", free: true, signature: true },
  { feature: "QR Code Check-in Scanner", free: true, signature: true },
  { feature: "Manual Ticket Lookup", free: true, signature: true },
  { feature: "Multi-Tier Ticketing", free: true, signature: true },
  { feature: "Apple Wallet Passes", free: true, signature: true },
  { feature: "Basic Analytics", free: true, signature: true },
  { feature: "Organizer Profile Page", free: true, signature: true },
  { feature: "Artist Profile Page", free: true, signature: true },
  { feature: "AFTERS RADIO Access", free: true, signature: true },
  { feature: "Follow & Save Events", free: true, signature: true },
  { feature: "Flyer Uploads", free: true, signature: true },
  { feature: "Multi-Language (EN/ES/PT)", free: true, signature: true },
  { feature: "Mobile-Optimized Pages", free: true, signature: true },
  { feature: "Artist Verification Requests", free: true, signature: true },
  // ── Signature features ──
  { feature: "Reduced Platform Fees (2%)", free: false, signature: true },
  { feature: "Priority Event Placement", free: false, signature: true },
  { feature: "Advanced Analytics & Funnels", free: false, signature: true },
  { feature: "Custom Branding & Colors", free: false, signature: true },
  { feature: "Promo Codes & Discounts", free: false, signature: true },
  { feature: "Staff Management (5 Roles)", free: false, signature: true },
  { feature: "Verified Organizer Badge", free: false, signature: true },
  { feature: "Priority Support (24/7)", free: false, signature: true },
  { feature: "Multi-City Management", free: false, signature: true },
  { feature: "Referral Link Tracking", free: false, signature: true },
  { feature: "Custom Event URLs", free: false, signature: true },
];

const testimonials = [
  {
    name: "DJ KRAVE",
    role: "Charlotte, NC",
    quote:
      "Since upgrading to Signature, my ticket sales doubled. The priority placement alone is worth it.",
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
              <span className="text-white">Keep more.</span>
              <br />
              <span className="text-gradient">Sell more.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Other platforms take 10–13% of every ticket.
              <br className="hidden sm:block" />
              We start at 5%. Go Signature and drop it to 2%.
            </p>

            <p className="text-muted-foreground/60 text-sm mb-12">
              Free to start · 7-day free trial on Signature · No contracts · No setup fees
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
                  { text: "Unlimited events", icon: Layers },
                  { text: "Event discovery listing", icon: Globe },
                  { text: "Stripe Connect payouts", icon: CircleDollarSign },
                  { text: "QR check-in scanner", icon: QrCode },
                  { text: "Multi-tier ticketing", icon: Ticket },
                  { text: "Apple Wallet passes", icon: Wallet },
                  { text: "Basic analytics", icon: BarChart3 },
                  { text: "AFTERS RADIO access", icon: Radio },
                  { text: "Organizer & artist profiles", icon: UserCircle },
                  { text: "Follow & save events", icon: Heart },
                  { text: "Multi-language (EN/ES/PT)", icon: Languages },
                  { text: "Flyer uploads", icon: Music },
                  { text: "Mobile-optimized pages", icon: ScanLine },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-2.5">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span className="text-sm text-white/80">{f.text}</span>
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

            {/* Signature TIER */}
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
                    <Crown className="size-3.5" /> Signature
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white font-display">
                      $45
                    </span>
                    <span className="text-muted-foreground text-lg">/mo</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold font-display">
                      <Clock className="size-3" />
                      7-DAY FREE TRIAL
                    </span>
                    <span className="text-muted-foreground/60 text-sm">
                      Cancel anytime.
                    </span>
                  </div>
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
                    { text: "Everything in Free, plus:", highlight: true },
                    { text: "Reduced platform fees (2%)" },
                    { text: "Priority event placement" },
                    { text: "Advanced analytics & funnels" },
                    { text: "Custom branding & colors" },
                    { text: "Promo codes & discounts" },
                    { text: "Staff management (5 roles)" },
                    { text: "Verified organizer badge" },
                    { text: "Priority support (24/7)" },
                    { text: "Multi-city management" },
                    { text: "Referral link tracking" },
                    { text: "Custom event URLs" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-center gap-2.5">
                      {"highlight" in f && f.highlight ? (
                        <Sparkles className="size-4 text-pink shrink-0" />
                      ) : (
                        <Check className="size-4 text-pink shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          "highlight" in f && f.highlight
                            ? "text-pink font-bold font-display"
                            : "text-white/80"
                        }`}
                      >
                        {f.text}
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
                    Start 7-Day Free Trial
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground/40 mt-4 text-center">
                  No charge until trial ends · Billed monthly · Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ COMPETITOR COMPARISON (hidden by default) ═══════════════ */}
        <CompetitorComparison />

        {/* ═══════════════ SIGNATURE FEATURES GRID ═══════════════ */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you unlock with{" "}
              <span className="text-gradient">Signature</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built for organizers who are serious about growing their events.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {signatureFeatures.map((feature) => (
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

        {/* ═══════════════ FREE VS Signature TABLE ═══════════════ */}
        <section className="max-w-3xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Free vs <span className="text-gradient">Signature</span>
            </h2>
            <p className="text-muted-foreground">
              See exactly what you get — and what you unlock.
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
                  <Crown className="size-3.5" /> Signature
                </span>
              </div>
            </div>

            {comparisonRows.map((row, i) => {
              // Add a visual separator between free and signature sections
              const isFirstSignature = i > 0 && !row.free && comparisonRows[i - 1].free;
              return (
                <div key={row.feature}>
                  {isFirstSignature && (
                    <div className="border-b-2 border-pink/20 bg-pink/[0.03]">
                      <div className="px-4 py-2 text-xs font-display text-pink font-bold tracking-wide uppercase flex items-center gap-1.5">
                        <Crown className="size-3" />
                        Signature Only
                      </div>
                    </div>
                  )}
                  <div
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
                </div>
              );
            })}
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
            <div className="absolute inset-0 bg-gradient-to-br from-pink/10 via-transparent to-pink/5" />
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-pink/30 via-pink/5 to-transparent pointer-events-none" />

            <div className="relative p-8 sm:p-12 text-center">
              <Sparkles className="size-8 text-pink mx-auto mb-6" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                Signature pays for itself. Fast.
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
                  Start Your Free Trial
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
                q: "Is there a free trial?",
                a: "Yes! Every Signature subscription starts with a 7-day free trial. Full access to all features — cancel anytime before the trial ends and pay nothing.",
              },
              {
                q: "What do I get for free?",
                a: "A lot. Unlimited events, QR check-in, multi-tier ticketing, Apple Wallet passes, AFTERS RADIO access, organizer and artist profiles, multi-language support, Stripe payouts, basic analytics, and more. Most platforms charge for half of this.",
              },
              {
                q: "What does Signature add?",
                a: "Lower fees (2% vs 5%), priority event placement, advanced analytics with funnels, custom branding, promo codes, staff management with 5 roles, verified badge, multi-city management, referral tracking, and 24/7 priority support.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. No contracts, no cancellation fees. Cancel from your dashboard whenever you want. Your Signature perks stay active until the end of your billing period.",
              },
              {
                q: "What happens if I downgrade?",
                a: "Your events stay live. You go back to 5% + $0.50 platform fees and lose Signature perks. Staff members are suspended but not deleted — they reactivate if you re-subscribe. No data is lost.",
              },
              {
                q: "Is AFTERS RADIO free?",
                a: "Yes. Artists can submit tracks and listeners can stream on both Free and Signature plans. It's a core part of the Afters experience.",
              },
              {
                q: "How does staff management work?",
                a: "Signature organizers can invite team members by email and assign them roles: Admin (full access), Scanner (ticket check-in), Editor (event posts), Support (customer messaging), or Finance (analytics & reports). Each role has granular permissions.",
              },
              {
                q: "How does priority placement work?",
                a: "Signature events are boosted to the top of discovery feeds, search results, and city pages. Your event gets seen first — more impressions, more sales.",
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
            Start free. Try Signature for 7 days — on us.
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
                Try Signature Free — 7 Days
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
