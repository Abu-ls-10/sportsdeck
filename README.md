# SportsDeck

> A full-stack Premier League fan platform that brings fixtures, standings, discussion threads, polls, personalized feeds, and community moderation into one experience.

SportsDeck turns following football into a social, contextual experience. Fans can explore Premier League teams, matches, and standings; follow other users; create or join match-specific conversations; vote in polls; and receive a feed shaped by the activity and teams they care about. Administrators have a dedicated moderation workflow for reviewing reports, AI-assisted toxicity signals, bans, and appeals.

Originally developed as a CSC309 web-programming project.

## Highlights

- **Match context and community in one place.** Premier League fixtures, results, teams, and standings are combined with discussions and match threads instead of being split across separate apps.
- **Rich social features.** Users can build profiles, choose a favourite team, follow other fans, create tagged threads, post nested replies, edit content with version history, and participate in polls.
- **Personalized discovery.** The home feed surfaces community activity, discussions, polls, trending tags, recent activity, and follow suggestions. A daily digest summarizes notable discussion and match activity.
- **Trust and safety tooling.** Reporting, moderation queues, content hiding, bans, and appeals are supported by a role-aware admin interface. New content can be evaluated by a Hugging Face toxicity model, with optional translation before classification.
- **Production-minded backend design.** The application uses a PostgreSQL data model, JWT-based sessions, OAuth sign-in, Redis caching and rate limiting, cache invalidation after writes, and a containerized Nginx deployment path.

## What I Built

### Fan experience

- Premier League team directory, match centre, schedules, match details, and league table
- Automatically created or joined match discussions alongside normal community threads
- Thread tagging, search, post and reply editing, nested replies, and edit history
- Poll creation, option management, voting, result aggregation, closing, and visibility controls
- Profile pages, avatars, favourite-team preferences, follows/followers, and user activity
- A filterable, mark-as-read personalized feed, plus a generated daily digest
- Responsive application shell with dark-mode styling, desktop navigation, and mobile top bar

### Authentication and access control

- Email/password sign-up and sign-in with `bcrypt` password hashing
- Short-lived access tokens and refresh-token rotation using signed JWTs
- Google and GitHub OAuth entry points
- Authenticated user settings and role-aware administrator routes

### Moderation and AI features

- User reports collected into an administrator review queue
- Approve, dismiss, hide-content, ban, lift-ban, and appeal flows with auditable admin actions
- Hugging Face-powered sentiment analysis, translation to English, daily-digest summarization, and toxicity classification
- Cached moderation verdicts keyed by a normalized text hash and model pipeline configuration to reduce duplicate inference calls
- Graceful degradation when AI credentials are not configured

### Data, performance, and resilience

- Football data is persisted locally and refreshed from [football-data.org](https://www.football-data.org/), reducing dependence on an upstream request for every page visit
- Redis-backed cache-aside responses for fixtures, standings, thread payloads, poll results, profiles, and tags
- Targeted cache invalidation whenever threads, posts, replies, polls, follows, profiles, or moderated content changes
- Optional cache warmer with distributed Redis locks to avoid duplicate upstream refreshes across replicas
- Configurable fixed-window rate limits for registration, token refresh, translation, sentiment, and administrator AI analysis

## Technology

| Area | Tools |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Mantine, Lucide/Tabler icons |
| Backend | Next.js App Router and Route Handlers |
| Data | PostgreSQL 15, Prisma ORM |
| Caching | Redis 7, ioredis, Next.js data cache |
| Authentication | JWT, bcrypt, Google OAuth, GitHub OAuth |
| External services | football-data.org and Hugging Face Inference API |
| Operations | Docker Compose, multi-stage Docker build, Nginx reverse proxy |
| API tooling | OpenAPI 3 specification and Postman collection |

## Architecture

The browser communicates with the Next.js application through Nginx in the containerized setup. Next.js renders the interface and exposes typed route handlers for authentication, sports data, social features, feeds, and administration. PostgreSQL is the system of record through Prisma; Redis supports response caching, cache warming, invalidation, and rate limiting. Football-data.org enriches the local sports dataset, while Hugging Face provides optional language and moderation capabilities.

```text
Browser
  │
  ├── Nginx reverse proxy ──> Next.js application
  │                              ├── PostgreSQL / Prisma
  │                              ├── Redis cache + rate limits
  │                              ├── football-data.org
  │                              └── Hugging Face Inference API
```

The full relational model—including users, follows, teams, matches, threads, posts, replies, polls, votes, activity, feeds, reports, bans, appeals, and moderation-cache records—is defined in [`sportsdeck-app/prisma/schema.prisma`](sportsdeck-app/prisma/schema.prisma). See the [entity-relationship diagram](erd.png) for a visual reference.

## Repository Layout

```text
.
├── sportsdeck-app/          # Next.js application
│   ├── src/app/             # Pages and API route handlers
│   ├── src/components/      # UI, auth, community, match, and admin components
│   ├── src/lib/             # Auth, caching, data, moderation, and shared helpers
│   ├── prisma/              # Prisma schema, seeds, and database snapshot
│   ├── tests/               # HTTP request collections for API checks
│   ├── Dockerfile           # Multi-stage production image
│   └── docker-compose.yaml  # App, PostgreSQL, Redis, Nginx, and optional Adminer
├── openapi.yaml             # API contract
├── postman_collection.json  # Postman requests for exercising the API
└── erd.png                  # Database ERD
```

## Run Locally

### Prerequisites

- Node.js 20+
- Docker Desktop (recommended for PostgreSQL and Redis)
- A [football-data.org](https://www.football-data.org/) API token to seed and refresh Premier League data
- A Hugging Face token only if AI translation, sentiment, summaries, or moderation should be enabled

### 1. Configure the application

```bash
cd sportsdeck-app
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Set at least the following values in `.env`:

```dotenv
DATABASE_URL=postgresql://sportsdeck:sportsdeck@localhost:5432/sportsdeck
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
X_AUTH_TOKEN=your-football-data-org-token
```

`HUGGINGFACE_API_KEY`, Google OAuth credentials, GitHub OAuth credentials, `REDIS_URL`, and the rate-limit settings are optional; their purpose and defaults are documented in [`.env.example`](sportsdeck-app/.env.example).

### 2. Start the local services

```bash
docker compose up -d db redis
```

### 3. Install, initialize, and seed

```bash
npm ci
npx prisma generate
npx prisma db push
npm run db:seed
```

Seeding loads the configured 2025 Premier League teams and fixtures from football-data.org, then creates the starter community data. A database snapshot is also included at [`sportsdeck-app/prisma/seedData/dump.sql`](sportsdeck-app/prisma/seedData/dump.sql) for development and restoration workflows.

### 4. Launch the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Commands

Run these inside `sportsdeck-app/`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and build the production application |
| `npm run start` | Run a production Next.js build |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed teams, users, fixtures, and starter threads |
| `npm run studio` | Open Prisma Studio |
| `docker compose --profile dev-tools up -d adminer` | Start Adminer at `http://localhost:8080` |

## API and Database Documentation

- [`openapi.yaml`](openapi.yaml) documents the REST API contract.
- [`postman_collection.json`](postman_collection.json) contains ready-to-import API requests.
- [`sportsdeck-app/tests`](sportsdeck-app/tests) contains HTTP files for authentication, user, social, feed, follow, and sports-data flows.
- [`erd.png`](erd.png) diagrams the relational data model.

## Deployment Notes

`sportsdeck-app/docker-compose.yaml` describes a production-style stack with the Next.js application, PostgreSQL, Redis, and Nginx. The Dockerfile uses a multi-stage Node 20 Alpine build and produces Next.js standalone output; Nginx exposes the application on port 80. The Compose configuration also includes an opt-in Adminer profile for database inspection.

Before deploying, supply strong JWT secrets, production database and Redis endpoints, OAuth callback configuration where used, and the external-service tokens needed for sports-data refreshes and AI features. Never commit `.env` files or API credentials.

## Portfolio Summary

SportsDeck demonstrates end-to-end product engineering: a polished responsive interface, a non-trivial relational domain, authentication and authorization, REST API design, third-party data integration, caching, rate limiting, AI-assisted moderation, operational tooling, and containerized deployment. The project is designed around a practical product question: how can a sports application provide timely match context while making fan conversation discoverable, personal, and manageable at scale?
