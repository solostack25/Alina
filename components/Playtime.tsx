"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { attachConfetti, confetti } from "@/lib/confetti";
import { pick, store } from "@/lib/util";
import type { GameId, GameProps } from "./types";
import Balloons from "./games/Balloons";
import Counting from "./games/Counting";
import Letters from "./games/Letters";
import Shapes from "./games/Shapes";

const DEFAULT_NAME = "Alina";
const PRAISE = ["Yay!", "Great job!", "You did it!", "Wow!", "Super!", "Hooray!"];

const DOORS: { id: GameId; label: string; art: string; cls: string }[] = [
  { id: "balloons", label: "Balloons", art: "🎈", cls: "d1" },
  { id: "count", label: "Counting", art: "🍓", cls: "d2" },
  { id: "letters", label: "Letters", art: "🔤", cls: "d3" },
  { id: "shapes", label: "Shapes", art: "🔷", cls: "d4" },
];

const GAMES = { balloons: Balloons, count: Counting, letters: Letters, shapes: Shapes };

type Screen = "start" | "home" | GameId;

export default function Playtime() {
  const [screen, setScreen] = useState<Screen>("start");
  const [stars, setStars] = useState(0);
  const [name, setName] = useState(DEFAULT_NAME);
  const [prompt, setPrompt] = useState<{ text: string; spoken: string; color?: { bg: string; fg: string } }>({ text: "", spoken: "" });
  const [cheer, setCheer] = useState<{ id: number; text: string } | null>(null);
  const [panel, setPanel] = useState(false);
  const [draftName, setDraftName] = useState("");
  const fx = useRef<HTMLCanvasElement>(null);
  const session = useRef(0); // bumps on every screen change so stale timers in old games stay quiet
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setStars(store.get("stars", 0));
    setName(store.get("kid", DEFAULT_NAME));
    return fx.current ? attachConfetti(fx.current) : undefined;
  }, []);

  const go = (s: Screen) => {
    session.current++;
    setScreen(s);
  };

  const goHome = (greeting?: string) => {
    go("home");
    say(greeting ?? (name ? `Hi ${name}! What do you want to play?` : "What do you want to play?"));
  };

  const gameProps = useMemo<GameProps>(() => {
    const mine = session.current;
    const live = () => session.current === mine;
    return {
      name,
      stars,
      ask: (text, spoken, color) => {
        if (!live()) return;
        setPrompt({ text, spoken: spoken ?? text, color });
        say(spoken ?? text);
      },
      win: (spoken) => {
        if (!live()) return;
        const p = pick(PRAISE);
        setCheer({ id: Date.now(), text: p });
        sfx.yay();
        confetti();
        setStars((s) => {
          store.set("stars", s + 1);
          return s + 1;
        });
        say(`${spoken ? spoken + ". " : ""}${p}${name && Math.random() < 0.4 ? ` ${name}!` : ""}`);
      },
    };
    // Rebuilt per screen; stars read at round start is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, name]);

  useEffect(() => {
    if (!cheer) return;
    const t = setTimeout(() => setCheer(null), 1250);
    return () => clearTimeout(t);
  }, [cheer]);

  const startHold = useCallback(() => {
    holdTimer.current = setTimeout(() => {
      setDraftName(name);
      setPanel(true);
    }, 900);
  }, [name]);
  const endHold = () => clearTimeout(holdTimer.current);

  const Game = screen !== "start" && screen !== "home" ? GAMES[screen] : null;

  return (
    <>
      <div className="cloud c1" aria-hidden />
      <div className="cloud c2" aria-hidden />

      {screen === "start" && (
        <section className="screen start">
          <h1 className="bigtitle">
            <span>{name || "Little"}&apos;s</span>
            <br />
            <span className="berry">Play</span> <span>Time</span>
          </h1>
          <button
            className="play"
            aria-label="Start playing"
            onClick={() => {
              sfx.unlock();
              goHome(name ? `Hi ${name}! Happy birthday! What do you want to play?` : "Hi! What do you want to play?");
            }}
          >
            <svg viewBox="0 0 10 12" aria-hidden>
              <path d="M0 0 L10 6 L0 12 Z" fill="#fff" />
            </svg>
          </button>
          <p className="hint">Tap to play</p>
        </section>
      )}

      {screen === "home" && (
        <section className="screen">
          <div className="bar">
            <button
              className="round"
              aria-label="Grown-up settings (press and hold)"
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              onClick={() => !panel && say("Ask a grown-up!")}
              onContextMenu={(e) => e.preventDefault()}
            >
              ⚙️
            </button>
            <Stars n={stars} />
          </div>
          <p className="hello">{name ? `Hi ${name}! Let's play!` : "Let's play!"}</p>
          <div className="doors">
            {DOORS.map((d) => (
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
              </button>
            ))}
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
              <button
                className="ask"
                aria-label="Say it again"
                style={prompt.color ? { background: prompt.color.bg, color: prompt.color.fg } : undefined}
                onClick={() => say(prompt.spoken)}
              >
                🔊 {prompt.text}
              </button>
            </div>
            <Stars n={stars} />
          </div>
          <Game key={session.current} {...gameProps} />
        </section>
      )}

      {cheer && (
        <div key={cheer.id} className="cheer" aria-live="polite">
          {cheer.text}
        </div>
      )}

      <canvas ref={fx} className="fx" aria-hidden />

      {panel && (
        <div className="panel">
          <div className="sheet" role="dialog" aria-labelledby="pt">
            <h2 id="pt">For grown-ups</h2>
            <label htmlFor="kidName">Her name (the app will say it)</label>
            <input id="kidName" value={draftName} onChange={(e) => setDraftName(e.target.value)} autoComplete="off" />
            <div className="row">
              <button
                className="btn"
                onClick={() => {
                  const n = draftName.trim();
                  setName(n);
                  store.set("kid", n);
                  setPanel(false);
                  say(n ? `Hi ${n}!` : "Saved");
                }}
              >
                Save
              </button>
              <button
                className="btn alt"
                onClick={() => {
                  setStars(0);
                  store.set("stars", 0);
                }}
              >
                Reset stars
              </button>
              <button className="btn alt" onClick={() => setPanel(false)}>
                Close
              </button>
            </div>
            <p className="note">The app talks out loud, so turn the volume up. Saved on this device only.</p>
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
