import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const MIN_BPM = 40;
const MAX_BPM = 240;

const TEMPO_MARKS = [
  { bpm: 40,  label: 'Grave' },
  { bpm: 60,  label: 'Largo' },
  { bpm: 76,  label: 'Adagio' },
  { bpm: 92,  label: 'Andante' },
  { bpm: 108, label: 'Moderato' },
  { bpm: 120, label: 'Allegretto' },
  { bpm: 144, label: 'Allegro' },
  { bpm: 176, label: 'Vivace' },
  { bpm: 208, label: 'Presto' },
];

function getTempoLabel(bpm) {
  let best = TEMPO_MARKS[0];
  for (const m of TEMPO_MARKS) {
    if (bpm >= m.bpm) best = m;
  }
  return best.label;
}

export default function MetronomePage() {
  const navigate = useNavigate();

  const [bpm, setBpm]         = useState(120);
  const [running, setRunning] = useState(false);
  const [accent, setAccent]   = useState(false); // flash on beat

  const intervalRef  = useRef(null);
  const audioCtxRef  = useRef(null);
  const tapTimesRef  = useRef([]);
  const bpmRef       = useRef(bpm);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  // ── audio click ──
  function click(isAccent = false) {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx  = audioCtxRef.current;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = isAccent ? 1200 : 880;
    gain.gain.setValueAtTime(isAccent ? 0.5 : 0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
    setAccent(true);
    setTimeout(() => setAccent(false), 80);
  }

  // ── start / stop ──
  const startMetronome = useCallback(() => {
    clearInterval(intervalRef.current);
    click(true);
    intervalRef.current = setInterval(() => {
      click(false);
    }, (60 / bpmRef.current) * 1000);
    setRunning(true);
  }, []);

  const stopMetronome = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  // restart when bpm changes while running
  useEffect(() => {
    if (running) startMetronome();
    return () => clearInterval(intervalRef.current);
  }, [bpm, running]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  // ── keyboard shortcuts ──
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowUp'   || e.key === '+') setBpm(v => Math.min(MAX_BPM, v + 1));
      if (e.key === 'ArrowDown' || e.key === '-') setBpm(v => Math.max(MIN_BPM, v - 1));
      if (e.key === ' ') { e.preventDefault(); setRunning(r => !r); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── tap tempo ──
  function handleTap() {
    const now = Date.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 6) tapTimesRef.current.shift();
    if (tapTimesRef.current.length >= 2) {
      const gaps = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        gaps.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(60000 / avg))));
    }
    if (!running) startMetronome();
  }

  const beatSec     = 60 / bpm;
  const ballTravel  = 180;

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white border-b border-primary/10 px-4 sm:px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/home')}
          className="text-primary/40 hover:text-primary transition-colors">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 5l-5 5 5 5" />
          </svg>
        </button>
        <h1 className="font-semibold text-primary">Metronome</h1>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 gap-8">

        {/* ── BPM display ── */}
        <div className="flex flex-col items-center gap-1">
          <div className={`text-7xl font-black tabular-nums transition-colors duration-75 ${accent ? 'text-primary' : 'text-primary/80'}`}>
            {bpm}
          </div>
          <div className="text-sm font-medium text-primary/40 tracking-widest uppercase">
            {getTempoLabel(bpm)}
          </div>
        </div>

        {/* ── Ball animation area ── */}
        <div className="relative flex flex-col items-center" style={{ height: `${ballTravel + 64}px`, width: '120px' }}>
          {/* Ball */}
          <div
            className={`ball-bounce w-14 h-14 rounded-full flex-shrink-0 ${accent ? 'bg-primary' : 'bg-primary/70'} transition-colors duration-75`}
            style={{
              '--ball-duration': `${beatSec}s`,
              '--ball-travel':   `${ballTravel}px`,
              animationPlayState: running ? 'running' : 'paused',
              boxShadow: '0 4px 24px rgba(40,90,72,0.3)',
            }}
          />
          {/* Shadow on ground */}
          <div
            className="shadow-pulse absolute bottom-0 left-1/2 h-3 w-14 rounded-full bg-primary/20 blur-sm"
            style={{
              '--ball-duration': `${beatSec}s`,
              animationPlayState: running ? 'running' : 'paused',
              transform: 'translateX(-50%)',
            }}
          />
        </div>

        {/* ── BPM slider ── */}
        <div className="w-full max-w-sm flex flex-col gap-2">
          <input
            type="range" min={MIN_BPM} max={MAX_BPM} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-full accent-primary h-1.5 rounded-full cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-primary/30 font-medium">
            <span>{MIN_BPM}</span>
            <span>{MAX_BPM}</span>
          </div>
        </div>

        {/* ── BPM +/- controls ── */}
        <div className="flex items-center gap-3">
          <button onClick={() => setBpm(v => Math.max(MIN_BPM, v - 5))}
            className="w-11 h-11 rounded-full border border-primary/20 text-primary/60 text-xl font-bold hover:bg-primary/5 transition-colors flex items-center justify-center">
            −
          </button>
          <button onClick={() => setBpm(v => Math.max(MIN_BPM, v - 1))}
            className="w-9 h-9 rounded-full border border-primary/15 text-primary/40 text-base font-bold hover:bg-primary/5 transition-colors flex items-center justify-center">
            −
          </button>

          <button
            onClick={() => setRunning(r => !r)}
            className={`w-20 h-20 rounded-full text-sm font-bold transition-all shadow-lg flex items-center justify-center ${
              running
                ? 'bg-primary text-white shadow-primary/30 scale-95'
                : 'bg-primary text-white shadow-primary/20 hover:scale-105'
            }`}>
            {running ? 'Stop' : 'Start'}
          </button>

          <button onClick={() => setBpm(v => Math.min(MAX_BPM, v + 1))}
            className="w-9 h-9 rounded-full border border-primary/15 text-primary/40 text-base font-bold hover:bg-primary/5 transition-colors flex items-center justify-center">
            +
          </button>
          <button onClick={() => setBpm(v => Math.min(MAX_BPM, v + 5))}
            className="w-11 h-11 rounded-full border border-primary/20 text-primary/60 text-xl font-bold hover:bg-primary/5 transition-colors flex items-center justify-center">
            +
          </button>
        </div>

        {/* ── Tap tempo ── */}
        <button
          onClick={handleTap}
          className="rounded-xl border-2 border-primary/20 px-8 py-3 text-sm font-semibold text-primary/60 hover:bg-primary/5 hover:border-primary/35 transition-all active:scale-95">
          Tap tempo
        </button>

        {/* ── Keyboard hint ── */}
        <p className="text-xs text-primary/25">
          Space — start/stop · ↑↓ — change BPM
        </p>

      </div>
    </div>
  );
}
