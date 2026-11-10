import { useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { useSmoothScrub } from "./SplitStory.jsx";
import { sfx } from "./sound.js";

// ============================================================
// 02 THE FACTORY — repos ride a conveyor belt under a press.
// Raw boxes (dashed outlines) get stamped into "SHIPPED" crates
// as they pass under the press. Scroll drives the belt.
// ============================================================

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function splitName(name) {
  const i = name.lastIndexOf("-") > 0 ? name.lastIndexOf("-") : name.lastIndexOf("_");
  if (i <= 0) return [name.toUpperCase(), ""];
  return [name.slice(0, i + 1).toUpperCase(), name.slice(i + 1)];
}

function Gear({ className }) {
  const teeth = Array.from({ length: 10 }, (_, i) => i * 36);
  return (
    <svg viewBox="0 0 100 100" className={`gear ${className}`} aria-hidden="true">
      {teeth.map((a) => (
        <rect key={a} x="44" y="2" width="12" height="16" rx="2" transform={`rotate(${a} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="36" />
      <circle cx="50" cy="50" r="10" className="gear__hole" />
    </svg>
  );
}

function Rack({ seed }) {
  return (
    <div className="rack-unit" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="rack-unit__cell">
          {(i * 7 + seed * 3) % 5 === 0 && <i className={(i + seed) % 2 ? "tall" : ""} />}
        </span>
      ))}
    </div>
  );
}

export default function Factory({ repos, loading, profileUrl }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const wallRef = useRef(null);
  const poleRef = useRef(null);
  const beltRef = useRef(null);
  const gearsRef = useRef(null);
  const plateRef = useRef(null);
  const labelRef = useRef(null);
  const labelTextRef = useRef(null);
  const countRef = useRef(null);
  const boxRefs = useRef([]);
  const states = useRef([]);
  const primed = useRef(false);
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
    states.current = [];
    primed.current = false;
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [repos.length, loading]);

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
      wallRef.current.style.transform = `translate3d(${x * 0.4}px,0,0)`;
      poleRef.current.style.transform = `translate3d(${x * 1.35}px,0,0)`;
      beltRef.current.style.setProperty("--roll", `${-x * 0.9}deg`);
      beltRef.current.style.setProperty("--shift", `${x}px`);
      gearsRef.current.style.setProperty("--spin", `${-x * 0.35}deg`);

      // Which boxes have passed under the press?
      const pressX = window.innerWidth / 2;
      let shipped = 0;
      let stamp = 0;
      let nearest = null;
      let nearestDist = Infinity;
      boxRefs.current.forEach((el, i) => {
        if (!el) return;
        const center = el.offsetLeft + el.offsetWidth / 2 + x;
        const isShipped = center < pressX;
        if (isShipped) shipped += 1;
        const d = Math.abs(center - pressX);
        stamp = Math.max(stamp, 1 - d / (el.offsetWidth * 0.55));
        if (d < nearestDist) {
          nearestDist = d;
          nearest = el;
        }
        if (states.current[i] !== isShipped) {
          el.classList.toggle("is-shipped", isShipped);
          if (primed.current && isShipped) {
            el.classList.remove("just-stamped");
            void el.offsetWidth; // restart animation
            el.classList.add("just-stamped");
            sfx.stamp();
          }
          states.current[i] = isShipped;
        }
      });
      primed.current = true;

      plateRef.current.style.transform = `translateY(${clamp01(stamp) * window.innerHeight * 0.034}px)`;
      if (nearest) {
        labelTextRef.current.textContent = nearest.dataset.name;
        labelRef.current.href = nearest.dataset.href;
      }
      const total = boxRefs.current.filter(Boolean).length;
      countRef.current.textContent = `${String(shipped).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    },
    animated
  );

  const items = loading ? [] : repos;

  return (
    <section
      id="lab"
      ref={sectionRef}
      className={`factory ${animated ? "is-animated" : ""}`}
      style={animated ? { height: `calc(100svh + ${distance}px)` } : undefined}
      data-chapter
      data-night
    >
      <div className="factory__sticky">
        <div className="factory__wall" ref={wallRef} aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <Rack key={i} seed={i} />
          ))}
        </div>
        <div className="factory__rail" aria-hidden="true" />
        <div className="factory__gears" ref={gearsRef} aria-hidden="true">
          <Gear className="gear--a" />
          <Gear className="gear--b" />
          <Gear className="gear--c" />
        </div>

        <header className="factory__head">
          <span className="kicker text-mono">
            <b>02</b> The factory
          </span>
          <h2 className="factory__title">
            Built in public.
            <br />
            <em>Shipped on repeat.</em>
          </h2>
        </header>

        {/* The press */}
        <div className="press" aria-hidden="true">
          <span className="press__rod" />
          <div className="press__head">
            <span className="press__bolt" />
            <span className="press__bolt" />
            <span className="press__lights">
              <i />
              <i />
              <i />
            </span>
          </div>
          <span className="press__piston" />
          <span className="press__plate-wrap">
            <span className="press__plate" ref={plateRef} />
          </span>
        </div>
        <a className="press__label text-mono" ref={labelRef} href={profileUrl} target="_blank" rel="noreferrer" data-cursor="Open">
          <span ref={labelTextRef}>{loading ? "loading…" : "github"}</span> <ArrowUpRight size={13} />
        </a>

        {/* Boxes on the belt */}
        <div className="factory__track" ref={trackRef}>
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="box box--ghost">
                <span className="box__raw" />
              </div>
            ))}
          {items.map((repo, i) => {
            const [bold, light] = splitName(repo.name);
            return (
              <a
                key={repo.id}
                ref={(el) => (boxRefs.current[i] = el)}
                className="box"
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                draggable="false"
                data-name={repo.name}
                data-href={repo.html_url}
                data-cursor="Open"
              >
                <span className="box__raw">
                  <svg viewBox="0 0 48 32" className="box__code">
                    <path d="M14 6 L4 16 L14 26 M34 6 L44 16 L34 26 M28 3 L20 29" />
                  </svg>
                  <span className="text-mono">{repo.name.replace(/[-_]/g, "- ")}</span>
                </span>
                <span className="box__crate">
                  <span className="box__tape" />
                  <span className="box__top text-mono">
                    <span className="box__vendor">
                      <FaGithub size={12} /> Martian172
                    </span>
                    <span className="box__stamp">Shipped</span>
                  </span>
                  <span className="box__name">
                    <b style={{ fontSize: `${Math.min(2.2, 24 / bold.length).toFixed(2)}em` }}>{bold}</b>
                    {light && <span>{light}</span>}
                  </span>
                  <span className="box__desc">{repo.description || "Freshly packed. Ask the AI what's inside."}</span>
                  <span className="box__foot text-mono">
                    <span>{repo.language || "Code"}</span>
                    <span>★ {repo.stargazers_count}</span>
                    <span className="box__gh">
                      GitHub <ArrowUpRight size={11} />
                    </span>
                  </span>
                </span>
              </a>
            );
          })}
        </div>

        <div className="belt2" ref={beltRef} aria-hidden="true">
          <div className="belt2__rollers">
            {Array.from({ length: 40 }).map((_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="belt2__hazard" />
        </div>
        <div className="factory__pole" ref={poleRef} aria-hidden="true" />

        <div className="factory__count text-mono">
          <span ref={countRef}>00 / {String(items.length).padStart(2, "0")}</span>
          <a href={profileUrl} target="_blank" rel="noreferrer" className="link-line">
            Full inventory ↗
          </a>
        </div>
      </div>
    </section>
  );
}
