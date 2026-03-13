import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Privacy | STT Arena",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm transition-colors duration-160"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        &larr; Back to Arena
      </Link>

      <h1
        className="mb-2 text-3xl font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        Terms &amp; Privacy
      </h1>
      <p className="mb-10 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
        Last updated: March 2026
      </p>

      <div className="flex flex-col gap-10">
        <Section title="What is STT Arena?">
          <p>
            STT Arena is a free, non-commercial tool sponsored by{" "}
            <a href="https://gladia.io" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-text-brand)" }}>
              Gladia
            </a>{" "}
            to give visibility into the current state of speech-to-text
            technology. You record or upload audio, two providers transcribe it
            blindly, and you vote for the better result. Votes feed into a public
            ELO-based leaderboard. This project is not a commercial product and
            generates no revenue.
          </p>
        </Section>

        <Section title="Audio data & third-party providers">
          <p>
            When you submit audio, it is sent in real time to two randomly
            selected third-party speech-to-text providers for transcription.{" "}
            <strong>Gladia does not store your audio files.</strong> However,
            once your audio is transmitted to a provider, it is processed under
            that provider&apos;s own terms and privacy policy. Gladia has no
            control over how third-party providers handle, store, or process your
            audio data. Please review their terms:
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 pl-4" style={{ listStyleType: "disc" }}>
            <ProviderLink name="Gladia" href="https://www.gladia.io/legal/terms-of-use" />
            <ProviderLink name="Deepgram" href="https://deepgram.com/terms" />
            <ProviderLink name="AssemblyAI" href="https://www.assemblyai.com/terms" />
            <ProviderLink name="ElevenLabs" href="https://elevenlabs.io/terms-of-service" />
            <ProviderLink name="Speechmatics" href="https://www.speechmatics.com/terms-and-conditions" />
          </ul>
          <p className="mt-3">
            <strong>
              Do not upload audio that contains sensitive, confidential, or
              personally identifiable information.
            </strong>{" "}
            You are solely responsible for the content you submit and for
            ensuring you have the right to share it.
          </p>
        </Section>

        <Section title="Votes & leaderboard">
          <p>
            Votes are anonymous — we do not require an account or collect any
            personal identifiers. A random session ID is stored in your
            browser&apos;s local storage to group votes within a session. By
            voting, you agree that your votes become the property of Gladia and
            may be used to compute and publish leaderboard rankings.
          </p>
        </Section>

        <Section title="Cookies & local storage">
          <p>
            STT Arena does not use cookies or third-party analytics. A single
            local storage entry
            (<code className="text-xs" style={{ color: "var(--color-text-brand)" }}>stt-arena-session</code>)
            holds your anonymous session ID. No tracking scripts are loaded.
          </p>
        </Section>

        <Section title="Trademarks">
          <p>
            Provider names and logos displayed on this site (Deepgram, AssemblyAI,
            ElevenLabs, Speechmatics) are trademarks of their respective owners.
            Their use here is strictly for identification purposes in the context
            of a comparative, non-commercial benchmark. Gladia is not affiliated
            with, endorsed by, or sponsored by any of these companies.
          </p>
        </Section>

        <Section title="Disclaimer & limitation of liability">
          <p>
            STT Arena is provided <strong>&ldquo;as is&rdquo; and &ldquo;as
            available&rdquo;</strong> without warranty of any kind, express or
            implied, including but not limited to the warranties of
            merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
          <p className="mt-3">
            Gladia shall not be held liable for any direct, indirect, incidental,
            special, consequential, or exemplary damages arising from or related
            to the use of this service, including but not limited to: the
            processing of audio by third-party providers, the accuracy or
            inaccuracy of any transcription, the availability of the service, or
            any decision made based on leaderboard rankings.
          </p>
          <p className="mt-3">
            Leaderboard rankings reflect community votes only and do not
            constitute an objective, scientific, or endorsed measure of
            transcription quality. Use them at your own discretion.
          </p>
          <p className="mt-3">
            By using STT Arena, you acknowledge and accept these terms in full.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For questions about this policy or to exercise your rights under GDPR,
            contact us at{" "}
            <a href="mailto:privacy@gladia.io" className="underline" style={{ color: "var(--color-text-brand)" }}>
              privacy@gladia.io
            </a>.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="mb-3 text-lg font-semibold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h2>
      <div
        className="text-sm leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {children}
      </div>
    </section>
  );
}

function ProviderLink({ name, href }: { name: string; href: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
        style={{ color: "var(--color-text-brand)" }}
      >
        {name} Terms
      </a>
    </li>
  );
}
