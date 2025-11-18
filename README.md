# DreamCar – Preference‑based Car Finder

Find your ideal car by expressing preferences in plain English. Deterministic scoring delivers speed, fairness, and reproducibility, while GPT handles preference extraction and human‑grade compromise explanations. Caching keeps costs tiny even at scale.

---

## Stack

### Frontend
- **Framework**: Next.js (App Router, TypeScript) on Vercel
- **UI**: Tailwind CSS + shadcn/ui, Lucide icons
- **Forms & validation**: React Hook Form + Zod (client + server)
- **Data fetching/state**: TanStack Query (+ server actions where it helps)
- **Charts (optional)**: Recharts for score breakdowns
- **A11y/UX**: Headless UI patterns; keyboard‑first; skeleton loaders; optimistic UI

### Backend & APIs
- **Runtime**: Next.js Route Handlers (Node 18+) for MVP; split out scoring service later if needed
- **Language**: TypeScript end‑to‑end
- **API style**: JSON REST (simple) or tRPC for type‑safe contracts
- **Job queue (optional)**: BullMQ on Redis (Upstash) for batch rescoring

### Data & Storage
- **Primary DB**: PostgreSQL (Supabase or Neon)
- **ORM**: Prisma
- **Vector search (optional)**: pgvector for free‑text notes/reviews
- **Object storage**: Supabase Storage (CSV uploads, exports)

---

## Minimal schema (concept)

- `cars` — `id`, `make`, `model`, `year`, `price`, `vehicle_type`, plus checkbox/score columns (ints like 0–4; 0–3, etc.) per section
- `scores_cache` — cache of last computed scores keyed by preference signature
- `search_sessions` — user query payloads & results (analytics & save search)

Example Prisma model sketch:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Car {
  id           String  @id @default(cuid())
  make         String
  model        String
  year         Int
  price        Int
  vehicleType  String
  // Section scores (normalized integers, e.g., 0..4)
  scoreDesign  Int?
  scoreEngine  Int?
  scoreInterior Int?
  scoreTech    Int?
  scoreSafety  Int?
  // Checkboxes/flags (0/1) for specific features as needed
  hasSunroof   Int? // example
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ScoresCache {
  id              String   @id @default(cuid())
  preferenceHash  String   @unique
  topN            Json
  compromises     Json
  createdAt       DateTime @default(now())
}

model SearchSession {
  id           String   @id @default(cuid())
  userId       String?
  preferences  Json     // original user prompt or structured prefs
  results      Json?    // car ids + scores at time of search
  createdAt    DateTime @default(now())
}
```

---

## Scoring Engine (hybrid)

1) Preference extraction (GPT)
- Model: `gpt-4o-mini` (cheap, structured) with JSON schema/tool calling to normalize into:
  - hard filters (must‑have / must‑not)
  - weights per section (Design/Engine/Interior/Tech/Safety/…)
  - budget range, body style, fuel type, brand constraints
- Temperature: ≤ 0.2

2) Deterministic ranker (fast & explainable)
- Apply hard filters in SQL (e.g., `price <= max`, `vehicle_type IN (…)`).
- Normalize each numeric/checkbox dimension to [0, 1].
- Compute either Weighted Sum or TOPSIS as `overall_score`.
- Handle missing values with neutral imputation or weight reallocation.
- Keep per‑criterion contributions to power "why" explanations.

Weighted Sum sketch:

```text
overall = Σ_i (weight_i * normalized_value_i)
```

TOPSIS sketch:

```text
1) Normalize and weight matrix
2) Determine ideal best/worst per criterion
3) Compute distances to ideals
4) Score = d_worst / (d_best + d_worst)
```

3) Compromise explainer (GPT)
- Model: `gpt-4o` (or `o3-mini` for stronger reasoning) turns the diff between prefs and each car’s unmet criteria into 2–4 crisp bullets.
- Input: top‑N cars + per‑criterion pass/fail + contribution deltas.
- Temperature: ~0.5; output is short, user‑facing text only.

4) Cost control
- Run GPT only for the top‑N (e.g., 10).
- Cache `preferenceSignature → topN + compromise bullets` in Redis.

---

## Example: Preference extraction JSON schema (tool)

```json
{
  "type": "object",
  "properties": {
    "hardFilters": {
      "type": "object",
      "properties": {
        "mustHave": { "type": "array", "items": { "type": "string" } },
        "mustNot":  { "type": "array", "items": { "type": "string" } },
        "price": {
          "type": "object",
          "properties": { "min": {"type":"number"}, "max": {"type":"number"} },
          "required": ["max"]
        },
        "vehicleType": { "type": "array", "items": { "type": "string" } },
        "fuelType": { "type": "array", "items": { "type": "string" } },
        "brands": { "type": "array", "items": { "type": "string" } }
      }
    },
    "weights": {
      "type": "object",
      "properties": {
        "design": { "type": "number", "minimum": 0 },
        "engine": { "type": "number", "minimum": 0 },
        "interior": { "type": "number", "minimum": 0 },
        "tech": { "type": "number", "minimum": 0 },
        "safety": { "type": "number", "minimum": 0 }
      }
    },
    "notes": { "type": "string" }
  },
  "required": ["hardFilters", "weights"]
}
```

---

## API surface (MVP)

- `POST /api/preferences/extract` – GPT extraction → structured prefs
- `POST /api/search` – apply SQL hard filters, score candidates, return top‑N with contributions
- `POST /api/compromises` – GPT generates bullets for top‑N
- `GET /api/cars/[id]` – details by id

Example request/response sketches:

```http
POST /api/search
Content-Type: application/json

{
  "preferences": { /* normalized from extraction */ },
  "topN": 10
}

200 OK
{
  "items": [
    {
      "carId": "...",
      "overall": 0.83,
      "contributions": {
        "design": 0.18,
        "engine": 0.24,
        "interior": 0.15,
        "tech": 0.14,
        "safety": 0.12
      }
    }
  ],
  "signature": "sha256:..." // cache key
}
```

---

## Frontend features (day 1)

- Questionnaire builder – JSON‑driven so questions/weights can be tweaked without redeploy
- Hard vs soft requirements – UI toggles (must‑have vs nice‑to‑have) reflected in SQL vs weights
- Explainability UI – stacked bar per car + “Compromises” bullets + “What it nails” strengths
- Result actions – Save search, share link, export CSV/PDF
- Caching – Hash of normalized prefs → cache top‑N and explanations

### Nice‑to‑haves (v2)
- Multi‑user compare board (drag 2–4 cars)
- Price/availability enrichment via public APIs; scheduled refresh
- Feature imputation using small models when checkboxes are missing

---

## Getting started

### Prerequisites
- Node.js 18+
- pnpm (preferred) or npm
- PostgreSQL (Supabase/Neon)
- Redis (Upstash)
- OpenAI API key

### Setup

```bash
# 1) Install deps
pnpm install

# 2) Create env file
cp .env.example .env.local
# Fill in values (see below)

# 3) Prepare database
pnpm prisma generate
pnpm prisma migrate dev

# 4) Start dev server
pnpm dev
```

### Phase 1: Import cars CSV into Postgres

```bash
# Ensure DATABASE_URL is set in .env.local or environment

# Generate Prisma client (once after schema changes)
pnpm prisma:generate

# Create/migrate tables (creates Car table)
pnpm prisma:migrate

# Ingest the provided CSV (path with spaces is already quoted)
pnpm ingest:cars

# Optional: open Prisma Studio to inspect data
pnpm prisma:studio
```

### Phase 2: Deterministic search (Weighted Sum)

```bash
# Prepare a preferences JSON (or use the example)
cp prefs.example.json my-prefs.json

# Run a search with top 10
pnpm search
# or custom
tsx scripts/search.ts my-prefs.json 15 > results.json
```

Output structure sample:

```json
{
  "items": [
    {
      "carId": "...",
      "make": "Toyota",
      "model": "RAV4",
      "year": 2022,
      "vehicleType": "SUV",
      "priceLower": 32000,
      "priceUpper": 38000,
      "overall": 0.83,
      "contributions": { "priceFit": 0.42, "fuel": 0.21, "vehicleType": 0.20 }
    }
  ]
}
```

### Phase 3: API routes (Next.js)

```bash
# Start API locally
pnpm dev

# Search
curl -X POST http://localhost:3000/api/search \
  -H 'Content-Type: application/json' \
  --data-binary @prefs.example.json | jq

# Car details
curl http://localhost:3000/api/cars/<id> | jq
```
### Phase 4: Preference extraction (GPT) and compromises with caching

Requirements:
- Set `OPENAI_API_KEY` in your env.
- Optional cache: set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (recommended).
- Optional: `CACHE_TTL_SECONDS` (default 86400).

```bash
# Extract preferences from a prompt
curl -X POST http://localhost:3000/api/preferences/extract \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Budget under 45k, SUV or sedan, prefer hybrid or EV, Toyota or Tesla, year 2018+", "draft": {"weights":{"priceFit":2}}}' | jq

# Run search with extracted prefs (edit as needed)
# Save JSON to prefs.json then:
curl -X POST http://localhost:3000/api/search \
  -H 'Content-Type: application/json' \
  --data-binary @prefs.json | jq

# Generate compromises for top-N (use items from search response)
# Save a body like: {"prefs": <prefs>, "items": <items array>} to body.json
curl -X POST http://localhost:3000/api/compromises \
  -H 'Content-Type: application/json' \
  --data-binary @body.json | jq
```

### Phase 5: Testing (Vitest + Playwright)

```bash
# Unit tests
pnpm test

# Coverage
pnpm test:coverage

# E2E (spins up dev server)
pnpm test:e2e
```

### Phase 6: Quiz-Based Frontend UI

```bash
# Start the dev server
pnpm dev

# Open browser to http://localhost:3000
```

**User Flow:**
1. **Home** (`/`) - Landing page with "Take the Quiz" CTA
2. **Quiz** (`/quiz`) - 15 curated lifestyle questions (no technical filters!)
   - Questions about family, commute, parking, weather, cargo needs, style, etc.
   - Progress bar and step-by-step navigation
   - Yes/No, Multiple Choice, and Scale questions
3. **AI Analysis** - GPT-4o automatically analyzes quiz answers and determines:
   - Which car features matter most (safety, tech, space, performance, etc.)
   - Appropriate weight distribution across 7 scoring dimensions
   - Budget and vehicle type preferences
4. **Results** (`/results`) - Personalized ranked matches with:
   - AI reasoning explanation ("Based on your answers...")
   - Match scores and "Why This Match" contribution charts
   - No technical jargon - user-friendly language
5. **Details** (`/cars/[id]`) - Full car specifications

**Key Features:**
- **No explicit filters** - users answer lifestyle questions instead
- **GPT-4o decides weights** - automatic preference extraction
- **7 scoring dimensions**: Price Fit, Fuel, Vehicle Type, Safety, Technology, Space, Performance
- JSON-driven quiz config (easy to add/modify questions)
- React Hook Form for quiz state management
- TanStack Query for data fetching
- Recharts for contribution visualization
- shadcn/ui components + Tailwind CSS

### Environment variables

Create `.env.local` (Vercel will use project envs):

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/db
DIRECT_URL=postgresql://user:password@host:5432/db

# Auth (NextAuth – email magic link)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32byte-secret
EMAIL_SERVER=smtp://user:pass@smtp.host:587
EMAIL_FROM=hello@yourdomain.com
# or RESEND_API_KEY=...

# OpenAI
OPENAI_API_KEY=sk-...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Monitoring & Analytics
SENTRY_DSN=...
POSTHOG_PUBLIC_KEY=...
POSTHOG_HOST=https://us.i.posthog.com
# Logs
BETTERSTACK_SOURCE_TOKEN=... # or LOGTAIL_SOURCE_TOKEN=...
```

---

## Development

### Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "prisma:studio": "prisma studio"
  }
}
```

### Testing
- Unit: Vitest (`src/scoring`, `src/utils`)
- E2E: Playwright (API smoke: `/api/search`)
- Snapshots: hash signature stability\n\n```bash\n# Unit tests\npnpm test\n# Coverage\npnpm test:coverage\n# E2E (starts dev server automatically)\npnpm test:e2e\n```

```bash
pnpm test
pnpm test:e2e
```

---

## CI/CD & Ops

- Hosting: Vercel (frontend + API). DB: Supabase/Neon. Redis: Upstash.
- CI: GitHub Actions – lint, typecheck, unit + e2e tests
- Secrets: Vercel encrypted env; Doppler optional for local/CI sync
- Monitoring: Sentry (frontend + server), Better Stack/Logtail for logs
- Analytics: PostHog (funnels, feature usage, A/B for UI)

Minimal GitHub Actions example:

```yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test -- --run
```

---

## LLM safety & observability
- Function calling / JSON schema
- Redact PII before logging; store prompts/responses safely
- Track token usage and add a kill switch to run deterministic‑only mode

---

## Why this split works
- Deterministic math = speed, fairness, reproducibility
- GPT does what it’s best at: (a) parsing messy preferences into clean JSON, (b) human‑grade trade‑off explanations
- With caching and top‑N summarization, token costs stay tiny

---

## Roadmap
- [ ] MVP UI with questionnaire + results
- [ ] Deterministic scorer (Weighted Sum → optional TOPSIS)
- [ ] Preference extraction tool + schema
- [ ] Compromise explainer (top‑N only) with caching
- [ ] Save/Share/Export

---

## License
MIT

---

## Maintainers
- Krish Arora (@krish_arora_88)

---

## Quick links
- Next.js: https://nextjs.org
- Prisma: https://www.prisma.io
- Supabase: https://supabase.com
- Neon: https://neon.tech
- Upstash: https://upstash.com
- shadcn/ui: https://ui.shadcn.com
- TanStack Query: https://tanstack.com/query
- Playwright: https://playwright.dev
- Vitest: https://vitest.dev
- PostHog: https://posthog.com
- Sentry: https://sentry.io
