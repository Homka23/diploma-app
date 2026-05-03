-- Seed: practice tasks for all lessons
-- Run once on the deployed database

INSERT INTO practice_tasks (lesson_id, title, instruction_text, expected_json, position) VALUES

-- ── Lesson 1: Introduction to Notes ──────────────────────────────────────────
(1, 'Single note C', 'Play C4', '{"notes":["C4"],"durations":[2],"timeSignature":"4/4"}', 1),
(1, 'C and E', 'Play C4 then E4', '{"notes":["C4","E4"],"durations":[1,1],"timeSignature":"4/4"}', 2),
(1, 'C D E', 'Play C4, D4, E4 in order', '{"notes":["C4","D4","E4"],"durations":[1,1,1],"timeSignature":"4/4"}', 3),
(1, 'C D E F G', 'Play five notes: C4 D4 E4 F4 G4', '{"notes":["C4","D4","E4","F4","G4"],"durations":[1,1,1,1,1],"timeSignature":"4/4"}', 4),
(1, 'A B C', 'Play A4, B4, C5', '{"notes":["A4","B4","C5"],"durations":[1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 2: Reading Sheet Music ────────────────────────────────────────────
(2, 'Line notes', 'Play E4, G4, B4 — notes on the lines', '{"notes":["E4","G4","B4"],"durations":[1,1,1],"timeSignature":"4/4"}', 1),
(2, 'Space notes', 'Play F4, A4, C5 — notes in the spaces', '{"notes":["F4","A4","C5"],"durations":[1,1,1],"timeSignature":"4/4"}', 2),
(2, 'Ascending phrase', 'Play C4 D4 E4 F4 G4 A4', '{"notes":["C4","D4","E4","F4","G4","A4"],"durations":[1,1,1,1,1,1],"timeSignature":"4/4"}', 3),
(2, 'Descending phrase', 'Play G4 F4 E4 D4 C4', '{"notes":["G4","F4","E4","D4","C4"],"durations":[1,1,1,1,2],"timeSignature":"4/4"}', 4),
(2, 'Skip motion', 'Play C4 E4 G4 E4 C4', '{"notes":["C4","E4","G4","E4","C4"],"durations":[1,1,1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 3: Rhythm & Time Signatures ───────────────────────────────────────
(3, 'Two half notes', 'Play C4 and G4 as half notes', '{"notes":["C4","G4"],"durations":[2,2],"timeSignature":"4/4"}', 1),
(3, 'Quarter notes', 'Play C4 D4 E4 G4 as quarter notes', '{"notes":["C4","D4","E4","G4"],"durations":[1,1,1,1],"timeSignature":"4/4"}', 2),
(3, 'Mixed durations', 'Play C4 (quarter), E4 (quarter), G4 (half)', '{"notes":["C4","E4","G4"],"durations":[1,1,2],"timeSignature":"4/4"}', 3),
(3, '3/4 pattern', 'Play C4 E4 G4 in 3/4 time', '{"notes":["C4","E4","G4"],"durations":[1,1,1],"timeSignature":"3/4"}', 4),
(3, 'Dotted rhythm', 'Play C4 (dotted quarter), D4 (eighth), E4 (half)', '{"notes":["C4","D4","E4"],"durations":[1.5,0.5,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 4: Dynamics & Tempo ───────────────────────────────────────────────
(4, 'Slow and steady', 'Play C4 E4 G4 slowly and evenly', '{"notes":["C4","E4","G4"],"durations":[2,2,2],"timeSignature":"4/4"}', 1),
(4, 'Short motif', 'Play G4 F4 E4 D4', '{"notes":["G4","F4","E4","D4"],"durations":[1,1,1,1],"timeSignature":"4/4"}', 2),
(4, 'Rising phrase', 'Play C4 D4 E4 G4', '{"notes":["C4","D4","E4","G4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 3),
(4, 'Falling phrase', 'Play A4 G4 F4 E4 D4 C4', '{"notes":["A4","G4","F4","E4","D4","C4"],"durations":[1,1,1,1,1,2],"timeSignature":"4/4"}', 4),

-- ── Lesson 5: Major Scales ───────────────────────────────────────────────────
(5, 'C major lower', 'Play the first four notes of C major: C4 D4 E4 F4', '{"notes":["C4","D4","E4","F4"],"durations":[1,1,1,1],"timeSignature":"4/4"}', 1),
(5, 'C major upper', 'Play the upper half of C major: G4 A4 B4 C5', '{"notes":["G4","A4","B4","C5"],"durations":[1,1,1,1],"timeSignature":"4/4"}', 2),
(5, 'C major full', 'Play the full C major scale', '{"notes":["C4","D4","E4","F4","G4","A4","B4","C5"],"durations":[1,1,1,1,1,1,1,1],"timeSignature":"4/4"}', 3),
(5, 'G major lower', 'Play G4 A4 B4 C5 (G major)', '{"notes":["G4","A4","B4","C5"],"durations":[1,1,1,1],"timeSignature":"4/4"}', 4),
(5, 'G major full', 'Play the G major scale: G4 A4 B4 C5 D5 E5 F#5 G5', '{"notes":["G4","A4","B4","C5","D5","E5","F#5","G5"],"durations":[1,1,1,1,1,1,1,1],"timeSignature":"4/4"}', 5),

-- ── Lesson 6: Natural Minor Scale ────────────────────────────────────────────
(6, 'A minor lower', 'Play A3 B3 C4 D4 (A natural minor)', '{"notes":["A3","B3","C4","D4"],"durations":[1,1,1,1],"timeSignature":"4/4"}', 1),
(6, 'A minor upper', 'Play E4 F4 G4 A4', '{"notes":["E4","F4","G4","A4"],"durations":[1,1,1,1],"timeSignature":"4/4"}', 2),
(6, 'A minor full', 'Play the full A natural minor scale', '{"notes":["A3","B3","C4","D4","E4","F4","G4","A4"],"durations":[1,1,1,1,1,1,1,1],"timeSignature":"4/4"}', 3),
(6, 'A minor descending', 'Play A4 G4 F4 E4 D4 C4 B3 A3', '{"notes":["A4","G4","F4","E4","D4","C4","B3","A3"],"durations":[1,1,1,1,1,1,1,1],"timeSignature":"4/4"}', 4),
(6, 'D minor lower', 'Play D4 E4 F4 G4 (D natural minor)', '{"notes":["D4","E4","F4","G4"],"durations":[1,1,1,1],"timeSignature":"4/4"}', 5),

-- ── Lesson 7: Harmonic & Melodic Minor ───────────────────────────────────────
(7, 'A harmonic minor', 'Play A3 B3 C4 D4 E4 F4 G#4 A4', '{"notes":["A3","B3","C4","D4","E4","F4","G#4","A4"],"durations":[1,1,1,1,1,1,1,1],"timeSignature":"4/4"}', 1),
(7, 'A melodic minor ascending', 'Play A3 B3 C4 D4 E4 F#4 G#4 A4', '{"notes":["A3","B3","C4","D4","E4","F#4","G#4","A4"],"durations":[1,1,1,1,1,1,1,1],"timeSignature":"4/4"}', 2),
(7, 'Leading tone', 'Play G#4 A4 — the leading tone resolution', '{"notes":["G#4","A4"],"durations":[1,2],"timeSignature":"4/4"}', 3),
(7, 'Harmonic minor phrase', 'Play E4 F4 G#4 A4', '{"notes":["E4","F4","G#4","A4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 4),
(7, 'Melodic minor phrase', 'Play A3 C4 E4 F#4 G#4 A4', '{"notes":["A3","C4","E4","F#4","G#4","A4"],"durations":[1,1,1,1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 8: Key Signatures ─────────────────────────────────────────────────
(8, 'G major (1 sharp)', 'Play G4 A4 B4 C5 D5 — G major, F is sharp', '{"notes":["G4","A4","B4","C5","D5"],"durations":[1,1,1,1,1],"timeSignature":"4/4"}', 1),
(8, 'D major (2 sharps)', 'Play D4 E4 F#4 G4 A4 — D major', '{"notes":["D4","E4","F#4","G4","A4"],"durations":[1,1,1,1,1],"timeSignature":"4/4"}', 2),
(8, 'F major (1 flat)', 'Play F4 G4 A4 A#4 C5 — F major, B is flat', '{"notes":["F4","G4","A4","A#4","C5"],"durations":[1,1,1,1,1],"timeSignature":"4/4"}', 3),
(8, 'A major (3 sharps)', 'Play A3 B3 C#4 D4 E4', '{"notes":["A3","B3","C#4","D4","E4"],"durations":[1,1,1,1,1],"timeSignature":"4/4"}', 4),
(8, 'Bb major (2 flats)', 'Play A#3 C4 D4 D#4 F4', '{"notes":["A#3","C4","D4","D#4","F4"],"durations":[1,1,1,1,1],"timeSignature":"4/4"}', 5),

-- ── Lesson 9: What Are Intervals? ────────────────────────────────────────────
(9, 'Unison and step', 'Play C4 C4 D4', '{"notes":["C4","C4","D4"],"durations":[1,1,2],"timeSignature":"4/4"}', 1),
(9, 'Second (C to D)', 'Play C4 then D4', '{"notes":["C4","D4"],"durations":[1,2],"timeSignature":"4/4"}', 2),
(9, 'Third (C to E)', 'Play C4 then E4', '{"notes":["C4","E4"],"durations":[1,2],"timeSignature":"4/4"}', 3),
(9, 'Mixed intervals', 'Play C4 D4 C4 E4', '{"notes":["C4","D4","C4","E4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 4),
(9, 'Interval sequence', 'Play C4 E4 G4 C5', '{"notes":["C4","E4","G4","C5"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 10: Perfect Intervals ─────────────────────────────────────────────
(10, 'Perfect 4th: C to F', 'Play C4 then F4', '{"notes":["C4","F4"],"durations":[1,2],"timeSignature":"4/4"}', 1),
(10, 'Perfect 5th: C to G', 'Play C4 then G4', '{"notes":["C4","G4"],"durations":[1,2],"timeSignature":"4/4"}', 2),
(10, 'Octave: C4 to C5', 'Play C4 then C5', '{"notes":["C4","C5"],"durations":[1,2],"timeSignature":"4/4"}', 3),
(10, 'Perfect intervals sequence', 'Play C4 F4 C4 G4', '{"notes":["C4","F4","C4","G4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 4),
(10, 'Two perfect 5ths', 'Play C4 G4 D4 A4', '{"notes":["C4","G4","D4","A4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 11: Major & Minor Intervals ───────────────────────────────────────
(11, 'Major 3rd: C to E', 'Play C4 then E4 (major 3rd)', '{"notes":["C4","E4"],"durations":[1,2],"timeSignature":"4/4"}', 1),
(11, 'Minor 3rd: A to C', 'Play A3 then C4 (minor 3rd)', '{"notes":["A3","C4"],"durations":[1,2],"timeSignature":"4/4"}', 2),
(11, 'Major 6th: C to A', 'Play C4 then A4 (major 6th)', '{"notes":["C4","A4"],"durations":[1,2],"timeSignature":"4/4"}', 3),
(11, 'Minor 6th: E to C', 'Play E4 then C5 (minor 6th)', '{"notes":["E4","C5"],"durations":[1,2],"timeSignature":"4/4"}', 4),
(11, 'Interval comparison', 'Play C4 E4 C4 D#4', '{"notes":["C4","E4","C4","D#4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 12: Introduction to Triads ────────────────────────────────────────
(12, 'C major triad', 'Play C4, E4, G4', '{"notes":["C4","E4","G4"],"durations":[1,1,2],"timeSignature":"4/4"}', 1),
(12, 'A minor triad', 'Play A3, C4, E4', '{"notes":["A3","C4","E4"],"durations":[1,1,2],"timeSignature":"4/4"}', 2),
(12, 'G major triad', 'Play G3, B3, D4', '{"notes":["G3","B3","D4"],"durations":[1,1,2],"timeSignature":"4/4"}', 3),
(12, 'D minor triad', 'Play D4, F4, A4', '{"notes":["D4","F4","A4"],"durations":[1,1,2],"timeSignature":"4/4"}', 4),
(12, 'F major triad', 'Play F3, A3, C4', '{"notes":["F3","A3","C4"],"durations":[1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 13: Major & Minor Chords ──────────────────────────────────────────
(13, 'C major broken', 'Play C4 E4 G4 E4 C4', '{"notes":["C4","E4","G4","E4","C4"],"durations":[1,1,1,1,2],"timeSignature":"4/4"}', 1),
(13, 'A minor broken', 'Play A3 C4 E4 C4 A3', '{"notes":["A3","C4","E4","C4","A3"],"durations":[1,1,1,1,2],"timeSignature":"4/4"}', 2),
(13, 'E major triad', 'Play E4, G#4, B4', '{"notes":["E4","G#4","B4"],"durations":[1,1,2],"timeSignature":"4/4"}', 3),
(13, 'E minor triad', 'Play E4, G4, B4', '{"notes":["E4","G4","B4"],"durations":[1,1,2],"timeSignature":"4/4"}', 4),
(13, 'Major vs minor', 'Play C4 E4 G4 then C4 D#4 G4', '{"notes":["C4","E4","G4","C4","D#4","G4"],"durations":[1,1,1,1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 14: Seventh Chords ────────────────────────────────────────────────
(14, 'Cmaj7', 'Play C4, E4, G4, B4 (Cmaj7)', '{"notes":["C4","E4","G4","B4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 1),
(14, 'C dominant 7', 'Play C4, E4, G4, A#4 (C7)', '{"notes":["C4","E4","G4","A#4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 2),
(14, 'Am7', 'Play A3, C4, E4, G4 (Am7)', '{"notes":["A3","C4","E4","G4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 3),
(14, 'G7', 'Play G3, B3, D4, F4 (G7)', '{"notes":["G3","B3","D4","F4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 4),
(14, 'Dm7', 'Play D4, F4, A4, C5 (Dm7)', '{"notes":["D4","F4","A4","C5"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 15: Chord Inversions ──────────────────────────────────────────────
(15, 'C major root', 'Play C4 E4 G4 (root position)', '{"notes":["C4","E4","G4"],"durations":[1,1,2],"timeSignature":"4/4"}', 1),
(15, 'C major 1st inversion', 'Play E4 G4 C5 (1st inversion)', '{"notes":["E4","G4","C5"],"durations":[1,1,2],"timeSignature":"4/4"}', 2),
(15, 'C major 2nd inversion', 'Play G4 C5 E5 (2nd inversion)', '{"notes":["G4","C5","E5"],"durations":[1,1,2],"timeSignature":"4/4"}', 3),
(15, 'Root to 1st inversion', 'Play C4 E4 G4 then E4 G4 C5', '{"notes":["C4","E4","G4","E4","G4","C5"],"durations":[1,1,1,1,1,2],"timeSignature":"4/4"}', 4),
(15, 'F major 1st inversion', 'Play A3 C4 F4 (F/A)', '{"notes":["A3","C4","F4"],"durations":[1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 16: Diatonic Chords ───────────────────────────────────────────────
(16, 'I chord (C major)', 'Play C4 E4 G4', '{"notes":["C4","E4","G4"],"durations":[1,1,2],"timeSignature":"4/4"}', 1),
(16, 'IV chord (F major)', 'Play F3 A3 C4', '{"notes":["F3","A3","C4"],"durations":[1,1,2],"timeSignature":"4/4"}', 2),
(16, 'V chord (G major)', 'Play G3 B3 D4', '{"notes":["G3","B3","D4"],"durations":[1,1,2],"timeSignature":"4/4"}', 3),
(16, 'ii chord (D minor)', 'Play D4 F4 A4', '{"notes":["D4","F4","A4"],"durations":[1,1,2],"timeSignature":"4/4"}', 4),
(16, 'vi chord (A minor)', 'Play A3 C4 E4', '{"notes":["A3","C4","E4"],"durations":[1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 17: Chord Progressions ────────────────────────────────────────────
(17, 'I–V roots', 'Play C4 then G4 (I to V)', '{"notes":["C4","G4"],"durations":[2,2],"timeSignature":"4/4"}', 1),
(17, 'I–IV–V roots', 'Play C4 F4 G4 (I–IV–V)', '{"notes":["C4","F4","G4"],"durations":[1,1,2],"timeSignature":"4/4"}', 2),
(17, 'I–V–vi–IV roots', 'Play C4 G4 A4 F4', '{"notes":["C4","G4","A4","F4"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 3),
(17, 'I–IV–V–I melody', 'Play C4 D4 E4 F4 G4 C4', '{"notes":["C4","D4","E4","F4","G4","C4"],"durations":[1,1,1,1,1,2],"timeSignature":"4/4"}', 4),
(17, 'vi–IV–I–V roots', 'Play A3 F3 C4 G3', '{"notes":["A3","F3","C4","G3"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 5),

-- ── Lesson 18: Cadences ──────────────────────────────────────────────────────
(18, 'Perfect authentic: V–I', 'Play G4 then C4 (V to I)', '{"notes":["G4","C4"],"durations":[1,2],"timeSignature":"4/4"}', 1),
(18, 'Plagal: IV–I', 'Play F4 then C4 (IV to I)', '{"notes":["F4","C4"],"durations":[1,2],"timeSignature":"4/4"}', 2),
(18, 'Half cadence: I–V', 'Play C4 then G4 (I to V)', '{"notes":["C4","G4"],"durations":[1,2],"timeSignature":"4/4"}', 3),
(18, 'Leading tone resolution', 'Play B3 C4 (leading tone to tonic)', '{"notes":["B3","C4"],"durations":[1,2],"timeSignature":"4/4"}', 4),
(18, 'Authentic cadence melody', 'Play G4 A4 B4 C5', '{"notes":["G4","A4","B4","C5"],"durations":[1,1,1,2],"timeSignature":"4/4"}', 5);
