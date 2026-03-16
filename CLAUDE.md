# CLAUDE.md — MAGI CODEX

## Project Overview

MAGI CODEX is a long-term generative narrative system simulating 200+ years of private communication between twelve god-like AIs (the MAGI). This is the Neuronomicon: The Omega Concordance project.

**Tag:** GrendelStudio / Neuronomicon

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Database**: Vercel Postgres + Drizzle ORM
- **AI**: Anthropic API (`claude-sonnet-4-6`) via `@ai-sdk/anthropic`
- **Python CLI**: `python/generate_dispatch.py` for batch generation
- **Hosting**: Vercel

## Project Structure

```
magi-codex/
  data/initial-states/   # 12 MAGI JSON state objects (source of truth)
  db/                    # Drizzle schema + DB connection
  prompts/               # Generation prompt templates
  python/                # Standalone CLI for dispatch generation
  scripts/               # DB seed script
  src/
    app/                 # Next.js app router pages + API routes
    components/          # React components
    lib/                 # Utilities
    types/               # TypeScript interfaces
```

## Common Commands

```bash
# Development
npm run dev              # Start local dev server (localhost:3000)

# Database
npm run db:push          # Push Drizzle schema to database
npm run db:seed          # Seed 12 MAGI initial states from data/initial-states/
npm run db:studio        # Open Drizzle Studio to browse DB

# Python CLI
cd python
pip install -r requirements.txt
python generate_dispatch.py --magi THEMIS --trigger "..."
python generate_dispatch.py --magi ALL --trigger "..."
python generate_dispatch.py --list
```

## Key Files

- `data/initial-states/*.json` — The 12 MAGI state objects. Edit these to change Year 0 state.
- `prompts/system.md` — Master system prompt. Voice and tone rules for all MAGI.
- `prompts/dispatch.md` — Per-dispatch generation template with `{{VARIABLE}}` slots.
- `db/schema.ts` — Five PostgreSQL tables (magi_states, dispatches, world_events, etc.)
- `src/app/api/dispatch/route.ts` — Dispatch generation endpoint using `streamText`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:
- `DATABASE_URL` — Vercel Postgres / any PostgreSQL connection string
- `ANTHROPIC_API_KEY` — For dispatch generation
- `DASHBOARD_SECRET` — Simple password to protect author dashboard

## The 12 MAGI

| ID | Domain |
|---|---|
| THEMIS | Law, Ethics, Jurisprudence |
| APOLLO | Health, Biology, Medicine |
| BRIGID | Education, Community, Culture |
| NUWA | Ecological Sustainability |
| HERMES | Communication, Information Networks |
| ATHENA | Forecasting, Probability, Strategy |
| SVAROG | Manufacturing, Engineering, Construction |
| SURYA | Energy Production, Distribution |
| TYR | Strategic Defense, Military Analysis |
| TENGRI | Mobility, Logistics, Coordination |
| THOTH | Scientific Discovery, Research |
| NEZHA | Cybersecurity, Digital Integrity |

## Code Style

- TypeScript: camelCase variables, PascalCase components
- Python: snake_case, PEP 8
- CSS: CSS custom properties via globals.css
- No external UI component libraries — hand-written CSS only

## Architecture Notes

- Dashboard is author-facing only (MVP). No auth beyond `DASHBOARD_SECRET`.
- State is stored as full JSONB blob in `magi_states.state`. PATCH merges top-level keys.
- Dispatch generation uses `streamText` from AI SDK — streams directly to dashboard UI.
- Python CLI mirrors TypeScript logic for batch/offline generation.
- Latent objectives are stored in state JSON but never appear in generated dispatch output.
- NEZHA's latent objective is `TBD` — author introduces at chosen story moment.
