import Link from "next/link"
import { 
  Code2, 
  Key, 
  BookOpen, 
  Zap, 
  ArrowRight, 
  Terminal,
  Webhook,
  Shield,
  Sparkles,
  ExternalLink
} from "lucide-react"

export const metadata = {
  title: "Developers | afters",
  description: "Build on afters. API access, webhooks, and integrations for event ticketing.",
}

const API_FEATURES = [
  {
    icon: Key,
    title: "API Keys",
    description: "Generate scoped API keys with fine-grained permissions for your integrations.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Real-time event notifications for ticket purchases, check-ins, and more.",
  },
  {
    icon: Shield,
    title: "Scoped Access",
    description: "Control exactly what each integration can read and write.",
  },
  {
    icon: Terminal,
    title: "RESTful API",
    description: "Clean, predictable endpoints following REST conventions.",
  },
]

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/events", description: "List your events" },
  { method: "POST", path: "/api/v1/events", description: "Create an event" },
  { method: "GET", path: "/api/v1/events/:id/tickets", description: "Get tickets for an event" },
  { method: "POST", path: "/api/v1/events/:id/checkin", description: "Check in a ticket" },
  { method: "GET", path: "/api/v1/orders", description: "List orders" },
  { method: "GET", path: "/api/v1/analytics/:id", description: "Event analytics" },
]

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff1493]/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff1493]/5 blur-[150px] rounded-full" />
        
        <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-32">
          <div className="flex items-center gap-3 mb-6">
            <Code2 className="w-8 h-8 text-[#ff1493]" />
            <span className="text-[10px] font-mono text-[#ff1493] tracking-widest border border-[#ff1493]/30 px-2 py-1">
              DEVELOPERS
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline tracking-wide mb-6">
            Build on <span className="text-[#ff1493]">afters</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mb-10">
            Integrate event ticketing into your workflow. Create events, manage tickets, 
            and track check-ins programmatically.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff1493] text-black font-mono font-bold text-sm tracking-wider hover:bg-[#ff1493]/90 transition-all"
            >
              GET API ACCESS
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#docs"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-mono text-sm tracking-wider hover:bg-white/5 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              VIEW DOCS
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid sm:grid-cols-2 gap-6">
          {API_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="border border-white/10 bg-white/[0.02] p-6 hover:border-white/20 transition-colors"
            >
              <feature.icon className="w-8 h-8 text-[#ff1493] mb-4" />
              <h3 className="font-mono font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API Preview */}
      <section id="docs" className="border-y border-white/10 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-3 mb-8">
            <Terminal className="w-5 h-5 text-[#ff1493]" />
            <h2 className="text-2xl font-mono font-bold">API Endpoints</h2>
          </div>

          <div className="border border-white/10 bg-black overflow-hidden">
            <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-white/40 tracking-widest">SAMPLE ENDPOINTS</span>
            </div>
            <div className="divide-y divide-white/5">
              {ENDPOINTS.map((endpoint) => (
                <div key={endpoint.path} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02]">
                  <span className={`text-[10px] font-mono px-2 py-0.5 ${
                    endpoint.method === "GET" 
                      ? "bg-green-500/10 text-green-400" 
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="font-mono text-sm text-white/80">{endpoint.path}</code>
                  <span className="text-xs text-white/40 ml-auto hidden sm:block">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-6 border border-[#ff1493]/30 bg-[#ff1493]/5">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-[#ff1493] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-mono font-bold mb-2">MCP Server Coming Soon</h3>
                <p className="text-sm text-white/60 mb-4">
                  We&apos;re building a Model Context Protocol (MCP) server so AI assistants can 
                  manage your events directly. Create events, check analytics, and manage 
                  your guestlist through natural language.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-[#ff1493]">
                  <Zap className="w-3.5 h-3.5" />
                  <span>STAY TUNED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-headline tracking-wide mb-4">
            Ready to integrate?
          </h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto">
            Sign up for an organizer account to generate API keys and start building.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff1493] text-black font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all"
            >
              CREATE ACCOUNT
            </Link>
            <Link
              href="/b/developers"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-mono tracking-wider hover:bg-white/5 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              DASHBOARD
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-headline text-xl">
            AFTERS<span className="text-[#ff1493]">.</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/developers" className="text-[#ff1493]">Developers</Link>
            <Link href="/sign-in" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
