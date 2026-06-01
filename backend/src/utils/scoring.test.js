// backend/src/utils/scoring.test.js
import { beatMultiplierFor, median, evaluateDurations, calcPitchScore, calcFinalScore } from './scoring.js';

// ── beatMultiplierFor ─────────────────────────────────────────────────────────

describe('beatMultiplierFor', () => {
  test('returns 1 for null/undefined', () => {
    expect(beatMultiplierFor(null)).toBe(1);
    expect(beatMultiplierFor(undefined)).toBe(1);
  });

  test('returns 1 for simple 4/4', () => {
    expect(beatMultiplierFor('4/4')).toBe(1);
  });

  test('returns 1.5 for compound 6/8', () => {
    expect(beatMultiplierFor('6/8')).toBe(1.5);
  });

  test('returns 1.5 for compound 9/8 and 12/8', () => {
    expect(beatMultiplierFor('9/8')).toBe(1.5);
    expect(beatMultiplierFor('12/8')).toBe(1.5);
  });

  test('returns 0.5 for simple 3/8 (not compound)', () => {
    expect(beatMultiplierFor('3/8')).toBe(0.5);
  });

  test('returns 2 for half-time 2/2', () => {
    expect(beatMultiplierFor('2/2')).toBe(2);
  });
});

// ── median ────────────────────────────────────────────────────────────────────

describe('median', () => {
  test('returns middle element for odd-length array', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  test('returns average of two middle elements for even-length array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  test('returns single element unchanged', () => {
    expect(median([7])).toBe(7);
  });

  test('does not mutate the original array', () => {
    const arr = [5, 1, 3];
    median(arr);
    expect(arr).toEqual([5, 1, 3]);
  });
});

// ── calcPitchScore ────────────────────────────────────────────────────────────

describe('calcPitchScore', () => {
  test('returns 100 when all notes match', () => {
    expect(calcPitchScore(['C4', 'E4', 'G4'], ['C4', 'E4', 'G4'])).toBe(100);
  });

  test('returns 0 when no notes match', () => {
    expect(calcPitchScore(['C4', 'E4'], ['D4', 'F4'])).toBe(0);
  });

  test('penalises extra recognized notes', () => {
    // 2 correct out of max(2, 4) = 4 → 50%
    const score = calcPitchScore(['C4', 'E4'], ['C4', 'E4', 'G4', 'B4']);
    expect(score).toBe(50);
  });

  test('penalises missing notes', () => {
    // 1 correct out of max(3, 1) = 3 → ~33%
    const score = calcPitchScore(['C4', 'E4', 'G4'], ['C4']);
    expect(score).toBeCloseTo(33.33, 1);
  });

  test('returns 0 for empty arrays', () => {
    expect(calcPitchScore([], [])).toBe(0);
  });
});

// ── evaluateDurations ─────────────────────────────────────────────────────────

describe('evaluateDurations', () => {
  test('returns null scores when expectedRatios is null', () => {
    const result = evaluateDurations([], ['C4', 'E4'], null, '4/4');
    expect(result.durationScore).toBeNull();
    expect(result.beatUnit).toBeNull();
    expect(result.noteDurations).toHaveLength(2);
    expect(result.noteDurations[0].match).toBeNull();
  });

  test('infers beatUnit from recognized durations', () => {
    // Student plays quarter notes at 0.6s each; ratios are [1, 1]
    const notes    = [{ duration: 0.6 }, { duration: 0.6 }];
    const expected = ['C4', 'E4'];
    const ratios   = [1, 1];
    const { beatUnit } = evaluateDurations(notes, expected, ratios, '4/4');
    expect(beatUnit).toBeCloseTo(0.6, 2);
  });

  test('returns 100 when all durations are within ±20%', () => {
    // beatUnit = 0.5s, ratios [1,1] → expected 0.5s each; recognized 0.55s (10% off)
    const notes    = [{ duration: 0.55 }, { duration: 0.55 }];
    const expected = ['C4', 'E4'];
    const ratios   = [1, 1];
    const { durationScore } = evaluateDurations(notes, expected, ratios, '4/4');
    expect(durationScore).toBe(100);
  });

  test('returns 0 when proportions between notes are wrong', () => {
    // ratios [1, 2] means second note should be twice as long as first.
    // Student plays both at 0.5s → beatUnit = median([0.5/1, 0.5/2]) = 0.375
    // expected[0] = 0.375s, recognized = 0.5s → diff 33% > 20% → no match
    // expected[1] = 0.75s,  recognized = 0.5s → diff 33% > 20% → no match
    const notes    = [{ duration: 0.5 }, { duration: 0.5 }];
    const expected = ['C4', 'E4'];
    const ratios   = [1, 2];
    const { durationScore } = evaluateDurations(notes, expected, ratios, '4/4');
    expect(durationScore).toBe(0);
  });

  test('falls back to beatUnit=1 when no notes have duration', () => {
    const notes    = [{ note: 'C4' }, { note: 'E4' }]; // no duration field
    const expected = ['C4', 'E4'];
    const ratios   = [1, 1];
    const { beatUnit } = evaluateDurations(notes, expected, ratios, '4/4');
    expect(beatUnit).toBe(1);
  });

  test('applies compound multiplier for 6/8', () => {
    // ratio=1, bm=1.5 → expected duration = 1 * 1.5 * beatUnit
    const notes    = [{ duration: 0.75 }, { duration: 0.75 }];
    const expected = ['C4', 'E4'];
    const ratios   = [1, 1];
    const { beatUnit, durationScore } = evaluateDurations(notes, expected, ratios, '6/8');
    // beatUnit = 0.75 / (1 * 1.5) = 0.5; expected = 1 * 1.5 * 0.5 = 0.75 → perfect match
    expect(beatUnit).toBeCloseTo(0.5, 2);
    expect(durationScore).toBe(100);
  });
});

// ── calcFinalScore ────────────────────────────────────────────────────────────

describe('calcFinalScore', () => {
  test('uses pitch only when durationScore is null', () => {
    expect(calcFinalScore(80, null)).toBe(80);
  });

  test('combines pitch 75% + duration 25%', () => {
    expect(calcFinalScore(100, 100)).toBe(100);
    expect(calcFinalScore(80, 60)).toBe(Math.round(80 * 0.75 + 60 * 0.25));
  });

  test('score of 80 or above is passing threshold', () => {
    expect(calcFinalScore(80, null)).toBeGreaterThanOrEqual(80);
    expect(calcFinalScore(79, null)).toBeLessThan(80);
  });
});
