export interface LeaderboardArticle {
  title: string;
  url: string;
  source: string;
  description?: string;
  imageUrl?: string;
}

const SPREADSHEET_ID = "1pzd1Vj_ESMxiwj5YZY8bxA0ZxgcmywnF9huVT9Hkwmc";
const SHEET_GID = "0";

const FALLBACK_ARTICLES: LeaderboardArticle[] = [
  {
    title: "Best speech-to-text APIs in 2026",
    url: "https://www.gladia.io/blog/best-speech-to-text-apis",
    source: "Gladia",
    imageUrl:
      "https://cdn.prod.website-files.com/645a730e85c9b4dfd57de5a1/69a81dbdd1bb83f4d641cbe4_Best%20STT%20APIs%20for%202026%20-%20Banner%20copy.png",
    description:
      "A side-by-side look at the leading STT APIs across accuracy, latency, multilingual support, and pricing.",
  },
  {
    title: "STT API benchmarks: accuracy, latency, and real-world performance",
    url: "https://www.gladia.io/blog/stt-api-benchmarks",
    source: "Gladia",
    imageUrl:
      "https://cdn.prod.website-files.com/645a730e85c9b4dfd57de5a1/69c2a4a70226557e3635e120_Speaker%20diarization%20-%20Banner%20(1).png",
    description:
      "How to evaluate speech-to-text providers beyond vendor WER claims using production-like audio.",
  },
  {
    title: "AssemblyAI vs Deepgram (vs Gladia): which STT API to choose in 2026",
    url: "https://www.gladia.io/blog/assemblyai-vs-deepgram",
    source: "Gladia",
    imageUrl:
      "https://cdn.prod.website-files.com/645a730e85c9b4dfd57de5a1/696f36b390411f213435efdf_Gladia-AssemblyAI-Deepgram-Thumbnail.png",
    description:
      "Compares two popular APIs on accuracy, streaming, multilingual coverage, and total cost.",
  },
  {
    title: "Best STT providers in 2026: independent benchmarks and how to choose",
    url: "https://www.coval.ai/blog/best-speech-to-text-providers-in-2026-independent-benchmarks-and-how-to-choose/",
    source: "Coval",
    imageUrl: "https://www.coval.ai/logo-black.png",
    description:
      "Independent overview of 14 STT providers with guidance on metrics that predict production performance.",
  },
  {
    title: "STT API benchmark 2026: latency and accuracy for voice agents",
    url: "https://gradium.ai/content/stt-api-benchmark-2026-latency-accuracy",
    source: "Gradium",
    imageUrl: "https://gradium.ai/assets/dots_1200.png",
    description:
      "Benchmark comparing TTFT and WER across Deepgram, AssemblyAI, ElevenLabs, and others for voice agents.",
  },
  {
    title: "Best speech-to-text APIs in 2026: a comprehensive comparison guide",
    url: "https://deepgram.com/learn/best-speech-to-text-apis-2026",
    source: "Deepgram",
    imageUrl:
      "https://cdn.sanity.io/images/10fppwnn/production/10d76b37d6361f025d199817c9ee1814ba8818f9-1600x832.jpg",
    description:
      "Deepgram's ranking of the top commercial STT APIs by accuracy, speed, cost, and customization.",
  },
  {
    title: "Speech-to-text API comparison (2026)",
    url: "https://apiscout.dev/guides/speech-to-text-api-comparison-2026",
    source: "APIScout",
    imageUrl:
      "https://apiscout.dev/images/guides/speech-to-text-api-comparison-2026.webp",
    description:
      "Developer-focused comparison of batch WER, streaming latency, and pricing across major providers.",
  },
  {
    title: "Speech-to-text APIs in 2026: benchmarks, pricing, and developer's decision guide",
    url: "https://futureagi.com/blog/speech-to-text-apis-in-2026-benchmarks-pricing-developer-s-decision-guide/",
    source: "Future AGI",
    imageUrl:
      "https://futureagi.com/images/blog/blog-cover-speech-to-text-apis-in-2026-benchmarks-pricing-developer-s-decision-guide.webp",
    description:
      "Use-case matrix for picking between Deepgram, AssemblyAI, Whisper, and ElevenLabs in production.",
  },
  {
    title: "Multilingual meeting transcription: language coverage and code-switching",
    url: "https://www.gladia.io/blog/multilingual-meeting-transcription-language-coverage-accuracy-and-code-switching-challenges",
    source: "Gladia",
    imageUrl:
      "https://cdn.prod.website-files.com/645a730e85c9b4dfd57de5a1/69ddee1adb13d2a6a0d7709b_69ddee1378d7a63b208fc7cc_Multilingual%2520meeting%2520transcription%2520-%2520Thumbnail.png",
    description:
      "How leading STT APIs handle multilingual meetings, code-switching, and real-world WER degradation.",
  },
  {
    title: "Open ASR Leaderboard: fighting test-set contamination with private data",
    url: "https://huggingface.co/blog/open-asr-leaderboard-private-data",
    source: "Hugging Face",
    imageUrl:
      "https://huggingface.co/blog/assets/open-asr-leaderboard-private-data/thumbnail.png",
    description:
      "Why Hugging Face added private English datasets to the open ASR leaderboard for fairer model evaluation.",
  },
];

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate);
    if (index >= 0) return index;
  }
  return -1;
}

function parseArticlesCsv(text: string): LeaderboardArticle[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const titleIndex = findColumnIndex(headers, [
    "title",
    "article title",
    "article",
    "name",
  ]);
  const urlIndex = findColumnIndex(headers, ["url", "link", "article url"]);
  const sourceIndex = findColumnIndex(headers, [
    "source",
    "publisher",
    "author",
    "site",
  ]);
  const descriptionIndex = findColumnIndex(headers, [
    "description",
    "summary",
    "notes",
    "excerpt",
  ]);
  const imageIndex = findColumnIndex(headers, [
    "image",
    "image url",
    "banner",
    "thumbnail",
    "og image",
  ]);

  if (titleIndex < 0 || urlIndex < 0) return [];

  const articles: LeaderboardArticle[] = [];

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const title = cells[titleIndex]?.trim();
    const url = cells[urlIndex]?.trim();

    if (!title || !url || !/^https?:\/\//i.test(url)) continue;

    const source =
      (sourceIndex >= 0 ? cells[sourceIndex]?.trim() : "") || "External";
    const description =
      descriptionIndex >= 0 ? cells[descriptionIndex]?.trim() : undefined;
    const imageUrl =
      imageIndex >= 0 ? cells[imageIndex]?.trim() : undefined;

    articles.push({
      title,
      url,
      source,
      ...(description ? { description } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    });
  }

  return articles;
}

function extractOgImage(html: string): string | undefined {
  const patterns = [
    /property="og:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="og:image"/i,
    /name="twitter:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+name="twitter:image"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return undefined;
}

function extractContentImages(html: string): string[] {
  const matches = [
    ...html.matchAll(
      /https:\/\/cdn\.sanity\.io\/images\/[^"'\\s<>]+?-\d+x\d+\.(?:jpg|jpeg|png|webp)/gi,
    ),
    ...html.matchAll(
      /https:\/\/cdn\.prod\.website-files\.com\/[^"'\\s<>]+\.(?:png|jpg|jpeg|webp)/gi,
    ),
  ];

  const seen = new Set<string>();
  const images: string[] = [];

  for (const match of matches) {
    const url = match[0];
    if (seen.has(url)) continue;
    seen.add(url);
    images.push(url);
  }

  return images.sort((a, b) => scoreBannerCandidate(b) - scoreBannerCandidate(a));
}

function scoreBannerCandidate(url: string): number {
  const dimensionMatch = url.match(/-(\d+)x(\d+)\./);
  if (!dimensionMatch) return 0;

  const width = Number(dimensionMatch[1]);
  const height = Number(dimensionMatch[2]);
  return width * height;
}

async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "CompareSTT/1.0" },
      next: { revalidate: 86400 },
    });

    clearTimeout(timeout);
    if (!res.ok) return false;

    const contentType = res.headers.get("content-type") ?? "";
    return contentType.startsWith("image/");
  } catch {
    return false;
  }
}

async function resolveArticleImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CompareSTT/1.0" },
      next: { revalidate: 86400 },
    });

    clearTimeout(timeout);
    if (!res.ok) return undefined;

    const html = await res.text();
    const candidates = [
      extractOgImage(html),
      ...extractContentImages(html),
    ].filter((value): value is string => Boolean(value));

    for (const candidate of candidates) {
      if (await isImageUrlValid(candidate)) return candidate;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

async function ensureArticleImage(
  article: LeaderboardArticle,
  fallbackByUrl: Map<string, string | undefined>,
): Promise<LeaderboardArticle> {
  const candidates = [
    article.imageUrl,
    fallbackByUrl.get(article.url),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (await isImageUrlValid(candidate)) {
      return { ...article, imageUrl: candidate };
    }
  }

  const resolved = await resolveArticleImage(article.url);
  return resolved ? { ...article, imageUrl: resolved } : article;
}

async function enrichArticlesWithImages(
  articles: LeaderboardArticle[],
): Promise<LeaderboardArticle[]> {
  const fallbackByUrl = new Map(
    FALLBACK_ARTICLES.map((article) => [article.url, article.imageUrl]),
  );

  return Promise.all(
    articles.map((article) => ensureArticleImage(article, fallbackByUrl)),
  );
}

export async function getLeaderboardArticles(): Promise<LeaderboardArticle[]> {
  try {
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return enrichArticlesWithImages(FALLBACK_ARTICLES);
    }

    const text = await res.text();
    if (text.includes("<!DOCTYPE html") || text.includes("Sign in")) {
      return enrichArticlesWithImages(FALLBACK_ARTICLES);
    }

    const articles = parseArticlesCsv(text);
    const baseArticles =
      articles.length > 0 ? articles : FALLBACK_ARTICLES;

    return enrichArticlesWithImages(baseArticles);
  } catch {
    return enrichArticlesWithImages(FALLBACK_ARTICLES);
  }
}
