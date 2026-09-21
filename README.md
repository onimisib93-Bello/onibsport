# Onibsport

A football news and blog site (Sky Sports Football / Goal.com style) covering the Premier League, La Liga, Serie A, Bundesliga, Champions League, transfers, and Nigeria Football & the NPFL — built with Next.js, TypeScript, and Tailwind CSS.

## Getting started

```bash
npm install
cp .env.example .env   # fill in ADMIN_EMAIL / ADMIN_PASSWORD / AUTH_SECRET
npm run db:push         # create the SQLite database from prisma/schema.prisma
npm run db:seed         # seed categories, sample articles, and the admin user
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site.

## What's here

- **Public site** (`src/app/(site)`) — homepage, category pages, article pages, live scores, and search. Content is served from the static mock data in `src/lib/data/` so the design can be reviewed without a database.
- **Admin dashboard** (`src/app/admin`, protected by `src/proxy.ts`) — sign in at `/admin/login` with the credentials from `.env`, then manage articles (draft → pending review → published) backed by Prisma/SQLite (`prisma/schema.prisma`).
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
| `npm run db:push` | Push `prisma/schema.prisma` to the SQLite database |
| `npm run db:seed` | Seed categories, articles, and the admin user |
| `npm run db:studio` | Open Prisma Studio to browse the database |
