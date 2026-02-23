<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/header-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/header-light.svg">
  <img alt="afters" src=".github/assets/header-dark.svg" width="100%">
</picture>

<br>
<br>

<p align="center">
  <code>event ticketing for the underground</code>
</p>

<p align="center">
  <a href="https://afters.am">website</a>
  &nbsp;·&nbsp;
  <a href="https://axxes-club.github.io/afters/">docs</a>
  &nbsp;·&nbsp;
  <a href="#quick-start">quick start</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/axxes-club/afters/issues">report bug</a>
</p>

<br>

---

<br>

## what is this

afters is a modern ticketing platform built for underground music events, warehouse parties, and intimate gatherings. no corporate bloat. no ticket scalpers. just you and your community.

<br>

## features

```
TICKETING          tiered pricing · capacity limits · hidden venues
RSVP               free events · plus-ones · waitlists
SCANNER            qr check-in · offline mode · real-time stats
RECURRING          series templates · bulk generation · smart updates
PAYMENTS           stripe connect · instant payouts · transparent fees
AI ASSISTANT       natural language event creation · analytics · flyer generation
```

<br>

## quick start

### option 1: docker (recommended)

```bash
# clone
git clone https://github.com/axxes-club/afters.git
cd afters

# configure
cp docker/.env.docker.example docker/.env.docker
# edit docker/.env.docker with your keys

# run
docker compose up
```

open [localhost:3000](http://localhost:3000)

<details>
<summary>docker commands</summary>

```bash
# start development
docker compose up

# start with MCP server
docker compose --profile mcp up

# run commands inside container
docker compose exec app pnpm prisma studio
docker compose exec app pnpm test

# run e2e tests
docker compose -f docker-compose.yml -f docker-compose.test.yml up playwright

# stop and clean up
docker compose down -v  # -v removes volumes (fresh start)

# production build
docker build -t afters:latest .
docker run -p 3000:3000 --env-file .env afters:latest
```

</details>

### option 2: local development

```bash
# clone
git clone https://github.com/axxes-club/afters.git
cd afters

# install
pnpm install

# configure
cp .env.example .env.local
# edit .env.local with your keys

# run
pnpm dev
```

open [localhost:3000](http://localhost:3000)

<br>

## requirements

| service | purpose |
|---------|---------|
| postgresql | database ([neon](https://neon.tech) recommended) |
| clerk | authentication |
| stripe | payments |
| uploadthing | file uploads |
| resend | transactional email |
| groq | ai assistant (optional) |

<br>

## environment

```env
# required
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
UPLOADTHING_TOKEN=
SCANNER_JWT_SECRET=

# optional
RESEND_API_KEY=
GROQ_API_KEY=
```

<br>

## commands

```bash
pnpm dev              # start dev server
pnpm build            # production build
pnpm lint             # run eslint
pnpm test             # run tests
pnpm test:e2e         # run e2e tests
pnpm db:push          # push schema to database
pnpm db:studio        # open prisma studio
```

<br>

## stack

```
next.js 16      framework
typescript      language
prisma          orm
tailwind        styling
shadcn/ui       components
stripe          payments
clerk           auth
```

<br>

## structure

```
app/
├── (public)/          # event pages, scanner
├── (dashboard)/       # organizer dashboard
├── (auth)/            # sign in/up
└── api/               # api routes

src/
├── components/        # react components
├── lib/               # utilities
└── hooks/             # custom hooks

prisma/
└── schema.prisma      # database schema
```

<br>

## api

authenticate with `X-API-Key` header.

```bash
curl -H "X-API-Key: aftr_xxxxx" https://afters.am/api/v1/events
```

| endpoint | description |
|----------|-------------|
| `GET /api/v1/events` | list events |
| `POST /api/v1/events` | create event |
| `GET /api/v1/events/:id` | event details |
| `GET /api/v1/events/:id/tickets` | list tickets |

<br>

## deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/axxes-club/afters)

<br>

## contributing

1. fork it
2. create your branch (`git checkout -b feature/thing`)
3. commit (`git commit -m 'add thing'`)
4. push (`git push origin feature/thing`)
5. open a pr

<br>

## license

proprietary. all rights reserved.

<br>

---

<br>

<p align="center">
  <sub>built for the underground</sub>
</p>

<p align="center">
  <a href="https://afters.am">afters.am</a>
</p>
