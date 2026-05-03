import { API_BASE } from '../config.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TranscriptionTab } from '../components/TranscriptionTab';

function ChevLeft() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 5l-5 5 5 5" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export default function PracticePage() {
  const navigate = useNavigate();

  const [topics, setTopics]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [result, setResult]           = useState(null);

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
  }

  function backToList() {
    setSelectedLesson(null);
    setResult(null);
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {/* Header */}
      <header className="bg-white border-b border-primary/10 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button onClick={selectedLesson ? backToList : () => navigate('/home')}
          className="text-primary/40 hover:text-primary transition-colors">
          <ChevLeft />
        </button>
        <div className="min-w-0">
          {selectedLesson ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 leading-none mb-0.5">Practice</p>
              <p className="font-semibold text-primary truncate">{selectedLesson.title}</p>
            </>
          ) : (
            <h1 className="font-semibold text-primary">Transcription Practice</h1>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {selectedLesson ? (
          /* ── Transcription task ── */
          <TranscriptionTab
            lessonId={selectedLesson.id}
            result={result}
            onResultChange={setResult}
            theoryDone={true}
            testDone={true}
            nextLesson={null}
            onPassed={() => {}}
          />
        ) : (
          /* ── Task list ── */
          <>
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="flex items-end gap-[4px] h-10">
                  {[0,1,2,3,4,5,6].map(i => (
                    <div key={i} className="w-[5px] rounded-full bg-primary animate-wave origin-bottom"
                      style={{ animationDelay: `${i * 0.1}s`, height: '40px' }} />
                  ))}
                </div>
                <p className="text-sm text-primary/40">Loading tasks…</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 text-center py-12">{error}</p>
            )}

            {!loading && !error && topics?.length === 0 && (
              <p className="text-sm text-primary/40 text-center py-12">No transcription tasks available yet.</p>
            )}

            {!loading && !error && topics?.map(topic => (
              <div key={topic.id} className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-2 px-1">{topic.title}</p>
                <div className="space-y-2">
                  {topic.lessons.map(lesson => (
                    <button key={lesson.id}
                      onClick={() => selectLesson(lesson)}
                      className="w-full flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3.5 shadow-sm border border-primary/8 hover:border-primary/20 hover:shadow-md transition-all text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center text-primary/50">
                          <MicIcon />
                        </div>
                        <span className="text-sm font-medium text-primary truncate">{lesson.title}</span>
                      </div>
                      <svg className="h-4 w-4 text-primary/30 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
