export interface ProviderDef {
  name: string;
  slug: string;
  logoUrl: string;
  color: string;
  model: string;
}

export const PROVIDERS: ProviderDef[] = [
  { name: "Gladia", slug: "gladia", logoUrl: "/providers/gladia.svg", color: "#947AFC", model: "Solaria" },
  { name: "ElevenLabs", slug: "elevenlabs", logoUrl: "/providers/elevenlabs.svg", color: "#FFFFFF", model: "Scribe v2" },
  { name: "Deepgram", slug: "deepgram", logoUrl: "/providers/deepgram.svg", color: "#13EF93", model: "Nova 3" },
  { name: "AssemblyAI", slug: "assemblyai", logoUrl: "/providers/assemblyai.svg", color: "#0055FF", model: "Universal-3 Pro" },
  { name: "Speechmatics", slug: "speechmatics", logoUrl: "/providers/speechmatics.svg", color: "#FF3D00", model: "Enhanced" },
  { name: "Mistral", slug: "mistral", logoUrl: "/providers/mistral.svg", color: "#FF7000", model: "Voxtral Mini" },
];

export function getProviderBySlug(slug: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.slug === slug);
}
