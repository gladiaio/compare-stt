import { renderToStaticMarkup } from "react-dom/server";
import { FAQ_ITEMS } from "./src/components/seo/about-faq";

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

function visibleText(html: string): string {
  return html
    .replace(/<\/p>\s*<p[^>]*>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

console.log("\nFAQ schema tests");
console.log("=".repeat(60));

for (const item of FAQ_ITEMS) {
  test(`schema answer matches visible text: ${item.question}`, () => {
    const visible = visibleText(renderToStaticMarkup(<>{item.content}</>));
    if (visible !== item.answer) {
      throw new Error(`\n      visible: ${visible}\n      schema:  ${item.answer}`);
    }
  });
}

console.log("=".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
