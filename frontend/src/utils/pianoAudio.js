import Soundfont from 'soundfont-player';

// ── Shared AudioContext ───────────────────────────────────────────────────────
let _ctx = null;
export function getAudioCtx() {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ── Piano instrument (lazy load, cached) ─────────────────────────────────────
let _pianoPromise = null;
export function getPiano() {
  if (!_pianoPromise) {
    const ctx = getAudioCtx();
    _pianoPromise = Soundfont.instrument(ctx, 'acoustic_grand_piano', {
      format: 'mp3',
      soundfont: 'MusyngKite',
      gain: 4,
    }).catch(err => {
      console.warn('Soundfont load failed, falling back to synthesis', err);
      _pianoPromise = null;
      return null;
    });
  }
  return _pianoPromise;
}

// Preload on first import
getPiano();

// ── Note name helpers ─────────────────────────────────────────────────────────
const SEMITONES = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };

export function noteNameToFreq(noteStr) {
  const m = noteStr.match(/^([A-G])(#|b?)(\d)$/);
  if (!m) return null;
  const [, name, acc, octStr] = m;
  const oct  = parseInt(octStr, 10);
  const semi = SEMITONES[name] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (oct * 12 + semi - 57) / 12);
}

// Convert vexflow key "c/4" → "C4"
export function vexKeyToNoteName(key) {
  const m = key.match(/^([a-g])(#|b?)\/(\d)$/);
  if (!m) return null;
  const [, letter, acc, oct] = m;
  return letter.toUpperCase() + acc + oct;
}

// Duration label → seconds
export const DURATION_SEC = { w: 2.4, h: 1.2, q: 0.6, '8': 0.3, '16': 0.15 };

// ── Fallback synthesis (if CDN unreachable) ───────────────────────────────────
const HARMONICS = [
  { ratio: 1, gain: 0.42 }, { ratio: 2, gain: 0.09 },
  { ratio: 3, gain: 0.04 }, { ratio: 4, gain: 0.02 },
];

export function playPianoNote(ctx, freq, startTime, duration) {
  const master = ctx.createGain();
  master.connect(ctx.destination);
  for (const h of HARMONICS) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * h.ratio * (1 + (h.ratio - 1) * 0.0004), startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(h.gain, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(h.gain * 0.35, startTime + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

// ── High-level play functions ─────────────────────────────────────────────────

// Play a single note by name ("C4", "G#3" etc.), returns a stop function
export async function playSingleNote(noteName, duration = 2.0) {
  getAudioCtx(); // ensure context running
  const piano = await getPiano();
  if (piano) {
    const node = piano.play(noteName, undefined, { duration, gain: 1 });
    return () => node?.stop();
  }
  // fallback
  const ctx  = getAudioCtx();
  const freq = noteNameToFreq(noteName);
  if (freq) playPianoNote(ctx, freq, ctx.currentTime + 0.01, duration);
  return () => {};
}

// Play a sequence of { note, duration } objects, returns total duration in ms
export async function playNoteSequence(notes) {
  getAudioCtx();
  const piano = await getPiano();
  let offset = 0;
  for (const n of notes) {
    const dur = typeof n.duration === 'number' ? n.duration : (DURATION_SEC[n.duration] ?? 0.6);
    const noteName = n.note;
    if (piano) {
      piano.schedule(getAudioCtx().currentTime + offset / 1000 + 0.04, [
        { time: 0, note: noteName, duration: dur + 0.5, gain: 1 },
      ]);
    } else {
      const ctx  = getAudioCtx();
      const freq = noteNameToFreq(noteName);
      if (freq) playPianoNote(ctx, freq, ctx.currentTime + offset / 1000 + 0.04, dur + 0.5);
    }
    offset += dur * 1000;
  }
  return offset;
}
