"use client";

import { useEffect, useRef, useState } from "react";
import Robot, { DEFAULT_ROBOT, PARTS, STARTER, UNLOCK_ORDER, partKind, partLabel, type PartKind, type RobotConfig } from "../Robot";
import { afterSpeech, say } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { confetti } from "@/lib/confetti";
import { NUMBER_WORDS, pick, shuffle, store, wobble } from "@/lib/util";
import type { GameProps } from "../types";

/**
 * Space Bots: build a robot in the workshop, then fly it to planets on missions.
 * Each planet needs the right tool (shovel, magnet or hammer). Missions earn new robot parts.
 * Liyana's missions stay simple; Alina's level up (colors, then counting, then numbers).
 */

type Save = { robot: RobotConfig; unlocked: string[]; missions: number };
type PlanetId = "sand" | "metal" | "rock";
type View = "workshop" | "map" | "launch" | "mission" | "reward";

const PLANETS: Record<PlanetId, { name: string; tool: string; toolName: string; blurb: string; icon: string }> = {
  sand: { name: "Sandy Moon", tool: "shovel", toolName: "shovel", blurb: "Dig up space crystals!", icon: "💎" },
  metal: { name: "Metal Planet", tool: "magnet", toolName: "magnet", blurb: "Pick up the metal things!", icon: "🔩" },
  rock: { name: "Rocky Planet", tool: "hammer", toolName: "hammer", blurb: "Free the space friends!", icon: "👽" },
};

const TABS: { kind: PartKind; label: string; icon: string }[] = [
  { kind: "head", label: "Head", icon: "🤖" },
  { kind: "body", label: "Body", icon: "🟪" },
  { kind: "legs", label: "Legs", icon: "🛞" },
  { kind: "tool", label: "Tool", icon: "🛠️" },
  { kind: "color", label: "Color", icon: "🎨" },
];

export default function SpaceBots(props: GameProps) {
  const { ask, player, name } = props;
  const key = `bots:${player}`;
  const [save, setSave] = useState<Save>({ robot: DEFAULT_ROBOT, unlocked: STARTER, missions: 0 });
  const [view, setView] = useState<View>("workshop");
  const [tab, setTab] = useState<PartKind>("head");
  const [hint, setHint] = useState<string | null>(null);
  const [planet, setPlanet] = useState<PlanetId>("sand");
  const [earned, setEarned] = useState<string | null>(null);
  const [pop, setPop] = useState(0);

  useEffect(() => {
    const s = store.get<Save>(key, { robot: DEFAULT_ROBOT, unlocked: STARTER, missions: 0 });
    setSave({ ...s, unlocked: Array.from(new Set([...STARTER, ...s.unlocked])) });
    ask("Robot Workshop", `Welcome to the robot workshop${name ? ", " + name : ""}! Build your space robot. Then blast off!`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (s: Save) => {
    setSave(s);
    store.set(key, s);
  };

  const choose = (kind: PartKind, id: string) => {
    if (!save.unlocked.includes(id)) {
      sfx.boop();
      say(`That one is locked. Go on missions to earn it!`);
      return;
    }
    sfx.pop();
    setPop((p) => p + 1);
    persist({ ...save, robot: { ...save.robot, [kind]: id } });
    if (hint && id === hint) setHint(null);
    say(kind === "color" ? (PARTS.color.find((c) => c.id === id)?.label ?? "") : partLabel(id), { rate: 1 });
  };

  const goMap = () => {
    sfx.flip();
    setHint(null);
    setView("map");
    ask("Pick a planet!", "Where should your robot go? Pick a planet!");
  };

  const pickPlanet = (p: PlanetId) => {
    const pl = PLANETS[p];
    if (save.robot.tool !== pl.tool) {
      sfx.boop();
      setTab("tool");
      setHint(pl.tool);
      setView("workshop");
      ask(`Use a ${pl.toolName}!`, `The ${pl.name} needs a ${pl.toolName}! Give your robot a ${pl.toolName}, then blast off again.`);
      return;
    }
    setPlanet(p);
    setView("launch");
    say("Three, two, one. Blast off!");
    sfx.levelUp();
    setTimeout(() => setView("mission"), 2400);
  };

  const missionDone = () => {
    const next = UNLOCK_ORDER.find((id) => !save.unlocked.includes(id)) ?? null;
    const s = { ...save, missions: save.missions + 1, unlocked: next ? [...save.unlocked, next] : save.unlocked };
    persist(s);
    afterSpeech(() => {
      setEarned(next);
      setView("reward");
      sfx.levelUp();
      confetti(140);
      if (next) ask("New part!", `You earned a new robot part: the ${kind_label(next)}! Try it in the workshop.`);
      else ask("Super mission!", "You have every robot part! You're a super robot builder!");
    }, 600);
  };

  return (
    <div className={`stage bots bots-${view}`}>
      {view === "workshop" && (
        <div className="workshop">
          <div className="bot-stand">
            <div className="bot-pop" key={pop}>
              <Robot config={save.robot} />
            </div>
            <div className="stand-base" aria-hidden />
          </div>
          <div className="parts-panel">
            <div className="part-tabs" role="tablist">
              {TABS.map((t) => (
                <button key={t.kind} role="tab" aria-selected={tab === t.kind} className={`part-tab${tab === t.kind ? " on" : ""}`} onClick={() => { sfx.flip(); setTab(t.kind); say(t.label, { rate: 1 }); }}>
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <div className={`part-grid ${tab}`}>
              {(PARTS[tab] as readonly { id: string; label: string }[]).map((p) => {
                const locked = !save.unlocked.includes(p.id);
                const on = save.robot[tab] === p.id;
                return (
                  <button
                    key={p.id}
                    className={`part${on ? " on" : ""}${locked ? " locked" : ""}${hint === p.id ? " hint" : ""}`}
                    aria-label={locked ? `${p.label}, locked` : p.label}
                    onClick={() => choose(tab, p.id)}
                  >
                    {tab === "color" ? (
                      <span className="swatch-big" style={{ background: p.id === "rainbow" ? "linear-gradient(135deg,#ff5d8f,#ffc93c,#3ccf91,#3a8dff,#9b6bff)" : p.id }} />
                    ) : (
                      <Robot config={{ ...save.robot, [tab]: p.id }} className="mini-bot" />
                    )}
                    {locked && <span className="lock">🔒</span>}
                  </button>
                );
              })}
            </div>
            <button className="blast" onClick={goMap}>
              🚀 Blast off!
            </button>
          </div>
        </div>
      )}

      {view === "map" && (
        <div className="space-map">
          {(Object.keys(PLANETS) as PlanetId[]).map((p, i) => (
            <button key={p} className={`planet-btn p-${p}`} style={{ animationDelay: `${i * 0.12}s` }} onClick={() => pickPlanet(p)}>
              <span className="planet-ball">
                <span className="planet-icon">{PLANETS[p].icon}</span>
              </span>
              <span className="planet-name">{PLANETS[p].name}</span>
              <span className="planet-need">needs a {PLANETS[p].toolName}</span>
            </button>
          ))}
          <button className="pill-btn back-ws" onClick={() => { sfx.flip(); setView("workshop"); ask("Robot Workshop", "Back to the workshop!"); }}>
            🔧 Workshop
          </button>
        </div>
      )}

      {view === "launch" && (
        <div className="launch">
          <div className="launch-bot">
            <Robot config={save.robot} />
            <div className="launch-flame" />
          </div>
        </div>
      )}

      {view === "mission" && <Mission planet={planet} robot={save.robot} game={props} onDone={missionDone} />}

      {view === "reward" && (
        <div className="reward">
          <div className="reward-card">
            {earned ? (
              <>
                <p className="reward-title">New part!</p>
                <div className="reward-bot">
                  <Robot config={{ ...save.robot, [partKind(earned)]: earned }} />
                </div>
                <p className="reward-name">{kind_label(earned)}</p>
              </>
            ) : (
              <p className="reward-title">Super builder!</p>
            )}
            <div className="row-center">
              <button className="pill-btn go" onClick={goMap}>🚀 More missions</button>
              <button className="pill-btn" onClick={() => { sfx.flip(); setTab(earned ? partKind(earned) : "head"); setView("workshop"); ask("Robot Workshop", "Try your new part!"); }}>
                🔧 Workshop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const kind_label = (id: string) => (partKind(id) === "color" ? `${PARTS.color.find((c) => c.id === id)?.label} color` : partLabel(id).toLowerCase());

/* ------------------------------------------------------------------ */
/* Missions                                                            */
/* ------------------------------------------------------------------ */

type Target = {
  id: number;
  x: number;
  kind: "mound" | "item" | "rock";
  /** what's inside / what it is */
  emoji?: string;
  word?: string;
  gem?: string; // crystal color hex
  gemName?: string;
  good: boolean;
  hits?: number; // rocks: hits needed
  done?: boolean;
  revealed?: boolean;
  label?: string; // number or dots on a rock
};

const GEMS = [
  { hex: "#3a8dff", name: "blue" },
  { hex: "#ff5d8f", name: "pink" },
  { hex: "#3ccf91", name: "green" },
  { hex: "#9b6bff", name: "purple" },
  { hex: "#ffc93c", name: "yellow" },
];
const JUNK = [
  { emoji: "🦴", word: "bone" },
  { emoji: "🐚", word: "shell" },
  { emoji: "🪱", word: "wiggly worm" },
  { emoji: "🧦", word: "lost sock" },
];
const METALS = [
  { emoji: "🔩", word: "bolt" },
  { emoji: "🔑", word: "key" },
  { emoji: "📎", word: "paper clip" },
  { emoji: "🥄", word: "spoon" },
  { emoji: "⚙️", word: "gear" },
  { emoji: "🔧", word: "wrench" },
  { emoji: "✂️", word: "scissors" },
];
const NOT_METAL = [
  { emoji: "🍌", word: "banana" },
  { emoji: "🧸", word: "teddy bear" },
  { emoji: "🖍️", word: "crayon" },
  { emoji: "🌸", word: "flower" },
  { emoji: "🍪", word: "cookie" },
  { emoji: "🎈", word: "balloon" },
  { emoji: "🪵", word: "log" },
];
const FRIENDS = ["👽", "🐙", "🐣", "🦄", "🐸", "🐼"];

// Targets start at 24% so the robot (parked to the left of each one) always fits on screen.
const spread = (n: number) => shuffle(Array.from({ length: n }, (_, i) => 24 + (68 / Math.max(1, n - 1)) * i));

type Plan = { goal: number; goalIcon: string; prompt: string; spoken: string; targets: Target[]; ask?: string };

function plan(planet: PlanetId, level: number, little: boolean): Plan {
  const lv = little ? 1 : Math.min(level, 3);
  let id = 0;
  if (planet === "sand") {
    if (lv === 2) {
      const want = pick(GEMS);
      const others = GEMS.filter((g) => g !== want);
      const xs = spread(7);
      const items: Omit<Target, "id" | "x">[] = [
        ...Array.from({ length: 3 }, () => ({ kind: "mound" as const, gem: want.hex, gemName: want.name, good: true })),
        ...shuffle(others).slice(0, 2).map((g) => ({ kind: "mound" as const, gem: g.hex, gemName: g.name, good: false })),
        ...shuffle(JUNK).slice(0, 2).map((j) => ({ kind: "mound" as const, emoji: j.emoji, word: j.word, good: false })),
      ];
      return { goal: 3, goalIcon: "💎", prompt: `Find 3 ${want.name}!`, spoken: `Dig up 3 ${want.name} crystals! Tap a sand pile to dig.`, targets: shuffle(items).map((t, i) => ({ ...t, id: id++, x: xs[i] })) };
    }
    const goal = lv === 3 ? 5 : 3;
    const crystals = lv === 3 ? 6 : 4;
    const n = lv === 3 ? 8 : 6;
    const xs = spread(n);
    const items: Omit<Target, "id" | "x">[] = [
      ...Array.from({ length: crystals }, () => {
        const g = pick(GEMS);
        return { kind: "mound" as const, gem: g.hex, gemName: g.name, good: true };
      }),
      ...shuffle(JUNK).slice(0, n - crystals).map((j) => ({ kind: "mound" as const, emoji: j.emoji, word: j.word, good: false })),
    ];
    return { goal, goalIcon: "💎", prompt: `Find ${goal} crystals!`, spoken: `Dig up ${NUMBER_WORDS[goal]} space crystals! Tap a sand pile to dig.`, targets: shuffle(items).map((t, i) => ({ ...t, id: id++, x: xs[i] })) };
  }
  if (planet === "metal") {
    const [m, nm] = lv === 1 ? [3, 2] : lv === 2 ? [4, 3] : [5, 4];
    const xs = spread(m + nm);
    const items = shuffle([
      ...shuffle(METALS).slice(0, m).map((x) => ({ kind: "item" as const, ...x, good: true })),
      ...shuffle(NOT_METAL).slice(0, nm).map((x) => ({ kind: "item" as const, ...x, good: false })),
    ]);
    return { goal: m, goalIcon: "🧲", prompt: "Get the metal!", spoken: "Magnets pick up metal things! Tap the things you think are metal.", targets: items.map((t, i) => ({ ...t, id: id++, x: xs[i] })) };
  }
  // rocks
  if (lv === 3) {
    const nums = shuffle([2, 3, 4, 5, 6]).slice(0, 5);
    const xs = spread(5);
    return {
      goal: 3,
      goalIcon: "👽",
      prompt: "",
      spoken: "",
      targets: nums.map((n, i) => ({ id: id++, x: xs[i], kind: "rock" as const, hits: n, label: String(n), emoji: FRIENDS[i % FRIENDS.length], good: true })),
      ask: "number",
    };
  }
  const xs = spread(3);
  return {
    goal: 3,
    goalIcon: "👽",
    prompt: "Free 3 friends!",
    spoken: "Space friends are stuck in the rocks! Tap a rock to smash it with your hammer. Count the hits!",
    targets: xs.map((x, i) => {
      const h = lv === 1 ? 1 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 4);
      return { id: id++, x, kind: "rock" as const, hits: h, label: lv === 1 ? "•".repeat(h) : String(h), emoji: FRIENDS[(i + Math.floor(Math.random() * 6)) % FRIENDS.length], good: true };
    }),
  };
}

function Mission({ planet, robot, game, onDone }: { planet: PlanetId; robot: RobotConfig; game: GameProps; onDone: () => void }) {
  const live = useRef(game);
  live.current = game;
  const [p] = useState(() => plan(planet, game.level, game.player === "little"));
  const [targets, setTargets] = useState<Target[]>(p.targets);
  const [botX, setBotX] = useState(22);
  const [acting, setActing] = useState(false);
  const [got, setGot] = useState(0);
  const [hitsDone, setHitsDone] = useState<Record<number, number>>({});
  const [wanted, setWanted] = useState<number | null>(null); // rock number to find (level 3 rocks)
  const busy = useRef(false);
  const finished = useRef(false);
  const gotRef = useRef(0);

  const askNextRock = (ts: Target[]) => {
    const left = ts.filter((t) => !t.done);
    if (!left.length) return;
    const t = pick(left);
    setWanted(t.hits!);
    live.current.ask(`Smash ${t.hits}!`, `Find the rock with the number ${NUMBER_WORDS[t.hits!]}, and smash it ${NUMBER_WORDS[t.hits!]} times!`);
  };

  useEffect(() => {
    if (p.ask === "number") askNextRock(p.targets);
    else live.current.ask(p.prompt, p.spoken);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const moveTo = (x: number) =>
    new Promise<void>((res) => {
      const dist = Math.abs(x - botX);
      setBotX(x);
      if (dist < 2) return res();
      sfx.tick(2);
      setTimeout(res, Math.min(900, 250 + dist * 9));
    });

  const act = (ms = 550) =>
    new Promise<void>((res) => {
      setActing(true);
      setTimeout(() => {
        setActing(false);
        res();
      }, ms);
    });

  const score = () => {
    gotRef.current++;
    setGot(gotRef.current);
    if (gotRef.current >= p.goal && !finished.current) {
      finished.current = true;
      setTimeout(() => {
        live.current.win(`Mission complete! Super robot${game.name ? ", " + game.name : ""}`);
        onDone();
      }, 500);
      return true;
    }
    return false;
  };

  const tap = async (t: Target, el: HTMLElement) => {
    if (busy.current || finished.current || t.done) return;
    busy.current = true;
    try {
      if (t.kind === "rock" && wanted !== null && t.hits !== wanted) {
        wobble(el);
        sfx.boop();
        live.current.miss();
        say(`That rock says ${NUMBER_WORDS[t.hits!]}. Find ${NUMBER_WORDS[wanted]}!`);
        return;
      }
      // Park just left of the target so the tool in the robot's right hand reaches it.
      await moveTo(t.x - 2);
      if (t.kind === "mound") {
        sfx.flip();
        await act(650);
        setTargets((ts) => ts.map((x) => (x.id === t.id ? { ...x, revealed: true, done: true } : x)));
        if (t.gem) {
          if (t.good) {
            sfx.yay();
            const won = score();
            if (!won) say(`A ${t.gemName} crystal! ${NUMBER_WORDS[gotRef.current]}!`, { rate: 1 });
          } else {
            sfx.pop();
            live.current.miss();
            say(`That's a ${t.gemName} crystal. We need ${p.prompt.split(" ")[2]}!`, { rate: 1 });
          }
        } else {
          sfx.boop();
          say(`Just a ${t.word}! Keep digging!`, { rate: 1 });
        }
      } else if (t.kind === "item") {
        await act(450);
        if (t.good) {
          sfx.note(880, 0.15);
          setTargets((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: true } : x)));
          const won = score();
          if (!won) say(`Clink! The ${t.word} is metal!`, { rate: 1 });
        } else {
          wobble(el);
          sfx.boop();
          live.current.miss();
          say(`The ${t.word} isn't metal, so the magnet can't pick it up!`, { rate: 1 });
        }
      } else {
        // rock
        const done = (hitsDone[t.id] ?? 0) + 1;
        await act(320);
        sfx.note(160 + done * 40, 0.12);
        setHitsDone((h) => ({ ...h, [t.id]: done }));
        say(NUMBER_WORDS[done], { rate: 1.05 });
        if (done >= t.hits!) {
          const ts2 = targets.map((x) => (x.id === t.id ? { ...x, done: true, revealed: true } : x));
          setTargets(ts2);
          setTimeout(() => sfx.yay(), 150);
          const won = score();
          if (!won) {
            afterSpeech(() => say(`You freed a space friend!`), 0);
            if (wanted !== null) afterSpeech(() => askNextRock(ts2), 600);
          }
        }
      }
    } finally {
      busy.current = false;
    }
  };

  return (
    <div className={`mission m-${planet}`}>
      <div className="mission-sky" aria-hidden>
        <span className="far-planet" />
      </div>
      <div className="mission-count" aria-label={`${got} of ${p.goal}`}>
        {Array.from({ length: p.goal }, (_, i) => (
          <span key={i} className={i < got ? "got" : ""}>
            {p.goalIcon}
          </span>
        ))}
      </div>
      <div className="ground" aria-hidden />
      {targets.map((t) => (
        <button
          key={t.id}
          className={`target ${t.kind}${t.done ? " done" : ""}${t.revealed ? " revealed" : ""}`}
          style={{ left: `${t.x}%` }}
          aria-label={t.kind === "mound" ? "Sand pile" : t.kind === "rock" ? `Rock ${t.label}` : t.word}
          onClick={(e) => tap(t, e.currentTarget)}
        >
          {t.kind === "mound" && (
            <>
              {t.revealed && (t.gem ? <Gem color={t.gem} good={t.good} /> : <span className="found">{t.emoji}</span>)}
              {!t.revealed && <span className="mound-pile" />}
            </>
          )}
          {t.kind === "item" && <span className="thing-emoji">{t.emoji}</span>}
          {t.kind === "rock" &&
            (t.revealed ? (
              <span className="friend">{t.emoji}</span>
            ) : (
              <span className={`rock-body crack-${Math.min(3, Math.floor(((hitsDone[t.id] ?? 0) / t.hits!) * 3))}`}>
                <b>{t.label}</b>
              </span>
            ))}
        </button>
      ))}
      <div className="mission-bot" style={{ left: `${botX}%` }}>
        <Robot config={robot} acting={acting} />
      </div>
    </div>
  );
}

function Gem({ color, good }: { color: string; good: boolean }) {
  return (
    <svg className={`gem${good ? " good" : ""}`} viewBox="0 0 60 60" aria-hidden>
      <path d="M14 8 H46 L58 24 L30 56 L2 24 Z" fill={color} stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M2 24 H58 M14 8 L22 24 L30 56 L38 24 L46 8" stroke="#fff" strokeWidth="2" fill="none" opacity=".7" />
    </svg>
  );
}
