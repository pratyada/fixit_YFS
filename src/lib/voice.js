// Voice engine for the kiosk: Polly speech-out (server) + browser speech-in.
// Both expose a live 0..1 amplitude so the orb can react to real audio.
import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_MARKETING_API_BASE || '';
let audioCtx;
const ctx = () => (audioCtx ||= new (window.AudioContext || window.webkitAudioContext)());

// Speak text via AWS Polly. Resolves when playback finishes.
// onAmplitude(0..1) fires each frame while speaking (drives the orb).
export async function speak(text, { onAmplitude, signal } = {}) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${API_BASE}/api/marketing/kiosk/speak`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new Error('speak failed');
  const { audio } = await res.json();
  const bytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
  const el = new Audio(url);
  el.crossOrigin = 'anonymous';

  let raf, analyser;
  if (onAmplitude) {
    try {
      const c = ctx(); await c.resume();
      const srcNode = c.createMediaElementSource(el);
      analyser = c.createAnalyser(); analyser.fftSize = 256;
      srcNode.connect(analyser); analyser.connect(c.destination);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => { analyser.getByteFrequencyData(data); onAmplitude(rms(data)); raf = requestAnimationFrame(tick); };
      tick();
    } catch { /* analyser optional */ }
  }
  try {
    await el.play();
    await new Promise((r) => { el.onended = r; el.onerror = r; if (signal) signal.addEventListener('abort', () => { el.pause(); r(); }); });
  } finally {
    if (raf) cancelAnimationFrame(raf);
    URL.revokeObjectURL(url);
    onAmplitude?.(0);
  }
}

// Listen once via the browser (Chrome desktop). Resolves with the transcript.
// onInterim(text) streams partial words; onAmplitude(0..1) drives the orb.
export function listen({ onInterim, onAmplitude, timeout = 9000 } = {}) {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return reject(new Error('Speech recognition needs desktop Chrome'));
    const rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    let finalT = '', stopMic;
    const done = (fn, arg) => { try { rec.stop(); } catch { /* */ } stopMic?.(); fn(arg); };
    const guard = setTimeout(() => done(resolve, finalT.trim()), timeout);
    rec.onresult = (e) => {
      let interim = '';
      for (const r of e.results) { if (r.isFinal) finalT += r[0].transcript; else interim += r[0].transcript; }
      onInterim?.((finalT + ' ' + interim).trim());
    };
    rec.onerror = (e) => { clearTimeout(guard); done(e.error === 'no-speech' ? resolve : reject, e.error === 'no-speech' ? '' : new Error(e.error)); };
    rec.onend = () => { clearTimeout(guard); done(resolve, finalT.trim()); };
    if (onAmplitude) startMic(onAmplitude).then((s) => { stopMic = s; }).catch(() => {});
    rec.start();
  });
}

// Continuous wake-word listener. Calls onWake() when it hears the word.
// Returns a stop() function. (Browser STT; restarts itself.)
export function wakeWord(word, onWake) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return () => {};
  const w = word.toLowerCase();
  let rec, stopped = false, timer;
  const start = () => {
    if (stopped) return;
    rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
    rec.onresult = (e) => {
      for (const r of e.results) {
        const t = r[0].transcript.toLowerCase();
        if (t.includes(w) || t.includes('fix it') || t.includes('fixed')) {
          stopped = true; clearTimeout(timer);           // stop BEFORE the conversation grabs the mic
          try { rec.stop(); } catch { /* */ }
          onWake(); return;
        }
      }
    };
    rec.onerror = () => {};
    rec.onend = () => { if (!stopped) timer = setTimeout(() => { if (!stopped) start(); }, 500); };
    try { rec.start(); } catch { /* */ }
  };
  start();
  return () => { stopped = true; clearTimeout(timer); try { rec?.stop(); } catch { /* */ } };
}

async function startMic(onAmplitude) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const c = ctx(); await c.resume();
  const src = c.createMediaStreamSource(stream);
  const analyser = c.createAnalyser(); analyser.fftSize = 256;
  src.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  let raf;
  const tick = () => { analyser.getByteFrequencyData(data); onAmplitude(rms(data)); raf = requestAnimationFrame(tick); };
  tick();
  return () => { cancelAnimationFrame(raf); stream.getTracks().forEach((t) => t.stop()); onAmplitude(0); };
}

function rms(data) {
  let s = 0; for (let i = 0; i < data.length; i++) s += data[i] * data[i];
  return Math.min(1, Math.sqrt(s / data.length) / 128);
}
