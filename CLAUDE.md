# ReviewPost

## Project Overview
ReviewPost is a SaaS platform that converts customer reviews into
branded social media content automatically. Two tracks:
- **Track A**: Local businesses (Google Reviews → IG/FB posts)
- **Track B**: E-commerce stores (Salla/Shopify reviews → social posts)

## Team & Tools
| Tool | Role | When to Use |
|------|------|-------------|
| **Claude (claude.ai)** | PM | Planning, docs, prompts, architecture, tracking |
| **Claude Code (CLI)** | Dev + Security | Complex logic, security review, deep reasoning tasks |
| **Antigravity (Google IDE)** | Dev + Build + Test | Agent-first building, parallel tasks, prototyping, UI, testing |
| **Mohammed** | Founder | Decisions, outreach, content, market knowledge |

### How the tools work together:
- **Antigravity Manager View** → Full features: "Build the onboarding wizard" — it plans, codes, tests, verifies
- **Claude Code** → Complex tasks needing deep reasoning: AI key management, security audit, DB schema design
- **Claude PM** → Writes prompts for both tools, tracks progress, updates docs

## Communication Rules
1. **If something is unclear → ASK. Never assume.**
2. When there is a problem: **ONE step at a time**, not 15 steps
3. Break work into small phases (max 1 week each)
4. Always show what is DONE vs what is NEXT
5. When suggesting code changes, be surgical — not broad rewrites
6. Git push triggers Telegram notification via N8N
7. Google Calendar via MCP for deadlines

## Tech Stack
- **Frontend**: Next.js 14 + React + TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM
- **Queue**: Redis + BullMQ
- **Automation**: N8N (self-hosted on primeflow.co)
- **AI**: OpenAI GPT-4o-mini (3-layer key management)
- **Image Gen**: Puppeteer + HTML/CSS templates
- **Hosting**: Docker on primeflow.co VPS
- **Payments**: Stripe (global) + Moyasar (GCC)
- **Alerts**: Telegram Bot (existing primeflow bot)
- **Calendar**: Google Calendar via MCP connector

## Dev Environment
- **Local**: Docker Desktop on Mac (Next.js + PostgreSQL + Redis)
- **N8N**: Already running on flow.primeflow.co
- **Production**: Same server primeflow.co (Docker deploy)
- **IDE**: Antigravity (primary) + Claude Code CLI (complex tasks)

## Architecture Decisions
- AI keys: 3 layers (shared / BYOK / managed-dedicated)
- Fair usage: post limits per plan, NOT token limits
- Plugins: Salla App (OAuth), Shopify App (Polaris), WooCommerce (PHP)
- Customer sees "posts remaining" — never "tokens"
- Admin sees consumption dashboard + heavy user alerts (3x average)

## Folder Structure
```
/src
  /app                  # Next.js app router pages
  /components           # React components
  /lib
    /ai                 # OpenAI integration + 3-layer key management
    /reviews            # Review pull logic (Google, FB, Salla API)
    /publishing         # Social media publishing (IG, FB, X)
    /templates          # Puppeteer HTML templates for image gen
    /billing            # Stripe + Moyasar integration
    /usage              # Fair usage tracking + alerts
  /api                  # API routes
  /prisma               # Database schema + migrations
/n8n                    # N8N workflow JSON exports
/plugins
  /salla                # Salla App plugin code
  /shopify              # Shopify App code
  /woocommerce          # WP plugin code
/docs
  CHANGELOG.md
  DECISIONS.md
  SPRINT.md
```

## Git Strategy
- `main` → production only (deploy on push)
- `develop` → integration branch
- `feature/xxx` → individual features
- `hotfix/xxx` → urgent production fixes
- Every merge via PR with checklist
- Commit format: `type(scope): message`

## Dev Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push Prisma schema
npm run db:seed      # Seed test data
npm run test         # Run tests
docker-compose up    # Full stack with Redis + Postgres
```

## Working Rules
1. **NEVER** commit API keys. Use `.env.local`
2. All API endpoints **must** have rate limiting
3. All user input **must** be sanitized
4. Arabic RTL support in **ALL** UI components
5. Every PR **must** update CHANGELOG.md
6. Security: AES-256 for stored API keys
7. Git push triggers Telegram notification via N8N
8. Break work into small phases (max 1 week each)
9. When fixing bugs: one step at a time, verify before next step
10. **If unclear about anything → ask Mohammed. Don't assume.**

## Current Phase
<!-- Updated by PM after each sprint -->
- **Phase**: 1.1 - MVP Core
- **Status**: Starting
- **Focus**: Google Reviews pull + 3 templates + IG publishing
- **Deadline**: TBD
- **Blockers**: None
- **Next**: 1.2 - Dashboard & Auth

## Phase Map
```
Phase 1: MVP (Weeks 1-4)
  1.1 Core: Google Reviews + 3 templates + IG publish
  1.2 Dashboard: Auth + onboarding + settings
  1.3 Polish: Landing page + free tool + FB Reviews

Phase 2: Salla Launch (Weeks 5-8)
  2.1 Salla plugin: OAuth + review sync
  2.2 Product matching + Arabic captions
  2.3 Salla App Store submission + ASO

Phase 3: Growth (Weeks 9-16)
  3.1 Shopify App + WooCommerce plugin
  3.2 TripAdvisor + X/Twitter publishing
  3.3 Arabic RTL templates + localized pricing
  3.4 Agency plan + white-label + referral

Phase 4: Scale (Weeks 17-24)
  4.1 Zid App + TikTok + Snapchat
  4.2 Carousel + Story + Video templates
  4.3 A/B testing + advanced analytics
  4.4 API + Zapier connector
```

## API Keys Required (.env.local)
```
OPENAI_API_KEY=sk-xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_BUSINESS_API_KEY=xxx
META_APP_ID=xxx
META_APP_SECRET=xxx
SALLA_CLIENT_ID=xxx
SALLA_CLIENT_SECRET=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
MOYASAR_API_KEY=xxx
DATABASE_URL=postgresql://xxx
REDIS_URL=redis://xxx
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx
N8N_WEBHOOK_URL=xxx
```
