"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { LeaderboardArticle } from "@/lib/leaderboard-articles";

const COLLAPSED_MAX_HEIGHT = 720;

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-transform duration-200"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ArticleCard({ article }: { article: LeaderboardArticle }) {
  const [imageError, setImageError] = useState(false);
  const showImage = article.imageUrl && !imageError;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border transition-all duration-160 hover:scale-[1.01]"
      style={{
        background: "var(--color-bg-primary)",
        borderColor: "var(--color-border-primary)",
      }}
    >
      <div
        className="relative aspect-[16/10] w-full overflow-hidden"
        style={{ background: "var(--color-bg-primary)" }}
      >
        {showImage ? (
          <Image
            src={article.imageUrl!}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "var(--color-bg-secondary)" }}
          />
        )}

        <span
          className="absolute right-3 top-3 rounded-[var(--radius-full)] border p-2 opacity-0 transition-opacity duration-160 group-hover:opacity-100"
          style={{
            background: "rgba(0, 0, 0, 0.72)",
            borderColor: "var(--color-border-transparent)",
            color: "var(--color-text-secondary)",
          }}
        >
          <ExternalLinkIcon />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3
          className="text-base font-medium leading-snug"
          style={{ color: "var(--color-text-primary)" }}
        >
          {article.title}
        </h3>

        {article.description && (
          <p
            className="line-clamp-2 flex-1 text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {article.description}
          </p>
        )}

      </div>
    </a>
  );
}

export function LeaderboardArticlesSection({
  articles,
}: {
  articles: LeaderboardArticle[];
}) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);

  if (articles.length === 0) return null;

  const canExpand = articles.length > 3;

  return (
    <section
      className="mt-16 border-t pt-12"
      style={{ borderColor: "var(--color-border-tertiary)" }}
      aria-label="Recommended reading"
    >
      <div className="mb-8 flex flex-col gap-3">
        <span
          className="font-mono text-xs uppercase tracking-[0.16em]"
          style={{ color: "var(--color-text-brand)" }}
        >
          Explore further
        </span>
        <h2
          className="type-section-title text-2xl md:text-3xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          Recommended reading
        </h2>
        <p
          className="max-w-2xl text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          More comparisons and deep dives from across the industry to help you
          choose the right STT API.
        </p>
      </div>

      <div className="relative">
        <div
          id={panelId}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          style={
            !expanded && canExpand
              ? {
                  maxHeight: COLLAPSED_MAX_HEIGHT,
                  overflow: "hidden",
                }
              : undefined
          }
        >
          {articles.map((article) => (
            <ArticleCard key={article.url} article={article} />
          ))}
        </div>

        {!expanded && canExpand && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center"
            aria-hidden="true"
          >
            <div
              className="h-28 w-full"
              style={{
                background:
                  "linear-gradient(to top, var(--color-bg-primary) 35%, transparent)",
              }}
            />
          </div>
        )}

        {canExpand && (
          <div
            className={
              expanded
                ? "mt-6 flex justify-center"
                : "absolute inset-x-0 bottom-0 flex justify-center pb-1"
            }
          >
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border px-5 py-2.5 text-sm font-medium transition-all duration-160 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--color-bg-primary)",
                color: "var(--color-text-secondary)",
                borderColor: "var(--color-border-secondary)",
              }}
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show less" : "Show more"}
              <ChevronIcon open={expanded} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
