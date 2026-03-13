# ASR Arena

Blind comparison of speech-to-text providers. Record or upload audio, compare two anonymous transcriptions side by side, and vote for the best one. Community votes feed into an ELO-based leaderboard.

## Providers

- [Gladia](https://gladia.io) — Solaria
- [ElevenLabs](https://elevenlabs.io) — Scribe v2
- [Deepgram](https://deepgram.com) — Nova 3
- [AssemblyAI](https://assemblyai.com) — Best
- [Speechmatics](https://speechmatics.com) — Enhanced

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
