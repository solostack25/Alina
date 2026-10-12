# Alina's Play Time

Learning games for a four-year-old who is just starting to read. Every instruction is spoken out loud, so no reading is needed.

## Who's playing?

The app opens on a "Who's playing?" screen. Each girl has her own name, stars, stickers and levels. **Pip**, a little owl, is the guide: he talks, blinks and flaps while the app speaks.

### For both girls

- **Super Catch**: each girl is a superhero (from the family's illustration in `public/heroes`). She drags her hero along the bottom to catch the falling stars or hearts Pip calls out. Liyana catches colors; Alina levels up from colors to numbers to letter sounds.
- **Space Bots**: build a robot in the workshop (head, body, legs, tool, color), then fly it to a planet. Each planet needs the right tool: dig for crystals on Sandy Moon (shovel), pick up only the metal things on Metal Planet (magnet), and smash rocks to free space friends on Rocky Planet (hammer). Every mission earns a new robot part. Alina levels up: colors, then counting, then numbers.
- **Super Letter Race**: she drives a go-kart (her own face in a racing helmet; purple and gold with a star for Alina, pink with a heart for Liyana) down a track; Pip calls a letter and she taps a lane to fly through the right letter gate (speed boost when right). Eight gates to the finish and a trophy. Liyana: 2 lanes, capital letters. Alina levels up: capitals, lowercase (with b/d/p/q look-alikes), letter sounds, then first letters of pictures.
- **Hero celebrations**: every right answer, her superhero swoops in with a burst of stars (Alina) or hearts (Liyana). Their faces are on the "Who's playing?" screen too.

- **Story Time**: read-along books. Each word lights up as it's read, and she can tap any word to hear it. The "Super Alina & Super Liyana" series (the family's own stories, with the girls' superhero art on the pages): *Super Alina and the Missing Stars*, *Super Liyana and the Bubble Trouble*, *Super Alina and the Grumpy Cloud*, and *Super Alina's Biggest Birthday Wish*, each ending with "Little heroes, BIG hearts, SUPER powers!" Plus "Alina's Big Day" and three more.
- **Coloring**: pick a color, tap a space to fill it. Ten superhero pages of the girls from the family's coloring sheet (Super Sisters, Alina the Brave, Liyana the Kind Heart, Happy Birthday Alina, and more), plus a cake, fish, house and butterfly. Tan and peach are in the crayons. Saved per girl.
- **Sticker Book**: spend stars on stickers (1 to 6 stars each), then drag them around garden, ocean and space scenes. Drag to the trash can to remove.

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
| **Feed the Monster** | Drag the right food into the monster's mouth | By color, then first sound, then rhymes, then feed exactly N |
| **Puzzles** | Drag pieces onto the board | 4 pieces with a guide picture, then 6, then 9 with no guide |

### Little sister's games (simple, no levels)

- **Balloons**: "Pop the blue balloon!" Colors.
- **Counting**: tap to count out loud, then pick the number.
- **Letters**: "B says buh. Which one starts with buh?"
- **Shapes**: "Find the triangle!"

Every instruction is spoken, the 🔊 bubble repeats it, and right answers get confetti and a star.

## For grown-ups

- On the "Who's playing?" screen, press and hold the ⚙️ button for about a second to set both names or reset stars and levels.
- Turn the volume up; the app talks.
- **Natural AI voice:** add one of these in Vercel → Project → Settings → Environment Variables, then redeploy:
  - `OPENAI_API_KEY` (uses `gpt-4o-mini-tts`, voice `coral`; change with `OPENAI_TTS_VOICE`), or
  - `ELEVENLABS_API_KEY` (`ELEVENLABS_VOICE_ID` is the default voice). The voices in the ElevenLabs collection "Alina App" (change with `ELEVENLABS_COLLECTION`) appear in a dropdown in grown-up settings; the choice is saved per device.
  Each phrase is generated once and cached by Vercel's CDN. Without a key, the app uses the device's built-in voice.
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

### Superhero coloring pages

Each page in `public/coloring` has `<page>-lines.png` (the outlines she sees) and `<page>-regions.png`, where every fillable space has its own number stored in the red and green channels. A tap looks up that number and fills the whole space.
