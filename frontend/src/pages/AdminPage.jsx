import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config.js';

// ── api helper ────────────────────────────────────────────────────────────────
function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
}
async function api(method, path, body) {
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    method, headers: authHeaders(), body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// ── small ui atoms ────────────────────────────────────────────────────────────
function Btn({ onClick, disabled, variant = 'primary', size = 'sm', children, className = '' }) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const sz   = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const v    = {
    primary:  'bg-[#408A71] text-white hover:bg-[#285A48]',
    ghost:    'bg-transparent border border-gray-200 text-gray-600 hover:bg-gray-50',
    danger:   'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100',
    neutral:  'bg-gray-100 text-gray-700 hover:bg-gray-200',
  }[variant];
  return <button onClick={onClick} disabled={disabled} className={`${base} ${sz} ${v} ${className}`}>{children}</button>;
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inp = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#408A71]/30';
const textarea = `${inp} resize-y min-h-[80px]`;

function ErrMsg({ error }) {
  if (!error) return null;
  return <p className="text-xs text-red-500 mt-1">{error}</p>;
}

function SaveBtn({ onSave, label = 'Save', disabled }) {
  const [state, setState] = useState('idle'); // idle | saving | saved
  async function handle() {
    if (state !== 'idle') return;
    setState('saving');
    try {
      await onSave();
      setState('saved');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    }
  }
  return (
    <Btn onClick={handle} disabled={state === 'saving' || disabled}
      className={state === 'saved' ? '!bg-emerald-600 hover:!bg-emerald-700' : ''}>
      {state === 'saving' ? 'Saving…' : state === 'saved' ? '✓ Saved' : label}
    </Btn>
  );
}

function SectionHeader({ title, onAdd, addLabel = 'Add' }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {onAdd && <Btn onClick={onAdd}><Plus /> {addLabel}</Btn>}
    </div>
  );
}

function Plus() { return <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>; }
function Trash() { return <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 8a1 1 0 012 0v3a1 1 0 11-2 0v-3zm4 0a1 1 0 012 0v3a1 1 0 11-2 0v-3z" clipRule="evenodd"/></svg>; }
function Pencil() { return <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-2.207 2.207L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>; }
function ChevLeft() { return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/></svg>; }
function GripHandle() { return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z"/></svg>; }
function LockIcon() { return <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>; }
function UnlockIcon() { return <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/></svg>; }

// ── confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm}>Delete</Btn>
        </div>
      </div>
    </div>
  );
}

// ── inline editable row ───────────────────────────────────────────────────────
function InlineEdit({ value, onSave, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);
  if (!editing) return (
    <span className="cursor-pointer hover:text-[#408A71]" onClick={() => setEditing(true)}>{value || <em className="text-gray-400">{placeholder}</em>}</span>
  );
  return (
    <span className="flex items-center gap-1">
      <input className="border border-gray-300 rounded px-1.5 py-0.5 text-sm" value={val} onChange={e => setVal(e.target.value)} autoFocus />
      <Btn size="sm" onClick={() => { onSave(val); setEditing(false); }}>Save</Btn>
      <Btn size="sm" variant="ghost" onClick={() => { setVal(value); setEditing(false); }}>✕</Btn>
    </span>
  );
}

// ── THEORY BLOCK EDITOR ───────────────────────────────────────────────────────
function TheoryBlockEditor({ block, onSave }) {
  const initBlocks = () => {
    try { return block.contentJson?.blocks ?? []; } catch { return []; }
  };
  const [blocks, setBlocks] = useState(initBlocks);
  const [err, setErr]       = useState('');

  const TYPES = ['heading', 'paragraph', 'note', 'list'];

  function addBlock(type) {
    setBlocks(b => [...b, type === 'list' ? { type, label: '', items: [] } : { type, text: '' }]);
  }
  function removeBlock(i) { setBlocks(b => b.filter((_, j) => j !== i)); }
  function moveUp(i)   { if (i === 0) return; setBlocks(b => { const n=[...b]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; }); }
  function moveDown(i) { setBlocks(b => { if (i===b.length-1) return b; const n=[...b]; [n[i],n[i+1]]=[n[i+1],n[i]]; return n; }); }
  function update(i, patch) { setBlocks(b => b.map((x,j) => j===i ? {...x,...patch} : x)); }

  async function save() {
    setErr('');
    try { await onSave({ contentJson: { blocks } }); }
    catch (e) { setErr(e.message); throw e; }
  }

  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <select value={b.type} onChange={e => update(i, { type: e.target.value })}
              className="rounded border border-gray-200 px-2 py-1 text-xs bg-white">
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <span className="flex-1" />
            <button onClick={() => moveUp(i)}   className="text-gray-400 hover:text-gray-700 text-xs px-1">↑</button>
            <button onClick={() => moveDown(i)} className="text-gray-400 hover:text-gray-700 text-xs px-1">↓</button>
            <button onClick={() => removeBlock(i)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
          </div>
          {b.type === 'list' ? (
            <>
              <input className={inp} placeholder="Label (optional)" value={b.label ?? ''} onChange={e => update(i, { label: e.target.value })} />
              <textarea className={textarea} placeholder="Items, one per line"
                value={(b.items ?? []).join('\n')}
                onChange={e => update(i, { items: e.target.value.split('\n') })} />
            </>
          ) : (
            <textarea className={textarea} placeholder={b.type} value={b.text ?? ''} onChange={e => update(i, { text: e.target.value })} />
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {TYPES.map(t => <Btn key={t} variant="ghost" onClick={() => addBlock(t)}><Plus />{t}</Btn>)}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <SaveBtn onSave={save} label="Save content" />
        <ErrMsg error={err} />
      </div>
    </div>
  );
}

// ── NOTE SECTION (UI ↔ JSON toggle wrapper) ───────────────────────────────────
// toJson(notes) → plain value for JSON textarea
// fromJson(parsed) → notes state array
function NoteSection({ title, notes, toJson, fromJson, onNotesChange, addBtn, children }) {
  const [mode, setMode]     = useState('ui');
  const [jsonText, setJson] = useState('');
  const [jsonErr, setJsonErr] = useState('');

  function openJson() {
    setJson(JSON.stringify(toJson(notes), null, 2));
    setJsonErr('');
    setMode('json');
  }
  function applyJson() {
    try {
      onNotesChange(fromJson(JSON.parse(jsonText)));
      setMode('ui');
    } catch (e) { setJsonErr('Invalid JSON: ' + e.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="block text-xs font-medium text-gray-500">{title}</span>
        <button onClick={mode === 'ui' ? openJson : () => setMode('ui')}
          className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-400 hover:border-[#408A71] hover:text-[#408A71] transition-colors">
          {mode === 'ui' ? 'JSON' : 'UI'}
        </button>
      </div>
      {mode === 'ui' ? (
        <>
          {children}
          {addBtn}
        </>
      ) : (
        <div className="space-y-2">
          <textarea className={`${textarea} font-mono text-xs min-h-[140px]`}
            value={jsonText} onChange={e => setJson(e.target.value)} />
          {jsonErr && <p className="text-xs text-red-500">{jsonErr}</p>}
          <Btn onClick={applyJson}>Apply</Btn>
        </div>
      )}
    </div>
  );
}

// ── NOTE SELECTOR (shared) ────────────────────────────────────────────────────
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES    = ['2', '3', '4', '5', '6', '7'];
const sel        = 'rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#408A71]/30 bg-white';

function parseNoteStr(v) {
  const m = (v ?? '').match(/^([A-G][#b]?)(\d)$/);
  return m ? { name: m[1], octave: m[2] } : { name: 'C', octave: '4' };
}

function swapArr(arr, i, j) {
  const n = [...arr]; [n[i], n[j]] = [n[j], n[i]]; return n;
}

function NoteSelector({ value, onChange }) {
  const { name, octave } = parseNoteStr(value);
  return (
    <div className="flex gap-1">
      <select className={sel} value={name} onChange={e => onChange(e.target.value + octave)}>
        {NOTE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <select className={sel} value={octave} onChange={e => onChange(name + e.target.value)}>
        {OCTAVES.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}


// ── PIANO PERFORMANCE EDITOR ──────────────────────────────────────────────────
const PIANO_PERF_DURATIONS = [
  { value: 0.25, label: '16th' }, { value: 0.5, label: '8th' },
  { value: 1, label: 'Quarter' }, { value: 1.5, label: 'Dotted quarter' },
  { value: 2, label: 'Half' },    { value: 3, label: 'Dotted half' },
  { value: 4, label: 'Whole' },
];

function PianoPerformanceEditor({ block, onSave }) {
  const rawNotes = block.expectedJson?.notes ?? [];
  const initNotes = rawNotes.map(n =>
    typeof n === 'string' ? { note: n, duration: 1 } : { note: n.note ?? 'C4', duration: n.duration ?? 1 }
  );
  const [instruction, setInstruction] = useState(block.instructionText ?? '');
  const [notes, setNotes]             = useState(initNotes.length ? initNotes : [{ note: 'C4', duration: 1 }]);
  const [err, setErr]                 = useState('');

  function updateNote(i, patch) { setNotes(n => n.map((x, j) => j === i ? { ...x, ...patch } : x)); }
  function addNote()    { setNotes(n => [...n, { note: 'C4', duration: 1 }]); }
  function removeNote(i){ setNotes(n => n.filter((_, j) => j !== i)); }
  function moveNote(i, dir) { setNotes(n => swapArr(n, i, i + dir)); }

  async function save() {
    setErr('');
    try {
      await onSave({ instructionText: instruction, expectedJson: { notes: notes.map(n => ({ note: n.note, duration: Number(n.duration) })) } });
    } catch (e) { setErr(e.message); throw e; }
  }

  return (
    <div className="space-y-3">
      <Field label="Instruction">
        <input className={inp} value={instruction} onChange={e => setInstruction(e.target.value)} />
      </Field>
      <NoteSection
        title="Expected notes (in order)"
        notes={notes}
        toJson={ns => ns.map(n => ({ note: n.note, duration: Number(n.duration) }))}
        fromJson={arr => arr.map(n => ({
          note: typeof n === 'string' ? n : n.note ?? 'C4',
          duration: typeof n === 'string' ? 1 : n.duration ?? 1,
        }))}
        onNotesChange={setNotes}
        addBtn={<Btn variant="ghost" className="mt-2" onClick={addNote}><Plus />Add note</Btn>}
      >
        <div className="space-y-2">
          {notes.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => moveNote(i, -1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▲</button>
                <button disabled={i === notes.length - 1} onClick={() => moveNote(i, 1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▼</button>
              </div>
              <NoteSelector value={n.note} onChange={v => updateNote(i, { note: v })} />
              <select className={sel} value={n.duration} onChange={e => updateNote(i, { duration: e.target.value })}>
                {PIANO_PERF_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <button onClick={() => removeNote(i)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
            </div>
          ))}
        </div>
      </NoteSection>
      <div className="flex items-center gap-2">
        <SaveBtn onSave={save} />
        <ErrMsg error={err} />
      </div>
    </div>
  );
}

// ── TRANSCRIPTION EDITOR ──────────────────────────────────────────────────────
const TIME_SIGS = ['4/4', '3/4', '2/4', '6/8', '12/8'];

function TranscriptionEditor({ block, onSave }) {
  const init = block.expectedJson ?? { notes: [], durations: [], timeSignature: '4/4' };
  const [instruction, setInstruction] = useState(block.instructionText ?? '');
  const [timeSig, setTimeSig]         = useState(init.timeSignature ?? '4/4');
  // notes + durations kept in sync as rows
  const initRows = (init.notes ?? []).map((n, i) => ({ note: n, duration: init.durations?.[i] ?? 1 }));
  const [rows, setRows] = useState(initRows.length ? initRows : [{ note: 'C4', duration: 1 }]);
  const [err, setErr]   = useState('');

  const TRANSCRIPTION_DURATIONS = [
    { value: 0.25, label: '16th' }, { value: 0.5, label: '8th' },
    { value: 1, label: 'Quarter' }, { value: 1.5, label: 'Dotted quarter' },
    { value: 2, label: 'Half' },    { value: 3, label: 'Dotted half' },
    { value: 4, label: 'Whole' },
  ];

  function updateRow(i, patch) { setRows(r => r.map((x, j) => j === i ? { ...x, ...patch } : x)); }
  function addRow()    { setRows(r => [...r, { note: 'C4', duration: 1 }]); }
  function removeRow(i){ setRows(r => r.filter((_, j) => j !== i)); }
  function moveRow(i, dir) { setRows(r => swapArr(r, i, i + dir)); }

  async function save() {
    setErr('');
    try {
      await onSave({
        instructionText: instruction,
        expectedJson: { notes: rows.map(r => r.note), durations: rows.map(r => Number(r.duration)), timeSignature: timeSig },
      });
    } catch (e) { setErr(e.message); throw e; }
  }

  return (
    <div className="space-y-3">
      <Field label="Instruction">
        <input className={inp} value={instruction} onChange={e => setInstruction(e.target.value)} />
      </Field>
      <Field label="Time signature">
        <select className={inp} value={timeSig} onChange={e => setTimeSig(e.target.value)}>
          {TIME_SIGS.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <NoteSection
        title="Notes & durations"
        notes={rows}
        toJson={rs => rs.map(r => ({ note: r.note, duration: Number(r.duration) }))}
        fromJson={arr => arr.map(r => ({ note: r.note ?? 'C4', duration: r.duration ?? 1 }))}
        onNotesChange={setRows}
        addBtn={<Btn variant="ghost" className="mt-2" onClick={addRow}><Plus />Add note</Btn>}
      >
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => moveRow(i, -1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▲</button>
                <button disabled={i === rows.length - 1} onClick={() => moveRow(i, 1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▼</button>
              </div>
              <NoteSelector value={r.note} onChange={v => updateRow(i, { note: v })} />
              <select className={sel} value={r.duration}
                onChange={e => updateRow(i, { duration: e.target.value })}>
                {TRANSCRIPTION_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
            </div>
          ))}
        </div>
      </NoteSection>
      <div className="flex items-center gap-2">
        <SaveBtn onSave={save} />
        <ErrMsg error={err} />
      </div>
    </div>
  );
}

// ── PIANO EXAMPLE EDITOR ──────────────────────────────────────────────────────
const PIANO_DURATIONS = ['q', 'h', 'w', '8', '16'];

function PianoExampleEditor({ block, onSave }) {
  const init = block.contentJson ?? { label: '', notes: [] };
  const [label, setLabel]   = useState(init.label ?? '');
  const [desc, setDesc]     = useState(block.description ?? '');
  const [notes, setNotes]   = useState(init.notes?.length ? init.notes : [{ note: 'C4', duration: 'q' }]);
  const [err, setErr]       = useState('');

  function updateNote(i, patch) { setNotes(n => n.map((x, j) => j === i ? { ...x, ...patch } : x)); }
  function addNote()    { setNotes(n => [...n, { note: 'C4', duration: 'q' }]); }
  function removeNote(i){ setNotes(n => n.filter((_, j) => j !== i)); }
  function moveNote(i, dir) { setNotes(n => swapArr(n, i, i + dir)); }

  const PIANO_DUR_LABELS = { q: 'Quarter', h: 'Half', w: 'Whole', '8': '8th', '16': '16th' };

  async function save() {
    setErr('');
    try { await onSave({ contentJson: { label, notes }, description: desc }); }
    catch (e) { setErr(e.message); throw e; }
  }

  return (
    <div className="space-y-3">
      <Field label="Label">
        <input className={inp} value={label} onChange={e => setLabel(e.target.value)} />
      </Field>
      <Field label="Description (optional)">
        <input className={inp} value={desc} onChange={e => setDesc(e.target.value)} />
      </Field>
      <NoteSection
        title="Notes"
        notes={notes}
        toJson={ns => ns}
        fromJson={arr => arr.map(n => ({ note: n.note ?? 'C4', duration: n.duration ?? 'q' }))}
        onNotesChange={setNotes}
        addBtn={<Btn variant="ghost" className="mt-2" onClick={addNote}><Plus />Add note</Btn>}
      >
        <div className="space-y-2">
          {notes.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => moveNote(i, -1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▲</button>
                <button disabled={i === notes.length - 1} onClick={() => moveNote(i, 1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▼</button>
              </div>
              <NoteSelector value={n.note} onChange={v => updateNote(i, { note: v })} />
              <select className={sel} value={n.duration}
                onChange={e => updateNote(i, { duration: e.target.value })}>
                {PIANO_DURATIONS.map(d => <option key={d} value={d}>{PIANO_DUR_LABELS[d]}</option>)}
              </select>
              <button onClick={() => removeNote(i)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
            </div>
          ))}
        </div>
      </NoteSection>
      <div className="flex items-center gap-2">
        <SaveBtn onSave={save} />
        <ErrMsg error={err} />
      </div>
    </div>
  );
}

// ── STAFF EXAMPLE EDITOR ──────────────────────────────────────────────────────
const CLEFS    = ['treble', 'bass'];
const STAFF_DURATIONS = ['q', 'h', 'w', '8', '16'];

function noteToVexKey(note) {
  // "C4" → "c/4",  "F#4" → "f#/4"
  const m = note.match(/^([A-Ga-g][#b]?)(\d)$/);
  if (!m) return note.toLowerCase();
  return `${m[1].toLowerCase()}/${m[2]}`;
}
function vexKeyToNote(key) {
  // "c/4" → "C4", "f#/4" → "F#4"
  const m = key.match(/^([a-g][#b]?)\/(\d)$/);
  if (!m) return key.toUpperCase();
  return `${m[1].toUpperCase()}${m[2]}`;
}

function StaffExampleEditor({ block, onSave }) {
  const init = block.contentJson ?? { clef: 'treble', notes: [], timeSignature: '4/4' };
  const [clef, setClef]       = useState(init.clef ?? 'treble');
  const [timeSig, setTimeSig] = useState(init.timeSignature ?? '4/4');
  const [desc, setDesc]       = useState(block.description ?? '');
  const initNotes = (init.notes ?? []).map(n => ({
    note:     vexKeyToNote((n.keys ?? ['c/4'])[0]),
    duration: n.duration ?? 'q',
  }));
  const [notes, setNotes]   = useState(initNotes.length ? initNotes : [{ note: 'C4', duration: 'q' }]);
  const [err, setErr]       = useState('');

  function updateNote(i, patch) { setNotes(n => n.map((x, j) => j === i ? { ...x, ...patch } : x)); }
  function addNote()    { setNotes(n => [...n, { note: 'C4', duration: 'q' }]); }
  function removeNote(i){ setNotes(n => n.filter((_, j) => j !== i)); }
  function moveNote(i, dir) { setNotes(n => swapArr(n, i, i + dir)); }

  async function save() {
    setErr('');
    try {
      const validNotes = notes.map(n => ({ keys: [noteToVexKey(n.note)], label: parseNoteStr(n.note).name, duration: n.duration }));
      await onSave({ contentJson: { clef, notes: validNotes, timeSignature: timeSig }, description: desc });
    } catch (e) { setErr(e.message); throw e; }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Field label="Clef">
          <select className={inp} value={clef} onChange={e => setClef(e.target.value)}>
            {CLEFS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Time signature">
          <select className={inp} value={timeSig} onChange={e => setTimeSig(e.target.value)}>
            {TIME_SIGS.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description (optional)">
        <input className={inp} value={desc} onChange={e => setDesc(e.target.value)} />
      </Field>
      <NoteSection
        title="Notes"
        notes={notes}
        toJson={ns => ns.map(n => ({ note: n.note, duration: n.duration }))}
        fromJson={arr => arr.map(n => ({ note: n.note ?? 'C4', duration: n.duration ?? 'q' }))}
        onNotesChange={setNotes}
        addBtn={<Btn variant="ghost" className="mt-2" onClick={addNote}><Plus />Add note</Btn>}
      >
        <div className="space-y-2">
          {notes.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => moveNote(i, -1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▲</button>
                <button disabled={i === notes.length - 1} onClick={() => moveNote(i, 1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▼</button>
              </div>
              <NoteSelector value={n.note} onChange={v => updateNote(i, { note: v })} />
              <select className={sel} value={n.duration}
                onChange={e => updateNote(i, { duration: e.target.value })}>
                {STAFF_DURATIONS.map(d => <option key={d} value={d}>{d === 'q' ? 'Quarter' : d === 'h' ? 'Half' : d === 'w' ? 'Whole' : d === '8' ? '8th' : '16th'}</option>)}
              </select>
              <button onClick={() => removeNote(i)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
            </div>
          ))}
        </div>
      </NoteSection>
      <div className="flex items-center gap-2">
        <SaveBtn onSave={save} />
        <ErrMsg error={err} />
      </div>
    </div>
  );
}

// ── QUIZ EDITOR ───────────────────────────────────────────────────────────────
function QuizEditor({ blockId }) {
  const [questions, setQuestions] = useState(null);
  const [err, setErr]             = useState('');
  const [dlg, setDlg]             = useState(null);

  const load = useCallback(async () => {
    try { setQuestions(await api('GET', `/blocks/${blockId}/questions`)); }
    catch (e) { setErr(e.message); }
  }, [blockId]);
  useEffect(() => { load(); }, [load]);

  async function addQuestion() {
    try {
      const q = await api('POST', `/blocks/${blockId}/questions`, { question_text: 'New question' });
      setQuestions(prev => [...prev, q]);
    } catch (e) { setErr(e.message); }
  }
  async function deleteQuestion(id) {
    await api('DELETE', `/questions/${id}`);
    setQuestions(q => q.filter(x => x.id !== id));
  }
  async function saveQuestion(id, patch) {
    const updated = await api('PUT', `/questions/${id}`, patch);
    setQuestions(q => q.map(x => x.id === id ? { ...x, ...updated } : x));
  }
  async function addOption(qId) {
    const o = await api('POST', `/questions/${qId}/options`, { option_text: 'Option', is_correct: false });
    setQuestions(q => q.map(x => x.id === qId ? { ...x, options: [...x.options, o] } : x));
  }
  async function deleteOption(qId, oId) {
    await api('DELETE', `/options/${oId}`);
    setQuestions(q => q.map(x => x.id === qId ? { ...x, options: x.options.filter(o => o.id !== oId) } : x));
  }
  async function saveOption(qId, oId, patch) {
    const updated = await api('PUT', `/options/${oId}`, patch);
    setQuestions(q => q.map(x => x.id === qId ? { ...x, options: x.options.map(o => o.id === oId ? { ...o, ...updated } : o) } : x));
  }

  if (!questions) return <p className="text-xs text-gray-400 animate-pulse">Loading questions…</p>;

  return (
    <div className="space-y-4">
      {dlg && <ConfirmModal {...dlg} onConfirm={() => { dlg.onConfirm(); setDlg(null); }} onCancel={() => setDlg(null)} />}
      <ErrMsg error={err} />
      {questions.map(q => (
        <div key={q.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <InlineEdit value={q.question_text} placeholder="Question text"
              onSave={v => saveQuestion(q.id, { question_text: v })} />
            <Btn variant="danger" onClick={() => setDlg({ title: 'Delete question', message: 'Delete this question and all its options?', onConfirm: () => deleteQuestion(q.id) })}><Trash /></Btn>
          </div>
          <div className="pl-3 space-y-1.5">
            {q.options.map(o => (
              <div key={o.id} className="flex items-center gap-2">
                <input type="checkbox" checked={o.is_correct}
                  onChange={e => saveOption(q.id, o.id, { is_correct: e.target.checked })}
                  title="Correct answer" className="accent-[#408A71]" />
                <InlineEdit value={o.option_text} placeholder="Option text"
                  onSave={v => saveOption(q.id, o.id, { option_text: v })} />
                <Btn variant="danger" onClick={() => setDlg({ title: 'Delete option', message: 'Delete this answer option?', onConfirm: () => deleteOption(q.id, o.id) })}><Trash /></Btn>
              </div>
            ))}
            <Btn variant="ghost" onClick={() => addOption(q.id)}><Plus />Add option</Btn>
          </div>
        </div>
      ))}
      <Btn onClick={addQuestion}><Plus />Add question</Btn>
    </div>
  );
}

// ── EAR TRAINING EDITOR ───────────────────────────────────────────────────────
const EAR_DURATIONS = [
  { value: 0.25, label: '16th' }, { value: 0.5, label: '8th' },
  { value: 1, label: 'Quarter' }, { value: 1.5, label: 'Dotted quarter' },
  { value: 2, label: 'Half' },    { value: 3, label: 'Dotted half' },
  { value: 4, label: 'Whole' },
];

function EarTrainingEditor({ block, onSave }) {
  const initNotes = (block.configJson?.notes ?? []).map(n => ({
    note: n.note ?? 'C4', duration: n.duration ?? 1,
  }));
  const [promptText, setPromptText] = useState(block.promptText ?? '');
  const [notes, setNotes]           = useState(initNotes.length ? initNotes : [{ note: 'C4', duration: 1 }]);
  const [options, setOptions]       = useState(null);
  const [err, setErr]               = useState('');
  const [dlg, setDlg]               = useState(null);

  const loadOptions = useCallback(async () => {
    try { setOptions(await api('GET', `/blocks/${block.id}/ear-options`)); }
    catch (e) { setErr(e.message); }
  }, [block.id]);
  useEffect(() => { loadOptions(); }, [loadOptions]);

  function updateNote(i, patch) { setNotes(n => n.map((x, j) => j === i ? { ...x, ...patch } : x)); }
  function addNote()    { setNotes(n => [...n, { note: 'C4', duration: 1 }]); }
  function removeNote(i){ setNotes(n => n.filter((_, j) => j !== i)); }
  function moveNote(i, dir) { setNotes(n => swapArr(n, i, i + dir)); }

  async function saveContent() {
    setErr('');
    try {
      await onSave({ promptText, configJson: { notes: notes.map(n => ({ note: n.note, duration: Number(n.duration) })) } });
    } catch (e) { setErr(e.message); throw e; }
  }
  async function addOption() {
    const o = await api('POST', `/blocks/${block.id}/ear-options`, { option_text: 'Option', is_correct: false });
    setOptions(prev => [...prev, o]);
  }
  async function deleteOption(id) {
    await api('DELETE', `/ear-options/${id}`);
    setOptions(o => o.filter(x => x.id !== id));
  }
  async function saveOption(id, patch) {
    const updated = await api('PUT', `/ear-options/${id}`, patch);
    setOptions(o => o.map(x => x.id === id ? { ...x, ...updated } : x));
  }

  return (
    <div className="space-y-3">
      {dlg && <ConfirmModal {...dlg} onConfirm={() => { dlg.onConfirm(); setDlg(null); }} onCancel={() => setDlg(null)} />}
      <Field label="Prompt text">
        <input className={inp} value={promptText} onChange={e => setPromptText(e.target.value)} />
      </Field>
      <NoteSection
        title="Notes to play"
        notes={notes}
        toJson={ns => ns.map(n => ({ note: n.note, duration: Number(n.duration) }))}
        fromJson={arr => arr.map(n => ({ note: n.note ?? 'C4', duration: n.duration ?? 1 }))}
        onNotesChange={setNotes}
        addBtn={<Btn variant="ghost" className="mt-2" onClick={addNote}><Plus />Add note</Btn>}
      >
        <div className="space-y-2">
          {notes.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => moveNote(i, -1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▲</button>
                <button disabled={i === notes.length - 1} onClick={() => moveNote(i, 1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▼</button>
              </div>
              <NoteSelector value={n.note} onChange={v => updateNote(i, { note: v })} />
              <select className={sel} value={n.duration} onChange={e => updateNote(i, { duration: e.target.value })}>
                {EAR_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <button onClick={() => removeNote(i)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
            </div>
          ))}
        </div>
      </NoteSection>
      <div className="flex items-center gap-2">
        <SaveBtn onSave={saveContent} />
        <ErrMsg error={err} />
      </div>

      <div className="border-t border-gray-200 pt-3">
        <SectionHeader title="Answer options" onAdd={addOption} addLabel="Add option" />
        {!options && <p className="text-xs text-gray-400 animate-pulse">Loading…</p>}
        {options?.map(o => (
          <div key={o.id} className="flex items-center gap-2 mb-1.5">
            <input type="checkbox" checked={o.is_correct}
              onChange={e => saveOption(o.id, { is_correct: e.target.checked })}
              title="Correct" className="accent-[#408A71]" />
            <InlineEdit value={o.option_text} placeholder="Option"
              onSave={v => saveOption(o.id, { option_text: v })} />
            <Btn variant="danger" onClick={() => setDlg({ title: 'Delete option', message: 'Delete this answer option?', onConfirm: () => deleteOption(o.id) })}><Trash /></Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BLOCK CARD ────────────────────────────────────────────────────────────────
function BlockCard({ block, onDelete, onSaved }) {
  const [open, setOpen]   = useState(false);
  const [title, setTitle] = useState(block.title ?? '');
  const [saving, setSaving] = useState(false);
  const [dlg, setDlg]     = useState(null);

  async function saveTitle() {
    setSaving(true);
    try { await api('PUT', `/blocks/${block.id}`, { title }); onSaved?.(); }
    catch { }
    finally { setSaving(false); }
  }

  async function saveContent(content) {
    await api('PUT', `/blocks/${block.id}`, { content });
    onSaved?.();
  }

  const TYPE_LABELS = {
    theory: 'Theory text', staff_example: 'Staff example', piano_example: 'Piano example',
    quiz: 'Quiz', ear_training: 'Ear training', piano_performance: 'Piano performance',
    transcription: 'Transcription',
  };
  const badge = {
    theory: 'bg-blue-100 text-blue-700', staff_example: 'bg-purple-100 text-purple-700',
    piano_example: 'bg-indigo-100 text-indigo-700', quiz: 'bg-yellow-100 text-yellow-700',
    ear_training: 'bg-orange-100 text-orange-700', piano_performance: 'bg-pink-100 text-pink-700',
    transcription: 'bg-teal-100 text-teal-700',
  }[block.blockType] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>{TYPE_LABELS[block.blockType]}</span>
        <span className="text-xs text-gray-400">#{block.position}</span>
        <input className="flex-1 text-sm border-0 outline-none bg-transparent text-gray-700 placeholder-gray-300"
          placeholder="Block title (optional)" value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          disabled={saving}
        />
        <Btn variant="ghost" onClick={() => setOpen(o => !o)}>{open ? 'Close' : <><Pencil />Edit</>}</Btn>
        <Btn variant="danger" onClick={() => setDlg(true)}><Trash /></Btn>
      </div>

      {dlg && (
        <ConfirmModal
          title="Delete block"
          message={`Delete this "${TYPE_LABELS[block.blockType]}" block? This action cannot be undone.`}
          onConfirm={() => { setDlg(null); onDelete(); }}
          onCancel={() => setDlg(null)}
        />
      )}

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
          {block.blockType === 'theory' && (
            <TheoryBlockEditor block={block} onSave={saveContent} />
          )}
          {block.blockType === 'staff_example' && (
            <StaffExampleEditor block={block} onSave={saveContent} />
          )}
          {block.blockType === 'piano_example' && (
            <PianoExampleEditor block={block} onSave={saveContent} />
          )}
          {block.blockType === 'quiz' && (
            <QuizEditor blockId={block.id} />
          )}
          {block.blockType === 'ear_training' && (
            <EarTrainingEditor block={block} onSave={saveContent} />
          )}
          {block.blockType === 'piano_performance' && (
            <PianoPerformanceEditor block={block} onSave={saveContent} />
          )}
          {block.blockType === 'transcription' && (
            <TranscriptionEditor block={block} onSave={saveContent} />
          )}
        </div>
      )}
    </div>
  );
}

// ── LESSON EDITOR ─────────────────────────────────────────────────────────────
const TAB_BLOCK_TYPES = {
  theory:       ['theory', 'staff_example', 'piano_example'],
  test:         ['quiz', 'ear_training', 'piano_performance'],
  transcription:['transcription'],
};

function LessonEditor({ lesson, onBack }) {
  const [tab, setTab]         = useState('theory');
  const [blocks, setBlocks]   = useState(null);
  const [err, setErr]         = useState('');
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const load = useCallback(async () => {
    try { setBlocks(await api('GET', `/lessons/${lesson.id}/blocks`)); }
    catch (e) { setErr(e.message); }
  }, [lesson.id]);
  useEffect(() => { load(); }, [load]);

  const tabBlocks = blocks?.filter(b => b.tabType === tab) ?? [];

  async function addBlock(blockType) {
    try {
      await api('POST', `/lessons/${lesson.id}/blocks`, { tab_type: tab, block_type: blockType });
      load();
    } catch (e) { setErr(e.message); }
  }

  async function deleteBlock(id) {
    try { await api('DELETE', `/blocks/${id}`); load(); }
    catch (e) { setErr(e.message); }
  }

  async function handleDrop(targetIdx) {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); setOverIdx(null); return; }
    const newOrder = [...tabBlocks];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    setDragIdx(null); setOverIdx(null);
    try {
      await api('POST', `/lessons/${lesson.id}/blocks/reorder`, { blockIds: newOrder.map(b => b.id) });
      load();
    } catch (e) { setErr(e.message); load(); }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700"><ChevLeft /></button>
        <div>
          <p className="text-xs text-gray-400">Lesson</p>
          <h2 className="text-lg font-semibold text-gray-900">{lesson.title}</h2>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {['theory', 'test', 'transcription'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <ErrMsg error={err} />

      {/* Blocks list */}
      {!blocks && <p className="text-sm text-gray-400 animate-pulse">Loading…</p>}
      <div className="space-y-2 mb-4">
        {tabBlocks.map((b, i) => (
          <div key={b.id}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => { e.preventDefault(); setOverIdx(i); }}
            onDragLeave={() => setOverIdx(null)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            className={`flex items-start gap-2 rounded-xl transition-all
              ${dragIdx === i ? 'opacity-40' : ''}
              ${overIdx === i && dragIdx !== i ? 'ring-2 ring-[#408A71] ring-offset-1' : ''}`}>
            <div className="pt-3 px-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
              <GripHandle />
            </div>
            <div className="flex-1">
              <BlockCard block={b}
                onDelete={() => deleteBlock(b.id)}
                onSaved={load} />
            </div>
          </div>
        ))}
        {blocks && tabBlocks.length === 0 && (
          <p className="text-sm text-gray-400">No blocks yet.</p>
        )}
      </div>

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2">
        {TAB_BLOCK_TYPES[tab].map(bt => (
          <Btn key={bt} variant="ghost" onClick={() => addBlock(bt)}>
            <Plus />{bt.replace('_', ' ')}
          </Btn>
        ))}
      </div>
    </div>
  );
}

// ── LESSONS LIST ──────────────────────────────────────────────────────────────
function LessonsPanel({ topic, onBack, onSelect }) {
  const [lessons, setLessons]         = useState(null);
  const [form, setForm]               = useState({ title: '', description: '' });
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [err, setErr]                 = useState('');
  const [dlg, setDlg]                 = useState(null);
  const [dragIdx, setDragIdx]         = useState(null);
  const [overIdx, setOverIdx]         = useState(null);

  const load = useCallback(async () => {
    try { setLessons(await api('GET', `/topics/${topic.id}/lessons`)); }
    catch (e) { setErr(e.message); }
  }, [topic.id]);
  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await api('POST', `/topics/${topic.id}/lessons`, form);
      setForm({ title: '', description: '' });
      load();
    } catch (e) { setErr(e.message); }
  }

  async function save(id) {
    try { await api('PUT', `/lessons/${id}`, editForm); setEditingId(null); load(); }
    catch (e) { setErr(e.message); }
  }

  async function del(id) {
    try { await api('DELETE', `/lessons/${id}`); load(); }
    catch (e) { setErr(e.message); }
  }

  async function toggleLock(l) {
    try { await api('PUT', `/lessons/${l.id}`, { force_unlock: !l.force_unlock }); load(); }
    catch (e) { setErr(e.message); }
  }

  async function handleDrop(targetIdx) {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); setOverIdx(null); return; }
    const newOrder = [...lessons];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    setDragIdx(null); setOverIdx(null);
    setLessons(newOrder);
    try { await api('POST', `/topics/${topic.id}/lessons/reorder`, { lessonIds: newOrder.map(l => l.id) }); }
    catch (e) { setErr(e.message); load(); }
  }

  return (
    <div>
      {dlg && <ConfirmModal {...dlg} onConfirm={() => { dlg.onConfirm(); setDlg(null); }} onCancel={() => setDlg(null)} />}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700"><ChevLeft /></button>
        <div>
          <p className="text-xs text-gray-400">Topic</p>
          <h2 className="text-lg font-semibold text-gray-900">{topic.title}</h2>
        </div>
      </div>

      <ErrMsg error={err} />

      <div className="space-y-2 mb-6">
        {!lessons && <p className="text-sm text-gray-400 animate-pulse">Loading…</p>}
        {lessons?.map((l, i) => (
          <div key={l.id}
            draggable={editingId !== l.id}
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => { e.preventDefault(); setOverIdx(i); }}
            onDragLeave={() => setOverIdx(null)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            className={`flex items-start gap-2 rounded-xl transition-all
              ${dragIdx === i ? 'opacity-40' : ''}
              ${overIdx === i && dragIdx !== i ? 'ring-2 ring-[#408A71] ring-offset-1' : ''}`}>
            <div className="pt-3.5 px-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0">
              <GripHandle />
            </div>
            <div className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3">
              {editingId === l.id ? (
                <div className="space-y-2">
                  <input className={inp} value={editForm.title ?? l.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                  <input className={inp} placeholder="Description" value={editForm.description ?? l.description ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                  <div className="flex gap-2">
                    <Btn onClick={() => save(l.id)}>Save</Btn>
                    <Btn variant="ghost" onClick={() => setEditingId(null)}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 cursor-pointer" onClick={() => onSelect(l)}>
                    <p className="text-sm font-medium text-gray-800">{l.title}</p>
                    {l.description && <p className="text-xs text-gray-400 mt-0.5">{l.description}</p>}
                  </div>
                  <button
                    onClick={() => toggleLock(l)}
                    title={l.force_unlock ? 'Click to lock' : 'Click to force-unlock'}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      l.force_unlock
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {l.force_unlock ? <><UnlockIcon />Unlocked</> : <><LockIcon />Auto</>}
                  </button>
                  <Btn variant="ghost" onClick={() => { setEditingId(l.id); setEditForm({}); }}><Pencil /></Btn>
                  <Btn variant="danger" onClick={() => setDlg({ title: 'Delete lesson', message: `Delete "${l.title}" and all its content? This action cannot be undone.`, onConfirm: () => del(l.id) })}><Trash /></Btn>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={create} className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New lesson</p>
        <Field label="Title"><input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></Field>
        <Field label="Description"><input className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
        <Btn type="submit"><Plus />Create lesson</Btn>
      </form>
    </div>
  );
}

// ── TOPICS LIST ───────────────────────────────────────────────────────────────
function TopicsPanel({ onSelect }) {
  const [topics, setTopics]       = useState(null);
  const [form, setForm]           = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [err, setErr]             = useState('');
  const [dlg, setDlg]             = useState(null);

  const load = useCallback(async () => {
    try { setTopics(await api('GET', '/topics')); }
    catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try { await api('POST', '/topics', form); setForm({ title: '', description: '' }); load(); }
    catch (e) { setErr(e.message); }
  }

  async function save(id) {
    try { await api('PUT', `/topics/${id}`, editForm); setEditingId(null); load(); }
    catch (e) { setErr(e.message); }
  }

  async function del(id) {
    try { await api('DELETE', `/topics/${id}`); load(); }
    catch (e) { setErr(e.message); }
  }

  async function toggleLock(t) {
    try { await api('PUT', `/topics/${t.id}`, { force_unlock: !t.force_unlock }); load(); }
    catch (e) { setErr(e.message); }
  }

  return (
    <div>
      {dlg && <ConfirmModal {...dlg} onConfirm={() => { dlg.onConfirm(); setDlg(null); }} onCancel={() => setDlg(null)} />}
      <SectionHeader title="Topics" />
      <ErrMsg error={err} />

      <div className="space-y-2 mb-6">
        {!topics && <p className="text-sm text-gray-400 animate-pulse">Loading…</p>}
        {topics?.map(t => (
          <div key={t.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            {editingId === t.id ? (
              <div className="space-y-2">
                <input className={inp} value={editForm.title ?? t.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                <input className={inp} placeholder="Description" value={editForm.description ?? t.description ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                <div className="flex gap-2">
                  <Btn onClick={() => save(t.id)}>Save</Btn>
                  <Btn variant="ghost" onClick={() => setEditingId(null)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => onSelect(t)}>
                  <p className="text-sm font-medium text-gray-800">{t.title}</p>
                  {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                </div>
                <button
                  onClick={() => toggleLock(t)}
                  title={t.force_unlock ? 'Click to lock' : 'Click to force-unlock'}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    t.force_unlock
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {t.force_unlock ? <><UnlockIcon />Unlocked</> : <><LockIcon />Auto</>}
                </button>
                <Btn variant="ghost" onClick={() => { setEditingId(t.id); setEditForm({}); }}><Pencil /></Btn>
                <Btn variant="danger" onClick={() => setDlg({ title: 'Delete topic', message: `Delete "${t.title}" and all its lessons and content? This action cannot be undone.`, onConfirm: () => del(t.id) })}><Trash /></Btn>
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={create} className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New topic</p>
        <Field label="Title"><input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></Field>
        <Field label="Description"><input className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
        <Btn type="submit"><Plus />Create topic</Btn>
      </form>
    </div>
  );
}

// ── USERS PANEL ───────────────────────────────────────────────────────────────
function UsersPanel() {
  const [users, setUsers] = useState(null);
  const [err, setErr]     = useState('');

  const load = useCallback(async () => {
    try { setUsers(await api('GET', '/users')); }
    catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggleRole(u) {
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.id === me.id) return;
    const newRole = u.role === 'admin' ? 'student' : 'admin';
    try { await api('PUT', `/users/${u.id}/role`, { role: newRole }); load(); }
    catch (e) { setErr(e.message); }
  }

  async function toggleBlock(u) {
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.id === me.id) return;
    try { await api('PUT', `/users/${u.id}/block`, {}); load(); }
    catch (e) { setErr(e.message); }
  }

  function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Users</h3>
      <ErrMsg error={err} />
      {!users && <p className="text-sm text-gray-400 animate-pulse">Loading…</p>}
      <div className="space-y-2">
        {users?.map(u => (
          <div key={u.id} className={`rounded-xl border bg-white px-4 py-3 flex items-center gap-3 ${u.is_blocked ? 'border-red-200' : 'border-gray-200'}`}>
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${u.is_blocked ? 'bg-red-100 text-red-400' : 'bg-[#408A71]/10 text-[#408A71]'}`}>
              {(u.display_name || u.username || u.email || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium truncate ${u.is_blocked ? 'text-gray-400' : 'text-gray-800'}`}>
                  {u.display_name || u.username || <em className="text-gray-400">no name</em>}
                </p>
                {u.is_blocked && (
                  <span className="flex-shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">Blocked</span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">{u.email}</p>
            </div>
            <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
              <p className="text-xs text-gray-400">Joined {fmt(u.created_at)}</p>
              <p className="text-xs text-gray-400">🔥 {u.streak_days ?? 0} days</p>
            </div>
            {(() => {
              const me = JSON.parse(localStorage.getItem('user') || '{}');
              const isSelf = u.id === me.id;
              return (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleBlock(u)}
                    disabled={isSelf}
                    title={isSelf ? 'Cannot block yourself' : u.is_blocked ? 'Unblock user' : 'Block user'}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      u.is_blocked
                        ? 'bg-red-50 text-red-500 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400'
                    }`}
                  >
                    {u.is_blocked ? <><UnlockIcon />Unblock</> : <><LockIcon />Block</>}
                  </button>
                  <button
                    onClick={() => toggleRole(u)}
                    disabled={isSelf}
                    title={isSelf ? 'Cannot change your own role' : u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      u.role === 'admin'
                        ? isSelf ? 'bg-[#408A71]/10 text-[#408A71]' : 'bg-[#408A71]/10 text-[#408A71] hover:bg-red-50 hover:text-red-500'
                        : 'bg-gray-100 text-gray-400 hover:bg-[#408A71]/10 hover:text-[#408A71]'
                    }`}
                  >
                    {u.role === 'admin' ? 'Admin' : 'User'}
                  </button>
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [view, setView]         = useState('topics');   // 'topics' | 'lessons' | 'editor' | 'users'
  const [selectedTopic, setTopic]   = useState(null);
  const [selectedLesson, setLesson] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.user?.role !== 'admin') navigate('/home');
        else setChecking(false);
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Checking access…</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <span className="text-sm font-bold text-[#408A71]">Admin</span>
        <span className="text-gray-300">|</span>
        <button onClick={() => { setView('topics'); setTopic(null); setLesson(null); }}
          className={`text-sm transition-colors ${view !== 'users' ? 'text-gray-800 font-medium' : 'text-gray-400 hover:text-gray-700'}`}>
          Topics
        </button>
        {selectedTopic && view !== 'users' && (
          <>
            <span className="text-gray-300">/</span>
            <button onClick={() => { setView('lessons'); setLesson(null); }}
              className="text-sm text-gray-500 hover:text-gray-800">{selectedTopic.title}</button>
          </>
        )}
        {selectedLesson && view !== 'users' && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-800">{selectedLesson.title}</span>
          </>
        )}
        <span className="text-gray-300">|</span>
        <button onClick={() => { setView('users'); setTopic(null); setLesson(null); }}
          className={`text-sm transition-colors ${view === 'users' ? 'text-gray-800 font-medium' : 'text-gray-400 hover:text-gray-700'}`}>
          Users
        </button>
        <span className="flex-1" />
        <button onClick={() => navigate('/home')}
          className="text-xs text-gray-400 hover:text-gray-700">← Back to app</button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {view === 'topics' && (
          <TopicsPanel onSelect={t => { setTopic(t); setView('lessons'); }} />
        )}
        {view === 'lessons' && selectedTopic && (
          <LessonsPanel
            topic={selectedTopic}
            onBack={() => { setView('topics'); setTopic(null); }}
            onSelect={l => { setLesson(l); setView('editor'); }}
          />
        )}
        {view === 'editor' && selectedLesson && (
          <LessonEditor
            lesson={selectedLesson}
            onBack={() => { setView('lessons'); setLesson(null); }}
          />
        )}
        {view === 'users' && <UsersPanel />}
      </main>
    </div>
  );
}
