import { accountVoices, defaultVoiceId } from "@/lib/elevenVoices";

/** The AI voices grown-ups can choose from in settings: everything in the ElevenLabs account. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.ELEVENLABS_API_KEY) return Response.json({ provider: process.env.OPENAI_API_KEY ? "openai" : "none", voices: [] });
  const voices = await accountVoices();
  return Response.json(
    { provider: "elevenlabs", default: defaultVoiceId(), voices },
    { headers: { "cache-control": "private, max-age=60" } },
  );
}
