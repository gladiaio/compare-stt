/**
 * Renders the ELO leaderboard as a standalone SVG card.
 *
 * Used by /api/leaderboard.svg so the GitHub README (which cannot run JS or
 * embed iframes) can show live standings through a plain <img>.
 *
 * Constraints of the target (an SVG loaded through <img> behind GitHub's
 * image proxy): no external resources, no web fonts, no scripts. Logos are
 * therefore inlined as nested <svg> elements and fonts fall back to close
 * system faces (Suisse Intl → Helvetica, Geist Mono → system mono).
 *
 * Colors and type follow the Gladia design system (dark-first, weight 400,
 * Geist Mono uppercase labels, purple reserved for labels and Gladia data).
 */

export interface LeaderboardSvgEntry {
  name: string;
  slug: string;
  model: string;
  rating: number;
  winRate: number;
}

export interface LeaderboardSvgInput {
  entries: LeaderboardSvgEntry[];
  totalVotes: number;
  isSignificant: boolean;
  lastUpdated: string;
  /** Raw SVG markup per provider slug. Missing logos fall back to the name. */
  logos?: Record<string, string>;
  /** Slug of the row to highlight (Gladia data). */
  highlightSlug?: string;
}

const TOKENS = {
  bg: "#000000",
  border: "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.06)",
  textPrimary: "#FFFFFF",
  textSecondary: "#A3A3A3",
  textTertiary: "#727272",
  accent: "#947AFC",
  accentSubtle: "rgba(148,122,252,0.08)",
} as const;

const FONT_SANS = "'Suisse Intl', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const WIDTH = 720;
const PAD = 32;
const ROW_H = 52;
const LOGO_W = 112;
const LOGO_H = 16;
const RADIUS = 24;

const COL = {
  rank: PAD,
  logo: PAD + 40,
  model: PAD + 40 + LOGO_W + 32,
  winRate: WIDTH - PAD - 120,
  elo: WIDTH - PAD,
};

const PUBLIC_URL_LABEL = "gladia.io/speech-to-text-api-comparison";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Turns a standalone logo file into a nested <svg> placed in a fixed box.
 * Class names are namespaced per slug (the document shares one stylesheet
 * scope) and ids are dropped so two logos can never collide.
 */
export function inlineLogo(markup: string, slug: string, x: number, y: number): string | null {
  const open = markup.match(/<svg\b[^>]*>/i);
  const close = markup.lastIndexOf("</svg>");
  if (!open || close === -1) return null;

  const attrs = open[0];
  let viewBox = attrs.match(/viewBox="([^"]+)"/i)?.[1];
  if (!viewBox) {
    const w = attrs.match(/\bwidth="([\d.]+)"/i)?.[1];
    const h = attrs.match(/\bheight="([\d.]+)"/i)?.[1];
    if (!w || !h) return null;
    viewBox = `0 0 ${w} ${h}`;
  }

  const prefix = `${slug.replace(/[^a-z0-9-]/gi, "")}-`;
  const body = markup
    .slice((open.index ?? 0) + attrs.length, close)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s(?:id|data-name)="[^"]*"/g, "")
    .replace(/\sclass="([^"]+)"/g, (_, names: string) =>
      ` class="${names.trim().split(/\s+/).map((n) => prefix + n).join(" ")}"`,
    )
    .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, a: string, css: string, b: string) =>
      a + css.replace(/\.([a-z_][\w-]*)/gi, `.${prefix}$1`) + b,
    )
    .trim();

  return `<svg x="${x}" y="${y}" width="${LOGO_W}" height="${LOGO_H}" viewBox="${escapeXml(viewBox)}" preserveAspectRatio="xMinYMid meet">${body}</svg>`;
}

function text(
  x: number,
  y: number,
  content: string,
  opts: { size: number; fill: string; mono?: boolean; anchor?: "start" | "end"; spacing?: string },
): string {
  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `font-family="${opts.mono ? FONT_MONO : FONT_SANS}"`,
    `font-size="${opts.size}"`,
    `font-weight="400"`,
    `fill="${opts.fill}"`,
  ];
  if (opts.anchor === "end") attrs.push(`text-anchor="end"`);
  if (opts.spacing) attrs.push(`letter-spacing="${opts.spacing}"`);
  return `<text ${attrs.join(" ")}>${escapeXml(content)}</text>`;
}

function formatVotes(n: number): string {
  return n.toLocaleString("en-US");
}

export function renderLeaderboardSvg(input: LeaderboardSvgInput): string {
  const { entries, totalVotes, isSignificant, lastUpdated, logos = {}, highlightSlug } = input;

  const parts: string[] = [];
  let y = PAD;

  // Header: kicker + title
  parts.push(text(PAD, y + 12, "BLIND TEST · ELO LEADERBOARD", {
    size: 12, fill: TOKENS.accent, mono: true, spacing: "1.92",
  }));
  y += 12 + 16;
  parts.push(text(PAD, y + 24, "Speech-to-text API leaderboard", {
    size: 24, fill: TOKENS.textPrimary, spacing: "-0.48",
  }));
  y += 24 + 32;

  // Column labels
  const labelOpts = { size: 12, fill: TOKENS.textTertiary, mono: true, spacing: "0.96" } as const;
  parts.push(text(COL.rank, y + 12, "#", labelOpts));
  parts.push(text(COL.logo, y + 12, "PROVIDER", labelOpts));
  parts.push(text(COL.model, y + 12, "MODEL", labelOpts));
  parts.push(text(COL.winRate, y + 12, "WIN RATE", { ...labelOpts, anchor: "end" }));
  parts.push(text(COL.elo, y + 12, "ELO", { ...labelOpts, anchor: "end" }));
  y += 12 + 12;

  // Rows
  entries.forEach((entry, i) => {
    const top = y;
    const mid = top + ROW_H / 2;
    const highlighted = entry.slug === highlightSlug;

    if (highlighted) {
      parts.push(
        `<rect x="${PAD - 12}" y="${top + 2}" width="${WIDTH - 2 * PAD + 24}" height="${ROW_H - 4}" rx="8" fill="${TOKENS.accentSubtle}"/>`,
      );
    } else if (i > 0 && entries[i - 1].slug !== highlightSlug) {
      parts.push(`<rect x="${PAD}" y="${top}" width="${WIDTH - 2 * PAD}" height="1" fill="${TOKENS.divider}"/>`);
    }

    const baseline = mid + 5;
    parts.push(text(COL.rank, baseline, isSignificant ? String(i + 1) : "–", {
      size: 14, fill: TOKENS.textTertiary, mono: true,
    }));

    const logo = logos[entry.slug] ? inlineLogo(logos[entry.slug], entry.slug, COL.logo, mid - LOGO_H / 2) : null;
    parts.push(logo ?? text(COL.logo, baseline, entry.name, { size: 14, fill: TOKENS.textPrimary }));

    parts.push(text(COL.model, baseline, entry.model, { size: 14, fill: TOKENS.textSecondary }));

    const winRate = isSignificant ? `${(entry.winRate * 100).toFixed(1)}%` : "–";
    parts.push(text(COL.winRate, baseline, winRate, {
      size: 14, fill: TOKENS.textSecondary, mono: true, anchor: "end",
    }));

    const elo = isSignificant ? String(Math.round(entry.rating)) : "–";
    parts.push(text(COL.elo, baseline, elo, {
      size: 16, fill: highlighted ? TOKENS.accent : TOKENS.textPrimary, mono: true, anchor: "end",
    }));

    y += ROW_H;
  });

  // Footer
  y += 8;
  parts.push(`<rect x="${PAD}" y="${y}" width="${WIDTH - 2 * PAD}" height="1" fill="${TOKENS.divider}"/>`);
  y += 20;
  const meta = isSignificant
    ? `${formatVotes(totalVotes)} community votes · updated ${lastUpdated}`
    : `${formatVotes(totalVotes)} votes so far · rankings unlock once results are significant`;
  parts.push(text(PAD, y + 12, meta, { size: 12, fill: TOKENS.textTertiary }));
  parts.push(text(WIDTH - PAD, y + 12, PUBLIC_URL_LABEL, {
    size: 12, fill: TOKENS.textSecondary, anchor: "end",
  }));
  y += 12 + PAD;

  const height = y;
  const title = isSignificant
    ? `Speech-to-text API ELO leaderboard: ${entries
        .map((e, i) => `${i + 1}. ${e.name} ${e.model} (${Math.round(e.rating)})`)
        .join(", ")}`
    : "Speech-to-text API ELO leaderboard: collecting votes";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="title">`,
    `<title id="title">${escapeXml(title)}</title>`,
    `<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="${RADIUS}" fill="${TOKENS.bg}" stroke="${TOKENS.border}"/>`,
    ...parts,
    `</svg>`,
  ].join("\n");
}

/** Shown when the data cannot be loaded, so the README never shows a broken image. */
export function renderLeaderboardUnavailableSvg(): string {
  const height = 120;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="title">`,
    `<title id="title">Speech-to-text API ELO leaderboard: temporarily unavailable</title>`,
    `<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="${RADIUS}" fill="${TOKENS.bg}" stroke="${TOKENS.border}"/>`,
    text(PAD, PAD + 12, "BLIND TEST · ELO LEADERBOARD", { size: 12, fill: TOKENS.accent, mono: true, spacing: "1.92" }),
    text(PAD, PAD + 12 + 16 + 18, "Live standings are temporarily unavailable.", { size: 16, fill: TOKENS.textSecondary }),
    text(PAD, PAD + 12 + 16 + 18 + 24, `See ${PUBLIC_URL_LABEL}`, { size: 12, fill: TOKENS.textTertiary }),
    `</svg>`,
  ].join("\n");
}
