import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, Copy, Download, LoaderCircle, Mail, X } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { sfx } from "./sound.js";
import Achievements, { TrophyButton, unlock } from "./Achievements.jsx";
import {
  API_URL, EMAIL, GITHUB_PROFILE_URL, LINKEDIN_URL, RESUME_URL, RESUME_FILE,
  grabResume, openLinkedIn, reduceMotion, Cursor, DelhiClock, SoundToggle, SiteFooter,
} from "./shared.jsx";

// ============================================================
// CONTACT PAGE: terminal intro → choose a mission → conversational form → direct links.
// Messages go to /api/contact, which emails them to Ansh (keys stay on the server).
// ============================================================

const HOME = import.meta.env.BASE_URL;

const MISSIONS = [
  {
    no: "01",
    name: "Full-time role",
    desc: "Hiring an AI / ML engineer? Tell me about the team, the role and the problems you're solving.",
    tags: ["AI Engineer", "ML Engineer", "GenAI", "Remote / On-site"],
    line: "Hi Ansh, I'm hiring for a full-time role.",
  },
  {
    no: "02",
    name: "Freelance project",
    desc: "A GenAI feature, RAG assistant or AI agent you want built and shipped end to end.",
    tags: ["LLM apps", "RAG", "FastAPI", "React"],
    line: "Hi Ansh, I have a project I'd like built.",
  },
  {
    no: "03",
    name: "MLOps & deployment",
    desc: "A model that works in a notebook but needs an API, containers, CI/CD and monitoring.",
    tags: ["Docker", "CI/CD", "Monitoring", "APIs"],
    line: "Hi Ansh, I need help getting a model into production.",
  },
  {
    no: "04",
    name: "Just saying hi",
    desc: "Research, collaboration, feedback on the site, or a question about one of my projects.",
    tags: ["Collab", "Research", "Feedback"],
    line: "Hi Ansh, just wanted to say hello.",
  },
];

const PROMPTS = "1. Company / team: \n2. What you need: \n3. Remote or on-site: ";
const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/;
const LIMITS = { name: 80, email: 254, message: 4000 };

// Text the visitor actually wrote, ignoring the mission line and the numbered prompt labels.
function ownWords(message) {
  let rest = message;
  for (const m of MISSIONS) rest = rest.replace(m.line, "");
  return rest.replace(/^\s*\d\.\s*(Company \/ team|What you need|Remote or on-site):/gm, "").replace(/\s+/g, " ").trim();
}

function validate({ name, email, message }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = "Please enter your name (at least 2 characters).";
  else if (/[\r\n<>]/.test(name)) errors.name = "Names can't contain < > or line breaks.";
  if (!EMAIL_RE.test(email.trim())) errors.email = "That email address doesn't look right. Check for typos.";
  if (ownWords(message).length < 15) errors.message = "Add a few more words so I know how to help (15+ characters).";
  return errors;
}

// ------------------------------------------------------------
// Header theme follows the section underneath (night or paper)
// ------------------------------------------------------------
function useHeaderTheme() {
  const [theme, setTheme] = useState("night");
  useEffect(() => {
    let frame;
    const update = () => {
      let t = "paper";
      document.querySelectorAll("[data-night]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= 40 && r.bottom > 40) t = "night";
      });
      setTheme(t);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return theme;
}

// ------------------------------------------------------------
// Hero terminal: lines print one after another
// ------------------------------------------------------------
const TERMINAL = [
  { cmd: "whoami", out: <>Ansh Singh <span className="dim">—</span> AI Engineer</> },
  { cmd: "cat status", out: <><span className="c-term__ok">● Available</span> for full-time roles</> },
  { cmd: "cat base", out: <>New Delhi, IN <span className="dim">·</span> <DelhiClock label="" /> IST</> },
  { cmd: "cat stack", out: <>Python · PyTorch · FastAPI · LLMs</> },
  { cmd: "cat reply_time", out: <>Usually within 24–48 hours</> },
];

function HeroTerminal() {
  const [shown, setShown] = useState(() => (reduceMotion() ? TERMINAL.length : 0));
  useEffect(() => {
    if (shown >= TERMINAL.length) return;
    const id = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 450 : 380);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <div className="terminal c-term" aria-label="About Ansh">
      <div className="terminal__bar text-mono">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>ansh@portfolio — contact</span>
        <span className="terminal__led">Online</span>
      </div>
      <div className="c-term__body">
        {TERMINAL.map((l, i) => (
          <div key={l.cmd} className={`c-term__row ${i < shown ? "is-in" : ""}`}>
            <div className="c-term__cmd text-mono">
              <span className="prompt-sign">guest@recruiter:~$</span> {l.cmd}
            </div>
            <div className="c-term__out">{l.out}</div>
          </div>
        ))}
        <div className="c-term__cmd text-mono">
          <span className="prompt-sign">guest@recruiter:~$</span> <span className="terminal__caret" />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
export default function ContactPage() {
  const headerTheme = useHeaderTheme();
  const [trophiesOpen, setTrophiesOpen] = useState(false);
  const [mission, setMission] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ state: "idle", error: "" }); // idle | sending | sent | error
  const [copied, setCopied] = useState(false);
  const messageRef = useRef(null);
  const nameRef = useRef(null);

  const errors = useMemo(() => validate(form), [form]);
  const showError = (field) => (touched[field] || status.state === "error-validation") && errors[field];

  const goTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });

  // Picking a mission writes (or swaps) the first line of the message.
  function chooseMission(m) {
    sfx.tick();
    const next = mission?.name === m.name ? null : m;
    setMission(next);
    setForm((f) => {
      let msg = f.message;
      const prev = MISSIONS.find((x) => msg.startsWith(x.line));
      if (prev) msg = msg.slice(prev.line.length).replace(/^\n+/, "");
      if (!next) return { ...f, message: msg.trim() === PROMPTS.trim() ? "" : msg };
      const body = msg.trim() ? msg : PROMPTS;
      return { ...f, message: `${next.line}\n\n${body}` };
    });
  }

  function clearMission() {
    if (mission) chooseMission(mission);
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value.slice(0, LIMITS[field] ?? 200) }));
  }

  async function submit(e) {
    e.preventDefault();
    if (status.state === "sending") return;
    setTouched({ name: true, email: true, message: true });
    if (Object.keys(errors).length) {
      setStatus({ state: "error-validation", error: "" });
      sfx.tick();
      return;
    }
    setStatus({ state: "sending", error: "" });
    sfx.send();
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          mission: mission?.name ?? null,
          website: form.website,
        }),
      });
      if (!res.ok) {
        // Only show the server's own wording for the cases it writes for visitors;
        // anything else (404, 500, proxy errors) gets one plain fallback.
        let detail = "";
        if ([429, 502, 503].includes(res.status)) {
          try {
            const data = await res.json();
            detail = typeof data.detail === "string" ? data.detail : "";
          } catch {
            /* not JSON */
          }
        }
        if (res.status === 422) detail = "Some fields need another look. Check your name, email and message.";
        throw new Error(detail || "The message service isn't reachable right now. Please email me directly.");
      }
      setStatus({ state: "sent", error: "" });
      sfx.chime();
      unlock("signal");
    } catch (err) {
      // A network failure throws a browser TypeError ("Failed to fetch"); never show that raw text.
      const friendly = err instanceof TypeError ? "" : err.message;
      setStatus({ state: "error", error: friendly || "The message service isn't reachable right now. Please email me directly." });
    }
  }

  function reset() {
    setForm({ name: "", email: "", message: "", website: "" });
    setMission(null);
    setTouched({});
    setStatus({ state: "idle", error: "" });
    setTimeout(() => nameRef.current?.focus(), 50);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      sfx.tick();
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the address is visible and selectable */
    }
  }

  const sending = status.state === "sending";

  return (
    <>
      <Cursor />
      <Achievements open={trophiesOpen} setOpen={setTrophiesOpen} />
      <a href="#main" className="skip text-mono">
        Skip to content
      </a>

      {/* ---------------- HEADER ---------------- */}
      <header className={`site-header site-header--solid theme-${headerTheme}`} id="top">
        <a href={HOME} className="brand" data-cursor="Home" aria-label="Ansh Singh, home">
          <svg viewBox="0 0 40 40" className="brand__mark" aria-hidden="true">
            <path d="M20 4 A16 16 0 0 0 20 36 Z" className="brand__l" />
            <path d="M20 4 A16 16 0 0 1 20 36" className="brand__r" />
            <circle cx="13" cy="20" r="3.2" className="brand__dot" />
          </svg>
          <span className="brand__word">
            <span className="brand__top">
              <b>ANSH</b> SINGH
            </span>
            <span className="brand__bottom">AI ENGINEER</span>
          </span>
        </a>
        <nav className="site-header__nav text-mono" aria-label="Main">
          <a href={HOME}>Index</a>
          <a href={`${HOME}#pipeline`}>Work</a>
          <a href="#message" className="is-active" aria-current="page">
            Contact
          </a>
          <a href={RESUME_URL} download={RESUME_FILE} onClick={grabResume} className="site-header__resume" data-cursor="Download">
            Resume <Download size={12} />
          </a>
        </nav>
        <div className="site-header__meta text-mono">
          <span className="online-dot" />
          <DelhiClock />
          <TrophyButton open={trophiesOpen} onClick={() => { sfx.tick(); setTrophiesOpen((o) => !o); }} />
          <SoundToggle />
        </div>
      </header>

      <main id="main">
        {/* ---------------- HERO ---------------- */}
        <section className="c-hero" data-night>
          <div className="container c-hero__grid">
            <div className="c-hero__copy">
              <span className="kicker text-mono">
                <b>06</b> / Contact
              </span>
              <h1 className="chapter-title">
                Let's build <em>the whole thing</em>.
              </h1>
              <p className="lead">
                Hiring for an AI / ML role, need a GenAI feature shipped, or want to talk models? Pick a mission and
                send a message. It lands straight in my inbox.
              </p>
              <div className="c-hero__chips text-mono" aria-label="What I do">
                <span>Model</span>
                <span className="c-hero__plus">+</span>
                <span>Product</span>
              </div>
              <button className="c-hero__down text-mono" onClick={() => goTo("mission")} data-cursor="Scroll">
                Scroll down <ArrowDown size={14} />
              </button>
            </div>
            <HeroTerminal />
          </div>
        </section>

        {/* ---------------- MISSION ---------------- */}
        <section className="c-mission" id="mission">
          <div className="container">
            <header className="section-head">
              <span className="kicker text-mono">
                <b>01</b> / Mission
              </span>
              <h2 className="chapter-title">
                Choose your <em>mission</em>.
              </h2>
              <p className="c-help">Pick the closest one: it writes the first line of your message.</p>
            </header>
            <div className="c-missions" role="group" aria-label="Missions">
              {MISSIONS.map((m) => {
                const on = mission?.name === m.name;
                return (
                  <button
                    key={m.no}
                    type="button"
                    className={`c-card ${on ? "is-on" : ""}`}
                    aria-pressed={on}
                    onClick={() => chooseMission(m)}
                    onMouseEnter={() => sfx.blip()}
                    data-cursor={on ? "Unselect" : "Select"}
                  >
                    <span className="c-card__top text-mono">
                      <span className="c-card__no">{m.no}</span>
                      <span className="c-card__state">
                        {on ? (
                          <>
                            <Check size={12} /> Selected
                          </>
                        ) : (
                          "Select"
                        )}
                      </span>
                    </span>
                    <span className="c-card__name">{m.name}</span>
                    <span className="c-card__desc">{m.desc}</span>
                    <span className="c-card__tags text-mono">
                      {m.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- MESSAGE ---------------- */}
        <section className="c-message" id="message" data-night>
          <div className="container c-message__grid">
            <header className="c-message__head">
              <span className="kicker text-mono">
                <b>02</b> / Message
              </span>
              <h2 className="chapter-title">
                Tell me what you're <em>building</em>.
              </h2>
              <p className="lead">I read every message myself and usually reply within 24–48 hours.</p>
            </header>

            {status.state === "sent" ? (
              <div className="terminal c-sent" role="status">
                <div className="terminal__bar text-mono">
                  <span className="dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>transmission log</span>
                  <span className="terminal__led">Delivered</span>
                </div>
                <div className="c-term__body">
                  <div className="c-term__cmd text-mono">
                    <span className="prompt-sign">guest@recruiter:~$</span> send --to ansh
                  </div>
                  <div className="c-term__out">
                    <span className="c-term__ok">✓ Message delivered.</span> Thanks, {form.name.trim().split(" ")[0]}. I'll
                    reply to <b>{form.email.trim()}</b> soon.
                  </div>
                  <div className="c-sent__actions">
                    <button className="btn btn--night" onClick={reset} data-cursor="Again">
                      Send another
                    </button>
                    <a className="btn btn--red" href={HOME} data-cursor="Home">
                      Back to the site <ArrowRight size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <form className="c-form" onSubmit={submit} noValidate>
                <div className="c-field">
                  <label htmlFor="c-name">Why don't we start with your name?</label>
                  <input
                    ref={nameRef}
                    id="c-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={update("name")}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    aria-invalid={Boolean(showError("name"))}
                    aria-describedby={showError("name") ? "c-name-err" : undefined}
                    maxLength={LIMITS.name}
                    required
                  />
                  {showError("name") && (
                    <p className="c-err" id="c-name-err">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="c-field">
                  <label htmlFor="c-email">Then, your email address?</label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={update("email")}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    aria-invalid={Boolean(showError("email"))}
                    aria-describedby={showError("email") ? "c-email-err" : undefined}
                    maxLength={LIMITS.email}
                    required
                  />
                  {showError("email") && (
                    <p className="c-err" id="c-email-err">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="c-field">
                  <div className="c-field__row">
                    <label htmlFor="c-message">And finally, your message.</label>
                    {mission && (
                      <button type="button" className="c-chip text-mono" onClick={clearMission} aria-label={`Remove mission ${mission.name}`}>
                        Mission: {mission.name} <X size={12} />
                      </button>
                    )}
                  </div>
                  <textarea
                    ref={messageRef}
                    id="c-message"
                    name="message"
                    rows={7}
                    placeholder={"Tell me about the role or project.\n\n" + PROMPTS}
                    value={form.message}
                    onChange={update("message")}
                    onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                    aria-invalid={Boolean(showError("message"))}
                    aria-describedby={`c-message-count${showError("message") ? " c-message-err" : ""}`}
                    maxLength={LIMITS.message}
                    required
                  />
                  <div className="c-field__foot">
                    {showError("message") ? (
                      <p className="c-err" id="c-message-err">
                        {errors.message}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="c-count text-mono" id="c-message-count">
                      {form.message.length} / {LIMITS.message}
                    </span>
                  </div>
                </div>

                {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
                <div className="c-hp" aria-hidden="true">
                  <label htmlFor="c-website">Leave this field empty</label>
                  <input id="c-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update("website")} />
                </div>

                {status.state === "error" && (
                  <div className="c-alert" role="alert">
                    <p>{status.error}</p>
                    <a href={`mailto:${EMAIL}`} className="text-mono">
                      <Mail size={12} /> {EMAIL}
                    </a>
                  </div>
                )}

                <div className="c-form__submit">
                  <button className="btn btn--red btn--big" type="submit" disabled={sending} data-cursor="Send">
                    {sending ? (
                      <>
                        Transmitting <LoaderCircle size={16} className="spin" />
                      </>
                    ) : (
                      <>
                        Send message <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  <p className="c-privacy text-mono">Only used to reply to you. Sent to my inbox; this site doesn't store it.</p>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ---------------- DIRECT ---------------- */}
        <section className="c-direct">
          <div className="container">
            <header className="section-head">
              <span className="kicker text-mono">
                <b>03</b> / Direct
              </span>
              <h2 className="chapter-title">
                Prefer the <em>direct route</em>?
              </h2>
            </header>
            <dl className="c-direct__grid">
              <div className="c-direct__item">
                <dt className="text-mono">Direct mail</dt>
                <dd>
                  <a href={`mailto:${EMAIL}`} className="c-direct__big" data-cursor="Email">
                    {EMAIL}
                  </a>
                  <button className="c-copy text-mono" onClick={copyEmail} data-cursor="Copy">
                    {copied ? (
                      <>
                        <Check size={12} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                </dd>
              </div>
              <div className="c-direct__item">
                <dt className="text-mono">Elsewhere</dt>
                <dd className="c-direct__links">
                  <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" onClick={openLinkedIn} data-cursor="Connect">
                    <FaLinkedin size={16} /> LinkedIn ↗
                  </a>
                  <a href={GITHUB_PROFILE_URL} target="_blank" rel="noreferrer" data-cursor="GitHub">
                    <FaGithub size={16} /> GitHub ↗
                  </a>
                  <a href={RESUME_URL} download={RESUME_FILE} onClick={grabResume} data-cursor="Download">
                    <Download size={16} /> Resume (PDF) ↓
                  </a>
                </dd>
              </div>
              <div className="c-direct__item">
                <dt className="text-mono">Base</dt>
                <dd>
                  New Delhi, India <span className="dim">· IST (UTC+5:30)</span>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter topHref="#top" />
    </>
  );
}
