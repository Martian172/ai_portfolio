// ============================================================
// Tiny synthesized sound kit (Web Audio API, no audio files).
// Retro robot / lab theme. Sounds only play after the visitor
// has interacted with the page (browser autoplay rules) and can
// be muted from the header toggle; the choice is remembered.
// ============================================================

const PREF_KEY = "ansh-sound";
let ctx = null;
let master = null;
let enabled = readPref();
const listeners = new Set();

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  return ctx;
}

// Unlock audio on the first real gesture.
if (typeof window !== "undefined") {
  const unlock = () => {
    const c = getCtx();
    if (c && c.state === "suspended") c.resume();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

function ready() {
  if (!enabled) return null;
  const c = getCtx();
  if (!c || c.state !== "running") return null;
  return c;
}

function tone(c, { type = "square", from, to = from, start = 0, dur = 0.12, vol = 0.25 }) {
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(c, { start = 0, dur = 0.3, vol = 0.2, from = 400, to = 2400, q = 1.2 }) {
  const t = c.currentTime + start;
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t);
  src.stop(t + dur + 0.02);
}

let lastBlip = 0;

export const sfx = {
  /** Robot "beep-boop" chirp: when someone touches the mascot. */
  robot() {
    const c = ready();
    if (!c) return;
    const notes = [[880, 1320], [660, 520], [990, 1480], [1320, 1760]];
    notes.forEach(([a, b], i) => tone(c, { type: "square", from: a, to: b, start: i * 0.075, dur: 0.07, vol: 0.12 }));
    tone(c, { type: "triangle", from: 220, to: 440, start: 0, dur: 0.3, vol: 0.12 });
  },
  /** Tiny hover blip (throttled). */
  blip() {
    const c = ready();
    const now = performance.now();
    if (!c || now - lastBlip < 120) return;
    lastBlip = now;
    tone(c, { type: "sine", from: 1600, to: 2200, dur: 0.05, vol: 0.06 });
  },
  /** Mascot rising: power-up sweep. */
  powerUp() {
    const c = ready();
    if (!c) return;
    tone(c, { type: "sawtooth", from: 110, to: 880, dur: 0.55, vol: 0.08 });
    tone(c, { type: "square", from: 220, to: 1760, dur: 0.5, vol: 0.05, start: 0.05 });
    [1046, 1318, 1568].forEach((f, i) => tone(c, { type: "triangle", from: f, start: 0.5 + i * 0.07, dur: 0.16, vol: 0.12 }));
  },
  /** Chat drawer open / close: airy whoosh. */
  whoosh(open = true) {
    const c = ready();
    if (!c) return;
    noise(c, { dur: 0.32, vol: 0.18, from: open ? 300 : 2600, to: open ? 2600 : 300 });
  },
  /** Message sent: upward data blip. */
  send() {
    const c = ready();
    if (!c) return;
    tone(c, { type: "square", from: 520, to: 1040, dur: 0.08, vol: 0.09 });
    tone(c, { type: "square", from: 1040, to: 1560, start: 0.07, dur: 0.08, vol: 0.07 });
  },
  /** AI answer finished: two-tone chime. */
  chime() {
    const c = ready();
    if (!c) return;
    tone(c, { type: "sine", from: 1318, dur: 0.35, vol: 0.14 });
    tone(c, { type: "sine", from: 1975, start: 0.11, dur: 0.45, vol: 0.12 });
  },
  /** UI selection tick (missions, toggles). */
  tick() {
    const c = ready();
    if (!c) return;
    tone(c, { type: "square", from: 1800, to: 1200, dur: 0.035, vol: 0.08 });
  },
  /** Card flip swoosh. */
  flip() {
    const c = ready();
    if (!c) return;
    noise(c, { dur: 0.22, vol: 0.14, from: 900, to: 3600, q: 2 });
    tone(c, { type: "triangle", from: 300, to: 600, dur: 0.18, vol: 0.06 });
  },
  /** Factory press stamping a crate: heavy thud + metallic clank. */
  stamp() {
    const c = ready();
    if (!c) return;
    tone(c, { type: "sine", from: 140, to: 45, dur: 0.22, vol: 0.4 });
    noise(c, { dur: 0.09, vol: 0.22, from: 2400, to: 900, q: 3 });
    tone(c, { type: "square", from: 1760, to: 1200, start: 0.03, dur: 0.06, vol: 0.05 });
  },
  /** Achievement unlocked: 8-bit victory arpeggio. */
  achievement() {
    const c = ready();
    if (!c) return;
    [523, 659, 784, 1046].forEach((f, i) => tone(c, { type: "square", from: f, start: i * 0.08, dur: 0.1, vol: 0.08 }));
    tone(c, { type: "square", from: 1318, start: 0.34, dur: 0.32, vol: 0.09 });
    tone(c, { type: "triangle", from: 659, start: 0.34, dur: 0.36, vol: 0.08 });
  },
  /** Neon sign flickering on: electric buzz. */
  /** Petting Bit: soft rising "boop", sparkly when it's in love. */
  pet(love = false) {
    const c = ready();
    const now = performance.now();
    if (!c || now - lastBlip < 90) return;
    lastBlip = now;
    const base = 700 + Math.random() * 300;
    tone(c, { type: "sine", from: base, to: base * 1.5, dur: 0.09, vol: 0.07 });
    if (love) tone(c, { type: "triangle", from: base * 2, to: base * 2.6, start: 0.06, dur: 0.08, vol: 0.04 });
  },
  buzz() {
    const c = ready();
    if (!c) return;
    [0, 0.12, 0.2, 0.42].forEach((s, i) => {
      tone(c, { type: "sawtooth", from: 120, dur: i === 3 ? 0.5 : 0.06, vol: 0.07, start: s });
      tone(c, { type: "square", from: 240, dur: i === 3 ? 0.5 : 0.05, vol: 0.03, start: s });
    });
  },
};

export function isSoundOn() {
  return enabled;
}

export function setSoundOn(on) {
  enabled = on;
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable: preference lasts for this visit */
  }
  if (on) {
    const c = getCtx();
    if (c && c.state === "suspended") c.resume().then(() => sfx.tick());
    else sfx.tick();
  }
  listeners.forEach((fn) => fn(on));
}

export function onSoundChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
