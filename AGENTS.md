# AGENTS.md

## Cursor Cloud specific instructions

This is a **Next.js 16 (App Router) + TypeScript** app — "Compare STT", a blind speech-to-text
provider comparison with an ELO leaderboard. Data lives in **PostgreSQL** via **Prisma**.
Standard scripts are in `package.json` (`dev`, `build`, `lint`, `test`, `db:migrate`, `db:seed`);
setup steps are in `README.md`. Notes below are only the non-obvious things.

### Services

- **PostgreSQL** — required for every page/route (Prisma). The repo's `docker compose up -d` is one
  option, but Docker is not available in this environment; PostgreSQL is installed natively instead.
  Start it with `sudo pg_ctlcluster 16 main start` (it is not started automatically on boot).
  The `compare_stt` role / `compare_stt` DB match the default `DATABASE_URL` in `.env.example`, and
  the role has been granted `CREATEDB` (needed by `prisma migrate dev`'s shadow database).
- **Next.js dev server** — `npm run dev` (Turbopack) on port 3000.

### Non-obvious gotchas

- **basePath `/compare-stt-apis`**: `next.config.ts` sets `basePath`, so the app is served under
  `http://localhost:3000/compare-stt-apis` (pages) and `.../compare-stt-apis/api/*` (routes). Hitting
  bare `http://localhost:3000/` renders the Next not-found page. Always include the prefix when
  testing locally with curl or a browser.
- **`FLAGS` env var is required to render anything locally**: the root layout (`src/app/layout.tsx`)
  and `src/lib/leaderboard-data.ts` evaluate Vercel Flags (`@flags-sdk/vercel`) that have **no
  `defaultValue`**. Without a valid `FLAGS` Vercel connection string, flag evaluation throws and
  **every page and API route returns HTTP 500** (`flags: ... No flag definitions available`). On
  Vercel `FLAGS` is injected automatically; for local dev it must be provided in `.env` (e.g. via
  `vercel env pull`). It is not in `.env.example`. If flag values are unavailable, the app cannot run.
- **Local `.env`**: copy from `.env.example`. The default `DATABASE_URL` works with the native
  PostgreSQL setup above. After changing `.env`, restart `npm run dev` (env is read at boot).
- **Prisma client** is generated to `src/generated/prisma` (gitignored) by the `postinstall` hook, so
  `npm install` regenerates it. After editing `prisma/schema.prisma`, run `npm run db:migrate`.
- **STT provider API keys are optional**: the arena's live transcription (`src/app/api/transcribe`)
  and `test-providers.ts` call the real Gladia / Deepgram / AssemblyAI / ElevenLabs / Speechmatics /
  Mistral APIs and need the corresponding `*_API_KEY` in `.env`. Without them, transcription fails but
  the rest of the app (pages, voting, leaderboard) works.

### Lint / test / build / run

- Lint: `npm run lint` (ESLint).
- Tests: `npm run test` runs three `tsx` suites. `test-diff.ts` and `test-match-token.ts` are pure
  unit tests and pass offline. `test-providers.ts` is a **live** integration smoke test that hits the
  real provider APIs and fails unless the provider API keys are set.
- Run (dev): `npm run dev`, then open `http://localhost:3000/compare-stt-apis`.
- The vote → ELO flow can be exercised without provider keys: match tokens are HMAC-signed with a key
  derived from `DATABASE_URL` (`src/lib/match-token.ts`), and `POST .../api/vote` records the vote and
  updates the ELO leaderboard.
