import http from "http";
import type { AddressInfo } from "net";
import { transcribeWithOruk } from "./src/lib/providers/oruk";
import { transcribeForProvider } from "./src/lib/transcribe";
import { getProviderBySlug } from "./src/lib/providers";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
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

async function withMockServer(
  handler: (req: http.IncomingMessage, body: Buffer, res: http.ServerResponse) => void,
  fn: (baseUrl: string) => Promise<void>
) {
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => handler(req, Buffer.concat(chunks), res));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await fn(`http://127.0.0.1:${port}/v1`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function main() {
  console.log("\nOruk provider tests\n" + "=".repeat(60));

  const origKey = process.env.ORUK_API_KEY;
  const origBase = process.env.ORUK_API_BASE_URL;

  try {
    await test("registers oruk in PROVIDERS metadata", () => {
      const def = getProviderBySlug("oruk");
      assert(def !== undefined, "oruk provider definition missing");
      assert(def!.name === "Oruk", `unexpected name: ${def!.name}`);
      assert(def!.model === "Fourier 2B", `unexpected model: ${def!.model}`);
      assert(def!.logoUrl === "/providers/oruk.svg", `unexpected logoUrl: ${def!.logoUrl}`);
    });

    await test("fails cleanly when ORUK_API_KEY is missing", async () => {
      delete process.env.ORUK_API_KEY;
      const result = await transcribeForProvider("oruk", Buffer.from("RIFF"), "audio/wav");
      assert(result.transcript === "", "expected empty transcript");
      assert(
        result.error === "Provider API key is not configured",
        `unexpected sanitized error: ${result.error}`
      );
    });

    await test("sends multipart audio upload and parses JSON transcript", async () => {
      let seenPath = "";
      let seenAuth = "";
      let seenContentType = "";
      let seenBody = "";

      await withMockServer(
        (req, body, res) => {
          seenPath = req.url || "";
          seenAuth = req.headers.authorization || "";
          seenContentType = req.headers["content-type"] || "";
          seenBody = body.toString("utf8");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ text: "  Hello from Fourier 2B.  " }));
        },
        async (baseUrl) => {
          process.env.ORUK_API_KEY = "test-oruk-key";
          process.env.ORUK_API_BASE_URL = baseUrl;

          const result = await transcribeWithOruk(Buffer.from("FAKEWAV"), "audio/wav");
          assert(seenPath === "/v1/audio/transcriptions", `unexpected path: ${seenPath}`);
          assert(seenAuth === "Bearer test-oruk-key", `unexpected auth header: ${seenAuth}`);
          assert(
            seenContentType.includes("multipart/form-data"),
            `expected multipart/form-data, got: ${seenContentType}`
          );
          assert(seenBody.includes('name="model"') && seenBody.includes("oruk-fourier-2b"), "missing model field");
          assert(seenBody.includes('name="language"') && seenBody.includes("en"), "missing language field");
          assert(seenBody.includes('filename="audio.wav"'), "missing audio.wav filename");
          assert(result.transcript === "Hello from Fourier 2B.", `unexpected transcript: ${result.transcript}`);
          assert(Array.isArray(result.words) && result.words.length === 0, "expected empty words array");
          assert(result.durationMs >= 0, "expected non-negative durationMs");
        }
      );
    });

    await test("sanitizes provider name on HTTP 400 error without retrying", async () => {
      let attempts = 0;
      await withMockServer(
        (_req, _body, res) => {
          attempts++;
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: "Oruk rejected invalid audio" } }));
        },
        async (baseUrl) => {
          process.env.ORUK_API_KEY = "test-oruk-key";
          process.env.ORUK_API_BASE_URL = baseUrl;

          const result = await transcribeForProvider("oruk", Buffer.from("BAD"), "audio/webm");
          assert(attempts === 1, `expected 1 attempt for HTTP 400, got ${attempts}`);
          assert(result.transcript === "", "expected empty transcript on error");
          assert(result.error !== undefined && !/oruk/i.test(result.error), `provider name leaked: ${result.error}`);
        }
      );
    });
  } finally {
    if (origKey === undefined) delete process.env.ORUK_API_KEY;
    else process.env.ORUK_API_KEY = origKey;
    if (origBase === undefined) delete process.env.ORUK_API_BASE_URL;
    else process.env.ORUK_API_BASE_URL = origBase;
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main();
