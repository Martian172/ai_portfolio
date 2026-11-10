import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ChevronRight, Mail, Download } from "lucide-react";
import { FaLinkedin } from "react-icons/fa";
import { sfx } from "./sound.js";

// ============================================================
// Scroll-scrubbed split hero ("Model vs Product") + finale.
// Halves slide apart on scroll, the mascot rises from the centre,
// the name strip types itself, then the halves close again.
// ============================================================

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Smoothed scroll scrubbing: the animation eases toward the scroll position
// instead of jumping with each mouse-wheel notch (like GSAP's `scrub: 0.6`).
export function useSmoothScrub(getTarget, draw, enabled = true, smoothing = 0.12) {
  useEffect(() => {
    if (!enabled) return;
    let current = getTarget();
    let target = current;
    let frame = 0;
    let running = false;
    draw(current);

    const tick = () => {
      current += (target - current) * smoothing;
      if (Math.abs(target - current) < 0.0004) current = target;
      draw(current);
      if (current !== target) frame = requestAnimationFrame(tick);
      else running = false;
    };
    const onScroll = () => {
      target = getTarget();
      if (!running) {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const NAME_LINE = "ANSH SINGH · AI ENGINEER · NEW DELHI · SINCE 2022";


// ------------------------------------------------------------
// MASCOT — half solid "model" robot, half amber blueprint "product"
// ------------------------------------------------------------

const STRIPES = Array.from({ length: 9 }, (_, i) => {
  const y = 212 + i * 21;
  const w = 94 - i * 7.5;
  const d = 16 + i * 1.6;
  return {
    d: `M${300 - w} ${y} Q${300 - w * 0.42} ${y + 2} 300 ${y + d} Q${300 + w * 0.42} ${y + 2} ${300 + w} ${y}`,
    o: 1 - i * 0.07,
  };
});

function RobotShapes({ blueprint }) {
  // Cyberpunk hooded figure, inspired by neon "hacker in a hood" art:
  // dark hood with red rim light, studio headphones with glowing rings,
  // a black mask crossed by curved neon stripes that pulse in a wave.
  // Symmetric so it splits: left half rendered, right half amber blueprint.
  const solid = !blueprint;
  const A = "#ffb547";
  const line = blueprint ? A : "none";
  return (
    <g>
      <defs>
        <radialGradient id="cpHood" cx="50%" cy="20%" r="80%">
          <stop offset="0" stopColor="#3b3f47" />
          <stop offset=".5" stopColor="#1b1d22" />
          <stop offset="1" stopColor="#08090b" />
        </radialGradient>
        <linearGradient id="cpCoat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24272d" />
          <stop offset="1" stopColor="#060708" />
        </linearGradient>
        <linearGradient id="cpRim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff3b2a" />
          <stop offset=".6" stopColor="#ea1d0f" stopOpacity=".5" />
          <stop offset="1" stopColor="#ea1d0f" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cpMask" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151516" />
          <stop offset="1" stopColor="#020203" />
        </linearGradient>
        <linearGradient id="cpNeon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset=".5" stopColor="#ff9a2e" />
          <stop offset="1" stopColor="#ff5a1f" />
        </linearGradient>
        <linearGradient id="cpCup" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a3d44" />
          <stop offset="1" stopColor="#0b0c0e" />
        </linearGradient>
        <radialGradient id="cpChestGlow" cx="50%" cy="0%" r="70%">
          <stop offset="0" stopColor="#ff9a2e" stopOpacity=".35" />
          <stop offset="1" stopColor="#ff9a2e" stopOpacity="0" />
        </radialGradient>
        <filter id="cpGlow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* shoulders */}
      <path
        d="M28 640 C46 528 150 458 300 454 C450 458 554 528 572 640 Z"
        fill={solid ? "url(#cpCoat)" : "url(#hatch)"}
        stroke={line}
        strokeWidth="3"
      />
      {solid && <path d="M40 600 C64 520 150 466 262 456" fill="none" stroke="url(#cpRim)" strokeWidth="5" strokeLinecap="round" />}
      {solid && <ellipse cx="300" cy="500" rx="150" ry="70" fill="url(#cpChestGlow)" />}
      {/* zipper */}
      <path d="M300 492 L300 640" stroke={solid ? "#3a3d44" : A} strokeWidth="6" />
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M292 ${506 + i * 18} L308 ${506 + i * 18}`} stroke={solid ? "#55585f" : A} strokeWidth="3" opacity=".8" />
      ))}

      {/* hood */}
      <path
        d="M300 46 C196 52 136 140 128 272 C122 372 148 444 190 494 L410 494 C452 444 478 372 472 272 C464 140 404 52 300 46 Z"
        fill={solid ? "url(#cpHood)" : "url(#hatch)"}
        stroke={line}
        strokeWidth="3"
      />
      {solid && (
        <>
          <path d="M268 54 C186 74 140 156 134 270 C130 352 148 420 182 476" fill="none" stroke="url(#cpRim)" strokeWidth="6" strokeLinecap="round" />
          <path d="M300 46 C284 70 274 96 270 124 M210 112 C176 170 164 240 168 320" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="6" strokeLinecap="round" />
        </>
      )}

      {/* opening + mask */}
      <path
        d="M300 122 C226 124 184 186 180 278 C176 370 214 436 262 470 L338 470 C386 436 424 370 420 278 C416 186 374 124 300 122 Z"
        fill={solid ? "#030304" : "#0b0d11"}
        stroke={line}
        strokeWidth="2"
      />
      <path
        d="M300 150 C240 152 206 204 204 282 C202 362 236 420 284 448 L316 448 C364 420 398 362 396 282 C394 204 360 152 300 150 Z"
        fill={solid ? "url(#cpMask)" : "#0f1217"}
        stroke={solid ? "#26272b" : A}
        strokeWidth={solid ? 2 : 3}
      />
      {solid && <path d="M232 190 C244 168 264 156 286 152" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="4" strokeLinecap="round" />}

      {/* neon stripes */}
      <g className="m-eyes" filter={solid ? "url(#cpGlow)" : undefined}>
        {STRIPES.map((st, i) => (
          <path
            key={i}
            d={st.d}
            fill="none"
            stroke={solid ? "url(#cpNeon)" : A}
            strokeWidth={solid ? 5 : 2.5}
            strokeLinecap="round"
            opacity={st.o}
            className="m-chev"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </g>
      <path d="M300 196 L300 420" stroke={solid ? "#ff9a2e" : A} strokeWidth="2" opacity=".35" />

      {/* headphones */}
      <path d="M150 262 C148 132 216 86 300 86 C384 86 452 132 450 262" fill="none" stroke={solid ? "#14151a" : A} strokeWidth={solid ? 18 : 4} strokeLinecap="round" />
      {solid && <path d="M160 230 C164 136 224 98 300 98" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3" strokeLinecap="round" />}
      {[136, 464].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="300" rx="36" ry="60" fill={solid ? "url(#cpCup)" : "#0f1217"} stroke={line} strokeWidth="3" />
          <ellipse
            cx={cx}
            cy="300"
            rx="26"
            ry="48"
            fill="none"
            stroke={solid ? "url(#cpNeon)" : A}
            strokeWidth={solid ? 6 : 3}
            filter={solid ? "url(#cpGlow)" : undefined}
            className="m-led"
          />
          <ellipse cx={cx} cy="300" rx="14" ry="30" fill={solid ? "#0b0c0e" : "none"} stroke={blueprint ? A : "#2c2e34"} strokeWidth="2" />
        </g>
      ))}
    </g>
  );
}

function Mascot({ onPoke, quip, talking, label = "Poke the robot mascot", cursor = "Poke" }) {
  return (
    <button
      className={`mascot ${talking ? "is-talking" : ""}`}
      onClick={onPoke}
      onMouseEnter={() => sfx.blip()}
      aria-label={label}
      data-cursor={cursor}
    >
      <span className="mascot__bubble text-mono">{quip}</span>
      <svg viewBox="0 0 600 640" className="mascot__svg" aria-hidden="true">
        <defs>
          <pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#1a0f0b" />
            <line x1="0" y1="11" x2="12" y2="11" stroke="#ffb547" strokeWidth="1.4" opacity=".55" />
          </pattern>
          <clipPath id="clip-left">
            <rect x="0" y="0" width="300" height="640" />
          </clipPath>
          <clipPath id="clip-right">
            <rect x="300" y="0" width="300" height="640" />
          </clipPath>
        </defs>
        <g clipPath="url(#clip-left)">
          <RobotShapes />
        </g>
        <g clipPath="url(#clip-right)">
          <RobotShapes blueprint />
        </g>
        <line x1="300" y1="20" x2="300" y2="640" stroke="#f4f1ea" strokeWidth="2" strokeDasharray="6 9" opacity=".55" />
      </svg>
    </button>
  );
}


// ------------------------------------------------------------
// SCENES (original illustrations for each half)
// ------------------------------------------------------------

function FrontScene() {
  return (
    <div className="scene scene--front" aria-hidden="true">
      <div className="nb">
        <div className="nb__bar">
          <i />
          <i />
          <i />
          <span className="text-mono">train.ipynb</span>
        </div>
        <div className="nb__body">
          <div className="nb__code">
            <b />
            <s style={{ width: "88%" }} />
            <s style={{ width: "64%" }} />
            <s style={{ width: "76%" }} />
            <div className="nb__run text-mono">
              Run ▶
              <svg viewBox="0 0 24 24" className="nb__cursor">
                <path d="M3 2 L3 19 L8 14 L11.5 21.5 L14.5 20 L11 13 L18 13 Z" />
              </svg>
            </div>
            <div className="nb__chips text-mono">
              <span>acc .98</span>
              <span>f1 .97</span>
            </div>
          </div>
          <div className="nb__chart">
            <svg viewBox="0 0 100 70">
              <path d="M6 10 C24 46 40 56 94 62" />
              <circle cx="86" cy="18" r="6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="tile tile--net">
        <svg viewBox="0 0 100 80">
          {[[18, 20], [18, 60]].flatMap(([x1, y1]) =>
            [[50, 14], [50, 40], [50, 66]].map(([x2, y2]) => <line key={`${x1}${y1}${x2}${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />)
          )}
          {[[50, 14], [50, 40], [50, 66]].map(([x, y]) => <line key={`o${y}`} x1={x} y1={y} x2="84" y2="40" />)}
          {[[18, 20], [18, 60], [50, 14], [50, 40], [50, 66]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" />)}
          <circle cx="84" cy="40" r="8" className="hot" />
        </svg>
      </div>

      <div className="tile tile--gpu">
        <div className="gpu">
          <span className="text-mono">GPU</span>
        </div>
      </div>

      <div className="dataset">
        <div className="dataset__head" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dataset__row">
            <i />
            <i />
            <i />
          </div>
        ))}
      </div>
      <div className="floor floor--front" />
    </div>
  );
}

const trainLines = [
  "$ python train.py --epochs 20",
  "epoch 20  loss 0.034 ✓",
  "$ docker build -t ansh/api .",
  "$ curl /api/predict",
  "HTTP 200 · p95 82ms",
];

function SceneTerminal() {
  const [lines, setLines] = useState(() => (reduceMotion() ? trainLines : []));
  const [typing, setTyping] = useState("");
  useEffect(() => {
    if (reduceMotion()) return;
    let line = 0;
    let ch = 0;
    let id;
    const step = () => {
      const cur = trainLines[line];
      if (ch <= cur.length) {
        setTyping(cur.slice(0, ch++));
        id = setTimeout(step, cur.startsWith("$") ? 42 : 16);
      } else {
        setLines((prev) => [...prev, cur]);
        setTyping("");
        line += 1;
        ch = 0;
        if (line >= trainLines.length) {
          id = setTimeout(() => {
            setLines([]);
            line = 0;
            step();
          }, 3600);
        } else id = setTimeout(step, 420);
      }
    };
    id = setTimeout(step, 700);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="sterm">
      <div className="sterm__bar">
        <i />
        <i />
        <i />
      </div>
      <div className="sterm__body">
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith("$") ? "" : "ok"}>
            {l}
          </div>
        ))}
        <div className={typing.startsWith("$") || typing === "" ? "" : "ok"}>
          {typing}
          <span className="sterm__caret" />
        </div>
      </div>
    </div>
  );
}

function BackScene() {
  return (
    <div className="scene scene--back" aria-hidden="true">
      <div className="stars" />
      <SceneTerminal />
      <svg className="cables" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M30 70 C30 78 20 76 20 86" />
        <path d="M74 70 C74 80 86 78 86 86" />
      </svg>
      <div className="rack">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rack__slot">
            <i className={i === 1 || i === 2 ? "on" : ""} />
            <i className={i === 2 ? "red" : ""} />
            {i === 0 && <span className="rack__box" />}
          </div>
        ))}
      </div>
      <div className="db">
        <span className="db__top" />
        <span className="db__ring" />
        <span className="db__ring db__ring--2" />
        <span className="db__icon text-mono">vec</span>
      </div>
      <div className="floor floor--back" />
    </div>
  );
}

// ------------------------------------------------------------
// STORY (pinned, scroll-scrubbed)
// ------------------------------------------------------------

export function SplitStory({ onSkip, onOpenChat }) {
  const sectionRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const heroRef = useRef(null);
  const bannerRef = useRef(null);
  const hintRef = useRef(null);
  const pickRef = useRef(null);
  const chatCtaRef = useRef(null);
  const nameRef = useRef(null);
  const nameTextRef = useRef(null);
  const skipRef = useRef(null);
  const poweredRef = useRef(false);
  const [animated] = useState(() => !reduceMotion());

  useEffect(() => {
    if (!animated && nameTextRef.current) nameTextRef.current.textContent = NAME_LINE;
  }, [animated]);

  const getProgress = () => {
    const section = sectionRef.current;
    if (!section) return 0;
    const total = section.offsetHeight - window.innerHeight;
    return clamp01(-section.getBoundingClientRect().top / Math.max(1, total));
  };

  useSmoothScrub(getProgress, (p) => render(p), animated);

  function render(p) {
    {
      if (!sectionRef.current || !frontRef.current) return;
      const q = (sel) => sectionRef.current.querySelectorAll(sel);
      const mobile = window.innerWidth < 760;
      const openAmount = mobile ? 46 : 30; // % of each half's width

      // 1) banner + hint + opening captions leave
      const b = seg(p, 0, 0.08);
      bannerRef.current.style.opacity = 1 - b;
      bannerRef.current.style.transform = `scale(${1 - 0.15 * b})`;
      hintRef.current.style.opacity = 1 - seg(p, 0, 0.05);
      const capOut = seg(p, 0.1, 0.18);
      q('[data-cap="open"]').forEach((el) => {
        el.style.opacity = 1 - capOut;
        el.style.transform = `translateY(${-20 * capOut}px)`;
      });

      // 2) halves open, 3) close again
      const open = easeInOut(seg(p, 0.18, 0.4)) * (1 - easeInOut(seg(p, 0.74, 0.92)));
      frontRef.current.style.transform = `translate3d(${-openAmount * open}%,0,0)`;
      backRef.current.style.transform = `translate3d(${openAmount * open}%,0,0)`;

      // mascot rises from the centre
      const rise = easeOut(seg(p, 0.24, 0.48));
      heroRef.current.style.transform = `translate3d(-50%, ${105 * (1 - rise)}%, 0)`;

      // centre caption
      const pick = seg(p, 0.4, 0.48) * (1 - seg(p, 0.7, 0.76));
      pickRef.current.style.opacity = pick;
      pickRef.current.style.transform = `translate(-50%, ${16 * (1 - seg(p, 0.4, 0.48))}px)`;

      // "Chat with me" call-to-action + mascot speech bubble while the stage is open
      const cta = seg(p, 0.44, 0.52) * (1 - seg(p, 0.7, 0.76));
      chatCtaRef.current.style.opacity = cta;
      chatCtaRef.current.style.transform = `translate(-50%, ${14 * (1 - seg(p, 0.44, 0.52))}px)`;
      chatCtaRef.current.style.pointerEvents = cta > 0.5 ? "auto" : "none";

      // power-up sound once each time the mascot fully rises
      if (rise > 0.9 && !poweredRef.current) {
        poweredRef.current = true;
        sfx.powerUp();
      } else if (rise < 0.2) poweredRef.current = false;

      // name strip types itself
      const typed = Math.round(NAME_LINE.length * seg(p, 0.56, 0.7));
      nameRef.current.style.opacity = typed > 0 ? 1 : 0;
      nameTextRef.current.textContent = NAME_LINE.slice(0, typed) + (typed > 0 && typed < NAME_LINE.length ? "▌" : "");

      // closing captions
      const capIn = seg(p, 0.82, 0.9);
      q('[data-cap="close"]').forEach((el) => {
        el.style.opacity = capIn;
        el.style.transform = `translateY(${16 * (1 - capIn)}px)`;
      });

      skipRef.current.classList.toggle("is-on", p > 0.06 && p < 0.96);
    }
  }

  const scrollIntoStory = () => {
    const s = sectionRef.current;
    if (!s) return;
    window.scrollTo({ top: s.offsetTop + window.innerHeight * 1.3, behavior: reduceMotion() ? "auto" : "smooth" });
  };

  return (
    <section
      className={`split split--story ${animated ? "is-animated" : ""}`}
      id="home"
      ref={sectionRef}
      data-chapter
    >
      <div className="split__stage">
        <div className="split__glow" />
        <div className="split__hero" ref={heroRef}>
          <Mascot
            onPoke={onOpenChat}
            quip="Hi! I'm Ansh's AI. Click me to chat 💬"
            talking={false}
            label="Chat with Ansh's AI"
            cursor="Chat"
          />
        </div>
        <p className="caption caption--center" ref={pickRef}>
          <span>Two sides.</span>
          <em>One engineer.</em>
        </p>
        <button className="split__chat text-mono" ref={chatCtaRef} onClick={onOpenChat} data-cursor="Chat">
          <span className="online-dot" /> Interview my AI twin →
        </button>

        <div className="split__half split__half--front" ref={frontRef}>
          <div className="split__half-inner">
            <FrontScene />
            <p className="caption caption--front" data-cap="open">
              Every <em>model</em>
            </p>
            <p className="caption caption--front caption--close" data-cap="close">
              I build <em>both</em>
            </p>
          </div>
        </div>
        <div className="split__half split__half--back" ref={backRef}>
          <div className="split__half-inner">
            <BackScene />
            <p className="caption caption--back" data-cap="open">
              Needs a <em>product</em>…
            </p>
            <p className="caption caption--back caption--close" data-cap="close">
              <em>End to end.</em>
            </p>
          </div>
        </div>

        <div className="split__banner" ref={bannerRef}>
          <h1 className="split__banner-inner">
            <span className="split__banner-front">Model</span>
            <span className="split__hex">vs</span>
            <span className="split__banner-back">Product</span>
          </h1>
        </div>

        <button className="split__hint text-mono" ref={hintRef} onClick={scrollIntoStory} data-cursor="Scroll">
          Scroll down <ArrowDown size={14} />
        </button>

        <p className="split__name text-mono" ref={nameRef}>
          <span className="split__name-text" ref={nameTextRef} />
        </p>
      </div>

      <button className="skip-story text-mono" ref={skipRef} onClick={onSkip} data-cursor="Skip">
        Skip the story <ChevronRight size={14} />
      </button>
    </section>
  );
}

// ------------------------------------------------------------
// FINALE (halves slide in, mascot rises onto the floor, CTA)
// ------------------------------------------------------------

export function SplitFinale({ email, onOpenChat, linkedin, onLinkedIn, resumeUrl, resumeFile, onResume, contactUrl }) {
  const sectionRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const heroRef = useRef(null);
  const [animated] = useState(() => !reduceMotion());
  const [lit, setLit] = useState(() => reduceMotion());
  const litRef = useRef(reduceMotion());

  const getProgress = () => {
    const s = sectionRef.current;
    return s ? clamp01(1 - s.getBoundingClientRect().top / window.innerHeight) : 0;
  };
  useSmoothScrub(
    getProgress,
    (p) => {
      if (!frontRef.current) return;
      const slide = easeOut(seg(p, 0, 0.6));
      frontRef.current.style.transform = `translate3d(${-100 * (1 - slide)}%,0,0)`;
      backRef.current.style.transform = `translate3d(${100 * (1 - slide)}%,0,0)`;
      const rise = easeOut(seg(p, 0.3, 0.75));
      heroRef.current.style.transform = `translate3d(-50%, ${100 * (1 - rise)}%, 0)`;
      heroRef.current.classList.toggle("is-inviting", rise > 0.95);
      if (p > 0.85 && !litRef.current) {
        litRef.current = true;
        setLit(true);
        sfx.buzz();
      }
    },
    animated
  );

  return (
    <section className="split split--finale" id="contact" ref={sectionRef}>
      <div className="split__stage">
        <div className="split__glow" />
        <div className="split__half split__half--front" ref={frontRef}>
          <div className="split__half-inner">
            <p className="caption caption--front">
              Got a <em>model</em>
            </p>
          </div>
        </div>
        <div className="split__half split__half--back" ref={backRef}>
          <div className="split__half-inner">
            <div className="stars" />
            <p className="caption caption--back">
              That needs <em>shipping?</em>
            </p>
            <div className={`neon text-mono ${lit ? "is-lit" : ""}`} aria-hidden="true">
              Open to work
            </div>
          </div>
        </div>
        <div className="split__hero" ref={heroRef}>
          <Mascot
            onPoke={onOpenChat}
            quip="Still curious? Ask me anything 💬"
            talking={false}
            label="Chat with Ansh's AI"
            cursor="Chat"
          />
        </div>
        <div className="split__cta">
          <a href={contactUrl || `mailto:${email}`} className="btn btn--red" data-cursor="Contact">
            Start a project <ArrowRight size={16} />
          </a>
          <button className="btn btn--night" onClick={onOpenChat} data-cursor="Chat">
            Ask my AI first
          </button>
          <div className="split__chips">
            <a href={`mailto:${email}`} className="split__mail text-mono">
              <Mail size={12} /> <span className="split__mail-full">{email}</span>
              <span className="split__mail-short">Email</span>
            </a>
            <a href={linkedin} target="_blank" rel="noreferrer" onClick={onLinkedIn} className="split__mail text-mono" data-cursor="Connect">
              <FaLinkedin size={12} /> LinkedIn
            </a>
            <a href={resumeUrl} download={resumeFile} onClick={onResume} className="split__mail split__mail--loot text-mono" data-cursor="Download">
              <Download size={12} /> Resume.pdf
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
