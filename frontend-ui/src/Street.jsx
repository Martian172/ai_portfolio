import { useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useSmoothScrub } from "./SplitStory.jsx";
import { sfx } from "./sound.js";

// ============================================================
// 01 THE STREET — projects as shop fronts on a sideways street.
// Vertical scroll drives the street sideways, with parallax sky,
// clouds and a back-row city. Each shop window shows the real UI.
// ============================================================

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Illustrated screens for projects without a web UI.
function ScreenArt({ type }) {
  if (type === "chain")
    return (
      <div className="screen-art screen-art--chain">
        <div className="sa-bar text-mono">chain.run(&quot;summarise → critique → rewrite&quot;)</div>
        <div className="sa-chain">
          {["summarise", "critique", "rewrite"].map((s, i) => (
            <span key={s} className={i === 2 ? "on" : ""}>
              {s}
            </span>
          ))}
        </div>
        <div className="sa-stats text-mono">
          <span>A/B  p = 0.031 ✓</span>
          <span>cost $0.0042</span>
          <span>cache hit 68%</span>
        </div>
      </div>
    );
  return (
    <div className="screen-art screen-art--canvas">
      {["ink", "pop", "sumi", "neon", "pastel", "mosaic", "noir", "dream"].map((s, i) => (
        <span key={s} className={`sw sw${i % 4}`}>
          <i className="text-mono">{s}</i>
        </span>
      ))}
    </div>
  );
}

function Shop({ p, onAsk }) {
  const open = p.live || p.repo;
  return (
    <article className={`store store--${p.theme}`} onMouseEnter={() => sfx.blip()}>
      <div className="store__upper">
        <i />
        <i />
        <i />
      </div>
      <a className="store__sign" href={open} target="_blank" rel="noreferrer" data-cursor="Open">
        <span className="store__no text-mono">{p.no}</span>
        <span className="store__plate">{p.title}</span>
      </a>
      <div className="store__awning" />
      <div className="store__ground">
        <a className="store__window" href={open} target="_blank" rel="noreferrer" data-cursor="Open">
          {p.shot ? <img src={p.shot} alt={`${p.title} interface`} loading="lazy" /> : <ScreenArt type={p.art} />}
          <span className="store__glare" />
        </a>
        <a className="store__door" href={open} target="_blank" rel="noreferrer" data-cursor="Enter" aria-label={`Open ${p.title}`}>
          <span className="store__inside" aria-hidden="true">
            <span className="store__inside-lamp" />
            <span className="store__inside-mat" />
          </span>
          <span className="store__leaf">
            <span className="store__door-panel" />
            <span className="store__knob" />
            {p.live && <span className="store__open text-mono">Open</span>}
          </span>
        </a>
      </div>
      <div className="store__fascia text-mono">
        <span>
          {p.kind} · {p.year}
        </span>
        <span className="store__links">
          <button onClick={() => onAsk(`Tell me about the ${p.title} project`)} data-cursor="Ask AI">
            Ask AI
          </button>
          {p.live && (
            <a href={p.live} target="_blank" rel="noreferrer" data-cursor="Live" className="store__live">
              Live <ArrowUpRight size={11} />
            </a>
          )}
          <a href={p.repo} target="_blank" rel="noreferrer" data-cursor="Code">
            Code <ArrowUpRight size={11} />
          </a>
        </span>
      </div>
    </article>
  );
}

function Lamp() {
  return (
    <div className="lamp" aria-hidden="true">
      <span className="lamp__head" />
      <span className="lamp__glow" />
      <span className="lamp__post" />
    </div>
  );
}

// More vertical scroll per pixel of sideways travel = a slower, calmer walk.
const SLOW = 1.8;

export default function Street({ projects, onAsk, onStart }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const cityRef = useRef(null);
  const cloudsRef = useRef(null);
  const sunRef = useRef(null);
  const roadRef = useRef(null);
  const countRef = useRef(null);
  const distRef = useRef(0);
  const [distance, setDistance] = useState(0);
  const [animated] = useState(() => !reduceMotion());

  useLayoutEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const d = Math.max(0, trackRef.current.scrollWidth - window.innerWidth);
      distRef.current = d;
      setDistance(d);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [projects.length]);

  const getProgress = () => {
    const s = sectionRef.current;
    if (!s) return 0;
    const total = s.offsetHeight - window.innerHeight;
    return clamp01(-s.getBoundingClientRect().top / Math.max(1, total));
  };

  useSmoothScrub(
    getProgress,
    (p) => {
      if (!trackRef.current) return;
      const x = -p * distRef.current;
      trackRef.current.style.transform = `translate3d(${x}px,0,0)`;
      cityRef.current.style.transform = `translate3d(${x * 0.45}px,0,0)`;
      cloudsRef.current.style.transform = `translate3d(${x * 0.2}px,0,0)`;
      sunRef.current.style.transform = `translate3d(${x * 0.06}px, ${p * 40}px,0)`;
      roadRef.current.style.backgroundPositionX = `${x}px`;
      const idx = Math.min(projects.length, 1 + Math.floor(p * projects.length * 0.999));
      countRef.current.textContent = `${String(idx).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}`;
    },
    animated
  );

  return (
    <section
      id="pipeline"
      ref={sectionRef}
      className={`street ${animated ? "is-animated" : ""}`}
      style={animated ? { height: `calc(100svh + ${Math.round(distance * SLOW)}px)` } : undefined}
      data-chapter
    >
      <div className="street__sticky">
        <div className="street__sun" ref={sunRef} aria-hidden="true" />
        <div className="street__clouds" ref={cloudsRef} aria-hidden="true">
          {[6, 38, 71, 104, 140, 176].map((l, i) => (
            <span key={l} className="cloud" style={{ left: `${l}vw`, top: `${18 + (i % 3) * 7}svh`, "--s": 0.7 + (i % 3) * 0.25 }} />
          ))}
        </div>

        <header className="street__head">
          <span className="kicker text-mono">
            <b>01</b> The street
          </span>
          <h2 className="street__title">
            The product is
            <br />
            what people <em>use.</em>
          </h2>
          <span className="street__sub text-mono">
            <i /> Keep scrolling ↓ to walk the street
          </span>
        </header>

        <div className="street__city" ref={cityRef} aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} className="bld" style={{ "--h": `${18 + ((i * 37) % 23)}svh`, "--w": `${7 + ((i * 13) % 6)}vw` }} />
          ))}
        </div>

        <div className="street__track" ref={trackRef}>
          {projects.map((p, i) => (
            <div className="street__lot" key={p.no}>
              <Shop p={p} onAsk={onAsk} />
              {i < projects.length && <Lamp />}
            </div>
          ))}
          <div className="street__lot">
            <div className="store store--empty">
              <div className="forrent">
                <span className="text-mono">Lot {String(projects.length + 1).padStart(2, "0")} · for rent</span>
                <strong>Your project could open here.</strong>
                <button className="btn btn--red" onClick={onStart} data-cursor="Let's talk">
                  Start a project <ArrowUpRight size={15} />
                </button>
              </div>
              <span className="forrent__post" />
            </div>
          </div>
        </div>

        <div className="street__ground" ref={roadRef} aria-hidden="true" />
        <div className="street__count text-mono" ref={countRef}>
          01 / {String(projects.length).padStart(2, "0")}
        </div>
      </div>
    </section>
  );
}
