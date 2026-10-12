# Alina's Play Time

Learning games for a four-year-old who is just starting to read. Every instruction is spoken out loud, so no reading is needed.

## Who's playing?

The app opens on a "Who's playing?" screen. Each girl has her own name, stars and levels.

### Alina's Big Games (twilight theme, they level up)

Three right answers in a row moves a game up a level. Dots on each game door show the level.

| Game | What she does | How it gets harder |
|---|---|---|
| **Memory** | Flip cards to find matching pairs | 6, 8, 12, then 16 cards |
| **Copy Me** | Watch the colors light up, then copy them | Sequence gets longer and faster every round |
| **Spell It** | Tap letter tiles to spell the picture | 3-letter words with hints, then 4 letters, then 5, with extra decoy tiles |
| **Math** | Count the groups and pick the answer | Add to 5, add to 10, take away (birds fly off), then mixed |
| **Patterns** | "What comes next?" | AB, then AAB/ABC, then ABB/AABB, then ABCD |
| **Odd One Out** | "Which one doesn't belong?" | 4 items, then 5, then look-alikes (fruit vs. treats, pets vs. sea animals) |

### Little sister's games (simple, no levels)

- **Balloons**: "Pop the blue balloon!" Colors.
- **Counting**: tap to count out loud, then pick the number.
- **Letters**: "B says buh. Which one starts with buh?"
- **Shapes**: "Find the triangle!"

Every instruction is spoken, the 🔊 bubble repeats it, and right answers get confetti and a star.

## For grown-ups

- On the "Who's playing?" screen, press and hold the ⚙️ button for about a second to set both names or reset stars and levels.
- Turn the volume up; the app talks.
- On a tablet, use **Add to Home Screen** so it opens full-screen like an app.
- Names, stars and levels are saved on that device only (localStorage). No accounts, no backend.

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
