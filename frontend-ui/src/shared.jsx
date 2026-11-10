import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sfx, isSoundOn, setSoundOn, onSoundChange } from "./sound.js";
import { unlock } from "./Achievements.jsx";

// ============================================================
// Shared by the main page and the contact page.
// ============================================================

// The API is served from the same domain under /api (Vercel in production, the Vite proxy in
// development). Set VITE_API_URL only if the backend lives on a different domain. It is NOT a
// secret: API keys live only on the backend server and never reach the browser.
export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
export const GITHUB_USERNAME = "martian172";
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
export const EMAIL = "singhanshz172@gmail.com";
export const LINKEDIN_URL = "https://www.linkedin.com/in/anshz";
export const RESUME_URL = `${import.meta.env.BASE_URL}Ansh_Singh_Resume.pdf`;
export const RESUME_FILE = "Ansh_Singh_Resume.pdf";

export const grabResume = () => {
  sfx.powerUp();
  unlock("loot");
};
export const openLinkedIn = () => unlock("party");
export const CONTACT_URL = `${import.meta.env.BASE_URL}contact/`;

export const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ============================================================
// CUSTOM CURSOR (dot + ring + contextual label)
// ============================================================

export function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches && !reduceMotion();
    setEnabled(fine);
    if (!fine) return;
    document.documentElement.classList.add("has-cursor");

    const target = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };
    let frame;

    const move = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (dotRef.current) dotRef.current.style.transform = `translate(${target.x}px, ${target.y}px)`;
    };
    const over = (e) => {
      const el = e.target.closest?.("[data-cursor], a, button");
      setLabel(el ? el.getAttribute("data-cursor") || "•" : "");
    };
    const tick = () => {
      ring.x += (target.x - ring.x) * 0.18;
      ring.y += (target.y - ring.y) * 0.18;
      if (ringRef.current) ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px)`;
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    tick();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  if (!enabled) return null;
  const active = label !== "";
  return (
    <div className="cursor" aria-hidden="true">
      <div ref={ringRef} className="cursor__pos">
        <div className={`cursor__ring ${active ? "is-active" : ""} ${label.length > 1 ? "has-label" : ""}`}>
          {label.length > 1 && <span className="cursor__label">{label}</span>}
        </div>
      </div>
      <div ref={dotRef} className="cursor__pos">
        <div className="cursor__dot" />
      </div>
    </div>
  );
}

// ============================================================
// HOOKS
// ============================================================

function useDelhiClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" });
}

// Isolated so the per-second tick only re-renders the clock, not the whole page.
export function DelhiClock({ label = "New Delhi " }) {
  return (
    <span>
      {label}
      {useDelhiClock()}
    </span>
  );
}

export function SoundToggle() {
  const [soundOn, setSoundOnState] = useState(isSoundOn);
  useEffect(() => onSoundChange(setSoundOnState), []);
  return (
    <button
      className={`sound-toggle ${soundOn ? "is-on" : ""}`}
      onClick={() => setSoundOn(!soundOn)}
      aria-pressed={soundOn}
      aria-label={soundOn ? "Mute sound effects" : "Turn on sound effects"}
      data-cursor={soundOn ? "Mute" : "Sound"}
    >
      {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
      <span className="sound-toggle__bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}

export function SiteFooter({ topHref = "#home" }) {
  return (
  <footer className="site-footer">
    <div className="container site-footer__grid">
      <div>
        <div className="wordmark">
          ANSH<b>.</b>SINGH
        </div>
        <p className="text-mono dim">AI Engineer · New Delhi, IN</p>
      </div>
      <div className="site-footer__col text-mono">
        <span className="dim">Contact</span>
        <a href={`mailto:${EMAIL}`} className="site-footer__mail">{EMAIL}</a>
      </div>
      <div className="site-footer__col text-mono">
        <span className="dim">Elsewhere</span>
        <a href={GITHUB_PROFILE_URL} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" onClick={openLinkedIn}>
          LinkedIn ↗
        </a>
        <a href={RESUME_URL} download={RESUME_FILE} onClick={grabResume}>
          Resume (PDF) ↓
        </a>
      </div>
      <div className="site-footer__col text-mono">
        <span className="dim">© {new Date().getFullYear()}</span>
        <span>Built with FastAPI, Groq &amp; React</span>
        <a href={topHref}>Back to top ↑</a>
      </div>
    </div>
  </footer>
  );
}
