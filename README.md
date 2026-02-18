<div align="center">

# 🎫 Afters

### The Modern Event Ticketing Platform for Underground Music

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Stripe](https://img.shields.io/badge/Stripe-Connect-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com)

[Live Demo](https://afters.xxx) · [Report Bug](https://github.com/axxes-club/afters/issues) · [Request Feature](https://github.com/axxes-club/afters/issues)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎟️ Ticketing & RSVPs
- **Tiered Tickets** — Multiple price tiers with limits
- **Free RSVPs** — Capacity-limited free events
- **Hidden Venues** — Address revealed after purchase
- **Plus-Ones** — Bring friends with group tickets

</td>
<td width="50%">

### 📱 Door Operations
- **QR Scanner** — Fast mobile check-in
- **Offline Mode** — Works without internet
- **Staff Codes** — Separate scanner credentials
- **Real-time Stats** — Live attendance tracking

</td>
</tr>
<tr>
<td width="50%">

### 🔄 Recurring Events
- **Series Templates** — Weekly, biweekly, monthly
- **Bulk Generation** — Create months of events at once
- **Smart Updates** — Template changes cascade to future events
- **Override Support** — Customize individual occurrences

</td>
<td width="50%">

### 🤖 AI Assistant (Aftie)
- **Event Creation** — "Create a techno night for next Saturday"
- **Analytics** — "How did last month's events perform?"
- **Image Generation** — AI-powered event flyers
- **Multilingual** — EN, ES, PT support

</td>
</tr>
<tr>
<td width="50%">

### 💰 Payments
- **Stripe Connect** — Organizers get paid directly
- **Instant Payouts** — No waiting for funds
- **Fee Transparency** — Clear pricing breakdown
- **Refund Management** — Easy cancellation handling

</td>
<td width="50%">

### 🔔 Notifications
- **Push Notifications** — Real-time browser alerts
- **Email Digests** — Sale summaries & reminders
- **Event Reminders** — 24h & 1h before event
- **Check-in Reports** — Post-event attendance summary

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (we recommend [pnpm](https://pnpm.io))
- **PostgreSQL** database ([Neon](https://neon.tech) recommended)
- **Clerk** account for authentication
- **Stripe** account for payments

### One-Command Setup

```bash
# Clone & install
git clone https://github.com/axxes-club/afters.git && cd afters && pnpm install

# Setup environment
cp .env.example .env.local

# Start developing
pnpm dev
```

### Environment Variables

Create `.env.local` with your credentials:

```env
# Database (Neon)
DATABASE_URL="postgresql://..."

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Payments (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# File Uploads (UploadThing)
UPLOADTHING_TOKEN=...

# Email (Resend)
RESEND_API_KEY=re_...

# AI (Groq - for Aftie)
GROQ_API_KEY=gsk_...
```

<details>
<summary>📋 Full Environment Reference</summary>

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk frontend key |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend key |
| `CLERK_WEBHOOK_SECRET` | ⚡ | For Clerk webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe frontend key |
| `STRIPE_SECRET_KEY` | ✅ | Stripe backend key |
| `STRIPE_WEBHOOK_SECRET` | ⚡ | For Stripe webhooks |
| `UPLOADTHING_TOKEN` | ✅ | UploadThing API token |
| `RESEND_API_KEY` | ⚡ | For sending emails |
| `SCANNER_JWT_SECRET` | ✅ | JWT secret for scanner auth |
| `GROQ_API_KEY` | ⚡ | For Aftie AI assistant |

✅ Required · ⚡ Required for full functionality

</details>

---

## 🛠️ Development

### Commands

```bash
# Development
pnpm dev              # Start dev server (localhost:3000)
pnpm dev:lan          # Start with LAN access (for mobile testing)
pnpm build            # Production build
pnpm lint             # Run ESLint

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:generate      # Regenerate Prisma client

# Testing
pnpm test             # Run unit tests (vitest)
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage report
pnpm test:e2e         # Run E2E tests (playwright)
pnpm test:e2e:ui      # E2E with visual UI
```

### Project Structure

```
afters/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public pages (events, scanner)
│   ├── (dashboard)/       # Authenticated dashboard (/d/*)
│   ├── (auth)/            # Sign in/up pages
│   ├── (onboarding)/      # New user onboarding
│   └── api/               # API routes
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn/ui primitives
│   │   └── ...           # Feature components
│   ├── lib/              # Utilities & services
│   │   ├── prisma.ts     # Database client
│   │   ├── stripe.ts     # Payment utilities
│   │   ├── auth-utils.ts # Clerk helpers
│   │   └── ...
│   └── hooks/            # Custom React hooks
├── prisma/
│   └── schema.prisma     # Database schema
├── messages/             # i18n translations
│   ├── en.json
│   ├── es-ES.json
│   ├── es-LA.json
│   └── pt-BR.json
├── tests/                # Unit tests
├── e2e/                  # E2E tests
└── public/               # Static assets
```

### Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/e/[slug]` | Public event page |
| `/scan/[eventId]` | QR scanner for check-in |
| `/d/events` | Dashboard: manage events |
| `/d/events/[id]` | Event detail & analytics |
| `/d/settings` | Organizer settings |
| `/api/v1/*` | Public API (API key auth) |

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5.9 |
| **Database** | PostgreSQL via Neon (serverless) |
| **ORM** | Prisma 7 |
| **Auth** | Clerk |
| **Payments** | Stripe Connect |
| **File Storage** | UploadThing |
| **Email** | Resend |
| **AI** | Groq (Llama 3) |
| **Styling** | Tailwind CSS + Shadcn/ui |
| **Testing** | Vitest + Playwright |

### User Roles

```
SUPERADMIN  → Full platform access
ORGANIZER   → Create & manage events, receive payments
ARTIST      → Artist profile, lineup appearances
PERSONAL    → Attend events, purchase tickets
USER        → Basic account (default)
```

### Event Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Create    │────▶│   Publish   │────▶│    Live     │
│   Event     │     │   & Share   │     │   Sales     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────┐           │
                    │   Check-in  │◀──────────┘
                    │   Scanner   │
                    └─────────────┘
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific file
pnpm test src/lib/utils.test.ts

# Watch mode (great for TDD)
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### E2E Tests

```bash
# Run headless
pnpm test:e2e

# With browser UI
pnpm test:e2e:ui

# Debug mode (step through)
pnpm test:e2e:debug

# Generate test from browser actions
pnpm test:e2e:codegen
```

### Test Environment

E2E tests require a `.env.test` file with test credentials. See `.env.test.example`.

---

## 🌍 Internationalization

Afters supports multiple languages via `next-intl`:

- 🇺🇸 English (`en`)
- 🇪🇸 Spanish - Spain (`es-ES`)
- 🇲🇽 Spanish - Latin America (`es-LA`)
- 🇧🇷 Portuguese - Brazil (`pt-BR`)

Translation files are in `/messages/*.json`.

---

## 📡 API

Afters exposes a public API for integrations. Authenticate with an API key in the `X-API-Key` header.

```bash
curl -H "X-API-Key: aftr_xxxxx" \
  https://afters.xxx/api/v1/events
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/events` | List your events |
| `POST` | `/api/v1/events` | Create an event |
| `GET` | `/api/v1/events/:id` | Get event details |
| `GET` | `/api/v1/events/:id/tickets` | List tickets sold |
| `GET` | `/api/v1/events/:id/check-ins` | Check-in history |

Generate API keys in **Settings → Security**.

---

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/axxes-club/afters)

1. Connect your GitHub repo
2. Add environment variables
3. Deploy!

### Manual Deployment

```bash
pnpm build
pnpm start
```

Ensure `DATABASE_URL` uses a pooled connection for serverless environments.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<div align="center">

**Built with 🖤 for the underground**

[afters.xxx](https://afters.xxx)

</div>
