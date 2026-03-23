import type { TranscribeResult, WordTimestamp } from "../transcribe";

const GLADIA_BASE = "https://api.gladia.io/v2";

interface GladiaWord {
  word: string;
  start: number;
  end: number;
}

interface GladiaUtterance {
  text: string;
  words: GladiaWord[];
}

export async function transcribeWithGladia(
  audio: Buffer,
  mimeType: string
): Promise<TranscribeResult> {
  const apiKey = process.env.GLADIA_API_KEY;
  if (!apiKey) throw new Error("GLADIA_API_KEY not set");

  const start = Date.now();

  const ext = mimeType.includes("wav") ? "audio.wav"
    : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "audio.mp3"
    : mimeType.includes("mp4") || mimeType.includes("m4a") ? "audio.m4a"
    : mimeType.includes("ogg") ? "audio.ogg"
    : "audio.webm";

  const uploadForm = new FormData();
  uploadForm.append("audio", new Blob([new Uint8Array(audio)], { type: mimeType }), ext);

  const uploadRes = await fetch(`${GLADIA_BASE}/upload`, {
    method: "POST",
    headers: { "x-gladia-key": apiKey },
    body: uploadForm,
  });

  if (!uploadRes.ok) {
    throw new Error(`Gladia upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const { audio_url } = await uploadRes.json();

  const transcribeRes = await fetch(`${GLADIA_BASE}/pre-recorded`, {
    method: "POST",
    headers: {
      "x-gladia-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audio_url }),
  });

  if (!transcribeRes.ok) {
    throw new Error(`Gladia transcribe failed: ${transcribeRes.status} ${await transcribeRes.text()}`);
  }

  const { result_url } = await transcribeRes.json();

  const { transcript, words } = await pollForResult(result_url, apiKey);
  const durationMs = Date.now() - start;

  return { transcript, words, durationMs };
}

async function pollForResult(
  resultUrl: string,
  apiKey: string
): Promise<{ transcript: string; words: WordTimestamp[] }> {
  const maxAttempts = 60;
  const interval = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(resultUrl, {
      headers: { "x-gladia-key": apiKey },
    });

    if (!res.ok) {
      throw new Error(`Gladia poll failed: ${res.status}`);
    }

    const data = await res.json();

    if (data.status === "done") {
      const utterances: GladiaUtterance[] | undefined =
        data.result?.transcription?.utterances;

      if (utterances && Array.isArray(utterances)) {
        const transcript = utterances.map((u) => u.text).join(" ");
        const words: WordTimestamp[] = utterances.flatMap((u) =>
          (u.words || []).map((w) => ({
            word: w.word,
            start: w.start,
            end: w.end,
          }))
        );
        return { transcript, words };
      }

      const fullTranscript = data.result?.transcription?.full_transcript;
      return { transcript: fullTranscript || "", words: [] };
    }

    if (data.status === "error") {
      throw new Error(`Gladia transcription error: ${JSON.stringify(data)}`);
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error("Gladia transcription timed out");
}
