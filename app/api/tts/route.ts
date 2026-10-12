import { NextRequest } from "next/server";

/**
 * Pip's AI voice. GET /api/tts?t=<text>&s=<speed>
 *
 * Uses whichever key is set in the Vercel project:
 *   ELEVENLABS_API_KEY  (+ optional ELEVENLABS_VOICE_ID)   most human-sounding
 *   OPENAI_API_KEY      (+ optional OPENAI_TTS_VOICE)      gpt-4o-mini-tts with acting directions
 *
 * Responses are cached by Vercel's CDN for a year, so each phrase is only ever generated once.
 * With no key set it returns 503 and the app falls back to the device voice.
 */

export const runtime = "nodejs";

const DIRECTIONS =
  "You are Pip, a friendly owl in a learning game for a four-year-old girl. Speak like a warm, gentle, cheerful " +
  "preschool teacher: smiling, soft, clear and unhurried, with natural kid-show enthusiasm. Never robotic, never shouty. " +
  "When saying a letter sound like 'buh' or 'mmm', say just the sound, short and clear.";

const MAX_LEN = 320;

export async function GET(req: NextRequest) {
  const text = (req.nextUrl.searchParams.get("t") ?? "").trim();
  const speed = Math.min(1.2, Math.max(0.7, Number(req.nextUrl.searchParams.get("s")) || 1));
  if (!text || text.length > MAX_LEN) return new Response("bad text", { status: 400 });

  const eleven = process.env.ELEVENLABS_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  if (!eleven && !openai) return new Response("no voice key configured", { status: 503 });

  try {
    let upstream: Response;
    if (eleven) {
      // Default voice: "Sarah", a soft, young, friendly voice from ElevenLabs' premade set.
      const voiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
      upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": eleven, "content-type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({
          text,
          model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true, speed },
        }),
      });
    } else {
      upstream = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { authorization: `Bearer ${openai}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
          voice: process.env.OPENAI_TTS_VOICE || "coral",
          input: text,
          instructions: DIRECTIONS,
          speed,
          response_format: "mp3",
        }),
      });
    }
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("tts upstream error", upstream.status, detail.slice(0, 300));
      return new Response("voice service error", { status: 502 });
    }
    const audio = await upstream.arrayBuffer();
    return new Response(audio, {
      headers: {
        "content-type": "audio/mpeg",
        // Same text + speed = same audio forever; let the CDN and the browser keep it.
        "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("tts failed", e);
    return new Response("voice service unreachable", { status: 502 });
  }
}
