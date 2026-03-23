import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Compare STT",
  description: "Why we built Compare STT, the blind speech-to-text benchmark.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <span
        className="mb-4 block font-mono text-xs uppercase tracking-[0.16em]"
        style={{ color: "var(--color-text-brand)" }}
      >
        About the project
      </span>

      <h1
        className="mb-6 text-3xl font-semibold tracking-tight md:text-4xl"
        style={{ color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}
      >
        Why Compare STT exists
      </h1>

      <div
        className="flex flex-col gap-6 text-base leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <p>
          Every speech-to-text provider claims to be the best. They publish
          benchmarks on cherry-picked datasets, compare against last year&apos;s
          models, and sprinkle asterisks everywhere. We&apos;ve all read those
          posts. We&apos;ve all stared at WER tables. And we&apos;ve all
          wondered: <em>how do they actually perform on my audio?</em>
        </p>

        <p>
          Compare STT was built from that frustration.
        </p>

        <p>
          Instead of trusting self-reported numbers, you test it yourself. Record
          your voice, upload a meeting snippet, drop in a podcast
          clip&mdash;whatever reflects your real use case. Two providers
          transcribe it blindly, side by side, and you decide which one got it
          right. No names. No bias. Just output.
        </p>

        <p>
          Built for exploration&mdash;not a substitute for proper evaluation. For
          rigorous analysis, see the{" "}
          <a
            href="https://github.com/gladiaio/normalization/tree/main?tab=readme-ov-file#quick-start"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--color-text-brand)" }}
          >
            benchmark methodology
          </a>
          .
        </p>

        <div
          className="my-2 rounded-[var(--radius-xl)] border p-6"
          style={{
            background: "var(--color-bg-tertiary)",
            borderColor: "var(--color-border-primary)",
          }}
        >
          <p
            className="text-sm italic leading-relaxed"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            &ldquo;The best benchmark is the one you can&apos;t game&mdash;because
            you don&apos;t know what&apos;s coming next, or who you&apos;re up
            against.&rdquo;
          </p>
        </div>

        <h2
          className="mt-4 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          How it works
        </h2>

        <ol
          className="flex flex-col gap-3 pl-5"
          style={{ listStyleType: "decimal" }}
        >
          <li>
            You submit audio (record live or upload a file, up to 2 minutes).
          </li>
          <li>
            Two providers transcribe it anonymously: &ldquo;Model A&rdquo; vs
            &ldquo;Model B&rdquo;.
          </li>
          <li>
            You pick the better transcription&mdash;or call it a tie.
          </li>
          <li>
            Identities are revealed after your vote.
          </li>
        </ol>

        <h2
          className="mt-4 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          What we don&apos;t do
        </h2>

        <ul
          className="flex flex-col gap-2 pl-5"
          style={{ listStyleType: "disc" }}
        >
          <li>We don&apos;t store your audio or transcriptions.</li>
          <li>
            We don&apos;t track you&mdash;no cookies, no accounts, no IP
            logging.
          </li>
          <li>We don&apos;t sell data (there&apos;s nothing to sell).</li>
          <li>
            We don&apos;t take money from providers to influence results.
          </li>
        </ul>

        <p>
          The only thing we keep is the vote outcome: who won, who lost, or if
          it was a tie. That&apos;s it.
        </p>

        <h2
          className="mt-4 text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Sponsored by Gladia
        </h2>

        <p>
          Compare STT is a free, open, non-commercial project sponsored by{" "}
          <a
            href="https://gladia.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--color-text-brand)" }}
          >
            Gladia
          </a>
          . Yes, Gladia is also one of the providers. No, they don&apos;t get
          special treatment. Pairings are random, comparisons are blind, and
          results are driven entirely by user input.
        </p>

        <p>
          Want to add a provider, report a bug, or just say hi?{" "}
          <a
            href="mailto:privacy@gladia.io"
            className="underline"
            style={{ color: "var(--color-text-brand)" }}
          >
            Reach out
          </a>
          .
        </p>
      </div>
    </div>
  );
}
