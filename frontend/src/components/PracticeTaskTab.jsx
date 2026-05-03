import { API_BASE } from '../config.js';
import { useState, useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';

// ── Note helpers ──────────────────────────────────────────────────────────────
const NOTE_ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function noteToMidi(name) {
  const m = name.match(/^([A-G]#?)(\d)$/);
  if (!m) return 0;
  return parseInt(m[2]) * 12 + NOTE_ORDER.indexOf(m[1]);
}
function nameToVexKey(name) {
  const m = name.match(/^([A-G])(#|b?)(\d)$/);
  if (!m) return null;
  return `${m[1].toLowerCase()}${m[2]}/${m[3]}`;
}
function secToDuration(sec, beatUnit = 0.5) {
  const r = sec / beatUnit;
  if (r < 0.35) return '16';
  if (r < 0.65) return '8';
  if (r < 1.4)  return 'q';
  if (r < 2.8)  return 'h';
  return 'w';
}
function groupToChords(notes, colors = [], beatUnit = 0.5) {
  const groups = [];
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    const last = groups[groups.length - 1];
    if (last && Math.abs(n.start - last[0].n.start) < 0.06) {
      last.push({ n, color: colors[i] ?? null });
    } else {
      groups.push([{ n, color: colors[i] ?? null }]);
    }
  }
  return groups.map(g => {
    const color = g.some(x => x.color === '#ef4444') ? '#ef4444'
                : g.some(x => x.color === '#d97706') ? '#d97706'
                : g.some(x => x.color === '#285A48') ? '#285A48'
                : null;
    return {
      keys:     g.map(x => nameToVexKey(x.n.note)).filter(Boolean),
      duration: secToDuration(Math.max(...g.map(x => x.n.duration)), beatUnit),
      accs:     g.map(x => x.n.note.includes('#') ? '#' : x.n.note.includes('b') ? 'b' : null),
      color,
    };
  }).filter(c => c.keys.length);
}

// ── Staff view ────────────────────────────────────────────────────────────────
function StaffView({ vexNotes, clef = 'treble', label, timeSignature }) {
  const ref = useRef(null);
  const lastWidthRef = useRef(0);

  useEffect(() => {
    if (!ref.current || !vexNotes?.length) return;
    function render() {
      const el = ref.current;
      if (!el) return;
      const style   = window.getComputedStyle(el);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const width   = Math.max((el.clientWidth - padding) || 560, 200);
      if (Math.abs(width - lastWidthRef.current) < 2) return;
      lastWidthRef.current = width;
      el.innerHTML = '';
      const CHUNK = 4;
      const chunks = [];
      for (let i = 0; i < vexNotes.length; i += CHUNK) chunks.push(vexNotes.slice(i, i + CHUNK));
      const renderer = new Renderer(el, Renderer.Backends.SVG);
      renderer.resize(width, 160);
      const ctx = renderer.getContext();
      const firstExtra = timeSignature ? 90 : 75;
      const w0 = chunks.length === 1 ? width - 10 : Math.round(width * 0.52);
      const wR = chunks.length  > 1 ? (width - w0 - 10) / (chunks.length - 1) : 0;
      chunks.forEach((chunk, ci) => {
        const x = ci === 0 ? 5 : 5 + w0 + wR * (ci - 1);
        const w = ci === 0 ? w0 : wR;
        const stave = new Stave(x, 20, w);
        if (ci === 0) {
          stave.addClef(clef);
          if (timeSignature) stave.addTimeSignature(timeSignature);
        }
        stave.setContext(ctx).draw();
        try {
          const tickables = chunk.map(n => {
            const sn = new StaveNote({ keys: n.keys, duration: n.duration });
            (n.accs ?? []).forEach((acc, i) => { if (acc) sn.addModifier(new Accidental(acc), i); });
            if (n.color) sn.setStyle({ fillStyle: n.color, strokeStyle: n.color });
            return sn;
          });
          const v = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
          v.addTickables(tickables);
          new Formatter().joinVoices([v]).format([v], w - (ci === 0 ? firstExtra : 15));
          v.draw(ctx, stave);
        } catch { /* skip invalid notes */ }
      });
      const svg = el.querySelector('svg');
      if (svg) {
        svg.setAttribute('viewBox', `0 0 ${width} 160`);
        svg.setAttribute('width', '100%');
        svg.removeAttribute('height');
      }
    }
    render();
    let rafId = null;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => { render(); rafId = null; });
    });
    observer.observe(ref.current);
    return () => { observer.disconnect(); if (rafId) cancelAnimationFrame(rafId); };
  }, [vexNotes, clef, timeSignature]);

  if (!vexNotes?.length) return null;
  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide">{label}</p>}
      <div ref={ref} className="w-full rounded-xl border border-primary/10 bg-white p-3" />
    </div>
  );
}

// ── Metronome ─────────────────────────────────────────────────────────────────
function Metronome({ bpm = 60 }) {
  const [running, setRunning]   = useState(false);
  const [beat, setBeat]         = useState(false);
  const [localBpm, setLocalBpm] = useState(bpm);
  const intervalRef  = useRef(null);
  const audioCtxRef  = useRef(null);

  useEffect(() => { setLocalBpm(bpm); }, [bpm]);

  // stop on unmount
  useEffect(() => () => { clearInterval(intervalRef.current); }, []);

  function click() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx  = audioCtxRef.current;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
    setBeat(true);
    setTimeout(() => setBeat(false), 80);
  }

  function start() {
    click();
    intervalRef.current = setInterval(click, (60 / localBpm) * 1000);
    setRunning(true);
    onStart?.();
  }

  function stop() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setBeat(false);
    onStop?.();
  }

  function toggle() { running ? stop() : start(); }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/12 bg-primary/4 px-4 py-2.5">
      {/* beat dot */}
      <span className={`h-3 w-3 rounded-full flex-shrink-0 transition-all duration-75 ${
        running ? (beat ? 'bg-primary scale-125' : 'bg-primary/25') : 'bg-primary/15'
      }`} />

      {/* BPM input */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => setLocalBpm(v => Math.max(40, v - 5))} disabled={running}
          className="text-primary/50 hover:text-primary disabled:opacity-30 text-base leading-none font-bold w-5 text-center">−</button>
        <input
          type="number" min={40} max={240} value={localBpm} disabled={running}
          onChange={e => setLocalBpm(Math.max(40, Math.min(240, parseInt(e.target.value) || 60)))}
          className="w-12 text-center text-sm font-bold text-primary bg-transparent border-none outline-none disabled:opacity-60"
        />
        <button onClick={() => setLocalBpm(v => Math.min(240, v + 5))} disabled={running}
          className="text-primary/50 hover:text-primary disabled:opacity-30 text-base leading-none font-bold w-5 text-center">+</button>
        <span className="text-xs text-primary/40 font-medium">BPM</span>
      </div>

      {/* start/stop */}
      <button onClick={toggle}
        className={`ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          running
            ? 'bg-primary/15 text-primary hover:bg-primary/25'
            : 'bg-primary text-white hover:bg-primary-hover'
        }`}>
        {running ? (
          <>
            <span className="h-2 w-2 rounded-sm bg-primary" />
            Stop
          </>
        ) : (
          <>
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Metronome
          </>
        )}
      </button>
    </div>
  );
}

// ── Attempt history ───────────────────────────────────────────────────────────
function AttemptHistory({ taskId, refreshTrigger }) {
  const [attempts, setAttempts] = useState([]);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/practice/tasks/${taskId}/attempts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setAttempts(d.attempts ?? []))
      .catch(() => {});
  }, [taskId, refreshTrigger]);

  if (!attempts.length) return null;

  const best = Math.max(...attempts.map(a => a.score_percent));
  const bars = [...attempts].reverse();

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) +
           ' ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
      <button onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-dark/70">Attempt history</span>
          <span className="rounded-full bg-primary/8 px-2 py-0.5 text-xs font-semibold text-primary">{attempts.length}</span>
          <span className="text-xs text-dark/35">best {best}%</span>
        </div>
        <div className="flex items-center gap-3">
          <svg width={attempts.length * 10 - 2} height={24} className="shrink-0">
            {bars.map((a, i) => {
              const h = Math.max(3, Math.round((a.score_percent / 100) * 20));
              const fill = a.passed ? '#285A48' : a.score_percent >= 50 ? '#d97706' : '#ef4444';
              return <rect key={i} x={i * 10} y={22 - h} width={8} height={h} rx={2} fill={fill} opacity={0.7} />;
            })}
          </svg>
          <svg className={`h-4 w-4 text-dark/30 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="border-t border-primary/6 divide-y divide-primary/6">
          {attempts.map((a, i) => (
            <div key={a.id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="w-5 text-xs text-dark/30 text-right">#{attempts.length - i}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  a.passed ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500'
                }`}>
                  {a.passed ? 'Passed' : 'Failed'}
                </span>
                <span className={`text-sm font-bold ${
                  a.passed ? 'text-primary' : a.score_percent >= 50 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {a.score_percent}%
                </span>
              </div>
              <span className="text-xs text-dark/30">{formatDate(a.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Score screen ──────────────────────────────────────────────────────────────
function ScoreScreen({ taskId, scorePercent, passed, recognized, expected, notes, noteDurations = [], durationScore = null, timeSignature = null, beatUnit = null, coinsEarned = 0, onRetry }) {
  const [feedback, setFeedback]     = useState('');
  const [fbLoading, setFbLoading]   = useState(false);
  const [fbError, setFbError]       = useState('');

  async function handleFeedback() {
    setFbLoading(true); setFeedback(''); setFbError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/practice/tasks/${taskId}/feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expected, recognized, scorePercent, noteDurations, durationScore, timeSignature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setFeedback(data.feedback);
    } catch (e) { setFbError(e.message); }
    finally { setFbLoading(false); }
  }

  const correctCount = expected.filter((e, i) => recognized[i] === e).length;
  const missingCount = expected.filter((e, i) => recognized[i] !== e).length;
  const extraCount   = Math.max(0, recognized.length - expected.length);

  const stats = [
    { label: 'Correct',  value: correctCount,   color: 'text-primary'   },
    { label: 'Expected', value: expected.length, color: 'text-dark/60'   },
    { label: 'Missing',  value: missingCount,    color: 'text-red-500'   },
    { label: 'Extra',    value: extraCount,       color: 'text-amber-600' },
    durationScore != null
      ? { label: 'Dur. accuracy', value: `${durationScore}%`, color: durationScore >= 80 ? 'text-primary' : 'text-red-500' }
      : { label: 'Detected', value: recognized.length, color: 'text-dark/60' },
    { label: 'Coins',    value: coinsEarned > 0 ? `+${coinsEarned}` : '—', color: coinsEarned > 0 ? 'text-amber-500' : 'text-dark/30' },
  ];

  const noteColors = expected.map((exp, i) => {
    const pitchOk = recognized[i] === exp;
    const durOk   = noteDurations[i]?.match;
    if (!pitchOk)        return '#ef4444';
    if (durOk === false) return '#d97706';
    return null;
  });

  const expectedVex = expected
    .map(n => ({ keys: [nameToVexKey(n)].filter(Boolean), duration: 'q', accs: [n.includes('#') ? '#' : n.includes('b') ? 'b' : null] }))
    .filter(n => n.keys.length);

  const recognizedColors = (notes ?? []).map((_, i) => {
    const pitchOk = recognized[i] === expected[i];
    const durOk   = noteDurations[i]?.match;
    if (!pitchOk)        return '#ef4444';
    if (durOk === false) return '#d97706';
    return '#285A48';
  });
  const recognizedVex = notes?.length ? groupToChords(notes, recognizedColors, beatUnit ?? 0.5) : [];

  return (
    <div className="space-y-4">
      {/* Coins banner */}
      {coinsEarned > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 flex items-center gap-3 animate-fade-in-up">
          <span className="text-2xl">🪙</span>
          <div>
            <p className="text-sm font-semibold text-amber-700">+{coinsEarned} coins earned!</p>
            <p className="text-xs text-amber-600/70">Great job passing this task</p>
          </div>
        </div>
      )}

      {/* Header + stats */}
      <div className="overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
        <div className={`px-6 py-5 ${passed ? 'bg-primary/6' : 'bg-red-50'}`}>
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${passed ? 'bg-primary text-white' : 'bg-red-400 text-white'}`}>
              {passed ? (
                <svg className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-2xl font-bold ${passed ? 'text-primary' : 'text-red-500'}`}>{scorePercent}%</p>
              <p className="text-sm text-dark/50">{passed ? 'Passed' : 'Need 80% to pass'}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-primary/6 border-t border-primary/6">
          {stats.map(s => (
            <div key={s.label} className="bg-white px-5 py-4">
              <p className="text-xs text-dark/40 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-primary/6">
          <button onClick={onRetry}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Try again
          </button>
          <button onClick={handleFeedback} disabled={fbLoading}
            className="flex items-center gap-2 rounded-xl border border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary/70 transition-colors hover:bg-primary/5 disabled:opacity-40">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v7a3 3 0 01-3 3H7a3 3 0 01-3-3v-7a3 3 0 013-3h1V6a4 4 0 014-4z"/>
              <circle cx="9" cy="13" r="1" fill="currentColor"/>
              <circle cx="15" cy="13" r="1" fill="currentColor"/>
            </svg>
            {fbLoading ? 'Analyzing…' : 'Ask AI for feedback'}
          </button>
        </div>
        {fbLoading && (
          <div className="mx-6 mb-5 rounded-xl bg-primary/5 px-5 py-5 animate-fade-in-up">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-primary/40">AI feedback</p>
            <div className="flex items-center gap-4">
              <div className="flex items-end gap-[3px] h-7 flex-shrink-0">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="w-[4px] rounded-full bg-primary/50 animate-wave origin-bottom"
                    style={{ height: '28px', animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-sm font-medium text-primary">AI is analyzing your performance</p>
            </div>
          </div>
        )}
        {(feedback || fbError) && !fbLoading && (
          <div className={`mx-6 mb-5 rounded-xl px-4 py-4 text-sm leading-relaxed animate-fade-in-up ${fbError ? 'bg-red-50 text-red-500' : 'bg-primary/6 text-dark/80'}`}>
            {!fbError && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary/40">AI feedback</p>}
            {fbError || feedback}
          </div>
        )}
      </div>

      {/* Staff legend */}
      {(expectedVex.length > 0 || recognizedVex.length > 0) && (
        <div className="flex flex-wrap gap-4 px-1">
          <span className="flex items-center gap-1.5 text-xs text-dark/50"><span className="h-2.5 w-2.5 rounded-full bg-[#285A48]" />correct pitch &amp; duration</span>
          <span className="flex items-center gap-1.5 text-xs text-dark/50"><span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />wrong / missing pitch</span>
          <span className="flex items-center gap-1.5 text-xs text-dark/50"><span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" />wrong duration</span>
        </div>
      )}

      {expectedVex.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white px-6 py-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
          <StaffView vexNotes={expectedVex} label="Expected" timeSignature={timeSignature} />
        </div>
      )}
      {recognizedVex.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white px-6 py-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
          <StaffView vexNotes={recognizedVex} label="Transcribed" timeSignature={timeSignature} />
        </div>
      )}

      {/* Note comparison */}
      <div className="overflow-hidden rounded-xl bg-white px-6 py-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
        <p className="mb-3 text-xs font-semibold text-dark/40 uppercase tracking-wide">Note comparison</p>
        <div className="flex flex-wrap gap-2">
          {expected.map((exp, i) => {
            const got     = recognized[i];
            const pitchOk = got === exp;
            const dur     = noteDurations[i] ?? null;
            const durOk   = dur?.match;
            const cardColor = pitchOk ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500';
            return (
              <div key={i} className={`flex flex-col items-center rounded-lg px-3 py-2 text-sm font-semibold ${cardColor}`}>
                <span>{exp}</span>
                {!pitchOk && got  && <span className="text-[10px] font-normal opacity-70">got {got}</span>}
                {!pitchOk && !got && <span className="text-[10px] font-normal opacity-70">missing</span>}
                {dur?.recognized != null && (
                  <span className={`mt-0.5 text-[10px] font-normal ${durOk === true ? 'opacity-60' : durOk === false ? 'text-amber-600 opacity-90' : 'opacity-50'}`}>
                    {dur.recognized}s{dur.expected != null ? ` / ${dur.expected}s` : ''}
                    {durOk === true ? ' ✓' : durOk === false ? ' ✗' : ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {extraCount > 0 && (
          <p className="mt-3 text-xs text-amber-600">+{extraCount} extra note{extraCount > 1 ? 's' : ''} detected</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PracticeTaskTab({ task, onCoinsChange }) {
  const [result, setResult]         = useState(null);
  const [recording, setRecording]   = useState(false);
  const [audioBlob, setAudioBlob]   = useState(null);
  const [audioUrl, setAudioUrl]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [attemptRefresh, setAttemptRefresh] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);

  // reset when task changes
  useEffect(() => {
    setResult(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setError('');
    setRecording(false);
  }, [task.id]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setAudioBlob(null);
      setAudioUrl(null);
      setResult(null);
    } catch {
      setError('Microphone access denied');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function handleSubmit() {
    if (!audioBlob || submitting) return;
    setSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    try {
      const res = await fetch(`${API_BASE}/api/practice/tasks/${task.id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submit failed');
      setResult(data);
      setAttemptRefresh(n => n + 1);
      if (data.coinsEarned > 0) onCoinsChange?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setResult(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setError('');
  }

  const expected      = task.expected_json?.notes         ?? [];
  const timeSignature = task.expected_json?.timeSignature ?? null;
  const bpm           = task.expected_json?.bpm           ?? 60;

  const expectedVex = expected
    .map(n => ({ keys: [nameToVexKey(n)].filter(Boolean), duration: 'q', accs: [n.includes('#') ? '#' : n.includes('b') ? 'b' : null] }))
    .filter(n => n.keys.length);

  if (submitting) return (
    <div className="flex flex-col items-center justify-center py-20 gap-8 animate-fade-in-up">
      <div className="flex items-end justify-center gap-[5px] h-16 w-48">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className="w-[6px] rounded-full bg-primary animate-wave origin-bottom"
            style={{ height: '64px', animationDelay: `${i * 0.07}s`, animationDuration: `${0.7 + (i % 3) * 0.15}s` }} />
        ))}
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-base font-semibold text-primary">Analyzing your recording</p>
        <p className="text-sm text-primary/40">This may take a few seconds…</p>
      </div>
      <div className="flex gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="h-2 w-2 rounded-full bg-primary animate-dot-bounce"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );

  if (result) return (
    <div className="space-y-4">
      <ScoreScreen {...result} taskId={task.id} onRetry={handleRetry} />
      <AttemptHistory taskId={task.id} refreshTrigger={attemptRefresh} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl bg-white px-6 py-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
        {task.instruction_text && (
          <p className="text-[15px] font-medium text-dark mb-3">{task.instruction_text}</p>
        )}

        {expected.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {expected.map((n, i) => (
              <span key={i} className="rounded-md bg-primary/8 px-2.5 py-1 text-sm font-semibold text-primary">{n}</span>
            ))}
            {timeSignature && (
              <span className="ml-2 rounded-md bg-dark/6 px-2.5 py-1 text-sm font-semibold text-dark/50">{timeSignature}</span>
            )}
          </div>
        )}

        {expectedVex.length > 0 && (
          <div className="lg:hidden portrait:flex landscape:hidden items-center gap-2 mt-3 text-[11px] text-primary/40">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="10" height="16" rx="2" />
              <path d="M16 9l3 3-3 3" /><path d="M2 15l3 3 3-3" /><path d="M19 12H9" />
            </svg>
            <span>Rotate your device to see the full staff</span>
          </div>
        )}

        {expectedVex.length > 0 && (
          <div className="mt-3">
            <StaffView vexNotes={expectedVex} label="Notes to play" timeSignature={timeSignature} />
          </div>
        )}

        {/* Metronome */}
        <div className="mt-4">
          <Metronome bpm={bpm} />
        </div>

        {/* Record controls */}
        <div className="mt-5 flex items-center gap-3">
          {recording ? (
            <button onClick={stopRecording}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-red-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-white" />
              Stop recording
            </button>
          ) : (
            <button onClick={startRecording}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-primary-hover">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              Start recording
            </button>
          )}
          {!recording && (
            <label className="flex flex-1 sm:flex-none cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary/70 whitespace-nowrap transition-colors hover:bg-primary/5">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload audio
              <input type="file" accept="audio/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAudioBlob(file);
                  setAudioUrl(URL.createObjectURL(file));
                  setResult(null);
                  e.target.value = '';
                }} />
            </label>
          )}
          {recording && (
            <span className="flex items-center gap-1.5 text-sm text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Recording…
            </span>
          )}
        </div>

        {audioUrl && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium text-dark/40 uppercase tracking-wide">Your recording</p>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-500">{error}</div>
        )}
      </div>

      <AttemptHistory taskId={task.id} refreshTrigger={attemptRefresh} />

      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={!audioBlob || submitting || recording}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed">
          Submit recording
        </button>
      </div>
    </div>
  );
}
