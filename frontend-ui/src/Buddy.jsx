import { useEffect, useRef, useState } from "react";
import { sfx } from "./sound.js";

// ============================================================
// BIT: a tiny floating companion bot.
// Hovers and bobs, leans toward the cursor and follows it with its
// eyes, drops a hint for each section, can be dragged anywhere, and
// opens the same AI chat on click.
// ============================================================

const TIPS = {
  home: "Psst… I'm Ansh's AI. Tap me!",
  pipeline: "These shops are live. Click a window!",
  lab: "Every box here is a real repo.",
  player: "Flip the card to see the stats.",
  missions: "Real missions, real impact.",
  terminal: "Type below, or just tap me.",
  contact: "Say hi to Ansh. He replies fast!",
};
const HOVER_LINES = ["Hiii! Ask me anything ♡", "Hiring? I know all about Ansh!", "Boop me to chat!", "I don't bite. Promise ♡", "*happy beep noises*"];
const PET_LINES = ["Hehe, that tickles!", "More pets pls ♡", "*purr… beep boop*", "You're my favourite human!", "Bzzt… so happy ♡"];
const LOVE_LINES = ["Best. Pets. Ever.", "Maximum happiness reached ♡", "Okay, you can hire Ansh now ♡"];
const STORE_KEY = "ansh-bit-home";
const SIZE = () => (window.innerWidth < 720 ? 62 : 78);

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function clampHome(h) {
  const m = SIZE() * 0.75;
  return {
    x: Math.min(window.innerWidth - m, Math.max(m, h.x)),
    y: Math.min(window.innerHeight - m, Math.max(5.25 * 16 + m * 0.6, h.y)),
  };
}

function loadHome() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && typeof raw.fx === "number") return clampHome({ x: raw.fx * window.innerWidth, y: raw.fy * window.innerHeight });
  } catch {}
  return clampHome({ x: window.innerWidth < 720 ? 44 : 64, y: window.innerHeight - (window.innerWidth < 720 ? 120 : 170) });
}

export default function Buddy({ onOpen, hidden, chapter }) {
  const rootRef = useRef(null);
  const bodyRef = useRef(null);
  const eyesRef = useRef(null);
  const shadowRef = useRef(null);
  const [bubble, setBubble] = useState("");
  const [hover, setHover] = useState(false);
  const [blink, setBlink] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [side, setSide] = useState("right");
  const [mood, setMood] = useState("idle"); // idle | happy | pet | love
  const [pops, setPops] = useState([]);
  const pet = useRef({ last: null, dist: 0, total: 0, calm: 0, lineAt: 0 });
  const live = useRef({
    home: { x: 64, y: 400 },
    pos: { x: 64, y: 400 },
    mouse: null,
    drag: null,
    hover: false,
  });
  const bubbleTimer = useRef(0);

  const say = (text, ms = 3200) => {
    clearTimeout(bubbleTimer.current);
    setBubble(text);
    bubbleTimer.current = setTimeout(() => setBubble(""), ms);
  };

  // Motion loop: direct DOM writes, no React re-render per frame.
  useEffect(() => {
    const L = live.current;
    L.home = loadHome();
    L.pos = { ...L.home };
    setSide(L.home.x > window.innerWidth / 2 ? "left" : "right");
    const still = reduceMotion();
    let raf = 0;
    const t0 = performance.now();

    const frame = (now) => {
      const t = (now - t0) / 1000;
      const { home, pos, mouse, drag } = L;
      let tx = home.x;
      let ty = home.y;
      let lookX = 0;
      let lookY = 0;

      if (drag?.moved) {
        tx = drag.x;
        ty = drag.y;
      } else if (mouse) {
        const dx = mouse.x - home.x;
        const dy = mouse.y - home.y;
        const d = Math.hypot(dx, dy) || 1;
        // Curious lean toward the cursor when it comes close.
        const pull = Math.max(0, 1 - d / 420) * Math.min(d, 90) * (L.hover ? 0.15 : 0.55);
        tx += (dx / d) * pull;
        ty += (dy / d) * pull;
      }
      if (!still && !drag?.moved) {
        tx += Math.sin(t * 0.7) * 6;
        ty += Math.sin(t * 1.9) * 7;
      }

      const k = drag?.moved ? 0.35 : 0.08;
      const vx = (tx - pos.x) * k;
      const vy = (ty - pos.y) * k;
      pos.x += vx;
      pos.y += vy;

      if (mouse) {
        const ex = mouse.x - pos.x;
        const ey = mouse.y - pos.y;
        const ed = Math.hypot(ex, ey) || 1;
        const r = Math.min(1, ed / 90);
        lookX = (ex / ed) * 6 * r;
        lookY = (ey / ed) * 4.5 * r;
      }

      const tilt = Math.max(-18, Math.min(18, vx * 2.4));
      const stretch = Math.min(0.12, Math.hypot(vx, vy) * 0.012);
      if (rootRef.current) rootRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (bodyRef.current)
        bodyRef.current.style.transform = `rotate(${tilt}deg) scale(${1 - stretch * 0.5}, ${1 + stretch})`;
      if (eyesRef.current) eyesRef.current.setAttribute("transform", `translate(${lookX.toFixed(2)} ${lookY.toFixed(2)})`);
      if (shadowRef.current) {
        const lift = still ? 0.5 : (Math.sin(t * 1.9) + 1) / 2;
        shadowRef.current.style.transform = `translateX(-50%) scale(${0.75 + (1 - lift) * 0.25})`;
        shadowRef.current.style.opacity = String(0.18 + (1 - lift) * 0.14);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onMove = (e) => {
      if (e.pointerType === "touch" && !L.drag) return;
      L.mouse = { x: e.clientX, y: e.clientY };
      if (L.drag) {
        const d = L.drag;
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) {
          d.moved = true;
          rootRef.current?.classList.add("is-dragging");
          sfx.blip();
        }
        if (d.moved) {
          const c = clampHome({ x: e.clientX - d.ox, y: e.clientY - d.oy });
          d.x = c.x;
          d.y = c.y;
        }
      }
    };
    const onLeave = () => (L.mouse = null);
    const onResize = () => {
      L.home = clampHome(L.home);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);

    // Blink every few seconds (sometimes twice).
    let blinkT = 0;
    const scheduleBlink = () => {
      blinkT = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        if (Math.random() < 0.3) setTimeout(() => {
          setBlink(true);
          setTimeout(() => setBlink(false), 110);
        }, 260);
        scheduleBlink();
      }, 2200 + Math.random() * 3200);
    };
    scheduleBlink();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(blinkT);
      clearTimeout(bubbleTimer.current);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // A contextual hint whenever the visitor reaches a new chapter.
  const firstChapter = useRef(true);
  useEffect(() => {
    if (hidden || !TIPS[chapter]) return;
    const delay = firstChapter.current ? 2600 : 500;
    firstChapter.current = false;
    const id = setTimeout(() => say(TIPS[chapter], 3600), delay);
    return () => clearTimeout(id);
  }, [chapter, hidden]);

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const L = live.current;
    L.drag = { sx: e.clientX, sy: e.clientY, ox: e.clientX - L.pos.x, oy: e.clientY - L.pos.y, x: L.pos.x, y: L.pos.y, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = () => {
    const L = live.current;
    const d = L.drag;
    L.drag = null;
    rootRef.current?.classList.remove("is-dragging");
    if (!d) return;
    if (d.moved) {
      L.home = { x: d.x, y: d.y };
      setSide(d.x > window.innerWidth / 2 ? "left" : "right");
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({ fx: d.x / window.innerWidth, fy: d.y / window.innerHeight }));
      } catch {}
      say("Wheee! I'll wait here.", 1800);
      return;
    }
    // Plain click: little hearts, then open the chat.
    const id = Date.now();
    setHearts((h) => [...h, ...[0, 1, 2, 3].map((i) => ({ id: `${id}-${i}`, i }))]);
    setTimeout(() => setHearts((h) => h.filter((x) => !String(x.id).startsWith(String(id)))), 1000);
    setBubble("");
    rootRef.current?.classList.remove("is-booped");
    void rootRef.current?.offsetWidth;
    rootRef.current?.classList.add("is-booped");
    onOpen();
  };

  // Petting: rub the cursor over Bit and it melts into hearts.
  const popHeart = (love) => {
    const id = `${performance.now()}-${Math.random()}`;
    const glyphs = love ? ["♥", "♥", "♡", "✦"] : ["♥", "♡", "✦", "♥"];
    const roll = Math.random();
    const item = {
      id,
      g: glyphs[Math.floor(Math.random() * glyphs.length)],
      x: (Math.random() - 0.5) * 70,
      r: (Math.random() - 0.5) * 50,
      s: 0.8 + Math.random() * (love ? 0.9 : 0.5),
      c: roll < 0.55 ? "pink" : roll < 0.8 ? "red" : "amber",
    };
    setPops((p) => [...p.slice(-14), item]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1300);
  };

  const onPetMove = (e) => {
    const P = pet.current;
    if (live.current.drag || e.pointerType === "touch") return;
    const pt = { x: e.clientX, y: e.clientY };
    if (P.last) P.dist += Math.hypot(pt.x - P.last.x, pt.y - P.last.y);
    P.last = pt;
    if (P.dist < 70) return;
    P.dist = 0;
    P.total += 1;
    const love = P.total >= 10;
    setMood(love ? "love" : "pet");
    popHeart(love);
    sfx.pet(love);
    const now = performance.now();
    if (now - P.lineAt > 2400) {
      P.lineAt = now;
      const lines = love ? LOVE_LINES : PET_LINES;
      say(lines[Math.floor(Math.random() * lines.length)], 2200);
    }
    clearTimeout(P.calm);
    P.calm = setTimeout(() => {
      setMood(live.current.hover ? "happy" : "idle");
      P.total = Math.max(0, P.total - 4);
    }, 900);
  };

  const onEnter = () => {
    live.current.hover = true;
    setHover(true);
    setMood("happy");
    sfx.blip();
    say(HOVER_LINES[Math.floor(Math.random() * HOVER_LINES.length)], 2600);
  };
  const onLeaveBot = () => {
    live.current.hover = false;
    setHover(false);
    pet.current.last = null;
    clearTimeout(pet.current.calm);
    pet.current.calm = setTimeout(() => setMood("idle"), 500);
  };

  return (
    <div
      ref={rootRef}
      className={`bit ${hidden ? "is-hidden" : ""} ${hover ? "is-hover" : ""} bit--${mood} bit--bubble-${side}`}
      aria-hidden={hidden}
    >
      <span className="bit__shadow" ref={shadowRef} />
      <button
        type="button"
        className="bit__btn"
        aria-label="Chat with Ansh's AI assistant"
        data-cursor="Chat"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (live.current.drag = null)}
        onPointerEnter={onEnter}
        onPointerLeave={onLeaveBot}
        onPointerMove={onPetMove}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
        onFocus={() => say("Press Enter to chat with me!", 2600)}
        tabIndex={hidden ? -1 : 0}
      >
        <span className="bit__halo" />
        <span className="bit__body" ref={bodyRef}>
          <svg viewBox="0 0 120 120" className="bit__svg">
            {/* antenna with a little heart */}
            <path d="M60 30 Q57 20 62 13" className="bit__stalk" />
            <path d="M62 15 C55 9 55 2 60 2 C62 2 63 4 63 5 C63 4 64 2 66 2 C71 2 71 9 63 15 Z" className="bit__bulb" />
            {/* tiny arms */}
            <ellipse cx="17" cy="84" rx="7" ry="10" className="bit__arm bit__arm--l" />
            <ellipse cx="103" cy="84" rx="7" ry="10" className="bit__arm bit__arm--r" />
            {/* chubby body */}
            <path d="M60 28 C88 28 104 46 104 72 C104 96 86 108 60 108 C34 108 16 96 16 72 C16 46 32 28 60 28 Z" className="bit__shell" />
            <path d="M30 52 Q38 38 54 35" className="bit__shine" />
            <circle cx="27" cy="62" r="3" className="bit__shine-dot" />
            {/* face screen */}
            <rect x="27" y="50" width="66" height="44" rx="22" className="bit__screen" />
            <g ref={eyesRef}>
              {mood === "love" ? (
                <>
                  <path d="M46 78 C36 71 37 63 42 63 C44.5 63 46 65 46 66.5 C46 65 47.5 63 50 63 C55 63 56 71 46 78 Z" className="bit__love" />
                  <path d="M74 78 C64 71 65 63 70 63 C72.5 63 74 65 74 66.5 C74 65 75.5 63 78 63 C83 63 84 71 74 78 Z" className="bit__love" />
                </>
              ) : mood === "pet" ? (
                <>
                  <path d="M39 68 Q46 75 53 68" className="bit__happy" />
                  <path d="M67 68 Q74 75 81 68" className="bit__happy" />
                </>
              ) : hover ? (
                <>
                  <path d="M38 73 Q46 62 54 73" className="bit__happy" />
                  <path d="M66 73 Q74 62 82 73" className="bit__happy" />
                </>
              ) : (
                <>
                  <g className={`bit__eye ${blink ? "is-blink" : ""}`}>
                    <ellipse cx="46" cy="70" rx="8" ry="9.5" className="bit__pupil" />
                    <circle cx="49" cy="66" r="3.2" className="bit__spark" />
                    <circle cx="43.5" cy="74" r="1.5" className="bit__spark" />
                  </g>
                  <g className={`bit__eye ${blink ? "is-blink" : ""}`}>
                    <ellipse cx="74" cy="70" rx="8" ry="9.5" className="bit__pupil" />
                    <circle cx="77" cy="66" r="3.2" className="bit__spark" />
                    <circle cx="71.5" cy="74" r="1.5" className="bit__spark" />
                  </g>
                </>
              )}
              {/* cat-like "w" mouth */}
              {mood === "pet" || mood === "love" ? (
                <path d="M54 81 Q60 90 66 81 Z" className="bit__mouth-open" />
              ) : (
                <path d="M55 82 Q57.5 85.5 60 82 Q62.5 85.5 65 82" className="bit__mouth" />
              )}
              <ellipse cx="35" cy="83" rx="5.5" ry="3.2" className="bit__cheek" />
              <ellipse cx="85" cy="83" rx="5.5" ry="3.2" className="bit__cheek" />
            </g>
            {/* little feet */}
            <ellipse cx="46" cy="109" rx="9" ry="4.5" className="bit__foot" />
            <ellipse cx="74" cy="109" rx="9" ry="4.5" className="bit__foot" />
          </svg>
        </span>
        {hearts.map((h) => (
          <span key={h.id} className={`bit__heart bit__heart--${h.i}`}>
            ♥
          </span>
        ))}
      </button>
      {pops.map((h) => (
        <span
          key={h.id}
          className={`bit__pop bit__pop--${h.c}`}
          style={{ "--px": `${h.x}px`, "--pr": `${h.r}deg`, "--ps": h.s }}
          aria-hidden="true"
        >
          {h.g}
        </span>
      ))}
      <span className={`bit__bubble text-mono ${bubble ? "is-on" : ""}`} role="status">
        {bubble}
      </span>
    </div>
  );
}
