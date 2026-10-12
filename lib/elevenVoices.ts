// Server-only: the voices in the ElevenLabs account, cached for 10 minutes.
// Used by /api/voices (the dropdown) and /api/tts (only these voices may be used).

export type AccountVoice = { id: string; name: string; group: "mine" | "elevenlabs"; description?: string };

let cache: { at: number; voices: AccountVoice[] } | null = null;

export async function accountVoices(): Promise<AccountVoice[]> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return [];
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.voices;
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } });
    if (!res.ok) throw new Error(`voices ${res.status}`);
    const data = (await res.json()) as {
      voices: { voice_id: string; name: string; category?: string; labels?: Record<string, string>; description?: string }[];
    };
    const voices = data.voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      group: (v.category === "premade" ? "elevenlabs" : "mine") as AccountVoice["group"],
      description: [v.labels?.accent, v.labels?.age, v.labels?.gender, v.labels?.description ?? v.labels?.descriptive]
        .filter(Boolean)
        .join(", "),
    }));
    voices.sort((a, b) => (a.group === b.group ? a.name.localeCompare(b.name) : a.group === "mine" ? -1 : 1));
    cache = { at: Date.now(), voices };
    return voices;
  } catch (e) {
    // The key may not have permission to list voices. Fall back to the ones set in Vercel.
    console.error("listing ElevenLabs voices failed", e);
    const fallback = [process.env.ELEVENLABS_VOICE_ID, ...(process.env.ELEVENLABS_VOICES ?? "").split(",")]
      .map((s) => s?.trim())
      .filter((s): s is string => !!s)
      .map((entry, i) => {
        const [name, id] = entry.includes(":") ? entry.split(":") : [`Voice ${i + 1}`, entry];
        return { id: id.trim(), name: name.trim(), group: "mine" as const };
      });
    cache = { at: Date.now(), voices: fallback };
    return fallback;
  }
}

export function defaultVoiceId() {
  return process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
}
