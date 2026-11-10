import { useEffect, useRef, useState } from "react";
import { Send, LoaderCircle, X, MessageSquare, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { sfx } from "./sound.js";

// ============================================================
// Floating AI chat: launcher + teaser + slide-in drawer.
// Shares the same conversation as the "Ask the AI" section,
// so a recruiter can chat from anywhere without leaving the page.
// ============================================================

const QUICK = [
  "Summarise Ansh in 30 seconds",
  "What did he build at Gumlabs?",
  "Strongest technical skills?",
  "Why should we hire him?",
];

const TEASER_KEY = "ansh-ai-teaser-dismissed";

function readDismissed() {
  try {
    return sessionStorage.getItem(TEASER_KEY) === "1";
  } catch {
    return false;
  }
}

export default function ChatWidget({ open, setOpen, messages, isStreaming, sendMessage, hideLauncher }) {
  const [input, setInput] = useState("");
  const [teaser, setTeaser] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const userMessages = messages.filter((m) => m.role === "user").length;

  // Teaser bubble pops up after a few seconds so a recruiter can't miss the bot.
  useEffect(() => {
    if (dismissed || open) return;
    const id = setTimeout(() => setTeaser(true), 4500);
    return () => clearTimeout(id);
  }, [dismissed, open]);

  // On phones the teaser covers a big slice of the screen, so it tucks itself away after 10s.
  useEffect(() => {
    if (!teaser || !window.matchMedia("(max-width: 760px)").matches) return;
    const id = setTimeout(() => setTeaser(false), 10000);
    return () => clearTimeout(id);
  }, [teaser]);

  // Whoosh when the drawer opens/closes (skip the initial mount).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    sfx.whoosh(open);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTeaser(false);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
    }
  }, [open]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  function dismissTeaser(e) {
    e.stopPropagation();
    setTeaser(false);
    setDismissed(true);
    try {
      sessionStorage.setItem(TEASER_KEY, "1");
    } catch {
      /* storage unavailable: fine */
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  }

  return (
    <>
      {/* Launcher + teaser */}
      <div className={`chat-launcher-wrap ${hideLauncher && !open ? "is-hidden" : ""} ${open ? "is-open" : ""}`}>
        {teaser && !open && (
          <div className="chat-teaser" role="status">
            <button className="chat-teaser__close" onClick={dismissTeaser} aria-label="Dismiss">
              <X size={12} />
            </button>
            <span className="text-mono chat-teaser__kicker">
              <span className="online-dot" /> Hiring?
            </span>
            <p>
              Ask my AI anything about Ansh: projects, internships, skills. <b>Answers in seconds.</b>
            </p>
            <button className="chat-teaser__cta text-mono" onClick={() => setOpen(true)}>
              Start chatting →
            </button>
          </div>
        )}
        <button
          className="chat-launcher"
          onClick={() => {
            if (!open) sfx.robot();
            setOpen(!open);
          }}
          onMouseEnter={() => sfx.blip()}
          aria-label={open ? "Close AI chat" : "Open AI chat"}
          aria-expanded={open}
          data-cursor={open ? "Close" : "Chat"}
        >
          <span className="chat-launcher__ring" />
          {open ? <X size={22} /> : <MessageSquare size={22} />}
          {!open && <span className="chat-launcher__label text-mono">Ask my AI</span>}
          {!open && userMessages === 0 && <span className="chat-launcher__badge">1</span>}
        </button>
      </div>

      {/* Drawer */}
      <div className={`chat-scrim ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`chat-drawer ${open ? "is-open" : ""}`} role="dialog" aria-modal="false" aria-label="Chat with Ansh's AI" aria-hidden={!open}>
        <header className="chat-drawer__head">
          <div className="chat-drawer__id">
            <span className="chat-drawer__avatar">
              <Sparkles size={16} />
            </span>
            <div>
              <strong>Ansh's AI twin</strong>
              <span className="text-mono">
                <span className="online-dot" /> {isStreaming ? "typing…" : "online · resume-grounded"}
              </span>
            </div>
          </div>
          <button className="chat-drawer__close" onClick={() => setOpen(false)} aria-label="Close chat">
            <X size={18} />
          </button>
        </header>

        <div className="chat-drawer__body" ref={bodyRef} aria-live="polite">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="cmsg cmsg--user">
                {m.content}
              </div>
            ) : (
              <div key={i} className="cmsg cmsg--ai">
                {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="cdots"><i /><i /><i /></span>}
                {m.streaming && m.content && <span className="terminal__caret" />}
              </div>
            )
          )}
          {userMessages === 0 && (
            <div className="chat-quick">
              <span className="text-mono">Try asking</span>
              {QUICK.map((q) => (
                <button key={q} onClick={() => sendMessage(q)} disabled={isStreaming}>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className="chat-drawer__input" onSubmit={submit}>
          <input
            ref={inputRef}
            maxLength={1500}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about projects, skills, experience…"
            disabled={isStreaming}
            aria-label="Your question"
            tabIndex={open ? 0 : -1}
          />
          <button type="submit" disabled={isStreaming || !input.trim()} aria-label="Send" tabIndex={open ? 0 : -1}>
            {isStreaming ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}
          </button>
        </form>
      </aside>
    </>
  );
}
