// backend/src/utils/scoring.js

export function beatMultiplierFor(timeSignature) {
  if (!timeSignature) return 1;
  const [top, bottom] = timeSignature.split('/').map(Number);
  if (bottom === 8 && top % 3 === 0 && top > 3) return 1.5;
  if (bottom === 2)                              return 2;
  if (bottom === 8)                              return 0.5;
  return 1;
}

export function median(arr) {
  const s   = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

export function evaluateDurations(notes, expected, expectedRatios, timeSignature) {
  if (!expectedRatios) {
    return {
      noteDurations: expected.map(() => ({ expectedRatio: null, expected: null, recognized: null, match: null })),
      durationScore: null,
      beatUnit:      null,
    };
  }

  const bm     = beatMultiplierFor(timeSignature);
  const paired = expectedRatios
    .map((r, i) => notes[i]?.duration != null ? { ratio: r * bm, dur: notes[i].duration } : null)
    .filter(Boolean);

  const beatUnit = paired.length > 0 ? median(paired.map(p => p.dur / p.ratio)) : 1;

  const noteDurations = expected.map((_, i) => {
    const ratio  = expectedRatios[i] ?? null;
    const recDur = notes[i]?.duration ?? null;
    const expDur = ratio != null ? parseFloat((ratio * bm * beatUnit).toFixed(2)) : null;
    const match  = expDur != null && recDur != null
      ? Math.abs(recDur - expDur) / expDur <= 0.2
      : null;
    return {
      expectedRatio: ratio,
      expected:      expDur,
      recognized:    recDur != null ? parseFloat(recDur.toFixed(2)) : null,
      match,
    };
  });

  const hits        = noteDurations.filter(d => d.match === true).length;
  const durationScore = Math.round((hits / expected.length) * 100);

  return { noteDurations, durationScore, beatUnit: parseFloat(beatUnit.toFixed(3)) };
}

export function calcPitchScore(expected, recognized) {
  const hits       = expected.filter((n, i) => recognized[i] === n).length;
  const totalNotes = Math.max(expected.length, recognized.length);
  return totalNotes > 0 ? (hits / totalNotes) * 100 : 0;
}

export function calcFinalScore(pitchScore, durationScore) {
  return Math.round(
    durationScore != null
      ? pitchScore * 0.75 + durationScore * 0.25
      : pitchScore,
  );
}
