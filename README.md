# Onibsport

A football news and blog site (Sky Sports Football / Goal.com style) covering the Premier League, La Liga, Serie A, Bundesliga, Champions League, transfers, and Nigeria Football & the NPFL — built with Next.js, TypeScript, and Tailwind CSS.

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL / ADMIN_EMAIL / ADMIN_PASSWORD / AUTH_SECRET
npm run db:push         # push prisma/schema.prisma to your Postgres database
npm run db:seed         # seed categories, sample articles, and the admin user
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site.

## What's here

- **Public site** (`src/app/(site)`) — homepage, category pages, article pages, live scores, and search. Content is served from the static mock data in `src/lib/data/` so the design can be reviewed without a database.
- **Admin dashboard** (`src/app/admin`, protected by `src/proxy.ts`) — sign in at `/admin/login` with the credentials from `.env`, then manage articles (draft → pending review → published) backed by Prisma/Postgres (`prisma/schema.prisma`).
- **AI Desk** (`/admin/ai-desk`) — the AI auto-drafting pipeline. It takes an incoming story (see `src/lib/ai/queue.ts` — currently sample data standing in for a real news API/RSS feed), rewrites it in original words with a punchy-but-accurate headline (`src/lib/ai/draft.ts`), and saves it as **pending review**. Nothing publishes without a human clicking "Approve & Publish". Without an `ANTHROPIC_API_KEY` set, it runs in stub mode so the flow is testable end-to-end without a live key.

## Wiring up real data

Two things are intentionally stubbed for this first pass:

1. **Public site content** currently reads from `src/lib/data/` rather than the database — swap those reads for Prisma queries once you're ready to make the admin-managed content live.
2. **AI Desk's source feed** (`src/lib/ai/queue.ts`) is sample data — replace it with a real news API, RSS ingestion job, or NPFL/NFF feed, keeping the same `SourceItem` shape.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / start |
| `npm run lint` | Lint the project |
| `npm run db:push` | Push `prisma/schema.prisma` to the Postgres database |
| `npm run db:seed` | Seed categories, articles, and the admin user |
| `npm run db:studio` | Open Prisma Studio to browse the database |

## Deploying to Vercel

1. **Import the repo** at [vercel.com/new](https://vercel.com/new) — pick this GitHub repository and branch. Vercel auto-detects Next.js; no build settings need to change.
2. **Add a Postgres database**: in the project's **Storage** tab, click **Create Database → Postgres** (Vercel's own, Neon-backed) and connect it to the project. This automatically adds a Postgres connection string as an environment variable — check **Settings → Environment Variables** for its exact name (commonly `DATABASE_URL` or `POSTGRES_PRISMA_URL`); if it's not literally `DATABASE_URL`, add one more variable named `DATABASE_URL` with that same value, since that's what `prisma/schema.prisma` reads.
3. **Add the rest of the environment variables** (Settings → Environment Variables):
   - `ADMIN_EMAIL` — e.g. `onibsport@gmail.com`
   - `ADMIN_PASSWORD` — a real password (used once by the seed script to create the admin user)
   - `AUTH_SECRET` — a random string, e.g. generate with `openssl rand -hex 32`
   - `SITE_URL` — your production URL, e.g. `https://onibsport.vercel.app` (needed for correct canonical URLs, sitemap, and Open Graph images)
   - `ANTHROPIC_API_KEY` — optional; leave unset to keep the AI Desk in stub mode
4. **Redeploy** (Deployments tab → ⋯ → Redeploy) so the build picks up the new environment variables.
5. **Push the schema and seed the database once**, from your own machine (this sandbox can't reach Vercel/Postgres, but your machine can):
   ```bash
   npx vercel link          # link this folder to the Vercel project
   npx vercel env pull .env.local
   npm run db:push
   npm run db:seed
   ```
6. Visit `/admin/login` on your deployed URL and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
