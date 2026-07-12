export interface LeaderboardArticle {
  title: string;
  url: string;
  source: string;
  description?: string;
  imageUrl?: string;
}

const SPREADSHEET_ID = "1pzd1Vj_ESMxiwj5YZY8bxA0ZxgcmywnF9huVT9Hkwmc";
const SHEET_GID = "0";
const MAX_ARTICLES = 20;
const ENRICHMENT_BATCH_SIZE = 4;

/** Keep in sync with `images.remotePatterns` in next.config.ts */
const ALLOWED_IMAGE_HOSTS = new Set([
  "cdn.prod.website-files.com",
  "www.coval.ai",
  "coval.ai",
  "deepgram.com",
  "cdn.sanity.io",
  "huggingface.co",
  "cdn-thumbnails.huggingface.co",
  "artificialanalysis.ai",
  "nextlevel.ai",
  "krisp.ai",
  "hackernoon.imgix.net",
  "substackcdn.com",
  "substack-post-media.s3.amazonaws.com",
  "images.ctfassets.net",
  "soniox.com",
  "openrouter.ai",
]);

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
    title: "Best open-source speech-to-text models in 2026",
    url: "https://www.gladia.io/blog/best-open-source-speech-to-text-models",
    source: "Gladia",
    imageUrl:
      "https://cdn.prod.website-files.com/645a730e85c9b4dfd57de5a1/69dfb6620a7e746f9dfc8ffa_best-opensource-speechtotext-models-in-2026-752x500.png",
    description:
      "Benchmarks and deployment guidance for Whisper, Canary-Qwen, Parakeet, Moonshine, and other open ASR models.",
  },
  {
    title: "Speech-to-text leaderboard (non-streaming)",
    url: "https://artificialanalysis.ai/speech-to-text/non-streaming",
    source: "Artificial Analysis",
    imageUrl:
      "https://artificialanalysis.ai/opengraph-image.png?732728ccc2829321",
    description:
      "Independent batch STT rankings comparing accuracy, speed, and price across commercial and open models.",
  },
  {
    title: "Open ASR Leaderboard",
    url: "https://huggingface.co/spaces/hf-audio/open_asr_leaderboard",
    source: "Hugging Face",
    imageUrl:
      "https://cdn-thumbnails.huggingface.co/social-thumbnails/spaces/hf-audio/open_asr_leaderboard.png",
    description:
      "Community benchmark tracking word error rates for open-source automatic speech recognition models.",
  },
  {
    title: "Best speech-to-text models",
    url: "https://nextlevel.ai/best-speech-to-text-models/",
    source: "NextLevel.ai",
    imageUrl: "https://nextlevel.ai/wp-content/uploads/2025/10/Frame-5.webp",
    description:
      "Overview of top STT models and APIs for developers evaluating accuracy, latency, and language coverage.",
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
    title: "Best STT providers in 2026: independent benchmarks and how to choose",
    url: "https://www.coval.ai/blog/best-speech-to-text-providers-in-2026-independent-benchmarks-and-how-to-choose/",
    source: "Coval",
    imageUrl: "https://www.coval.ai/logo-black.png",
    description:
      "Independent overview of 14 STT providers with guidance on metrics that predict production performance.",
  },
  {
    title: "Best speech-to-text APIs",
    url: "https://www.edenai.co/post/best-speech-to-text-apis",
    source: "Eden AI",
    imageUrl:
      "https://cdn.prod.website-files.com/61e7d259b7746e3f63f0b6be/6a0dc5e6e203a821c91e7850_69b02edcc948d3de90aa93e9_Best%2520Speech-to-text%2520in%25202026.jpeg",
    description:
      "Unified comparison of major STT APIs on accuracy, features, pricing, and integration options.",
  },
  {
    title: "Best speech-to-text API solutions",
    url: "https://krisp.ai/blog/speech-to-text-api/",
    source: "Krisp",
    imageUrl:
      "https://krisp.ai/blog/wp-content/uploads/2024/06/speech-to-text-copy-380x217.png",
    description:
      "Guide to choosing an STT API for real-time transcription, noise handling, and production voice apps.",
  },
  {
    title: "Best speech-to-text APIs to build an AI notetaker in 2026",
    url: "https://hackernoon.com/best-speech-to-text-apis-to-build-an-ai-notetaker-in-2026",
    source: "HackerNoon",
    imageUrl:
      "https://hackernoon.imgix.net/images/yInti7CnmZMjybXOCRsTVUOcMel2-g883emq.jpeg",
    description:
      "Developer-focused roundup of STT APIs suited for AI notetaker and meeting-assistant products.",
  },
  {
    title: "Speech-to-text APIs in 2026: benchmarks",
    url: "https://futureagi.substack.com/p/speech-to-text-apis-in-2026-benchmarks",
    source: "Future AGI",
    imageUrl:
      "https://substackcdn.com/image/fetch/w_1200,h_675,c_fill,f_jpg,q_auto:good,fl_progressive:steep,g_auto/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F30527d45-835e-4501-884e-7c9932a1d7e4_3138x1962.heic",
    description:
      "Benchmark-driven analysis of leading STT APIs for accuracy, latency, and developer experience.",
  },
  {
    title: "The best dictation and speech-to-text software in 2026",
    url: "https://www.zapier.com/blog/best-text-dictation-software/",
    source: "Zapier",
    imageUrl:
      "https://images.ctfassets.net/lzny33ho1g45/29rBWbGgbQbINImpQkAaYq/851ba72b076849374411958567bcf01a/best-dictation-software.jpg",
    description:
      "Hands-on review of the best dictation tools and speech-to-text apps for everyday productivity.",
  },
  {
    title: "Soniox Compare",
    url: "https://soniox.com/compare/",
    source: "Soniox",
    imageUrl: "https://soniox.com/images/logos/logo_soniox.png",
    description:
      "Live side-by-side comparison of real-time STT providers including Soniox, OpenAI, Google, and Deepgram.",
  },
  {
    title: "Best speech-to-text and transcription models",
    url: "https://openrouter.ai/collections/speech-to-text-models",
    source: "OpenRouter",
    imageUrl:
      "https://openrouter.ai/dynamic-og?title=Best+Speech-to-Text+and+Transcription+Models&description=Find+the+best+speech-to-text+and+transcription+models+on+OpenRouter.",
    description:
      "Curated collection of transcription models on OpenRouter, from Whisper to GPT-4o Transcribe and Chirp 3.",
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

function isPrivateOrReservedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }

  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) return false;

  const [, a, b, c, d] = ipv4Match.map(Number);
  if ([a, b, c, d].some((octet) => octet > 255)) return true;

  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isAllowedOutboundUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    return !isPrivateOrReservedHost(parsed.hostname);
  } catch {
    return false;
  }
}

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_IMAGE_HOSTS.has(parsed.hostname) &&
      !isPrivateOrReservedHost(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function parseArticlesCsv(text: string): LeaderboardArticle[] {
  const cleanText = text.replace(/^\uFEFF/, "");
  const lines = cleanText
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
    const rawImageUrl =
      imageIndex >= 0 ? cells[imageIndex]?.trim() : undefined;
    const imageUrl =
      rawImageUrl && isAllowedImageUrl(rawImageUrl) ? rawImageUrl : undefined;

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
      /https:\/\/cdn\.sanity\.io\/images\/[^"'\s<>]+?-\d+x\d+\.(?:jpg|jpeg|png|webp)/gi,
    ),
    ...html.matchAll(
      /https:\/\/cdn\.prod\.website-files\.com\/[^"'\s<>]+\.(?:png|jpg|jpeg|webp)/gi,
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
  if (!isAllowedImageUrl(url)) return false;

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
  if (!isAllowedOutboundUrl(url)) return undefined;

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
    ].filter(
      (value): value is string =>
        typeof value === "string" && isAllowedImageUrl(value),
    );

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
  ].filter(
    (value): value is string =>
      typeof value === "string" && isAllowedImageUrl(value),
  );

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

  const results: LeaderboardArticle[] = [];

  for (let i = 0; i < articles.length; i += ENRICHMENT_BATCH_SIZE) {
    const batch = articles.slice(i, i + ENRICHMENT_BATCH_SIZE);
    const enriched = await Promise.all(
      batch.map((article) => ensureArticleImage(article, fallbackByUrl)),
    );
    results.push(...enriched);
  }

  return results;
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
      articles.length > 0
        ? articles.slice(0, MAX_ARTICLES)
        : FALLBACK_ARTICLES.slice(0, MAX_ARTICLES);

    return enrichArticlesWithImages(baseArticles);
  } catch {
    return enrichArticlesWithImages(FALLBACK_ARTICLES);
  }
}
