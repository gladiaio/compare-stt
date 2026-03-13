import { computeWordDiff } from "./src/lib/diff";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ ${name}`);
    console.log(`    ${msg}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function getTypes(segments: { type: string }[]) {
  return segments.map((s) => s.type);
}

function getTexts(segments: { text: string }[]) {
  return segments.map((s) => s.text.trim());
}

console.log("\nDiff tests\n" + "=".repeat(60));

test("identical strings produce all 'same'", () => {
  const { segmentsA, segmentsB } = computeWordDiff("hello world", "hello world");
  assert(segmentsA.every((s) => s.type === "same"), `A: ${JSON.stringify(segmentsA)}`);
  assert(segmentsB.every((s) => s.type === "same"), `B: ${JSON.stringify(segmentsB)}`);
});

test("completely different strings produce all 'diff'", () => {
  const { segmentsA, segmentsB } = computeWordDiff("hello world", "foo bar");
  assert(segmentsA.every((s) => s.type === "diff"), `A: ${JSON.stringify(segmentsA)}`);
  assert(segmentsB.every((s) => s.type === "diff"), `B: ${JSON.stringify(segmentsB)}`);
});

test("case differences are detected", () => {
  const { segmentsA, segmentsB } = computeWordDiff("Hello World", "hello world");
  assert(segmentsA.every((s) => s.type === "diff"), `A should be diff: ${JSON.stringify(segmentsA)}`);
  assert(segmentsB.every((s) => s.type === "diff"), `B should be diff: ${JSON.stringify(segmentsB)}`);
});

test("punctuation differences are detected", () => {
  const { segmentsA, segmentsB } = computeWordDiff(
    "Hello, world.",
    "Hello world"
  );
  const typesA = getTypes(segmentsA);
  const typesB = getTypes(segmentsB);
  assert(typesA.includes("diff"), `Expected diff in A, got: ${JSON.stringify(segmentsA)}`);
  assert(typesB.includes("diff"), `Expected diff in B, got: ${JSON.stringify(segmentsB)}`);
});

test("trailing period difference is detected", () => {
  const { segmentsA } = computeWordDiff("end.", "end");
  const typesA = getTypes(segmentsA);
  assert(typesA.includes("diff"), `Expected diff for 'end.' vs 'end', got: ${JSON.stringify(segmentsA)}`);
});

test("one word different in the middle", () => {
  const { segmentsA, segmentsB } = computeWordDiff(
    "the quick brown fox",
    "the slow brown fox"
  );
  const textsA = getTexts(segmentsA);
  const textsB = getTexts(segmentsB);
  assert(textsA.includes("quick"), `A should contain 'quick': ${JSON.stringify(segmentsA)}`);
  assert(textsB.includes("slow"), `B should contain 'slow': ${JSON.stringify(segmentsB)}`);
  const quickSeg = segmentsA.find((s) => s.text.trim() === "quick");
  const slowSeg = segmentsB.find((s) => s.text.trim() === "slow");
  assert(quickSeg?.type === "diff", `'quick' should be diff: ${JSON.stringify(quickSeg)}`);
  assert(slowSeg?.type === "diff", `'slow' should be diff: ${JSON.stringify(slowSeg)}`);
});

test("extra words at end are marked as diff", () => {
  const { segmentsB } = computeWordDiff("hello", "hello world");
  const lastSeg = segmentsB[segmentsB.length - 1];
  assert(lastSeg.text.trim() === "world", `Last should be 'world': ${JSON.stringify(segmentsB)}`);
  assert(lastSeg.type === "diff", `'world' should be diff: ${JSON.stringify(lastSeg)}`);
});

test("empty vs non-empty", () => {
  const { segmentsA, segmentsB } = computeWordDiff("", "hello");
  assert(segmentsA.length === 0, `A should be empty: ${JSON.stringify(segmentsA)}`);
  assert(segmentsB.length > 0, `B should have content: ${JSON.stringify(segmentsB)}`);
  assert(segmentsB[0].type === "diff", `B should be diff: ${JSON.stringify(segmentsB)}`);
});

test("real-world: comma and period differences", () => {
  const { segmentsA } = computeWordDiff(
    "So I was thinking, we could try.",
    "So I was thinking we could try"
  );
  const diffTexts = segmentsA.filter((s) => s.type === "diff").map((s) => s.text.trim());
  assert(
    diffTexts.some((t) => t.includes("thinking,") || t.includes("try.")),
    `Expected punctuation diffs in A, got diffs: ${JSON.stringify(diffTexts)}, all: ${JSON.stringify(segmentsA)}`
  );
});

test("real-world: capitalization differences", () => {
  const a = "let me know when you have a chance to look at this no rush but i would appreciate your feedback";
  const b = "Let me know when you have a chance to look at this No rush but I would appreciate your feedback";
  const { segmentsA, segmentsB } = computeWordDiff(a, b);
  const diffA = segmentsA.filter((s) => s.type === "diff").map((s) => s.text.trim());
  const diffB = segmentsB.filter((s) => s.type === "diff").map((s) => s.text.trim());
  assert(diffA.includes("let"), `A should diff 'let': ${JSON.stringify(diffA)}`);
  assert(diffB.includes("Let"), `B should diff 'Let': ${JSON.stringify(diffB)}`);
  assert(diffA.includes("no"), `A should diff 'no': ${JSON.stringify(diffA)}`);
  assert(diffB.includes("No"), `B should diff 'No': ${JSON.stringify(diffB)}`);
});

test("real-world: subtle comma and period at end", () => {
  const a = "I remember seeing an error message about this yesterday but I cannot recall what it said exactly.";
  const b = "I remember seeing an error message about this yesterday, but I cannot recall what it said exactly";
  const { segmentsA, segmentsB } = computeWordDiff(a, b);
  const diffA = segmentsA.filter((s) => s.type === "diff").map((s) => s.text.trim());
  const diffB = segmentsB.filter((s) => s.type === "diff").map((s) => s.text.trim());
  assert(diffA.includes("yesterday"), `A should diff 'yesterday': ${JSON.stringify(diffA)}`);
  assert(diffA.includes("exactly."), `A should diff 'exactly.': ${JSON.stringify(diffA)}`);
  assert(diffB.includes("yesterday,"), `B should diff 'yesterday,': ${JSON.stringify(diffB)}`);
  assert(diffB.includes("exactly"), `B should diff 'exactly': ${JSON.stringify(diffB)}`);
});

test("diffIndices match expected word positions", () => {
  const a = "hold on let me check something real quick i remember seeing an error message about this yesterday but i cannot recall what it said exactly";
  const b = "Hold on, let me check something real quick. I remember seeing an error message about this yesterday, but I cannot recall what it said exactly";
  const { diffIndicesA, diffIndicesB } = computeWordDiff(a, b);
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);

  const expectedDiffA = ["hold", "on", "quick", "i", "yesterday", "i"];
  const actualDiffA = [...diffIndicesA].map((i) => wordsA[i]);
  assert(
    expectedDiffA.every((w) => actualDiffA.includes(w)),
    `A diff words should be ${JSON.stringify(expectedDiffA)}, got ${JSON.stringify(actualDiffA)}`
  );

  const expectedDiffB = ["Hold", "on,", "quick.", "I", "yesterday,", "I"];
  const actualDiffB = [...diffIndicesB].map((i) => wordsB[i]);
  assert(
    expectedDiffB.every((w) => actualDiffB.includes(w)),
    `B diff words should be ${JSON.stringify(expectedDiffB)}, got ${JSON.stringify(actualDiffB)}`
  );

  assert(!diffIndicesA.has(2), `'let' (index 2) should NOT be diff in A`);
  assert(!diffIndicesB.has(2), `'let' (index 2) should NOT be diff in B`);
  assert(!diffIndicesA.has(wordsA.length - 1), `'exactly' should NOT be diff in A`);
  assert(!diffIndicesB.has(wordsB.length - 1), `'exactly' should NOT be diff in B`);
});

console.log("=".repeat(60));
console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
