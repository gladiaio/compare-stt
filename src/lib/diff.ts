export interface DiffSegment {
  text: string;
  type: "same" | "diff";
}

/**
 * Word-level diff between two strings.
 * Returns two arrays of segments, one per side, marking which words differ.
 * Also returns per-word diff index sets for alignment with word timestamp arrays.
 */
export function computeWordDiff(
  a: string,
  b: string
): {
  segmentsA: DiffSegment[];
  segmentsB: DiffSegment[];
  diffIndicesA: Set<number>;
  diffIndicesB: Set<number>;
} {
  const wordsA = tokenize(a);
  const wordsB = tokenize(b);

  const lcs = longestCommonSubsequence(wordsA, wordsB);

  return {
    segmentsA: buildSegments(wordsA, lcs, "a"),
    segmentsB: buildSegments(wordsB, lcs, "b"),
    diffIndicesA: buildDiffWordIndices(wordsA, lcs, "a"),
    diffIndicesB: buildDiffWordIndices(wordsB, lcs, "b"),
  };
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

function normalizeWord(w: string): string {
  return w;
}

interface LCSEntry {
  indexA: number;
  indexB: number;
}

function longestCommonSubsequence(a: string[], b: string[]): LCSEntry[] {
  const wordsA = a.filter((w) => w.trim());
  const wordsB = b.filter((w) => w.trim());

  const idxA = a.map((w, i) => (w.trim() ? i : -1)).filter((i) => i >= 0);
  const idxB = b.map((w, i) => (w.trim() ? i : -1)).filter((i) => i >= 0);

  const m = wordsA.length;
  const n = wordsB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalizeWord(wordsA[i - 1]) === normalizeWord(wordsB[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: LCSEntry[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (normalizeWord(wordsA[i - 1]) === normalizeWord(wordsB[j - 1])) {
      result.unshift({ indexA: idxA[i - 1], indexB: idxB[j - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

function buildDiffWordIndices(
  tokens: string[],
  lcs: LCSEntry[],
  side: "a" | "b"
): Set<number> {
  const matchedTokenIndices = new Set(lcs.map((e) => (side === "a" ? e.indexA : e.indexB)));
  const diffWordIndices = new Set<number>();
  let wordIdx = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].trim()) continue;
    if (!matchedTokenIndices.has(i)) diffWordIndices.add(wordIdx);
    wordIdx++;
  }
  return diffWordIndices;
}

function buildSegments(
  words: string[],
  lcs: LCSEntry[],
  side: "a" | "b"
): DiffSegment[] {
  const matchedIndices = new Set(lcs.map((e) => (side === "a" ? e.indexA : e.indexB)));
  const segments: DiffSegment[] = [];

  let currentType: "same" | "diff" | null = null;
  let currentText = "";

  for (let i = 0; i < words.length; i++) {
    const isWhitespace = !words[i].trim();
    const isSame = matchedIndices.has(i);

    if (isWhitespace) {
      currentText += words[i];
      continue;
    }

    const type = isSame ? "same" : "diff";
    if (type !== currentType && currentText) {
      segments.push({ text: currentText, type: currentType ?? "same" });
      currentText = "";
    }
    currentType = type;
    currentText += words[i];
  }

  if (currentText) {
    segments.push({ text: currentText, type: currentType ?? "same" });
  }

  return segments;
}
