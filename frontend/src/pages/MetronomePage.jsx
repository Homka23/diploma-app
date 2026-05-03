import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../config.js';

function initials(user) {
  const name = user?.display_name || user?.username || user?.email || '?';
  return name.slice(0, 2).toUpperCase();
}

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

  const [user, setUser]           = useState(null);
  const [profileOpen, setProfile] = useState(false);

  const [bpm, setBpm]         = useState(120);
  const [running, setRunning] = useState(false);
  const [accent, setAccent]   = useState(false); // flash on beat

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user) { setUser(d.user); localStorage.setItem('user', JSON.stringify(d.user)); } })
      .catch(() => {});
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

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

  const beatSec = 60 / bpm;

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-primary/10 bg-[#f7f7f7]/95 backdrop-blur-sm flex-shrink-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
          {/* Logo + title */}
          <button onClick={() => navigate('/home')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <span className="text-base font-bold text-dark">Music Theory</span>
          </button>

          <span className="text-sm font-semibold text-primary/50 hidden sm:block">Metronome</span>

          {/* User */}
          {user && (
            <div className="relative">
              <button onClick={() => setProfile(o => !o)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-primary/8">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  {initials(user)}
                </div>
                <span className="hidden text-sm font-medium text-dark sm:block">
                  {user.display_name || user.username || user.email?.split('@')[0]}
                </span>
                <svg className={`h-3.5 w-3.5 text-primary/40 transition-transform ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-primary/12 bg-white shadow-lg shadow-primary/8 z-50">
                  <Link to="/profile" className="block px-4 py-2.5 text-sm text-primary/70 transition-colors hover:bg-[#f7f7f7] hover:text-primary">
                    Profile
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2.5 text-sm text-[#408A71] font-medium transition-colors hover:bg-[#f7f7f7]">
                      Admin panel
                    </Link>
                  )}
                  <div className="mx-3 h-px bg-primary/8" />
                  <button onClick={logout} className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-50 hover:text-red-500">
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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

        {/* ── Pendulum ── */}
        <div className="relative flex items-end justify-center" style={{ height: '220px', width: '140px' }}>
          {/* Left / right tick marks */}
          <div className="absolute bottom-0 w-full flex justify-between px-4 pointer-events-none">
            <div className="w-0.5 h-4 rounded-full bg-primary/20" />
            <div className="w-0.5 h-4 rounded-full bg-primary/20" />
          </div>

          {/* Rod (rotates around bottom-center) */}
          <div
            className="pendulum-rod absolute bottom-0"
            style={{
              '--swing-duration': `${beatSec * 2}s`,
              animationPlayState: running ? 'running' : 'paused',
              width: '3px',
              height: '190px',
              borderRadius: '2px',
              backgroundColor: accent ? 'var(--color-primary)' : 'rgba(40,90,72,0.55)',
              transition: 'background-color 75ms',
            }}
          >
            {/* Weight */}
            <div
              className="absolute left-1/2 rounded-full"
              style={{
                top: '18px',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '24px',
                backgroundColor: accent ? 'var(--color-primary)' : 'rgba(40,90,72,0.6)',
                transition: 'background-color 75ms',
                boxShadow: '0 2px 10px rgba(40,90,72,0.25)',
              }}
            />
          </div>

          {/* Pivot dot */}
          <div
            className="absolute bottom-0 left-1/2 rounded-full bg-primary/70"
            style={{ width: '10px', height: '10px', transform: 'translate(-50%, 50%)' }}
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
