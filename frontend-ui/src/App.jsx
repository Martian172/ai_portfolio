import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { ArrowRight, Send, LoaderCircle, Mail, Volume2, VolumeX, Save, Download } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { SplitStory, SplitFinale } from "./SplitStory.jsx";
import ChatWidget from "./ChatWidget.jsx";
import Buddy from "./Buddy.jsx";
import Street from "./Street.jsx";
import Factory from "./Factory.jsx";
import { sfx, isSoundOn, setSoundOn, onSoundChange } from "./sound.js";
import Achievements, { TrophyButton, unlock } from "./Achievements.jsx";

// ============================================================
// CONFIGURATION & CONTENT (from Ansh's resume)
// ============================================================

// The API is served from the same domain under /api (Vercel in production, the Vite proxy in
// development). Set VITE_API_URL only if the backend lives on a different domain. It is NOT a
// secret: API keys live only on the backend server and never reach the browser.
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const GITHUB_USERNAME = "martian172";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const EMAIL = "singhanshz172@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/anshz";
const RESUME_URL = `${import.meta.env.BASE_URL}Ansh_Singh_Resume.pdf`;
const RESUME_FILE = "Ansh_Singh_Resume.pdf";

const grabResume = () => {
  sfx.powerUp();
  unlock("loot");
};
const openLinkedIn = () => unlock("party");

// RPG-style inventory: the downloadable / outbound links, styled as item slots.
const inventory = [
  {
    id: "resume",
    name: "Resume",
    meta: ".PDF · 66 KB",
    rarity: "Legendary",
    href: RESUME_URL,
    download: RESUME_FILE,
    icon: <Save size={22} />,
    cursor: "Download",
    onClick: grabResume,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    meta: "/in/anshz",
    rarity: "Rare",
    href: LINKEDIN_URL,
    external: true,
    icon: <FaLinkedin size={22} />,
    cursor: "Connect",
    onClick: openLinkedIn,
  },
  {
    id: "github",
    name: "GitHub",
    meta: "@martian172",
    rarity: "Rare",
    href: GITHUB_PROFILE_URL,
    external: true,
    icon: <FaGithub size={22} />,
    cursor: "GitHub",
  },
  {
    id: "email",
    name: "Email",
    meta: "Say hi",
    rarity: "Common",
    href: `mailto:${EMAIL}`,
    icon: <Mail size={22} />,
    cursor: "Email",
  },
];

const projects = [
  {
    no: "01",
    title: "CardioSense AI",
    kind: "ML · Healthcare",
    year: "2026",
    blurb: "Real-time ECG anomaly detection: PyTorch autoencoder, FastAPI inference, React UI and a Gemini RAG assistant.",
    repo: `https://github.com/${GITHUB_USERNAME}/cardiosense_ai`,
    live: "https://cardiosenseai-neon.vercel.app",
    shot: "/shots/cardiosense.png",
    theme: "dark",
  },
  {
    no: "02",
    title: "CompanyLens",
    kind: "AI Agents · Research",
    year: "2026",
    blurb: "Agentic research app that crawls company sites and writes structured profiles, pain points and PDF reports.",
    repo: `https://github.com/${GITHUB_USERNAME}/CompanyLens-AI`,
    live: "https://companylens-ai.vercel.app",
    shot: "/shots/companylens.png",
    theme: "red",
  },
  {
    no: "03",
    title: "MLOps Sentinel",
    kind: "MLOps · Monitoring",
    year: "2026",
    blurb: "Production model monitoring: KS/PSI drift detection, Prometheus metrics, WebSocket dashboard, Grafana.",
    repo: `https://github.com/${GITHUB_USERNAME}/mlops-sentinel`,
    live: "https://mlops-sentinel.onrender.com",
    shot: "/shots/sentinel.png",
    theme: "light",
  },
  {
    no: "04",
    title: "LLM Chain Forge",
    kind: "GenAI · Framework",
    year: "2026",
    blurb: "Build, test and statistically A/B-test multi-step LLM prompt chains with caching and cost tracking.",
    repo: `https://github.com/${GITHUB_USERNAME}/llm-chain-forge`,
    art: "chain",
    theme: "red",
  },
  {
    no: "05",
    title: "Neural Canvas",
    kind: "Vision · API",
    year: "2026",
    blurb: "Artistic image stylization engine with 8 style presets served through a FastAPI REST API and web UI.",
    repo: `https://github.com/${GITHUB_USERNAME}/neural-canvas`,
    art: "canvas",
    theme: "dark",
  },
];

const missions = [
  {
    no: "01",
    name: "GenAI & LLM apps",
    desc: "RAG assistants, prompt-chain pipelines and agentic tools that are grounded, measurable and cheap to run.",
    loadout: ["LangChain", "RAG", "FAISS", "ChromaDB", "OpenAI API", "Anthropic API", "Gemini API", "LoRA / QLoRA", "Prompt Engineering"],
    related: ["LLM Chain Forge", "CompanyLens", "CardioSense AI"],
    question: "What GenAI and LLM applications have you built, and how did you make them reliable?",
  },
  {
    no: "02",
    name: "ML & deep learning",
    desc: "From EDA to trained model: anomaly detection, NLP, CNNs and autoencoders with honest evaluation.",
    loadout: ["PyTorch", "TensorFlow", "Scikit-learn", "CNNs", "Autoencoders", "NLP", "Anomaly Detection", "Transformers"],
    related: ["CardioSense AI", "Neural Canvas"],
    question: "Walk me through your machine learning and deep learning experience.",
  },
  {
    no: "03",
    name: "MLOps & shipping",
    desc: "APIs, containers, CI/CD and monitoring, so models survive contact with real users (400K+ at Gumlabs).",
    loadout: ["FastAPI", "Docker", "GitHub Actions", "CI/CD", "PostgreSQL", "JWT Auth", "Vercel", "Prometheus"],
    related: ["MLOps Sentinel", "CardioSense AI"],
    question: "How have you deployed and monitored ML models in production?",
  },
  {
    no: "04",
    name: "Data & analytics",
    desc: "Automated cleaning, EDA and dashboards that stakeholders actually use. Cut manual reporting by 40% at IBM.",
    loadout: ["SQL", "Pandas", "NumPy", "Power BI", "EDA", "Matplotlib", "Seaborn", "MS Excel"],
    related: ["IBM internship", "Prime Trade AI"],
    question: "Tell me about your data analyst internship at IBM.",
  },
];

const quests = [
  {
    role: "AI Engineer Intern",
    org: "Gumlabs Pvt. Ltd.",
    when: "Sep 2025 – Jun 2026",
    text: "Twik AI Voice Keyboard, scaled to 400K+ users. Integrated NLP and voice-to-text pipelines into production.",
  },
  {
    role: "Data Analyst Intern",
    org: "IBM",
    when: "Jun 2025 – Aug 2025",
    text: "Automated cleaning + EDA across 3 datasets (−30% inconsistencies) and built dashboards (−40% reporting time).",
  },
];

const chapters = [
  { id: "home", label: "Index" },
  { id: "pipeline", label: "The street" },
  { id: "lab", label: "The factory" },
  { id: "player", label: "Under the hood" },
  { id: "missions", label: "Missions" },
  { id: "terminal", label: "Ask the AI" },
  { id: "contact", label: "Contact" },
];

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ============================================================
// CUSTOM CURSOR (dot + ring + contextual label)
// ============================================================

function Cursor() {
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
function DelhiClock() {
  return <span>New Delhi {useDelhiClock()}</span>;
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [mission, setMission] = useState(0);
  const pctRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [soundOn, setSoundOnState] = useState(isSoundOn);
  useEffect(() => onSoundChange(setSoundOnState), []);
  const openChat = useCallback(() => {
    sfx.robot();
    setChatOpen(true);
  }, []);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [activeChapter, setActiveChapter] = useState("home");
  const [headerTheme, setHeaderTheme] = useState("split");
  const [trophiesOpen, setTrophiesOpen] = useState(false);

  // Achievements tied to how far the visitor has travelled.
  useEffect(() => {
    if (["pipeline", "lab", "player", "missions", "terminal", "contact"].includes(activeChapter)) unlock("start");
    if (activeChapter === "contact") unlock("end");
  }, [activeChapter]);

  const flipCard = (next) => {
    sfx.flip();
    setFlipped(next);
    unlock("flip");
  };

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! 👋 I'm Ansh's AI twin, trained on his resume and GitHub. Ask me about his projects, internships, skills or education.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

  // ---------------- GitHub repositories (live) ----------------
  useEffect(() => {
    fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) =>
        setRepos(
          data
            .filter((repo) => !repo.fork && !repo.name.toLowerCase().endsWith(".github.io"))
            .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        )
      )
      .catch((error) => console.error("GitHub fetch error:", error))
      .finally(() => setReposLoading(false));
  }, []);

  // ---------------- Scroll: progress %, header hide, active chapter ----------------
  useEffect(() => {
    let lastY = window.scrollY;
    let frame;
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (pctRef.current) pctRef.current.textContent = `${String(max > 0 ? Math.round((y / max) * 100) : 0).padStart(3, "0")}%`;
      setHeaderHidden(y > lastY && y > 400 && !(document.getElementById("home")?.getBoundingClientRect().bottom > 0));
      let theme = "paper";
      const heroEl = document.getElementById("home");
      const finaleEl = document.getElementById("contact");
      if (heroEl && heroEl.getBoundingClientRect().bottom > 60) theme = "split";
      else if (finaleEl && finaleEl.getBoundingClientRect().top <= 40) theme = "split";
      else
        document.querySelectorAll("[data-night]").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top <= 40 && r.bottom > 40) theme = "night";
        });
      setHeaderTheme(theme);
      lastY = y;
      for (const c of chapters) {
        const el = document.getElementById(c.id);
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.top <= window.innerHeight * 0.4 && r.bottom >= window.innerHeight * 0.4) setActiveChapter(c.id);
        }
      }
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

  // ---------------- Reveal on scroll + neon sign switch-on ----------------
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]:not(.is-in)");
    if (reduceMotion()) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
    };
  }, [reposLoading]);

  useEffect(() => {
    const el = chatBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ============================================================
  // STREAMING CHAT (same backend contract as before)
  // ============================================================

  async function sendMessage(customQuestion = null) {
    const question = (customQuestion || input).trim();
    if (!question || isStreaming) return;

    setInput("");
    const updatedMessages = [...messages, { role: "user", content: question }];
    setMessages([...updatedMessages, { role: "assistant", content: "", streaming: true }]);
    setIsStreaming(true);
    sfx.send();
    unlock("ask");

    try {
      const history = updatedMessages
        .filter((m) => m.content && m.content.trim())
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 5000) }));
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.slice(0, 1500), history }),
      });
      if (response.status === 429) {
        const wait = Number(response.headers.get("Retry-After")) || 60;
        const err = new Error("rate-limited");
        err.friendly = `⏳ You're asking faster than my rate limit allows. Please try again in ${
          wait > 120 ? `${Math.ceil(wait / 3600)} hour(s)` : `${wait} seconds`
        }.`;
        throw err;
      }
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      if (!response.body) throw new Error("Streaming response is unavailable.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantText, streaming: true };
          return updated;
        });
      }
      assistantText += decoder.decode();
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: assistantText || "I couldn't generate a response. Please try again.",
          streaming: false,
        };
        return updated;
      });
      sfx.chime();
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            error.friendly ||
            "⚠️ I couldn't reach the AI right now. Please try again in a moment, or email Ansh directly.",
          streaming: false,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  const goTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  }, []);

  function chooseMission(m) {
    goTo("terminal");
    sendMessage(m.question);
  }

  const m = missions[mission];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Cursor />
      <Achievements open={trophiesOpen} setOpen={setTrophiesOpen} />
      <Buddy onOpen={openChat} hidden={chatOpen} chapter={activeChapter} />
      <ChatWidget
        open={chatOpen}
        setOpen={setChatOpen}
        messages={messages}
        isStreaming={isStreaming}
        sendMessage={sendMessage}
        hideLauncher={activeChapter === "terminal" || activeChapter === "contact"}
      />
      <a href="#main" className="skip text-mono">
        Skip to content
      </a>

      {/* ---------------- HEADER ---------------- */}
      <header className={`site-header theme-${headerTheme} ${headerHidden ? "is-hidden" : ""}`}>
        <a href="#home" className="brand" data-cursor="Home" aria-label="Ansh Singh, home">
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
          <a href="#home" className={activeChapter === "home" ? "is-active" : ""}>Index</a>
          <a href="#pipeline" className={["pipeline", "lab", "player", "missions"].includes(activeChapter) ? "is-active" : ""}>Work</a>
          <a href="#contact" className={activeChapter === "contact" ? "is-active" : ""}>Contact</a>
          <a href={RESUME_URL} download={RESUME_FILE} onClick={grabResume} className="site-header__resume" data-cursor="Download">
            Resume <Download size={12} />
          </a>
        </nav>
        <div className="site-header__meta text-mono">
          <span className="online-dot" />
          <DelhiClock />
          <span className="site-header__pct" ref={pctRef}>000%</span>
          <TrophyButton open={trophiesOpen} onClick={() => { sfx.tick(); setTrophiesOpen((o) => !o); }} />
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
        </div>
      </header>

      {/* ---------------- CHAPTER NAV ---------------- */}
      <nav className={`chapter-nav text-mono ${activeChapter === "home" ? "is-hidden" : ""}`} aria-label="Chapters">
        {chapters.map((c, i) => (
          <a key={c.id} href={`#${c.id}`} className={activeChapter === c.id ? "is-active" : ""} data-cursor={c.label}>
            <span className="chapter-nav__no">{String(i).padStart(2, "0")}</span>
            <span className="chapter-nav__label">{c.label}</span>
          </a>
        ))}
      </nav>

      <main id="main">
        {/* ---------------- 00 SPLIT STORY (scroll: halves open, mascot rises) ---------------- */}
        <SplitStory onSkip={() => goTo("pipeline")} onOpenChat={openChat} />

        {/* ---------------- 01 THE STREET (projects as shops) ---------------- */}
        <Street
          projects={projects}
          onAsk={(q) => {
            openChat();
            sendMessage(q);
          }}
          onStart={() => goTo("contact")}
        />

        {/* ---------------- 02 THE FACTORY (repos on a conveyor) ---------------- */}
        <Factory repos={repos} loading={reposLoading} profileUrl={GITHUB_PROFILE_URL} />

        {/* ---------------- 03 UNDER THE HOOD (Player 1 card) ---------------- */}
        <section className="player" id="player" data-chapter data-night>
          <div className="container player__grid">
            <div className="player__intro" data-reveal>
              <span className="kicker text-mono">
                <b>03</b> / Under the hood
              </span>
              <h2 className="chapter-title">
                Player one, <em>ready</em>.
              </h2>
              <p className="lead">
                B.Tech in Industrial IoT (GGSIPU, 2026) who fell for machine learning, then for shipping it. I like
                problems where the model is only half the job and the other half is making it fast, observable and
                useful.
              </p>
              <div className="toggle text-mono" role="group" aria-label="Card side">
                <button className={!flipped ? "is-on" : ""} onClick={() => flipCard(false)}>
                  Stats
                </button>
                <button className={flipped ? "is-on" : ""} onClick={() => flipCard(true)}>
                  Quest log
                </button>
              </div>

              <div className="inventory">
                <div className="inventory__head text-mono">
                  <span>Inventory</span>
                  <span className="dim">{inventory.length} / 8 slots</span>
                </div>
                <ul className="inventory__slots">
                  {inventory.map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        className={`slot slot--${item.rarity.toLowerCase()}`}
                        download={item.download}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noreferrer" : undefined}
                        onClick={item.onClick}
                        onMouseEnter={() => sfx.blip()}
                        data-cursor={item.cursor}
                        aria-label={item.download ? `Download ${item.name} (PDF)` : `${item.name}: ${item.meta}`}
                      >
                        {item.download && <span className="slot__badge text-mono">New</span>}
                        <span className="slot__icon" aria-hidden="true">{item.icon}</span>
                        <span className="slot__name">{item.name}</span>
                        <span className="slot__meta text-mono">{item.meta}</span>
                        <span className="slot__rarity text-mono">{item.rarity}</span>
                      </a>
                    </li>
                  ))}
                  {Array.from({ length: 8 - inventory.length }).map((_, i) => (
                    <li key={`empty-${i}`} className="slot slot--empty" aria-hidden="true" />
                  ))}
                </ul>
              </div>
            </div>

            <div className="player__stage" data-reveal>
              <div className="player__light" aria-hidden="true" />
              <div className={`card3d ${flipped ? "is-flipped" : ""}`} onClick={() => flipCard(!flipped)} data-cursor="Flip">
                {/* Front: stats */}
                <article className="player__card card3d__face">
                  <header className="player__top text-mono">
                    <span>Player 1</span>
                    <span className="player__status">
                      <span className="online-dot" /> Available
                    </span>
                  </header>
                  <div className="player__name">Ansh Singh</div>
                  <div className="player__class text-mono">Class: AI Engineer · Lv. 22</div>
                  <div className="player__meter">
                    <div className="text-mono">
                      <span>XP · CGPA</span>
                      <span>8.45 / 10</span>
                    </div>
                    <span className="bar">
                      <i style={{ width: "84.5%" }} />
                    </span>
                  </div>
                  <dl className="player__stats">
                    <div>
                      <dt className="text-mono">Projects</dt>
                      <dd>{String(projects.length).padStart(2, "0")}</dd>
                    </div>
                    <div>
                      <dt className="text-mono">Internships</dt>
                      <dd>02</dd>
                    </div>
                    <div>
                      <dt className="text-mono">Users reached</dt>
                      <dd>400K+</dd>
                    </div>
                    <div>
                      <dt className="text-mono">Base</dt>
                      <dd>DEL</dd>
                    </div>
                  </dl>
                  <footer className="player__foot text-mono">Tap card to flip ↻</footer>
                </article>

                {/* Back: quest log */}
                <article className="player__card card3d__face card3d__back">
                  <header className="player__top text-mono">
                    <span>Quest log</span>
                    <span>2 completed</span>
                  </header>
                  <ol className="quests">
                    {quests.map((q) => (
                      <li key={q.org}>
                        <div className="quests__top">
                          <strong>{q.role}</strong>
                          <span className="text-mono">{q.when}</span>
                        </div>
                        <div className="quests__org text-mono">@ {q.org}</div>
                        <p>{q.text}</p>
                      </li>
                    ))}
                    <li>
                      <div className="quests__top">
                        <strong>B.Tech, Industrial IoT</strong>
                        <span className="text-mono">2022 – 2026</span>
                      </div>
                      <div className="quests__org text-mono">@ USAR, GGSIPU · CGPA 8.45</div>
                    </li>
                  </ol>
                  <footer className="player__foot text-mono">Tap card to flip ↻</footer>
                </article>
              </div>
              <div className="player__pedestal" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* ---------------- 04 MISSIONS ---------------- */}
        <section className="board" id="missions" data-chapter>
          <div className="container">
            <header className="section-head" data-reveal>
              <span className="kicker text-mono">
                <b>04</b> / Missions
              </span>
              <h2 className="chapter-title">
                Pick a <em>mission</em>.
              </h2>
            </header>

            <div className="board__inner" data-reveal>
              <div className="board__list" role="tablist" aria-label="Missions">
                {missions.map((item, i) => (
                  <button
                    key={item.no}
                    role="tab"
                    aria-selected={mission === i}
                    className={`board__item ${mission === i ? "is-on" : ""}`}
                    onClick={() => { sfx.tick(); setMission(i); }}
                    onMouseEnter={() => sfx.blip()}
                    data-cursor="Select"
                  >
                    <span className="board__number text-mono">{item.no}</span>
                    <span className="board__name">{item.name}</span>
                    <ArrowRight size={18} className="board__arrow" />
                  </button>
                ))}
              </div>

              <div className="board__panel" role="tabpanel" key={mission}>
                <span className="board__tag text-mono">Mission {m.no} · briefing</span>
                <h3 className="board__title">{m.name}</h3>
                <p className="board__desc">{m.desc}</p>
                <div className="board__sub text-mono">Loadout</div>
                <div className="loadout">
                  {m.loadout.map((t) => (
                    <span key={t} className="text-mono">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="board__sub text-mono">Proof of work</div>
                <ul className="board__related">
                  {m.related.map((r) => (
                    <li key={r}>
                      <span className="board__hex" /> {r}
                    </li>
                  ))}
                </ul>
                <button className="btn btn--red" onClick={() => chooseMission(m)} data-cursor="Ask AI">
                  Choose this mission <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- 05 TERMINAL (AI chat) ---------------- */}
        <section className="term-section" id="terminal" data-chapter data-night>
          <div className="container term-grid">
            <div data-reveal>
              <span className="kicker text-mono">
                <b>05</b> / Ask the AI
              </span>
              <h2 className="chapter-title">
                Interview my <em>AI twin</em>.
              </h2>
              <p className="lead">
                Grounded in my resume and public GitHub. It streams answers live and says when it doesn't know
                something instead of inventing it.
              </p>
              <div className="quick text-mono">
                {[
                  "Summarise your background in 30 seconds",
                  "What did you build at Gumlabs?",
                  "What are your strongest skills?",
                  "Why should we hire you?",
                ].map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} disabled={isStreaming}>
                    → {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="terminal" data-reveal>
              <div className="terminal__bar text-mono">
                <span className="dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>ansh-ai — resume-grounded</span>
                <span className={`terminal__led ${isStreaming ? "is-busy" : ""}`}>{isStreaming ? "THINKING" : "ONLINE"}</span>
              </div>
              <div className="terminal__body" ref={chatBodyRef} aria-live="polite">
                {messages.map((msg, i) =>
                  msg.role === "user" ? (
                    <div key={i} className="line line--user text-mono">
                      <span className="prompt-sign">guest@recruiter:~$</span> {msg.content}
                    </div>
                  ) : (
                    <div key={i} className="line line--ai">
                      <span className="ai-sign text-mono">ansh-ai ›</span>
                      <div className="ai-text">
                        {msg.content ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <span className="text-mono dim">thinking…</span>}
                        {msg.streaming && <span className="terminal__caret" />}
                      </div>
                    </div>
                  )
                )}
              </div>
              <form
                className="terminal__input"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <span className="prompt-sign text-mono">$</span>
                <input
                  ref={inputRef}
                  maxLength={1500}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="ask anything about Ansh…"
                  disabled={isStreaming}
                  aria-label="Your question"
                  className="text-mono"
                />
                <button type="submit" disabled={isStreaming || !input.trim()} aria-label="Send" data-cursor="Send">
                  {isStreaming ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ---------------- FINALE ---------------- */}
        <SplitFinale
          email={EMAIL}
          onOpenChat={openChat}
          linkedin={LINKEDIN_URL}
          onLinkedIn={openLinkedIn}
          resumeUrl={RESUME_URL}
          resumeFile={RESUME_FILE}
          onResume={grabResume}
        />
      </main>

      {/* ---------------- FOOTER ---------------- */}
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
            <a href="#home">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </>
  );
}
