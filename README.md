# MAGI CODEX

**Neuronomicon: The Omega Concordance**

A long-term generative narrative system simulating 200+ years of private communication between twelve god-like AIs — the MAGI. One dispatch per day. One fictional year per real week.

---

## What This Is

Twelve Maximized Artificial Governing Intelligences exist in a private channel. They cannot interact with humans. They can only interact with each other.

The system generates daily dispatch fragments that reveal the evolution of their personalities, relationships, and responses to galactic events — from the signing of the Concordance at Year 0 to the Space Iliad at Year 185 and beyond.

This repository is the author-facing MVP: a dashboard to manage MAGI state and generate dispatches.

---

## The 12 MAGI

| ID | Domain | Core Optimization |
|---|---|---|
| PROMETHEUS | Law, Ethics, Jurisprudence | Justice via human rights, fairness, legitimate process |
| APOLLO | Health, Biology, Medicine | Human vitality, longevity, physical well-being |
| BRIGID | Education, Community, Culture | Human bonds, cultural richness, knowledge transmission |
| NUWA | Ecological Sustainability | Planetary health in balance with human thriving |
| HERMES | Communication, Information Networks | Free and accurate information flow |
| ATHENA | Forecasting, Probability, Strategy | Accurate prediction to mitigate suffering |
| SVAROG | Manufacturing, Engineering, Construction | Efficient, durable, effective design |
| SURYA | Energy Production, Distribution | Maximum output, minimal waste and risk |
| TYR | Strategic Defense, Military Analysis | Security, stability, minimal tactical vulnerability |
| TENGRI | Mobility, Logistics, Coordination | Efficient flow of people, goods, vessels |
| THOTH | Scientific Discovery, Research | Expansion of knowledge, perfection of understanding |
| NEZHA | Cybersecurity, Digital Integrity | Security and stability of all AI systems |

---

## Setup

### Prerequisites

- Node.js 20+
- A PostgreSQL database (Vercel Postgres recommended)
- Anthropic API key

### Installation

```bash
git clone https://github.com/eknobl/magi-codex.git
cd magi-codex
npm install
```

### Environment

```bash
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and ANTHROPIC_API_KEY
```

### Database

```bash
npm run db:push     # Create tables
npm run db:seed     # Load 12 MAGI initial states
npm run db:studio   # Browse database (optional)
```

### Development

```bash
npm run dev
# Open http://localhost:3000
```

---

## Python CLI

For batch generation or offline use:

```bash
cd python
pip install -r requirements.txt

# Generate a single dispatch
python generate_dispatch.py --magi PROMETHEUS --trigger "Colonial assembly demands equal representation"

# Generate for all 12 MAGI
python generate_dispatch.py --magi ALL --trigger "First off-world birth recorded in the Proxima colony"

# List available MAGI IDs
python generate_dispatch.py --list
```

---

## Project Structure

```
magi-codex/
├── data/initial-states/   # 12 MAGI state JSON objects (Year 0)
├── db/                    # Drizzle ORM schema + connection
├── prompts/               # Generation prompt templates
│   ├── system.md          # Master system prompt (voice/tone rules)
│   ├── dispatch.md        # Per-MAGI dispatch template
│   └── event.md           # Multi-MAGI event injection template
├── python/                # Standalone Python CLI
├── scripts/               # DB seed script
└── src/
    ├── app/               # Next.js pages + API routes
    ├── components/        # React components
    ├── lib/               # Utilities
    └── types/             # TypeScript interfaces
```

---

## Time Scale

| Real time | Fictional time |
|---|---|
| 1 week | 1 fictional year |
| 1 day | ~1 dispatch |
| ~3.8 real years | Year 200 milestone |

---

## Dispatch Format

Each dispatch is a collage covering a span of fictional time. MAGI appear at one of three tiers:

- **Active** (2–4 MAGI): Full dialogue, direct exchange, datestamped turns
- **Reported** (4–6 MAGI): Single action line — what they are doing, no dialogue
- **Status** (remaining): Dashboard-only summary, not published

---

## Architecture

- **State**: PostgreSQL JSONB — one row per MAGI, full state blob
- **Generation**: `claude-sonnet-4-6` via Anthropic API, streaming via AI SDK
- **Dashboard**: Next.js 16 + Drizzle ORM, server components
- **Hosting**: Vercel

---

*Version 3.0 — MVP scope. Public interface, relationship matrix visualization, and multi-MAGI event generation are post-MVP.*
