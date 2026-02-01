"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle, MapPin, Users, Zap, Shield } from "lucide-react"
import { Footer } from "@/components/layout/footer"

const STATES = [
  { value: "NC", label: "North Carolina" },
  { value: "SC", label: "South Carolina" },
]

export default function BetaPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "",
    state: "",
    instagram: "",
    reason: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      setSubmitted(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold font-display tracking-tight">
            AFTERS<span className="text-[#ff1493]">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/events" className="text-sm hover:text-[#ff1493] transition-colors">
              EVENTS
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col justify-center pt-20">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff1493]/10 via-black to-black pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#ff1493]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-[#ff1493]/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#ff1493]/30 bg-[#ff1493]/5 mb-8">
              <div className="w-2 h-2 bg-[#ff1493] rounded-full animate-pulse" />
              <span className="text-xs font-display tracking-widest text-[#ff1493]">
                INVITE ONLY
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-none mb-4">
              <span className="font-display">AFTERS</span>
              <br />
              <span className="text-gradient font-display">EARLY ACCESS</span>
              <br />
              <span className="font-display">CLUB</span>
            </h1>

            <p className="text-sm font-display tracking-[0.3em] text-white/40 mb-8">
              BETA PROGRAM
            </p>

            <p className="text-lg md:text-xl text-white/60 max-w-xl mx-auto mb-4">
              We&apos;re building the future of nightlife ticketing. Get in before everyone else.
            </p>

            <p className="text-sm text-white/30 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 text-[#ff1493]" />
              Currently accepting entries from North &amp; South Carolina
            </p>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <p className="text-[#ff1493] font-display text-sm tracking-widest mb-6 text-center">
            WHAT YOU GET
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: "FIRST ACCESS",
                description:
                  "Be the first to use Afters before it goes public. Shape the platform with your feedback.",
              },
              {
                icon: Users,
                title: "COMMUNITY",
                description:
                  "Join a tight-knit group of organizers and nightlife people who are building something new.",
              },
              {
                icon: Shield,
                title: "LOCKED PRICING",
                description:
                  "Beta members lock in the lowest fees forever. The price you start with is the price you keep.",
              },
              {
                icon: CheckCircle,
                title: "PRIORITY SUPPORT",
                description:
                  "Direct line to the team. We build what you need. Your events, your way.",
              },
            ].map((perk, i) => (
              <div
                key={i}
                className="p-6 border border-white/10 hover:border-[#ff1493]/30 transition-colors"
              >
                <perk.icon className="w-6 h-6 text-[#ff1493] mb-4" />
                <h3 className="font-display font-bold text-sm tracking-wider mb-2">
                  {perk.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 relative" id="apply">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#ff1493]/5 to-black pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-lg mx-auto">
            {submitted ? (
              /* Success State */
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 border-2 border-[#ff1493] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-[#ff1493]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                  YOU&apos;RE IN
                </h2>
                <p className="text-white/60 mb-2">
                  Welcome to the Afters Early Access Club.
                </p>
                <p className="text-sm text-white/40 mb-8">
                  We&apos;ll reach out when it&apos;s your turn. Keep an eye on your inbox.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-[#ff1493] hover:text-[#ff69b4] transition-colors font-display text-sm tracking-widest"
                >
                  BACK TO AFTERS
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              /* Form */
              <>
                <div className="text-center mb-10">
                  <p className="text-[#ff1493] font-display text-sm tracking-widest mb-3">
                    REQUEST ACCESS
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">
                    JOIN THE CLUB
                  </h2>
                  <p className="text-white/40 text-sm">
                    Limited spots. Real people only.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-display tracking-widest text-white/60 mb-2"
                    >
                      NAME
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff1493] transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-display tracking-widest text-white/60 mb-2"
                    >
                      EMAIL
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff1493] transition-colors"
                    />
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-xs font-display tracking-widest text-white/60 mb-2"
                      >
                        CITY
                      </label>
                      <input
                        id="city"
                        type="text"
                        required
                        placeholder="Charlotte"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff1493] transition-colors"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="state"
                        className="block text-xs font-display tracking-widest text-white/60 mb-2"
                      >
                        STATE
                      </label>
                      <select
                        id="state"
                        required
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-[#ff1493] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-black text-white/40">
                          Select
                        </option>
                        {STATES.map((s) => (
                          <option key={s.value} value={s.value} className="bg-black">
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div>
                    <label
                      htmlFor="instagram"
                      className="block text-xs font-display tracking-widest text-white/60 mb-2"
                    >
                      INSTAGRAM{" "}
                      <span className="text-white/20">(OPTIONAL)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                        @
                      </span>
                      <input
                        id="instagram"
                        type="text"
                        placeholder="yourhandle"
                        value={form.instagram}
                        onChange={(e) =>
                          setForm({ ...form, instagram: e.target.value.replace("@", "") })
                        }
                        className="w-full pl-9 pr-4 py-3 bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff1493] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label
                      htmlFor="reason"
                      className="block text-xs font-display tracking-widest text-white/60 mb-2"
                    >
                      WHY DO YOU WANT IN?{" "}
                      <span className="text-white/20">(OPTIONAL)</span>
                    </label>
                    <textarea
                      id="reason"
                      rows={3}
                      placeholder="Tell us about yourself or your events..."
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff1493] transition-colors resize-none"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-[#ff1493] text-black font-bold text-lg font-display tracking-wider hover:bg-[#ff69b4] transition-all hover-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      "SUBMITTING..."
                    ) : (
                      <>
                        REQUEST EARLY ACCESS
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-white/20 mt-6">
                  By requesting access you agree to be contacted about the Afters beta program.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="py-20 border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-white/20 text-xs font-display tracking-widest mb-4">
            THE CAROLINAS FIRST. EVERYWHERE NEXT.
          </p>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            THE NIGHT STARTS WITH{" "}
            <span className="text-gradient">US</span>
          </h2>
          <p className="text-white/40 max-w-md mx-auto text-sm">
            We&apos;re starting small on purpose. Quality over quantity.
            The best events. The lowest fees. No nonsense.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
