"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { currentVoiceName, getAiVoice, listVoices, say, setAiVoice, setVoice, voiceMode } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { attachConfetti, confetti } from "@/lib/confetti";
import { pick, store } from "@/lib/util";
import type { Activity, BigGame, GameId, GameProps, LittleGame, Player } from "./types";
import Pip from "./Pip";
import HeroSwoop from "./HeroSwoop";
import { HEROES } from "@/lib/heroes";
import Balloons from "./games/Balloons";
import Counting from "./games/Counting";
import Letters from "./games/Letters";
import Shapes from "./games/Shapes";
import Memory from "./games/Memory";
import Simon from "./games/Simon";
import Spell from "./games/Spell";
import MathGame from "./games/MathGame";
import Patterns from "./games/Patterns";
import OddOneOut from "./games/OddOneOut";
import Feed from "./games/Feed";
import Puzzle from "./games/Puzzle";
import Stickers from "./games/Stickers";
import Stories from "./games/Stories";
import Coloring from "./games/Coloring";
import SuperCatch from "./games/SuperCatch";

const PRAISE = ["Yay!", "Great job!", "You did it!", "Wow!", "Super!", "Hooray!", "Amazing!", "So smart!"];
const DEFAULT_NAMES: Record<Player, string> = { big: "Alina", little: "Liyana" };

const LITTLE_DOORS: { id: LittleGame; label: string; art: string; cls: string }[] = [
  { id: "balloons", label: "Balloons", art: "🎈", cls: "d1" },
  { id: "count", label: "Counting", art: "🍓", cls: "d2" },
  { id: "letters", label: "Letters", art: "🔤", cls: "d3" },
  { id: "shapes", label: "Shapes", art: "🔷", cls: "d4" },
];

const BIG_DOORS: { id: BigGame; label: string; art: string; cls: string; max: number; spoken: string }[] = [
  { id: "memory", label: "Memory", art: "🃏", cls: "b1", max: 4, spoken: "Memory match" },
  { id: "simon", label: "Copy Me", art: "🎵", cls: "b2", max: 8, spoken: "Copy me" },
  { id: "spell", label: "Spell It", art: "✏️", cls: "b3", max: 3, spoken: "Spell it" },
  { id: "math", label: "Math", art: "➕", cls: "b4", max: 4, spoken: "Math" },
  { id: "patterns", label: "Patterns", art: "🔁", cls: "b5", max: 4, spoken: "Patterns" },
  { id: "odd", label: "Odd One Out", art: "🧐", cls: "b6", max: 3, spoken: "Odd one out" },
  { id: "feed", label: "Feed the Monster", art: "👾", cls: "b7", max: 4, spoken: "Feed the monster" },
  { id: "puzzle", label: "Puzzles", art: "🧩", cls: "b8", max: 3, spoken: "Puzzles" },
];

const ACTIVITIES: { id: Activity; label: string; art: string; cls: string }[] = [
  { id: "stories", label: "Story Time", art: "📖", cls: "a1" },
  { id: "coloring", label: "Coloring", art: "🖍️", cls: "a2" },
  { id: "stickers", label: "Stickers", art: "🌟", cls: "a3" },
];

const GAMES: Record<GameId, (p: GameProps) => React.ReactNode> = {
  balloons: Balloons, count: Counting, letters: Letters, shapes: Shapes,
  memory: Memory, simon: Simon, spell: Spell, math: MathGame, patterns: Patterns, odd: OddOneOut, feed: Feed, puzzle: Puzzle,
  stickers: Stickers, stories: Stories, coloring: Coloring, catch: SuperCatch,
};

/** Super Catch levels up for Alina only: colors, numbers, letter sounds. */
const CATCH_MAX = 3;

/** Wins in a row needed to level up. */
const STREAK_TO_LEVEL = 3;

type Screen = "who" | "home" | GameId;

export default function Playtime() {
  const [screen, setScreen] = useState<Screen>("who");
  const [player, setPlayer] = useState<Player>("big");
  const [names, setNames] = useState(DEFAULT_NAMES);
  const [stars, setStars] = useState<Record<Player, number>>({ big: 0, little: 0 });
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [prompt, setPrompt] = useState<{ text: string; spoken: string; color?: { bg: string; fg: string } }>({ text: "", spoken: "" });
  const [cheer, setCheer] = useState<{ id: number; text: string; big?: boolean } | null>(null);
  const [panel, setPanel] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_NAMES);
  const [voices, setVoices] = useState<string[]>([]);
  const [voiceName, setVoiceName] = useState("");
  type AiVoice = { id: string; name: string; group: "mine" | "elevenlabs"; description?: string };
  const [aiVoices, setAiVoices] = useState<AiVoice[]>([]);
  const [aiPick, setAiPick] = useState("");
  const fx = useRef<HTMLCanvasElement>(null);
  const session = useRef(0); // bumps on every screen change so stale timers in old games stay quiet
  const streak = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const unlocked = useRef(false);
  const starsRef = useRef(stars);
  starsRef.current = stars;
  const birthdaySaid = useRef<Record<Player, boolean>>({ big: false, little: false });

  useEffect(() => {
    setNames(store.get("names", DEFAULT_NAMES));
    setStars(store.get("stars2", { big: 0, little: 0 }));
    setLevels(store.get("levels", {}));
    return fx.current ? attachConfetti(fx.current) : undefined;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.player = screen === "who" ? "" : player;
  }, [player, screen]);

  const name = names[player];
  const isBig = (g: Screen): g is BigGame => BIG_DOORS.some((d) => d.id === g);
  const showsLevel = isBig(screen) || (screen === "catch" && player === "big");
  const levelKey = `${player}:${screen}`;
  const level = levels[levelKey] ?? 1;

  const go = (s: Screen) => {
    session.current++;
    streak.current = 0;
    setScreen(s);
  };

  const goHome = (greeting?: string) => {
    go("home");
    say(greeting ?? (name ? `${name}, what do you want to play?` : "What do you want to play?"));
  };

  const gameProps = useMemo<GameProps>(() => {
    const mine = session.current;
    const live = () => session.current === mine;
    const game = screen;
    const door = BIG_DOORS.find((d) => d.id === game) ?? (game === "catch" && player === "big" ? { max: CATCH_MAX } : undefined);
    return {
      name,
      player,
      stars: stars[player],
      level,
      spend: (n) => {
        if (!live() || starsRef.current[player] < n) return false;
        const next = { ...starsRef.current, [player]: starsRef.current[player] - n };
        starsRef.current = next;
        setStars(next);
        store.set("stars2", next);
        return true;
      },
      ask: (text, spoken, color) => {
        if (!live()) return;
        setPrompt({ text, spoken: spoken ?? text, color });
        say(spoken ?? text);
      },
      miss: () => {
        streak.current = 0;
      },
      win: (spoken) => {
        if (!live()) return;
        const p = pick(PRAISE);
        sfx.yay();
        confetti();
        setStars((s) => {
          const next = { ...s, [player]: s[player] + 1 };
          store.set("stars2", next);
          return next;
        });
        streak.current++;
        let levelLine = "";
        if (door && streak.current >= STREAK_TO_LEVEL) {
          streak.current = 0;
          const key = `${player}:${game}`;
          setLevels((lv) => {
            const cur = lv[key] ?? 1;
            if (cur >= door.max) return lv;
            const next = { ...lv, [key]: cur + 1 };
            store.set("levels", next);
            return next;
          });
          const cur = levels[key] ?? 1;
          if (cur < door.max) {
            levelLine = ` Level up! Level ${cur + 1}!`;
            setTimeout(() => {
              sfx.levelUp();
              confetti(160);
              setCheer({ id: Date.now() + 1, text: `Level ${cur + 1}!`, big: true });
            }, 1300);
          }
        }
        setCheer({ id: Date.now(), text: p });
        say(`${spoken ? spoken + ". " : ""}${p}${name && Math.random() < 0.4 ? ` ${name}!` : ""}${levelLine}`);
      },
    };
    // Rebuilt per screen and when the level changes; games read props at the start of each round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, name, level, player, stars[player]]);

  useEffect(() => {
    if (!cheer) return;
    const t = setTimeout(() => setCheer(null), cheer.big ? 1700 : 1250);
    return () => clearTimeout(t);
  }, [cheer]);

  const choosePlayer = (p: Player) => {
    if (!unlocked.current) {
      sfx.unlock();
      unlocked.current = true;
    }
    sfx.pop();
    setPlayer(p);
    const n = names[p];
    session.current++;
    setScreen("home");
    const bday = p === "big" && !birthdaySaid.current.big;
    birthdaySaid.current[p] = true;
    say(
      p === "big"
        ? `Hi ${n || "big girl"}!${bday ? " Happy birthday!" : ""} These are your big girl games. Pick one!`
        : `Hi ${n || "little one"}! What do you want to play?`,
    );
  };

  const startHold = () => {
    holdTimer.current = setTimeout(() => {
      setDraft(names);
      setVoices(listVoices().map((v) => v.name));
      fetch("/api/voices")
        .then((r) => r.json())
        .then((d: { voices: AiVoice[]; default?: string }) => {
          setAiVoices(d.voices ?? []);
          const mine = getAiVoice();
          setAiPick((d.voices ?? []).some((v) => v.id === mine) ? mine : d.default ?? "");
        })
        .catch(() => setAiVoices([]));
      setVoiceName(currentVoiceName());
      setPanel(true);
    }, 900);
  };
  const endHold = () => clearTimeout(holdTimer.current);

  const Game = screen !== "who" && screen !== "home" ? GAMES[screen] : null;
  const doors = player === "big" ? BIG_DOORS : LITTLE_DOORS;

  return (
    <>
      <div className="sky" aria-hidden>
        <div className="cloud c1" />
        <div className="cloud c2" />
      </div>

      {screen === "who" && (
        <section className="screen who">
          <div className="who-banner" aria-hidden />
          <h1 className="bigtitle">
            <span>Super</span> <span className="berry">Play</span> <span>Time</span>
          </h1>
          <p className="whoask">
            <Pip size={64} className="who-pip" /> Who&apos;s playing?
          </p>
          <div className="players">
            {(["big", "little"] as Player[]).map((p) => (
              <button key={p} className={`player ${p}`} onClick={() => choosePlayer(p)} aria-label={`${names[p]} is playing`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="avatar" src={HEROES[p].face} alt="" draggable={false} />
                <span className="pname">{names[p]}</span>
                <span className="pstars">⭐ {stars[p]}</span>
              </button>
            ))}
          </div>
          <button
            className="gear-link"
            aria-label="Grown-up settings (press and hold)"
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            onClick={() => !panel && say("Ask a grown-up!")}
            onContextMenu={(e) => e.preventDefault()}
          >
            ⚙️ Grown-ups: press and hold
          </button>
        </section>
      )}

      {screen === "home" && (
        <section className="screen">
          <div className="bar">
            <button
              className="round who-btn"
              aria-label="Change who's playing"
              onClick={() => {
                sfx.boop();
                go("who");
                say("Who's playing? Pick your superhero!");
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={`mini ${player}`} src={HEROES[player].face} alt="" draggable={false} />
            </button>
            <Stars n={stars[player]} />
          </div>
          <div className="home-scroll">
            <div className="greet">
              <Pip size={92} />
              <p className="hello">{player === "big" ? `${name}'s Big Games` : `Hi ${name}! Let's play!`}</p>
            </div>
            <button
              className={`hero-door ${player}`}
              onClick={() => {
                sfx.pop();
                go("catch");
              }}
            >
              <span className="hero-door-text">
                <span className="hd-title">Super Catch</span>
                <span className="hd-sub">{HEROES[player].power === "stars" ? "⭐ Catch the stars! ⭐" : "💖 Catch the hearts! 💖"}</span>
                {player === "big" && (
                  <span className="lvl" aria-label={`Level ${levels["big:catch"] ?? 1} of ${CATCH_MAX}`}>
                    {Array.from({ length: CATCH_MAX }, (_, i) => (
                      <i key={i} className={i < (levels["big:catch"] ?? 1) ? "on" : ""} />
                    ))}
                  </span>
                )}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HEROES[player].hero} alt="" draggable={false} />
            </button>
            <div className="acts">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  className={`act ${a.cls}`}
                  onClick={() => {
                    sfx.pop();
                    go(a.id);
                  }}
                >
                  <span className="art">{a.art}</span>
                  {a.label}
                </button>
              ))}
            </div>
            <div className={`doors ${player === "big" ? "eight" : ""}`}>
              {doors.map((d) => {
                const lv = levels[`${player}:${d.id}`] ?? 1;
                const max = "max" in d ? d.max : 0;
                return (
                  <button
                    key={d.id}
                    className={`door ${d.cls}`}
                    onClick={() => {
                      sfx.pop();
                      go(d.id);
                    }}
                  >
                    <span className="art">{d.art}</span>
                    {d.label}
                    {max > 0 && (
                      <span className="lvl" aria-label={`Level ${lv} of ${max}`}>
                        {Array.from({ length: max }, (_, i) => (
                          <i key={i} className={i < lv ? "on" : ""} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {Game && (
        <section className="screen">
          <div className="bar">
            <button
              className="round"
              aria-label="Back home"
              onClick={() => {
                sfx.boop();
                goHome();
              }}
            >
              🏠
            </button>
            <div className="prompt">
              <Pip size={64} className="bar-pip" />
              <button
                className="ask"
                aria-label="Say it again"
                style={prompt.color ? { background: prompt.color.bg, color: prompt.color.fg } : undefined}
                onClick={() => say(prompt.spoken)}
              >
                🔊 {prompt.text}
              </button>
            </div>
            {showsLevel ? <div className="levelpill">Lv {level}</div> : <Stars n={stars[player]} />}
          </div>
          <Game key={session.current} {...gameProps} />
        </section>
      )}

      {cheer && screen !== "who" && screen !== "home" && <HeroSwoop key={`h${cheer.id}`} player={player} id={cheer.id} big={cheer.big} />}

      {cheer && (
        <div key={cheer.id} className={`cheer${cheer.big ? " big" : ""}`} aria-live="polite">
          {cheer.text}
        </div>
      )}

      <canvas ref={fx} className="fx" aria-hidden />

      {panel && (
        <div className="panel">
          <div className="sheet" role="dialog" aria-labelledby="pt">
            <h2 id="pt">For grown-ups</h2>
            <label htmlFor="bigName">Big sister (harder games)</label>
            <input id="bigName" value={draft.big} onChange={(e) => setDraft({ ...draft, big: e.target.value })} autoComplete="off" />
            <label htmlFor="littleName">Little sister (simple games)</label>
            <input id="littleName" value={draft.little} onChange={(e) => setDraft({ ...draft, little: e.target.value })} autoComplete="off" />
            {aiVoices.length > 0 ? (
              <>
                <label htmlFor="aiVoicePick">Pip&apos;s voice</label>
                <div className="voice-row">
                  <select
                    id="aiVoicePick"
                    value={aiPick}
                    onChange={(e) => {
                      setAiPick(e.target.value);
                      setAiVoice(e.target.value);
                      say(`Hi ${draft.big || "Alina"} and ${draft.little || "Liyana"}! I'm Pip. Let's play!`);
                    }}
                  >
                    {(["mine", "elevenlabs"] as const).map((g) => {
                      const list = aiVoices.filter((v) => v.group === g);
                      return list.length ? (
                        <optgroup key={g} label={g === "mine" ? "Your voices" : "ElevenLabs voices"}>
                          {list.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                              {v.description ? ` (${v.description})` : ""}
                            </option>
                          ))}
                        </optgroup>
                      ) : null;
                    })}
                  </select>
                  <button className="btn alt" onClick={() => say(`Hi ${draft.big || "Alina"} and ${draft.little || "Liyana"}! I'm Pip. Let's play!`)}>
                    ▶ Test
                  </button>
                </div>
                <p className="note">Add more voices to &quot;My Voices&quot; in ElevenLabs and they show up here. The choice is saved on this device.</p>
              </>
            ) : (
              <>
                <label htmlFor="voicePick">Pip&apos;s voice</label>
                <p className="note">{voiceMode() === "ai" ? "✅ Using the natural AI voice." : "Using this device's voice. Add a voice key in Vercel for the natural AI voice."}</p>
                <div className="voice-row">
                  <select
                    id="voicePick"
                    value={voiceName}
                    onChange={(e) => {
                      setVoiceName(e.target.value);
                      setVoice(e.target.value);
                      say(`Hi ${draft.big || "Alina"}! I'm Pip. Let's play!`);
                    }}
                  >
                    {voices.length === 0 && <option value="">Default voice</option>}
                    {voices.map((v, i) => (
                      <option key={v} value={v}>
                        {v}
                        {i === 0 ? " (best match)" : ""}
                      </option>
                    ))}
                  </select>
                  <button className="btn alt" onClick={() => say(`Hi ${draft.big || "Alina"}! I'm Pip. Let's play!`)}>
                    ▶ Test
                  </button>
                </div>
              </>
            )}
            <div className="row">
              <button
                className="btn"
                onClick={() => {
                  const next = { big: draft.big.trim(), little: draft.little.trim() };
                  setNames(next);
                  store.set("names", next);
                  setPanel(false);
                }}
              >
                Save
              </button>
              <button
                className="btn alt"
                onClick={() => {
                  setStars({ big: 0, little: 0 });
                  setLevels({});
                  store.set("stars2", { big: 0, little: 0 });
                  store.set("levels", {});
                }}
              >
                Reset stars and levels
              </button>
              <button className="btn alt" onClick={() => setPanel(false)}>
                Close
              </button>
            </div>
            {aiVoices.length === 0 && (
              <p className="note">Voices come from this device. On an iPad, a Premium voice like Ava or Zoe sounds much more natural: Settings › Accessibility › Spoken Content › Voices › English.</p>
            )}
            <p className="note">Big games level up after 3 right answers in a row. Everything is saved on this device only.</p>
          </div>
        </div>
      )}
    </>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="stars" aria-label={`${n} stars`}>
      <i>⭐</i>
      <span>{n}</span>
    </div>
  );
}
