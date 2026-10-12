import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Not secret: tells the app which AI voice is set, so cached audio is per voice.
    // Changing ELEVENLABS_VOICE_ID (and redeploying) gives every line the new voice.
    NEXT_PUBLIC_TTS_VOICE: process.env.ELEVENLABS_VOICE_ID || process.env.OPENAI_TTS_VOICE || "default",
  },
};

export default nextConfig;
