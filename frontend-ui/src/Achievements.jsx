import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Trophy, Lock, X, Tv } from "lucide-react";
import { sfx } from "./sound.js";

// ============================================================
// Arcade achievements: small goals around the site pop an
// "Achievement unlocked" toast. Progress lives in this visitor's
// browser only. The Konami code unlocks a secret CRT mode.
// ============================================================

export const ACHIEVEMENTS = [
  { id: "start", name: "Press start", desc: "Made it through the opening story.", hint: "Scroll past the split stage" },
  { id: "flip", name: "Card collector", desc: "Flipped the Player One card.", hint: "Something under the hood flips" },
  { id: "ask", name: "First contact", desc: "Asked the AI twin a question.", hint: "Talk to the AI" },
  { id: "loot", name: "Legendary loot", desc: "Picked up the resume save file.", hint: "Check the inventory" },
  { id: "party", name: "Party up", desc: "Opened LinkedIn to connect.", hint: "Invite the player to your party" },
  { id: "end", name: "End credits", desc: "Reached the final level.", hint: "Reach the very end" },
  { id: "signal", name: "Signal sent", desc: "Sent Ansh a message.", hint: "Use the contact form" },
  { id: "konami", name: "Cheat code", desc: "↑↑↓↓←→←→BA. CRT mode unlocked.", hint: "Old-school players know the code", secret: true },
];

const STORE_KEY = "ansh-achievements";
const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((id) => ACHIEVEMENTS.some((a) => a.id === id)) : [];
  } catch {
    return [];
  }
}

let unlocked = readStore();
const subs = new Set();
const toastSubs = new Set();

function emit() {
  subs.forEach((fn) => fn());
}

/** Unlock an achievement by id. Safe to call repeatedly. */
export function unlock(id) {
  if (unlocked.includes(id) || !ACHIEVEMENTS.some((a) => a.id === id)) return;
  unlocked = [...unlocked, id];
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(unlocked));
  } catch {
    /* storage unavailable: progress lasts for this visit */
  }
  emit();
  toastSubs.forEach((fn) => fn(id));
}

function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function useUnlocked() {
  return useSyncExternalStore(subscribe, () => unlocked, () => unlocked);
}

// ------------------------------------------------------------
// Header trophy button (count + opens the panel)
// ------------------------------------------------------------

export function TrophyButton({ onClick, open }) {
  const list = useUnlocked();
  const [bump, setBump] = useState(false);
  const prev = useRef(list.length);
  useEffect(() => {
    if (list.length > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 700);
      prev.current = list.length;
      return () => clearTimeout(t);
    }
    prev.current = list.length;
  }, [list.length]);

  return (
    <button
      className={`trophy-btn ${bump ? "is-bump" : ""} ${open ? "is-open" : ""}`}
      onClick={onClick}
      aria-expanded={open}
      aria-controls="achievements-panel"
      aria-label={`Achievements: ${list.length} of ${ACHIEVEMENTS.length} unlocked`}
      data-cursor="Trophies"
    >
      <Trophy size={13} />
      <span>
        {list.length}/{ACHIEVEMENTS.length}
      </span>
    </button>
  );
}

// ------------------------------------------------------------
// Toasts + panel + Konami listener
// ------------------------------------------------------------

export default function Achievements({ open, setOpen }) {
  const list = useUnlocked();
  const [queue, setQueue] = useState([]);
  const [crt, setCrt] = useState(false);
  const current = queue[0] ? ACHIEVEMENTS.find((a) => a.id === queue[0]) : null;

  // Collect unlock events into a queue so they show one at a time.
  useEffect(() => {
    const onUnlock = (id) => setQueue((q) => [...q, id]);
    toastSubs.add(onUnlock);
    return () => toastSubs.delete(onUnlock);
  }, []);

  useEffect(() => {
    if (!current) return;
    sfx.achievement();
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 3600);
    return () => clearTimeout(t);
  }, [current]);

  // Konami code: unlocks the secret and toggles CRT mode.
  useEffect(() => {
    let pos = 0;
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, [contenteditable]")) return;
      const key = e.key.toLowerCase();
      pos = key === KONAMI[pos] ? pos + 1 : key === KONAMI[0] ? 1 : 0;
      if (pos === KONAMI.length) {
        pos = 0;
        unlock("konami");
        setCrt((on) => !on);
        sfx.powerUp();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("crt", crt);
  }, [crt]);

  // Close the panel on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const pct = Math.round((list.length / ACHIEVEMENTS.length) * 100);

  return (
    <>
      <div className="ach-toast-wrap" aria-live="polite">
        {current && (
          <div className="ach-toast" key={queue[0] + queue.length} role="status">
            <span className="ach-toast__icon">
              <Trophy size={20} />
            </span>
            <span className="ach-toast__text">
              <span className="ach-toast__kicker text-mono">Achievement unlocked</span>
              <strong className="ach-toast__name">{current.name}</strong>
              <span className="ach-toast__desc">{current.desc}</span>
            </span>
            <span className="ach-toast__xp text-mono">+100 XP</span>
          </div>
        )}
      </div>

      {open && <div className="ach-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside
        id="achievements-panel"
        className={`ach-panel ${open ? "is-open" : ""}`}
        aria-label="Achievements"
        aria-hidden={!open}
        inert={!open}
      >
        <header className="ach-panel__head">
          <div>
            <span className="text-mono dim">Trophy room</span>
            <strong className="ach-panel__title">Achievements</strong>
          </div>
          <button className="ach-panel__close" onClick={() => setOpen(false)} aria-label="Close achievements" data-cursor="Close">
            <X size={16} />
          </button>
        </header>
        <div className="ach-panel__meter text-mono">
          <span>
            {list.length} / {ACHIEVEMENTS.length} unlocked
          </span>
          <span>{pct}%</span>
        </div>
        <span className="bar ach-panel__bar">
          <i style={{ width: `${pct}%` }} />
        </span>
        <ol className="ach-list">
          {ACHIEVEMENTS.map((a) => {
            const got = list.includes(a.id);
            return (
              <li key={a.id} className={`ach-item ${got ? "is-got" : ""}`}>
                <span className="ach-item__icon">{got ? <Trophy size={16} /> : <Lock size={14} />}</span>
                <span className="ach-item__text">
                  <strong>{got || !a.secret ? a.name : "???"}</strong>
                  <span>{got ? a.desc : a.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {list.includes("konami") && (
          <button className={`ach-crt text-mono ${crt ? "is-on" : ""}`} onClick={() => setCrt((on) => !on)} aria-pressed={crt}>
            <Tv size={14} /> CRT mode {crt ? "on" : "off"}
          </button>
        )}
      </aside>
    </>
  );
}
