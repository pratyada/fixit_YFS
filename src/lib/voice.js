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

// Ask the Claude coach brain for the next spoken line, given the conversation
// so far. Returns { reply, firstName, done, exerciseId }.
export async function chat(messages, exercises, { subscriber, signal } = {}) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${API_BASE}/api/marketing/kiosk/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ messages, exercises, subscriber }),
    signal,
  });
  if (!res.ok) throw new Error('coach failed');
  return res.json();
}

// Premium streaming STT via Deepgram Nova-3. Far better on accents & names than
// the browser recognizer, and it uses proper end-of-utterance detection instead
// of a dumb silence timer. Mints a short-lived token from our Lambda (which also
// returns the subscriber name roster for keyterm boosting), then streams mic
// audio straight to Deepgram over WebSocket. Falls back to listen() if Deepgram
// isn't configured or the browser can't record.
export async function listenStream({ onInterim, keyterms = [], timeout = 15000, silenceMs = 1100, signal } = {}) {
  const idToken = await auth.currentUser?.getIdToken();
  let grant;
  try {
    const res = await fetch(`${API_BASE}/api/marketing/kiosk/stt-token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
    });
    if (!res.ok) throw new Error('stt-token ' + res.status);
    grant = await res.json();
  } catch {
    return listen({ onInterim, timeout, signal });   // no Deepgram → browser recognizer
  }
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported?.('audio/webm')) {
    return listen({ onInterim, timeout, signal });
  }
  const terms = (keyterms.length ? keyterms : (grant.keyterms || [])).slice(0, 90);

  return new Promise((resolve, reject) => {
    let stream, mr, ws, finalText = '', lastInterim = '', settled = false, guard;
    const cleanup = () => {
      clearTimeout(guard);
      try { if (mr && mr.state !== 'inactive') mr.stop(); } catch { /* */ }
      try { if (ws && ws.readyState <= 1) ws.close(); } catch { /* */ }
      try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    };
    // Fall back to the best interim if no final locked in — a slightly-late
    // finalization should never come back as silence and derail the turn.
    const best = () => (finalText || lastInterim);
    const finish = (text) => { if (settled) return; settled = true; cleanup(); resolve((text || '').trim()); };

    if (signal) signal.addEventListener('abort', () => finish(''), { once: true });
    guard = setTimeout(() => finish(best()), timeout);

    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((s) => {
        stream = s;
        const params = new URLSearchParams({
          model: 'nova-3', language: 'en', smart_format: 'true',
          interim_results: 'true', endpointing: '400', utterance_end_ms: String(silenceMs), vad_events: 'true',
        });
        for (const t of terms) params.append('keyterm', t);
        const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
        // Two auth modes from the server: a short-lived JWT (goes in the query
        // string — too long for the WS header), or the raw API key (fits the
        // subprotocol header) when the key can't mint grant tokens.
        ws = grant.token
          ? new WebSocket(`${wsUrl}&access_token=${grant.token}`)
          : new WebSocket(wsUrl, ['token', grant.apiKey]);
        ws.onopen = () => {
          try {
            mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mr.ondataavailable = (e) => { if (e.data.size && ws.readyState === 1) ws.send(e.data); };
            mr.start(250);
          } catch { finish(finalText); }
        };
        ws.onmessage = (evt) => {
          let msg; try { msg = JSON.parse(evt.data); } catch { return; }
          if (msg.type === 'Results') {
            const t = msg.channel?.alternatives?.[0]?.transcript || '';
            if (t) {
              if (msg.is_final) finalText = (finalText + ' ' + t).trim();
              else lastInterim = t;
              onInterim?.((finalText + ' ' + (msg.is_final ? '' : t)).trim());
            }
            if (msg.speech_final && best()) finish(best());   // utterance ended
          } else if (msg.type === 'UtteranceEnd' && best()) {
            finish(best());
          }
        };
        ws.onerror = () => finish(best());
        ws.onclose = () => finish(best());
      })
      .catch((err) => { cleanup(); reject(err); });
  });
}

// Listen once via the browser (Chrome desktop). Resolves with the transcript.
// onInterim(text) streams partial words; onAmplitude(0..1) drives the orb.
export function listen({ onInterim, onAmplitude, timeout = 9000, signal } = {}) {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return reject(new Error('Speech recognition needs desktop Chrome'));
    const rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    let finalT = '', stopMic;
    const done = (fn, arg) => { try { rec.stop(); } catch { /* */ } stopMic?.(); fn(arg); };
    const guard = setTimeout(() => done(resolve, finalT.trim()), timeout);
    if (signal) signal.addEventListener('abort', () => { clearTimeout(guard); done(resolve, ''); }, { once: true });
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
