import "dotenv/config";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const providers = [
  { name: "Gladia", slug: "gladia", logoUrl: "/providers/gladia.svg" },
  { name: "ElevenLabs", slug: "elevenlabs", logoUrl: "/providers/elevenlabs.svg" },
  { name: "Deepgram", slug: "deepgram", logoUrl: "/providers/deepgram.svg" },
  { name: "AssemblyAI", slug: "assemblyai", logoUrl: "/providers/assemblyai.svg" },
  { name: "Speechmatics", slug: "speechmatics", logoUrl: "/providers/speechmatics.svg" },
  { name: "Mistral", slug: "mistral", logoUrl: "/providers/mistral.svg" },
];

const removedSlugs = ["soniox", "openai-whisper"];

async function main() {
  console.log("Seeding providers...");

  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { slug: provider.slug },
      update: { name: provider.name, logoUrl: provider.logoUrl },
      create: provider,
    });
    console.log(`  + ${provider.name}`);
  }

  for (const slug of removedSlugs) {
    const existing = await prisma.provider.findUnique({ where: { slug } });
    if (existing) {
      const voteCount = await prisma.vote.count({
        where: {
          OR: [
            { providerAId: existing.id },
            { providerBId: existing.id },
          ],
        },
      });
      if (voteCount === 0) {
        await prisma.provider.delete({ where: { slug } });
        console.log(`  - Removed ${slug} (no votes)`);
      } else {
        console.log(`  ~ Kept ${slug} (has ${voteCount} votes)`);
      }
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
