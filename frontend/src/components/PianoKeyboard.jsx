import { useState, useRef, useEffect } from 'react';
import { getPiano, getAudioCtx, DURATION_SEC } from '../utils/pianoAudio';

// ── Note helpers ──────────────────────────────────────────────────────────────
const SEMITONES  = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const IS_BLACK   = new Set([1, 3, 6, 8, 10]);

function toAbsolute(noteStr) {
  const m = noteStr.match(/^([A-G])(#?)(\d)$/);
  if (!m) return null;
  const [, name, sharp, oct] = m;
  return parseInt(oct, 10) * 12 + SEMITONES[name] + (sharp === '#' ? 1 : 0);
}

function absToNote(abs) {
  return NOTE_NAMES[abs % 12] + Math.floor(abs / 12);
}

async function playNote(abs, duration = 2.0) {
  getAudioCtx();
  const noteName = absToNote(abs);
  const piano    = await getPiano();
  if (piano) {
    piano.play(noteName, undefined, { duration, gain: 1 });
  }
}

// ── Key sizes ─────────────────────────────────────────────────────────────────
const WW = 40;
const WH = 140;
const BW = 26;
const BH = 88;

export default function PianoKeyboard({ notes = [], startNote = 'C3', octaves = 3, scrollToNote = 'F3' }) {
  const [activeAbs, setActiveAbs]   = useState(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const cancelRef                   = useRef(false);
  const scrollRef                   = useRef(null);

  // derive highlighted set from notes array
  const hiSet    = new Set(notes.map(n => toAbsolute(n.note)).filter(Boolean));
  const startAbs = toAbsolute(startNote) ?? (3 * 12);

  // Scroll to scrollToNote on mount
  useEffect(() => {
    if (!scrollRef.current || !scrollToNote) return;
    const targetAbs = toAbsolute(scrollToNote);
    if (targetAbs === null) return;
    let whiteCount = 0;
    for (let i = startAbs; i < targetAbs; i++) {
      if (!IS_BLACK.has(i % 12)) whiteCount++;
    }
    scrollRef.current.scrollLeft = whiteCount * WW;
  }, []);

  // Build key arrays
  const whiteKeys = [];
  const blackKeys = [];
  let wi = 0;
  for (let i = 0; i < octaves * 12; i++) {
    const abs = startAbs + i;
    const s   = abs % 12;
    if (IS_BLACK.has(s)) {
      blackKeys.push({ abs, x: wi * WW - BW / 2 });
    } else {
      whiteKeys.push({ abs, x: wi * WW });
      wi++;
    }
  }
  const totalWidth = wi * WW;

  function handleKeyClick(abs) {
    setActiveAbs(abs);
    playNote(abs, 1.0);
    setTimeout(() => setActiveAbs(a => a === abs ? null : a), 1000);
  }

  async function handlePlay() {
    if (isPlaying) return;
    cancelRef.current = false;
    setIsPlaying(true);
    getAudioCtx();
    const piano = await getPiano();

    for (const { note, duration } of notes) {
      if (cancelRef.current) break;
      const abs = toAbsolute(note);
      if (abs === null) continue;
      const sec      = DURATION_SEC[duration] ?? 0.6;
      const noteName = absToNote(abs);
      setActiveAbs(abs);
      if (piano) piano.play(noteName, undefined, { duration: sec + 0.5, gain: 1 });
      await new Promise(r => setTimeout(r, sec * 1000));
    }

    setActiveAbs(null);
    setIsPlaying(false);
  }

  function handleStop() {
    cancelRef.current = true;
    setIsPlaying(false);
    setActiveAbs(null);
  }

  function whiteFill(abs) {
    if (hiSet.has(abs)) return '#d6f0e4';
    return '#fafafa';
  }
  function whiteStroke(abs) {
    if (hiSet.has(abs)) return '#95cdb0';
    return '#e2e8e5';
  }
  function blackFill(abs) {
    if (hiSet.has(abs)) return '#408A71';
    return '#2c2c2c';
  }

  return (
    <div className="space-y-3">

      {/* Play / Stop button */}
      {notes.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {activeAbs !== null ? (
              <>
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary">
                  {absToNote(activeAbs)}
                </span>
                {(() => {
                  const dur = notes.find(n => toAbsolute(n.note) === activeAbs)?.duration;
                  const label = { w:'whole', h:'half', q:'quarter', '8':'eighth', '16':'16th' }[dur];
                  return label ? (
                    <span className="text-xs text-primary/40">— {label}</span>
                  ) : null;
                })()}
              </>
            ) : (
              <span className="text-xs text-primary/30">Press a key</span>
            )}
          </div>

          {isPlaying ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs font-medium text-primary/60 transition-colors hover:border-primary/40 hover:text-primary"
            >
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                <rect x="2" y="2" width="3" height="8" rx="0.5"/>
                <rect x="7" y="2" width="3" height="8" rx="0.5"/>
              </svg>
              Stop
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 1.5l7 4.5-7 4.5z"/>
              </svg>
              Play
            </button>
          )}
        </div>
      )}

      {/* Keyboard */}
      <div ref={scrollRef} className="rounded-2xl border border-primary/8 bg-white p-3 shadow-sm">
        <svg
          viewBox={`0 0 ${totalWidth} ${WH + 2}`}
          width="100%"
          style={{ display: 'block', height: 'auto' }}
        >
          {whiteKeys.map((k, i) => (
            <g key={`w${i}`} style={{ cursor: 'pointer' }} onClick={() => handleKeyClick(k.abs)}>
              <rect
                x={k.x + 1}
                y={1}
                width={WW - 2}
                height={WH}
                rx={5}
                fill={whiteFill(k.abs)}
                stroke={whiteStroke(k.abs)}
                strokeWidth={1}
              />
              {k.abs === activeAbs && (
                <circle
                  cx={k.x + WW / 2}
                  cy={1 + WH - 20}
                  r={9}
                  fill="#285A48"
                />
              )}
            </g>
          ))}

          {blackKeys.map((k, i) => (
            <g key={`b${i}`} style={{ cursor: 'pointer' }} onClick={() => handleKeyClick(k.abs)}>
              <rect
                x={k.x}
                y={1}
                width={BW}
                height={BH}
                rx={4}
                fill={blackFill(k.abs)}
              />
              {k.abs === activeAbs && (
                <circle
                  cx={k.x + BW / 2}
                  cy={1 + BH - 14}
                  r={7}
                  fill="#B0E4CC"
                />
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
