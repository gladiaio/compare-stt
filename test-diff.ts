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

test("case differences are ignored", () => {
  const { segmentsA } = computeWordDiff("Hello World", "hello world");
  assert(segmentsA.every((s) => s.type === "same"), `A: ${JSON.stringify(segmentsA)}`);
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

console.log("=".repeat(60));
console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
