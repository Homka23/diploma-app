import { API_BASE } from '../config.js';
import { useState, useEffect } from 'react';
import { getPiano, getAudioCtx } from '../utils/pianoAudio';
import { ErrorScreen } from './ErrorView';

// ── Piano performance helpers ─────────────────────────────────────────────────
const SEMITONES  = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const IS_BLACK   = new Set([1, 3, 6, 8, 10]);
const WW = 40; const WH = 140; const BW = 26; const BH = 88;

function toAbs(note) {
  const m = note.match(/^([A-G])(#?)(\d)$/);
  if (!m) return null;
  return parseInt(m[3], 10) * 12 + SEMITONES[m[1]] + (m[2] === '#' ? 1 : 0);
}
function absToName(abs) { return NOTE_NAMES[abs % 12] + Math.floor(abs / 12); }

function MiniPiano({ performed, onKeyClick }) {
  const perfSet  = new Set(performed.map(toAbs).filter(Boolean));
  const startAbs = toAbs('C3');
  const white = [], black = [];
  let wi = 0;
  for (let i = 0; i < 36; i++) {
    const abs = startAbs + i;
    if (IS_BLACK.has(abs % 12)) { black.push({ abs, x: wi * WW - BW / 2 }); }
    else { white.push({ abs, x: wi * WW }); wi++; }
  }
  const totalW = wi * WW;
  return (
    <svg viewBox={`0 0 ${totalW} ${WH + 2}`} width="100%" style={{ display:'block', height:'auto' }}>
      {white.map((k, i) => (
        <g key={i} style={{ cursor: 'pointer' }} onClick={() => onKeyClick(absToName(k.abs))}>
          <rect x={k.x+1} y={1} width={WW-2} height={WH} rx={4} fill="#fafafa" stroke="#e2e8e5" strokeWidth={1} />
          {perfSet.has(k.abs) && <circle cx={k.x + WW/2} cy={1 + WH - 18} r={8} fill="#285A48" />}
        </g>
      ))}
      {black.map((k, i) => (
        <g key={i} style={{ cursor: 'pointer' }} onClick={() => onKeyClick(absToName(k.abs))}>
          <rect x={k.x} y={1} width={BW} height={BH} rx={3} fill="#2c2c2c" />
          {perfSet.has(k.abs) && <circle cx={k.x + BW/2} cy={1 + BH - 14} r={6} fill="#B0E4CC" />}
        </g>
      ))}
    </svg>
  );
}

async function playPianoKey(noteName) {
  getAudioCtx();
  const piano = await getPiano();
  if (piano) piano.play(noteName, undefined, { duration: 1.5, gain: 1 });
}

function PianoPerformanceBlock({ block, number, performed, onAnswer }) {
  // Support both old format (strings) and new format ({note, duration})
  const rawNotes = block.expected?.notes ?? [];
  const expected = rawNotes.map(n => typeof n === 'string' ? { note: n, duration: 1 } : n);
  const [playing, setPlaying] = useState(false);

  function handleKey(noteName) {
    playPianoKey(noteName);
    onAnswer([...performed, noteName]);
  }

  async function handlePlay() {
    if (playing || !expected.length) return;
    setPlaying(true);
    const totalMs = await playNotes(expected);
    const fallback = expected.reduce((s, n) => s + n.duration, 0) * 1000;
    setTimeout(() => setPlaying(false), (totalMs || fallback) + 300);
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white px-6 py-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3 mb-4">
        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{number}</span>
        <div className="flex-1">
          <p className="text-[15px] font-medium text-dark">{block.instructionText}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {expected.map((n, i) => (
              <span key={i} className="rounded-md bg-primary/8 px-2.5 py-1 text-sm font-semibold text-primary">{n.note}</span>
            ))}
          </div>
          <button onClick={handlePlay} disabled={playing}
            className="mt-2 flex items-center gap-1.5 text-xs text-[#408A71]/70 hover:text-[#408A71] transition-colors disabled:opacity-40">
            <svg className={`h-3.5 w-3.5 ${playing ? 'animate-pulse' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            {playing ? 'Playing…' : 'Listen'}
          </button>
        </div>
      </div>

      <div className="lg:hidden portrait:flex landscape:hidden items-center gap-2.5 rounded-xl border border-primary/10 bg-white px-3 py-2.5 text-xs text-primary/50 mb-3">
        <svg className="h-5 w-5 flex-shrink-0 text-primary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="10" height="16" rx="2" />
          <path d="M16 9l3 3-3 3" />
          <path d="M2 15l3 3 3-3" />
          <path d="M19 12H9" />
        </svg>
        <span>Rotate your device for easier play</span>
      </div>
      <div className="mb-4 rounded-2xl border border-primary/8 bg-white p-3 shadow-sm overflow-x-auto">
        <MiniPiano performed={performed} onKeyClick={handleKey} />
      </div>

      <div className="pl-9">
        <button
          onClick={() => onAnswer([])}
          disabled={performed.length === 0}
          className="flex items-center gap-1.5 text-sm text-dark/40 hover:text-dark/60 transition-colors disabled:opacity-30"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          Clear
        </button>
      </div>
    </div>
  );
}

async function playNotes(notes) {
  getAudioCtx();
  const piano = await getPiano();
  if (!piano) return 0;
  let offset = 0;
  for (const n of notes) {
    piano.schedule(getAudioCtx().currentTime + offset + 0.04, [
      { time: 0, note: n.note, duration: n.duration + 0.5, gain: 1 },
    ]);
    offset += n.duration;
  }
  return offset * 1000;
}

// ── Ear training single block ─────────────────────────────────────────────────
function EarTrainingQuestion({ block, number, selectedOptionId, onSelect }) {
  const [playing, setPlaying] = useState(false);

  async function handlePlay() {
    if (playing) return;
    setPlaying(true);
    const notes = block.config?.notes ?? [];
    const totalMs = await playNotes(notes);
    const fallback = notes.reduce((s, n) => s + n.duration, 0) * 1000;
    setTimeout(() => setPlaying(false), (totalMs || fallback) + 300);
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white px-6 py-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#408A71]/10 text-[11px] font-bold text-[#408A71]">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-dark">{block.promptText}</p>
          <button
            onClick={handlePlay}
            disabled={playing}
            className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              playing
                ? 'bg-[#408A71]/10 text-[#408A71]/50 cursor-not-allowed'
                : 'bg-[#408A71]/10 text-[#408A71] hover:bg-[#408A71]/20'
            }`}
          >
            <svg className={`h-4 w-4 ${playing ? 'animate-pulse' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            {playing ? 'Playing…' : 'Play sound'}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2 pl-9">
        {block.options.map(opt => {
          const isSelected = selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                isSelected
                  ? 'border-[#408A71] bg-[#408A71]/6 text-[#408A71] font-medium'
                  : 'border-primary/10 text-dark/60 hover:border-primary/25 hover:bg-primary/4'
              }`}
            >
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                isSelected ? 'border-[#408A71] bg-[#408A71]' : 'border-primary/20'
              }`}>
                {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              {opt.option_text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Quiz single question ──────────────────────────────────────────────────────
function QuizQuestion({ question, number, selectedOptionId, onSelect }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white px-6 py-5 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {number}
        </span>
        <p className="text-[15px] font-medium text-dark">{question.questionText}</p>
      </div>
      <div className="mt-4 space-y-2 pl-9">
        {question.options.map(opt => {
          const isSelected = selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                isSelected
                  ? 'border-[#408A71] bg-[#408A71]/6 text-[#408A71] font-medium'
                  : 'border-primary/10 text-dark/60 hover:border-primary/25 hover:bg-primary/4'
              }`}
            >
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                isSelected ? 'border-[#408A71] bg-[#408A71]' : 'border-primary/20'
              }`}>
                {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              {opt.option_text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Score screen ──────────────────────────────────────────────────────────────
function ScoreScreen({ scorePercent, correct, total, passed, onRetry, blocks, quizAnswers, earAnswers, pianoAnswers, lessonId }) {
  const [showReview, setShowReview] = useState(false);

  const quizMap  = Object.fromEntries((quizAnswers  ?? []).map(a => [a.questionId, a]));
  const earMap   = Object.fromEntries((earAnswers   ?? []).map(a => [a.blockId,    a]));
  const pianoMap = Object.fromEntries((pianoAnswers ?? []).map(a => [a.blockId,    a]));

  return (
    <div className="space-y-4">
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
              <p className="text-sm text-dark/50">{correct} / {total} correct · {passed ? 'Passed' : 'Need 80% to pass'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 px-6 py-4">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Try again
          </button>
          <button
            onClick={() => setShowReview(v => !v)}
            className="flex items-center gap-2 rounded-xl border border-primary/20 px-4 py-2.5 text-sm font-medium text-primary/70 transition-colors hover:bg-primary/5"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {showReview ? 'Hide review' : 'Review answers'}
          </button>
        </div>
      </div>

      {showReview && (
        <div className="space-y-3">
          {(() => {
            let num = 0;
            return blocks.map((block) => {
            if (block.type === 'quiz') {
              return block.questions.map((q) => {
                num++;
                const ans = quizMap[q.id];
                const correctOpt = q.options.find(o => o.isCorrect);
                return (
                  <ReviewCard
                    key={`q-${q.id}`}
                    number={num}
                    text={q.questionText}
                    options={q.options}
                    selectedId={ans?.selectedOptionId}
                    isCorrect={ans?.isCorrect}
                    correctId={correctOpt?.id}
                    optionTextField="option_text"
                  />
                );
              });
            }
            if (block.type === 'ear_training') {
              num++;
              const ans = earMap[block.blockId];
              const correctOpt = block.options.find(o => o.isCorrect);
              return (
                <ReviewCard
                  key={`e-${block.blockId}`}
                  number={num}
                  text={block.promptText}
                  options={block.options}
                  selectedId={ans?.selectedOptionId}
                  isCorrect={ans?.isCorrect}
                  correctId={correctOpt?.id}
                  optionTextField="option_text"
                  isEar
                  config={block.config}
                />
              );
            }
            if (block.type === 'piano_performance') {
              num++;
              const ans      = pianoMap[block.blockId];
              const rawNotes = block.expected?.notes ?? [];
              const expected = rawNotes.map(n => typeof n === 'string' ? { note: n, duration: 1 } : n);
              const performed = ans?.performed ?? [];
              return (
                <div key={`p-${block.blockId}`} className="overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
                  <div className="px-6 pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${ans?.isCorrect ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-500'}`}>{num}</span>
                      <div className="flex-1">
                        <p className="text-[15px] font-medium text-dark">{block.instructionText}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {expected.map((n, i) => {
                            const match = performed[i] === n.note;
                            return (
                              <span key={i} className={`rounded-md px-2.5 py-1 text-sm font-semibold ${match ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500'}`}>
                                {n.note}{performed[i] && !match ? ` (got ${performed[i]})` : ''}
                              </span>
                            );
                          })}
                        </div>
                        <p className="mt-1 text-xs text-dark/40">{ans?.scorePercent ?? 0}% correct</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          });
          })()}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ number, text, options, selectedId, isCorrect, correctId, isEar, config }) {
  const [playing, setPlaying] = useState(false);

  async function handlePlay() {
    if (playing || !config?.notes) return;
    setPlaying(true);
    const totalMs = await playNotes(config.notes);
    const fallback = config.notes.reduce((s, n) => s + n.duration, 0) * 1000;
    setTimeout(() => setPlaying(false), (totalMs || fallback) + 300);
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_-1px_rgba(0,0,0,0.04)]">
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isCorrect ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-500'}`}>
            {number}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-dark">{text}</p>
            {isEar && (
              <button
                onClick={handlePlay}
                disabled={playing}
                className="mt-2 flex items-center gap-1.5 text-xs text-[#408A71]/70 hover:text-[#408A71] transition-colors"
              >
                <svg className={`h-3.5 w-3.5 ${playing ? 'animate-pulse' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                {playing ? 'Playing…' : 'Play again'}
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-2 pl-9">
          {options.map(opt => {
            const isSelected  = opt.id === selectedId;
            const isCorrectOpt = opt.id === correctId;
            let cls = 'border-primary/10 text-dark/40';
            if (isSelected && isCorrect)   cls = 'border-primary bg-primary/6 text-primary font-medium';
            else if (isSelected && !isCorrect) cls = 'border-red-300 bg-red-50 text-red-600 font-medium';
            else if (isCorrectOpt)         cls = 'border-primary/30 bg-primary/4 text-primary/70';
            return (
              <div key={opt.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${cls}`}>
                {isSelected && isCorrect   && <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                {isSelected && !isCorrect  && <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
                {opt.option_text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export function QuizTab({ lessonId, onPassed, onProgressChange }) {
  const [blocks, setBlocks]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [quizSelected, setQuizSel]    = useState({});
  const [earSelected, setEarSel]      = useState({});
  const [pianoAnswers, setPianoAns]   = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState(null);

  function load() {
    setLoading(true);
    setResult(null);
    setQuizSel({});
    setEarSel({});
    setPianoAns({});
    setError('');
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/lessons/${lessonId}/test`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setBlocks(d.blocks))
      .catch(() => setError('Failed to load test'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [lessonId]);

  // Flatten all "items" that need an answer
  const quizQuestions  = blocks?.filter(b => b.type === 'quiz').flatMap(b => b.questions) ?? [];
  const earBlocks      = blocks?.filter(b => b.type === 'ear_training') ?? [];
  const pianoBlocks    = blocks?.filter(b => b.type === 'piano_performance') ?? [];
  const totalItems    = quizQuestions.length + earBlocks.length + pianoBlocks.length;
  const pianoStarted  = Object.values(pianoAnswers).filter(v => v.length > 0).length;
  const answeredCount = Object.keys(quizSelected).length + Object.keys(earSelected).length + pianoStarted;
  const allAnswered   = (quizQuestions.length + earBlocks.length) > 0 &&
                        Object.keys(quizSelected).length + Object.keys(earSelected).length ===
                        quizQuestions.length + earBlocks.length;

  useEffect(() => {
    onProgressChange?.(answeredCount, totalItems);
  }, [answeredCount, totalItems]);


  async function handleSubmit() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const quizAnswersList = Object.entries(quizSelected).map(([qId, optId]) => ({
      questionId: Number(qId), selectedOptionId: Number(optId),
    }));
    const earAnswersList = Object.entries(earSelected).map(([bId, optId]) => ({
      blockId: Number(bId), selectedOptionId: Number(optId),
    }));
    const pianoAnswersList = Object.entries(pianoAnswers).map(([bId, performed]) => ({
      blockId: Number(bId), performed,
    }));
    try {
      const res = await fetch(`${API_BASE}/api/lessons/${lessonId}/test/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizAnswers: quizAnswersList, earAnswers: earAnswersList, pianoAnswers: pianoAnswersList }),
      });
      const data = await res.json();
      setResult({ ...data, blocks });
      if (data.passed) onPassed?.();
    } catch {
      setError('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="flex items-end gap-[4px] h-10">
        {[0,1,2,3,4,5,6].map(i => (
          <div key={i} className="w-[5px] rounded-full bg-primary animate-wave origin-bottom"
            style={{ animationDelay: `${i * 0.1}s`, height: '40px' }} />
        ))}
      </div>
      <p className="text-sm font-medium text-primary/50">Loading…</p>
    </div>
  );
  if (error)   return <ErrorScreen message={error} onRetry={load} />;
  if (!blocks?.length) return <div className="py-20 text-center text-sm text-primary/30">No test content yet.</div>;

  if (result) {
    return <ScoreScreen {...result} lessonId={lessonId} onRetry={load} />;
  }

  // Render all blocks in order, each question/ear block numbered globally
  let globalNum = 0;
  return (
    <div className="space-y-4">
      {blocks.map(block => {
        if (block.type === 'quiz') {
          return block.questions.map(q => {
            globalNum++;
            return (
              <QuizQuestion
                key={`q-${q.id}`}
                question={q}
                number={globalNum}
                selectedOptionId={quizSelected[q.id]}
                onSelect={optId => setQuizSel(prev => ({ ...prev, [q.id]: optId }))}
              />
            );
          });
        }
        if (block.type === 'ear_training') {
          globalNum++;
          return (
            <EarTrainingQuestion
              key={`e-${block.blockId}`}
              block={block}
              number={globalNum}
              selectedOptionId={earSelected[block.blockId]}
              onSelect={optId => setEarSel(prev => ({ ...prev, [block.blockId]: optId }))}
            />
          );
        }
        if (block.type === 'piano_performance') {
          globalNum++;
          return (
            <PianoPerformanceBlock
              key={`p-${block.blockId}`}
              block={block}
              number={globalNum}
              performed={pianoAnswers[block.blockId] ?? []}
              onAnswer={notes => setPianoAns(prev => ({ ...prev, [block.blockId]: notes }))}
            />
          );
        }
        return null;
      })}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-dark/40">
          {answeredCount} / {totalItems} answered
        </p>
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit test'}
        </button>
      </div>
    </div>
  );
}
