import { accountVoices, defaultVoiceId, voiceSource } from "@/lib/elevenVoices";

/** The AI voices grown-ups can choose from in settings: the "Alina App" collection in ElevenLabs. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.ELEVENLABS_API_KEY) return Response.json({ provider: process.env.OPENAI_API_KEY ? "openai" : "none", voices: [] });
  const voices = await accountVoices();
  const def = voices.some((v) => v.id === defaultVoiceId()) ? defaultVoiceId() : voices[0]?.id;
  return Response.json(
    { provider: "elevenlabs", source: voiceSource(), default: def, voices },
    { headers: { "cache-control": "private, max-age=60" } },
  );
}
