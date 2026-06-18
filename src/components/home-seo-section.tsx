import Link from "next/link";

export function HomeSeoSection() {
  return (
    <section
      className="mx-auto max-w-2xl px-6 pb-16 pt-8"
      aria-label="About Compare STT"
    >
      <div
        className="flex flex-col gap-6 border-t pt-12 text-base leading-relaxed"
        style={{
          borderColor: "var(--color-border-tertiary)",
          color: "var(--color-text-secondary)",
        }}
      >
        <h2
          className="type-section-title text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          About Compare STT
        </h2>
        <p>
          Compare STT is a free, open benchmarking tool for evaluating
          speech-to-text (STT) APIs through blind, head-to-head comparisons.
          Instead of relying on vendor-published Word Error Rate (WER) numbers,
          which are often measured on curated datasets that don&apos;t reflect
          real-world audio, Compare STT lets anyone upload or record an audio
          file and see transcriptions from multiple providers side by side,
          without knowing which provider produced which output until after they
          vote.
        </p>

        <h2
          className="type-section-title text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          How it works
        </h2>
        <p>
          Each comparison runs the same audio file through several STT providers
          in parallel. Transcription results are displayed anonymously, and the
          user selects the one they judge most accurate. Votes feed into an ELO
          rating system (the same statistical model used in chess and in LLM
          benchmarks like LMArena) which produces a relative skill score for
          each provider based on how often it wins, loses, or ties against the
          others. Providers compete across diverse audio: clean studio speech,
          noisy environments, accented English, multilingual content, and
          domain-specific vocabulary.{" "}
          <Link
            href="/methodology"
            className="underline"
            style={{ color: "var(--color-text-brand)" }}
          >
            Read the full methodology
          </Link>
          .
        </p>

        <h2
          className="type-section-title text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          Providers compared
        </h2>
        <p>
          The current leaderboard includes six commercial speech-to-text APIs:
          Gladia (Solaria model), ElevenLabs (Scribe v2), Speechmatics
          (Enhanced), AssemblyAI (Universal-3 Pro), Mistral AI (Voxtral Mini),
          and Deepgram (Nova 3). New providers and model versions are added as
          they reach general availability.
        </p>

        <h2
          className="type-section-title text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          What the leaderboard shows
        </h2>
        <p>
          STT accuracy is highly context-dependent — a model that excels at clean
          conference-call audio may struggle with phone-quality recordings,
          regional accents, or technical jargon. Vendor benchmarks rarely capture
          this variance. By aggregating thousands of blind human judgments across
          heterogeneous audio, Compare STT produces a community-driven ranking
          that reflects practical, real-world performance rather than
          ideal-condition scores. The full leaderboard with current ELO ratings
          is available on the{" "}
          <Link
            href="/leaderboard"
            className="underline"
            style={{ color: "var(--color-text-brand)" }}
          >
            live leaderboard
          </Link>
          . Compare STT is sponsored by Gladia.
        </p>
      </div>
    </section>
  );
}
