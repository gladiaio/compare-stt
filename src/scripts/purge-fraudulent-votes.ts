/**
 * Purge fraudulent votes from the database.
 *
 * Detects votes that cannot plausibly be from legitimate human users using
 * four independent signals:
 *
 *   1. Duplicate provider pairs within the same session (token replay)
 *   2. Inter-vote gap < 8s (below minimum listening time)
 *   3. 20+ votes in a single session (far beyond realistic visit)
 *   4. 6+ votes in any 30s sliding window (machine-gun pattern)
 *
 * Usage:
 *   # Dry-run — shows what would be deleted (default)
 *   npx tsx src/scripts/purge-fraudulent-votes.ts
 *
 *   # Apply deletions
 *   npx tsx src/scripts/purge-fraudulent-votes.ts --apply
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const MIN_INTER_VOTE_GAP_MS = 8_000;
const MAX_SESSION_VOTES = 20;
const BURST_WINDOW_MS = 30_000;
const BURST_MAX_VOTES = 6;

interface FlaggedVote {
  id: string;
  sessionId: string;
  providerAId: string;
  providerBId: string;
  winnerId: string | null;
  createdAt: Date;
  reasons: string[];
}

async function detectFraudulentVotes(): Promise<FlaggedVote[]> {
  const allVotes = await prisma.vote.findMany({
    orderBy: [{ sessionId: "asc" }, { createdAt: "asc" }],
  });

  const flagged = new Map<string, FlaggedVote>();

  function flag(vote: typeof allVotes[number], reason: string) {
    const existing = flagged.get(vote.id);
    if (existing) {
      existing.reasons.push(reason);
    } else {
      flagged.set(vote.id, {
        id: vote.id,
        sessionId: vote.sessionId,
        providerAId: vote.providerAId,
        providerBId: vote.providerBId,
        winnerId: vote.winnerId,
        createdAt: vote.createdAt,
        reasons: [reason],
      });
    }
  }

  const bySession = new Map<string, typeof allVotes>();
  for (const vote of allVotes) {
    const list = bySession.get(vote.sessionId) || [];
    list.push(vote);
    bySession.set(vote.sessionId, list);
  }

  for (const [, votes] of bySession) {
    // Signal 1: Duplicate (session, providerA, providerB) pairs — token replay
    const pairSeen = new Set<string>();
    for (const vote of votes) {
      const pairKey = [vote.providerAId, vote.providerBId].sort().join(":");
      if (pairSeen.has(pairKey)) {
        flag(vote, "duplicate_pair");
      }
      pairSeen.add(pairKey);
    }

    // Signal 2: Inter-vote gap < 8s
    for (let i = 1; i < votes.length; i++) {
      const gap = votes[i].createdAt.getTime() - votes[i - 1].createdAt.getTime();
      if (gap < MIN_INTER_VOTE_GAP_MS) {
        flag(votes[i], `fast_vote(${(gap / 1000).toFixed(1)}s)`);
      }
    }

    // Signal 3: 20+ votes in one session
    if (votes.length >= MAX_SESSION_VOTES) {
      for (const vote of votes) {
        flag(vote, `excessive_session(${votes.length} votes)`);
      }
    }

    // Signal 4: 6+ votes in any 30s sliding window
    for (let i = 0; i < votes.length; i++) {
      const windowStart = votes[i].createdAt.getTime();
      const windowEnd = windowStart + BURST_WINDOW_MS;
      let count = 0;
      for (let j = i; j < votes.length && votes[j].createdAt.getTime() <= windowEnd; j++) {
        count++;
      }
      if (count >= BURST_MAX_VOTES) {
        for (let j = i; j < votes.length && votes[j].createdAt.getTime() <= windowEnd; j++) {
          flag(votes[j], `burst(${count} in 30s)`);
        }
      }
    }
  }

  return Array.from(flagged.values());
}

function printSummary(flaggedVotes: FlaggedVote[]) {
  const reasonCounts = new Map<string, number>();
  for (const vote of flaggedVotes) {
    for (const reason of vote.reasons) {
      const key = reason.replace(/\(.*\)/, "");
      reasonCounts.set(key, (reasonCounts.get(key) || 0) + 1);
    }
  }

  const sessionIds = new Set(flaggedVotes.map((v) => v.sessionId));

  console.log("\n" + "=".repeat(70));
  console.log("  FRAUDULENT VOTE DETECTION REPORT");
  console.log("=".repeat(70));
  console.log(`\n  Total flagged votes:    ${flaggedVotes.length}`);
  console.log(`  Affected sessions:      ${sessionIds.size}`);
  console.log("\n  Breakdown by signal:");
  for (const [reason, count] of [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    - ${reason.padEnd(25)} ${count} votes`);
  }
  console.log();
}

function printDetails(flaggedVotes: FlaggedVote[]) {
  const bySession = new Map<string, FlaggedVote[]>();
  for (const vote of flaggedVotes) {
    const list = bySession.get(vote.sessionId) || [];
    list.push(vote);
    bySession.set(vote.sessionId, list);
  }

  console.log("  DETAILED FLAGGED VOTES BY SESSION");
  console.log("-".repeat(70));

  for (const [sessionId, votes] of [...bySession.entries()].sort(
    (a, b) => b[1].length - a[1].length
  )) {
    console.log(`\n  Session: ${sessionId} (${votes.length} flagged)`);
    for (const vote of votes) {
      const ts = vote.createdAt.toISOString().replace("T", " ").slice(0, 19);
      const reasons = vote.reasons.join(", ");
      console.log(`    ${vote.id}  ${ts}  [${reasons}]`);
    }
  }
  console.log();
}

async function main() {
  const apply = process.argv.includes("--apply");
  const verbose = process.argv.includes("--verbose");

  const totalVotes = await prisma.vote.count();
  console.log(`\nTotal votes in database: ${totalVotes}`);

  const flaggedVotes = await detectFraudulentVotes();

  if (flaggedVotes.length === 0) {
    console.log("\nNo fraudulent votes detected. Database is clean.");
    await prisma.$disconnect();
    return;
  }

  printSummary(flaggedVotes);

  if (verbose) {
    printDetails(flaggedVotes);
  }

  if (!apply) {
    console.log("  DRY RUN — no changes made.");
    console.log("  Run with --apply to delete flagged votes.");
    console.log("  Run with --verbose to see per-vote details.\n");
  } else {
    const voteIds = flaggedVotes.map((v) => v.id);

    console.log(`  Deleting ${voteIds.length} votes...`);
    const result = await prisma.vote.deleteMany({
      where: { id: { in: voteIds } },
    });
    console.log(`  Deleted ${result.count} votes.`);

    const remaining = await prisma.vote.count();
    console.log(`  Remaining votes: ${remaining}\n`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
