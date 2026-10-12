# Alina's Play Time

Learning games for a four-year-old who is just starting to read. Every instruction is spoken out loud, so no reading is needed.

## Games

- **Balloons**: "Pop the blue balloon!" Teaches colors.
- **Counting**: tap each thing to count out loud, then pick the number. Numbers show dots too, so she can match by counting. Goes up to 10 as she earns stars.
- **Letters**: "B says buh. Which one starts with buh?" Beginning sounds for pre-reading. The first letter of her name shows up extra often.
- **Shapes**: "Find the triangle!" Diamond, rectangle and oval unlock after 20 stars.

Each right answer earns a star, confetti and a cheer. The 🔊 bubble repeats the question.

## For grown-ups

- Press and hold the ⚙️ button on the home screen for about a second to change her name or reset stars. A quick tap just says "Ask a grown-up."
- Turn the volume up; the app talks.
- On an iPad or Android tablet, open the site and use **Add to Home Screen** so it opens full-screen like an app.
- Name and stars are saved on that device only (localStorage). No accounts, no backend.

## Development

```bash
npm install
npm run dev
```

Next.js 15 (App Router) + React 19. No external services. Voice uses the browser's built-in speech; sound effects are synthesized with Web Audio, so there are no audio files.

```
app/            layout, page, manifest and generated icons
components/     Playtime.tsx (home screen, stars, cheers) and games/
lib/            voice, sound effects, confetti, helpers
```

Deploys to Vercel with no configuration.
