import { useEffect, useRef, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';
import { getPiano, getAudioCtx, vexKeyToNoteName, DURATION_SEC } from '../utils/pianoAudio';

export default function StaffExample({ content }) {
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const cancelRef             = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !content?.notes?.length) return;

    const el      = containerRef.current;
    const style   = window.getComputedStyle(el);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const width   = Math.max((el.clientWidth - padding) || 560, 200);

    el.innerHTML = '';

    const notes  = content.notes;
    const chunk1 = notes.slice(0, 4);
    const chunk2 = notes.slice(4);
    const w1     = chunk2.length > 0 ? Math.round(width * 0.52) : width - 10;
    const w2     = width - w1 - 10;

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, 160);
    const ctx = renderer.getContext();

    const stave1 = new Stave(5, 20, w1);
    if (content.clef)          stave1.addClef(content.clef);
    if (content.timeSignature) stave1.addTimeSignature(content.timeSignature);
    stave1.setContext(ctx).draw();

    const v1 = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
    v1.addTickables(chunk1.map(n => new StaveNote({ keys: n.keys, duration: n.duration })));
    new Formatter().joinVoices([v1]).format([v1], w1 - 80);
    v1.draw(ctx, stave1);

    if (chunk2.length > 0) {
      const stave2 = new Stave(5 + w1, 20, w2);
      stave2.setContext(ctx).draw();
      const v2 = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
      v2.addTickables(chunk2.map(n => new StaveNote({ keys: n.keys, duration: n.duration })));
      new Formatter().joinVoices([v2]).format([v2], w2 - 20);
      v2.draw(ctx, stave2);
    }

    const svg = el.querySelector('svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${width} 160`);
      svg.setAttribute('width', '100%');
      svg.removeAttribute('height');
    }
  }, [content]);

  async function handlePlay() {
    if (playing || !content?.notes?.length) return;
    cancelRef.current = false;
    setPlaying(true);
    getAudioCtx();
    const piano = await getPiano();

    for (const n of content.notes) {
      if (cancelRef.current) break;
      const noteName = vexKeyToNoteName(n.keys[0]);
      const dur      = DURATION_SEC[n.duration] ?? 0.6;
      if (noteName && piano) piano.play(noteName, undefined, { duration: dur + 0.5, gain: 1 });
      await new Promise(r => setTimeout(r, dur * 1000));
    }

    setPlaying(false);
  }

  function handleStop() {
    cancelRef.current = true;
    setPlaying(false);
  }

  const hasNotes = content?.notes?.length > 0;

  return (
    <div className="space-y-2">
      {hasNotes && (
        <div className="flex justify-end">
          {playing ? (
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
      <div
        ref={containerRef}
        className="w-full rounded-xl border border-primary/10 bg-white p-3"
      />
    </div>
  );
}
