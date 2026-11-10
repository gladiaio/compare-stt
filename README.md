# Compare STT

Blind comparison of speech-to-text providers. Record or upload audio, compare two anonymous transcriptions side by side, and vote for the best one. Community votes feed into an ELO-based leaderboard.

Try it at [gladia.io/speech-to-text-api-comparison](https://www.gladia.io/speech-to-text-api-comparison).

## Providers

- [Gladia](https://gladia.io) — Solaria-3
- [ElevenLabs](https://elevenlabs.io) — Scribe v2
- [AssemblyAI](https://assemblyai.com) — Universal-3 Pro
- [Speechmatics](https://speechmatics.com) — Enhanced
- [Mistral](https://mistral.ai) — Voxtral Mini
- [Deepgram](https://deepgram.com) — Nova 3

## Results

Current ELO standings from community blind votes (snapshot of 2026-11-10, 1,026 votes, statistically significant):

| Rank | Provider | Model | ELO | Win rate | Matches |
|---:|---|---|---:|---:|---:|
| 1 | ElevenLabs | Scribe v2 | 1573 | 49.6% | 341 |
| 2 | Gladia | Solaria-3 | 1555 | 49.9% | 341 |
| 3 | AssemblyAI | Universal-3 Pro | 1527 | 45.3% | 342 |
| 4 | Speechmatics | Enhanced | 1487 | 30.7% | 342 |
| 5 | Mistral | Voxtral Mini | 1480 | 42.0% | 345 |
| 6 | Deepgram | Nova 3 | 1378 | 22.6% | 341 |

Win rate counts ties as non-wins. The table is a snapshot; the live leaderboard updates with every vote.

- **Live leaderboard and blind test**: [gladia.io/speech-to-text-api-comparison](https://www.gladia.io/speech-to-text-api-comparison)
- **WER benchmarks across datasets**: [gladia.io/competitors/benchmarks](https://www.gladia.io/competitors/benchmarks)

## Getting started

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)

### Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d

# Run database migrations
npm run db:migrate

# Seed providers
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env`. The defaults work with the Docker Compose setup.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `GLADIA_API_KEY` | [Gladia](https://gladia.io) API key |
| `DEEPGRAM_API_KEY` | [Deepgram](https://deepgram.com) API key |
| `ASSEMBLYAI_API_KEY` | [AssemblyAI](https://assemblyai.com) API key |
| `ELEVENLABS_API_KEY` | [ElevenLabs](https://elevenlabs.io) API key |
| `SPEECHMATICS_API_KEY` | [Speechmatics](https://speechmatics.com) API key |

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 with Gladia design tokens
- **Database**: PostgreSQL + Prisma ORM
- **Deployment**: Vercel + Neon (Postgres)
