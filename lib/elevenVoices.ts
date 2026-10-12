// Server-only: the voices grown-ups can pick for Pip, cached for 10 minutes.
// Comes from the ElevenLabs collection named in ELEVENLABS_COLLECTION (default "Alina App"),
// so the family controls the list by adding or removing voices in that collection.
// Used by /api/voices (the dropdown) and /api/tts (only these voices may be used).

export type AccountVoice = { id: string; name: string; group: "mine" | "elevenlabs"; description?: string };

type ApiVoice = { voice_id: string; name: string; category?: string; labels?: Record<string, string> };

let cache: { at: number; voices: AccountVoice[]; source: string } | null = null;

const API = "https://api.elevenlabs.io";

function toVoice(v: ApiVoice): AccountVoice {
  return {
    id: v.voice_id,
    name: v.name.trim(),
    group: "mine",
    description: [v.labels?.accent, v.labels?.age, v.labels?.gender, v.labels?.description ?? v.labels?.descriptive]
      .filter(Boolean)
      .join(", "),
  };
}

async function get<T>(path: string, key: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { "xi-api-key": key }, cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

async function collectionVoices(key: string): Promise<AccountVoice[] | null> {
  let id = process.env.ELEVENLABS_COLLECTION_ID;
  if (!id) {
    const title = (process.env.ELEVENLABS_COLLECTION || "Alina App").trim().toLowerCase();
    const { collections } = await get<{ collections: { collection_id: string; title: string }[] }>("/v1/voices/collections", key);
    id = collections.find((c) => c.title.trim().toLowerCase() === title)?.collection_id;
    if (!id) {
      console.error(`ElevenLabs collection "${title}" not found; found: ${collections.map((c) => c.title).join(", ")}`);
      return null;
    }
  }
  const out: AccountVoice[] = [];
  let token: string | null | undefined;
  for (let page = 0; page < 5; page++) {
    const q = new URLSearchParams({ collection_id: id, page_size: "100", include_total_count: "false" });
    if (token) q.set("next_page_token", token);
    const data = await get<{ voices: ApiVoice[]; has_more: boolean; next_page_token?: string | null }>(`/v2/voices?${q}`, key);
    out.push(...data.voices.map(toVoice));
    if (!data.has_more || !data.next_page_token) break;
    token = data.next_page_token;
  }
  return out;
}

export async function accountVoices(): Promise<AccountVoice[]> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return [];
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.voices;
  let voices: AccountVoice[] = [];
  let source = "collection";
  try {
    const fromCollection = await collectionVoices(key);
    if (fromCollection && fromCollection.length) voices = fromCollection;
    else throw new Error("collection empty or missing");
  } catch (e) {
    // Can't read the collection: offer only the default voice rather than everything in the account.
    console.error("reading the ElevenLabs collection failed", e);
    source = "default-only";
    voices = [{ id: defaultVoiceId(), name: "Pip's voice", group: "mine" }];
  }
  const seen = new Set<string>();
  voices = voices.filter((v) => !seen.has(v.id) && seen.add(v.id));
  voices.sort((a, b) => a.name.localeCompare(b.name));
  cache = { at: Date.now(), voices, source };
  return voices;
}

export function voiceSource() {
  return cache?.source ?? "unknown";
}

export function defaultVoiceId() {
  return process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
}
