import type { LeaderboardData } from "@/lib/leaderboard-data";
import { publicUrl } from "@/lib/site";

export function LeaderboardDatasetSchema({ data }: { data: LeaderboardData }) {
  const sorted = [...data.leaderboard].sort((a, b) => b.rating - a.rating);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Compare STT Leaderboard",
    description:
      "Community-driven ELO rankings of speech-to-text providers based on blind side-by-side comparisons. Users listen to audio, vote for the better transcription without seeing which provider produced it, and rankings update as votes accumulate.",
    url: publicUrl("/leaderboard"),
    dateModified: data.lastUpdated,
    keywords: [
      "speech-to-text",
      "STT benchmark",
      "ASR comparison",
      "transcription accuracy",
      "ELO ranking",
      "blind evaluation",
    ],
    creator: {
      "@type": "Organization",
      name: "Gladia",
      url: "https://gladia.io",
    },
    license: publicUrl("/terms"),
    isAccessibleForFree: true,
    variableMeasured: [
      { "@type": "PropertyValue", name: "Rank", description: "Position in the leaderboard, 1 = best" },
      { "@type": "PropertyValue", name: "Provider", description: "Speech-to-text provider name" },
      {
        "@type": "PropertyValue",
        name: "ELO score",
        description: "ELO rating derived from blind pairwise comparisons",
      },
      {
        "@type": "PropertyValue",
        name: "Votes",
        description: "Total number of community comparisons contributing to the score",
      },
      { "@type": "PropertyValue", name: "95% CI", description: "95% confidence interval on the ELO score" },
    ],
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "text/html",
      contentUrl: publicUrl("/leaderboard"),
    },
    measurementTechnique: "Blind pairwise comparison with ELO scoring",
    sampleData: sorted.slice(0, 6).map((entry, index) => ({
      rank: index + 1,
      provider: entry.model ? `${entry.name} ${entry.model}` : entry.name,
      elo: entry.rating,
      votes: entry.totalMatches,
      ci: entry.confidenceInterval,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
