"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { say, hush } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { STORIES, fill, type Story } from "@/lib/stories";
import { store } from "@/lib/util";
import type { GameProps } from "../types";

/** Split a sentence into words with their start positions, keeping punctuation attached. */
function tokenize(text: string) {
  const out: { word: string; start: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ word: m[0], start: m.index });
  return out;
}
const bare = (w: string) => w.replace(/[^a-zA-Z']/g, "");

export default function Stories({ ask, win, name }: GameProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [page, setPage] = useState(0);
  const [hi, setHi] = useState(-1);
  const [ended, setEnded] = useState(false);
  const token = useRef(0);
  const fallback = useRef<ReturnType<typeof setInterval>>(undefined);
  const [alina, setAlina] = useState("Alina");

  useEffect(() => {
    setAlina(store.get("names", { big: "Alina" }).big || "Alina");
    ask("Story Time", "Story time! Pick a book.");
    return () => {
      token.current++;
      clearInterval(fallback.current);
      hush();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const text = story ? fill(story.pages[page]?.text ?? "", name, alina) : "";
  const words = useMemo(() => tokenize(text), [text]);

  const read = (t: string) => {
    const me = ++token.current;
    clearInterval(fallback.current);
    const ws = tokenize(t);
    let gotBoundary = false;
    setHi(0);
    // If the browser doesn't report word positions, step through words on a timer instead.
    const startFallback = setTimeout(() => {
      if (gotBoundary || token.current !== me) return;
      let i = 0;
      fallback.current = setInterval(() => {
        if (token.current !== me) return clearInterval(fallback.current);
        i++;
        if (i >= ws.length) return clearInterval(fallback.current);
        setHi(i);
      }, 420);
    }, 700);
    say(t, {
      rate: 0.82,
      onWord: (ci) => {
        if (token.current !== me) return;
        gotBoundary = true;
        clearTimeout(startFallback);
        clearInterval(fallback.current);
        let idx = 0;
        for (let i = 0; i < ws.length; i++) if (ws[i].start <= ci) idx = i;
        setHi(idx);
      },
      onEnd: () => {
        if (token.current !== me) return;
        clearTimeout(startFallback);
        clearInterval(fallback.current);
        setTimeout(() => token.current === me && setHi(-1), 400);
      },
    });
  };

  // Read each page aloud when it opens.
  useEffect(() => {
    if (story && !ended) {
      const t = setTimeout(() => read(text), 450);
      return () => clearTimeout(t);
    }
  }, [story, page, ended]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (s: Story) => {
    sfx.flip();
    setStory(s);
    setPage(0);
    setEnded(false);
    ask(fill(s.title, name, alina), fill(s.title, name, alina));
  };

  const turn = (d: number) => {
    if (!story) return;
    sfx.flip();
    token.current++;
    hush();
    setHi(-1);
    const next = page + d;
    if (next < 0) return;
    if (next >= story.pages.length) {
      setEnded(true);
      win("The end! You read the whole story");
      return;
    }
    setPage(next);
  };

  const tapWord = (i: number) => {
    token.current++;
    clearInterval(fallback.current);
    setHi(i);
    say(bare(words[i].word) || words[i].word, { rate: 0.75, onEnd: () => setHi(-1) });
  };

  if (!story) {
    return (
      <div className="stage">
        <div className="shelf">
          {STORIES.map((s) => (
            <button key={s.id} className="book" style={{ ["--book" as string]: s.color }} onClick={() => open(s)}>
              <span className="book-cover">{s.cover}</span>
              <span className="book-title">{fill(s.title, name, alina)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (ended) {
    return (
      <div className="stage reader-end">
        <p className="the-end">The End</p>
        <div className="row-center">
          <button className="pill-btn" onClick={() => { setEnded(false); setPage(0); }}>🔁 Read again</button>
          <button className="pill-btn" onClick={() => { setStory(null); ask("Story Time", "Pick another book!"); }}>📚 More books</button>
        </div>
      </div>
    );
  }

  const p = story.pages[page];
  return (
    <div className="stage reader">
      <div className="page" style={{ background: p.bg }} key={page}>
        <div className="page-art">{p.art}</div>
        <p className={`page-text${["#2d2470", "#3a2f8f", "#1f1a55", "#2f5d4d"].includes(p.bg) ? " light" : ""}`}>
          {words.map((w, i) => (
            <button key={i} className={`word${i === hi ? " hi" : ""}`} onClick={() => tapWord(i)}>
              {w.word}
            </button>
          ))}
        </p>
      </div>
      <div className="page-nav">
        <button className="arrow" aria-label="Back a page" onClick={() => turn(-1)} disabled={page === 0}>◀</button>
        <button className="arrow read" aria-label="Read it again" onClick={() => read(text)}>🔊</button>
        <span className="page-dots" aria-label={`Page ${page + 1} of ${story.pages.length}`}>
          {story.pages.map((_, i) => <i key={i} className={i === page ? "on" : ""} />)}
        </span>
        <button className="arrow" aria-label="Next page" onClick={() => turn(1)}>▶</button>
      </div>
    </div>
  );
}
