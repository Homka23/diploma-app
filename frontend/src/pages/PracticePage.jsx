import { API_BASE } from '../config.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TranscriptionTab } from '../components/TranscriptionTab';

function MicIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function TaskList({ topics, loading, error, selectedLesson, onSelect }) {
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="flex items-end gap-[4px] h-8">
        {[0,1,2,3,4,5,6].map(i => (
          <div key={i} className="w-[4px] rounded-full bg-primary animate-wave origin-bottom"
            style={{ animationDelay: `${i * 0.1}s`, height: '32px' }} />
        ))}
      </div>
      <p className="text-xs text-primary/40">Loading…</p>
    </div>
  );

  if (error) return (
    <p className="text-xs text-red-400 text-center py-8 px-3">{error}</p>
  );

  if (!topics?.length) return (
    <p className="text-xs text-primary/40 text-center py-8 px-3">No tasks available yet.</p>
  );

  return (
    <div className="py-2">
      {topics.map(topic => (
        <div key={topic.id} className="mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/35 px-3 py-2">{topic.title}</p>
          {topic.lessons.map(lesson => {
            const active = selectedLesson?.id === lesson.id;
            return (
              <button key={lesson.id} onClick={() => onSelect(lesson)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors rounded-lg mx-0
                  ${active
                    ? 'bg-primary/10 text-primary'
                    : 'text-primary/70 hover:bg-primary/5 hover:text-primary'
                  }`}>
                <MicIcon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-primary' : 'text-primary/35'}`} />
                <span className={`text-sm truncate ${active ? 'font-semibold' : 'font-medium'}`}>{lesson.title}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-8">
      <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center text-primary/30">
        <MicIcon className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-primary/60 mb-1">Select a task</p>
        <p className="text-sm text-primary/35">Choose a lesson from the list to start practicing</p>
      </div>
    </div>
  );
}

export default function PracticePage() {
  const navigate = useNavigate();

  const [topics, setTopics]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [result, setResult]               = useState(null);
  // mobile: 'list' | 'task'
  const [mobileView, setMobileView]       = useState('list');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/practice/transcription`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setTopics(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function selectLesson(lesson) {
    setSelectedLesson(lesson);
    setResult(null);
    setMobileView('task');
  }

  function backToList() {
    setMobileView('list');
  }

  return (
    <div className="h-screen flex flex-col bg-[#F4F4F4] overflow-hidden">

      {/* ── Header ── */}
      <header className="bg-white border-b border-primary/10 px-4 sm:px-6 py-3 flex items-center gap-3 flex-shrink-0">
        {/* Mobile: back button changes depending on view */}
        <button
          onClick={mobileView === 'task' ? backToList : () => navigate('/home')}
          className="text-primary/40 hover:text-primary transition-colors md:hidden">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 5l-5 5 5 5" />
          </svg>
        </button>
        {/* Desktop: always go home */}
        <button
          onClick={() => navigate('/home')}
          className="text-primary/40 hover:text-primary transition-colors hidden md:block">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 5l-5 5 5 5" />
          </svg>
        </button>

        <div className="min-w-0 flex items-center gap-2">
          <h1 className="font-semibold text-primary">Transcription Practice</h1>
          {selectedLesson && (
            <span className="hidden md:inline text-primary/30">/</span>
          )}
          {selectedLesson && (
            <span className="hidden md:inline text-sm text-primary/60 truncate">{selectedLesson.title}</span>
          )}
        </div>

        {/* Mobile: show lesson title when in task view */}
        {mobileView === 'task' && selectedLesson && (
          <span className="md:hidden text-sm text-primary/60 truncate min-w-0">{selectedLesson.title}</span>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar (desktop always visible / mobile list view) ── */}
        <aside className={`
          bg-white border-r border-primary/8 overflow-y-auto flex-shrink-0
          md:w-64 md:block
          ${mobileView === 'list' ? 'block w-full' : 'hidden'}
        `}>
          <TaskList
            topics={topics}
            loading={loading}
            error={error}
            selectedLesson={selectedLesson}
            onSelect={selectLesson}
          />
        </aside>

        {/* ── Main content (desktop always visible / mobile task view) ── */}
        <main className={`
          flex-1 overflow-y-auto
          md:block
          ${mobileView === 'task' ? 'block' : 'hidden'}
        `}>
          {selectedLesson ? (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
              <TranscriptionTab
                lessonId={selectedLesson.id}
                result={result}
                onResultChange={setResult}
                theoryDone={true}
                testDone={true}
                nextLesson={null}
                onPassed={() => {}}
                practiceMode={true}
              />
            </div>
          ) : (
            <EmptyState />
          )}
        </main>

      </div>
    </div>
  );
}
