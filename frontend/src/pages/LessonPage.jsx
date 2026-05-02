import { API_BASE, handleBlocked } from '../config.js';
import Loader from '../components/Loader';
import { ErrorScreen } from '../components/ErrorView';
import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

function ChevronIcon({ open, className = '' }) {
  return (
    <svg
      className={`transition-transform duration-300 ${open ? 'rotate-180' : ''} ${className}`}
      viewBox="0 0 20 20" fill="currentColor"
    >
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BlockCard }     from '../components/TheoryBlocks';
import { LessonSidebar } from '../components/LessonSidebar';
import { QuizTab }            from '../components/QuizTab';
import { TranscriptionTab }   from '../components/TranscriptionTab';

const TABS = [
  {
    key: 'theory',
    label: 'Theory',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    key: 'test',
    label: 'Test',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    key: 'transcription',
    label: 'Transcription',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
        <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
  },
];

export default function LessonPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [tab, setTab]               = useState(() => {
    const t = searchParams.get('tab');
    return ['theory', 'test', 'transcription'].includes(t) ? t : 'theory';
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [user, setUser]               = useState(null);
  const [profileOpen, setProfile]     = useState(false);
  const [theoryDone, setTheoryDone]             = useState(false);
  const [testDone, setTestDone]                 = useState(false);
  const [transcriptionDone, setTranscriptionDone] = useState(false);
  const [nextLesson, setNextLesson]             = useState(null);
  const [markingDone, setMarkingDone]           = useState(false);
  const [refreshKey, setRefreshKey]             = useState(0);
  const [tabJustCompleted, setTabJustCompleted] = useState(null);
  const [lessonComplete, setLessonComplete]     = useState(false);
  const completedThisSession = useRef(false);
  const readProgressBarRef   = useRef(null);
  const [scrolled, setScrolled]         = useState(false);
  const [testAnswered, setTestAnswered] = useState(0);
  const [testTotal,    setTestTotal]    = useState(0);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [leaving, setLeaving] = useState(false);

  function navigateOut(path) {
    setLeaving(true);
    setTimeout(() => navigate(path), 300);
  }

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const t = searchParams.get('tab');
    setTab(['theory', 'test', 'transcription'].includes(t) ? t : 'theory');
    setTranscriptionResult(null);
    setLeaving(false);
    setTheoryDone(false);
    setTestDone(false);
    setTranscriptionDone(false);
    setNextLesson(null);
    setLessonComplete(false);
    completedThisSession.current = false;
  }, [id]);

  useEffect(() => {
    let rafId = null;
    const handler = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setScrolled(window.scrollY > 0);
        if (readProgressBarRef.current) {
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          const pct = scrollable > 0 ? Math.min(window.scrollY / scrollable * 100, 100) : 0;
          readProgressBarRef.current.style.width = `${pct}%`;
        }
      });
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => { window.removeEventListener('scroll', handler); if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  function initials(u) {
    const name = u?.display_name || u?.username || u?.email || '?';
    return name.slice(0, 2).toUpperCase();
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API_BASE}/api/lessons/${id}/theory`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) { navigate('/login'); return null; }
        if (res.status === 403) { handleBlocked(); return null; }
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(d => { if (d) setData(d); })
      .catch(() => setError('Failed to load lesson'))
      .finally(() => setLoading(false));

    fetch(`${API_BASE}/api/topics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(topics => {
        const allLessons = topics.flatMap(t => t.lessons);
        const idx = allLessons.findIndex(l => String(l.id) === String(id));
        const lesson = idx >= 0 ? allLessons[idx] : null;
        if (lesson?.theory)        setTheoryDone(true);
        if (lesson?.test)          setTestDone(true);
        if (lesson?.transcription) setTranscriptionDone(true);
        setNextLesson(idx >= 0 && idx + 1 < allLessons.length ? allLessons[idx + 1] : null);
      })
      .catch(() => {});
  }, [id, navigate, refreshKey]);

  // Auto-clear tab toast
  useEffect(() => {
    if (!tabJustCompleted) return;
    const t = setTimeout(() => setTabJustCompleted(null), 2500);
    return () => clearTimeout(t);
  }, [tabJustCompleted]);

  // Detect lesson complete (only if something was completed this session)
  useEffect(() => {
    if (theoryDone && testDone && transcriptionDone && completedThisSession.current && !lessonComplete) {
      setLessonComplete(true);
      setTimeout(() => {
        confetti({ particleCount: 160, spread: 75, origin: { y: 0.5 },
          colors: ['#285A48', '#408A71', '#B0E4CC', '#ffffff', '#d1fae5'] });
      }, 350);
    }
  }, [theoryDone, testDone, transcriptionDone]);

  const topicTitle  = data?.lesson?.topic_title ?? '…';
  const lessonTitle = data?.lesson?.title ?? '…';

  return (
    <div className={`flex min-h-screen bg-[#f7f7f7] ${leaving ? 'animate-fade-out' : 'animate-fade-in'}`}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-dark/20 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        flex-shrink-0 bg-white border-r border-primary/10
        fixed inset-y-0 left-0 z-40 w-[320px]
        transition-transform duration-500 ease-in-out
        lg:relative lg:inset-auto lg:z-auto lg:sticky lg:top-0 lg:h-screen
        lg:translate-x-0 lg:transition-[width] lg:duration-500 lg:overflow-hidden
        ${sidebarOpen ? 'translate-x-0 lg:w-[320px]' : '-translate-x-full lg:w-0 lg:border-0'}
      `}>
        <div className="flex h-full w-[320px] flex-col">
          <LessonSidebar
            currentId={id}
            refreshKey={refreshKey}
            onLinkClick={() => setSidebarOpen(false)}
            onCollapse={() => setSidebarOpen(false)}
          />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-primary/10 bg-[#f7f7f7]">
          <div className={`px-4 sm:px-6 lg:px-10 transition-all duration-300 ${scrolled ? 'pt-2 pb-1' : 'pt-3 pb-2 sm:pt-4 sm:pb-3'}`}>

            <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'mt-0' : 'mt-2 sm:mt-3'}`}>
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#408A71] transition-colors hover:bg-[#408A71]/10"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <p className="flex-shrink-0 truncate text-xs font-bold uppercase tracking-[0.15em] text-primary/50 max-w-[120px] sm:max-w-none">
                    {topicTitle}
                  </p>
                  <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${scrolled ? 'max-w-[140px] sm:max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>
                    <span className="flex-shrink-0 text-primary/20">·</span>
                    <p className="truncate text-sm sm:text-base font-semibold text-[#285A48]">{lessonTitle}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {!sidebarOpen && (
                  <Link
                    to="/home"
                    className="flex items-center justify-center text-primary/50 transition-colors hover:text-primary/70"
                  >
                    <svg className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setProfile(o => !o)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-primary/8"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#285A48] text-[11px] font-bold text-white">
                      {user ? initials(user) : '?'}
                    </div>
                    <span className="hidden text-sm font-medium text-dark sm:block">
                      {user?.display_name || user?.username || user?.email}
                    </span>
                    <ChevronIcon open={profileOpen} className="h-3.5 w-3.5 text-primary/40" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-primary/12 bg-white shadow-lg shadow-primary/8 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2.5 text-sm text-primary/70 transition-colors hover:bg-surface hover:text-primary"
                      >
                        Profile
                      </Link>
                      <div className="mx-3 h-px bg-primary/8" />
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out px-4 sm:px-6 lg:px-10 ${scrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-24 opacity-100 mt-2'}`}>
            <h1 className="text-2xl sm:text-4xl font-semibold text-[#285A48] truncate">{lessonTitle}</h1>
          </div>

          {/* Tabs */}
          <div className="relative flex px-4 sm:px-6 lg:px-10">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-1.5 px-2 sm:px-3 py-3.5 mr-4 sm:mr-8 text-sm sm:text-base font-medium transition-colors ${
                  tab === t.key
                    ? 'text-[#408A71]'
                    : 'text-primary/35 hover:text-[#408A71]/60'
                }`}
              >
                {t.icon}
                {t.label}
                {tab === t.key && !scrolled && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#408A71]" />
                )}
              </button>
            ))}
            {scrolled && tab === 'theory' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#408A71]/12">
                <div ref={readProgressBarRef} className="h-full bg-[#408A71] transition-[width] duration-150 ease-out" />
              </div>
            )}
            {scrolled && tab === 'test' && testTotal > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#408A71]/12">
                <div className="h-full bg-[#408A71] transition-[width] duration-700 ease-in-out"
                  style={{ width: `${Math.round(testAnswered / testTotal * 100)}%` }} />
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-3 sm:px-6 py-4 sm:py-8">
          {loading && <Loader />}
          {error   && <ErrorScreen message={error} />}

          {!loading && !error && (
            <div key={tab} className="animate-fade-slide-up">
              {tab === 'theory' && (
                <div className="space-y-4">
                  {data?.theory?.map(block => (
                    <BlockCard key={block.blockId} block={block} />
                  ))}
                  {data?.theory?.length === 0 && (
                    <p className="py-20 text-center text-sm text-primary/30">No theory content yet.</p>
                  )}
                  {data?.theory?.length > 0 && (
                    <div className="flex justify-end pt-4">
                      {theoryDone ? (
                        <div className="flex items-center gap-2 rounded-xl bg-primary/8 px-5 py-3 text-sm font-semibold text-primary">
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Theory completed
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            if (markingDone) return;
                            setMarkingDone(true);
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${API_BASE}/api/lessons/${id}/complete/theory`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (res.ok) {
                              if (!theoryDone) { setTabJustCompleted('theory'); completedThisSession.current = true; }
                              setTheoryDone(true);
                              setRefreshKey(k => k + 1);
                            } else {
                              const err = await res.json().catch(() => ({}));
                              console.error('completeTab failed:', err);
                            }
                            setMarkingDone(false);
                          }}
                          disabled={markingDone}
                          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Mark as Read
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === 'test' && (
                <QuizTab
                  lessonId={id}
                  onPassed={() => {
                    if (!testDone) { setTabJustCompleted('test'); completedThisSession.current = true; }
                    setRefreshKey(k => k + 1);
                  }}
                  onProgressChange={(answered, total) => { setTestAnswered(answered); setTestTotal(total); }}
                />
              )}

              {tab === 'transcription' && (
                <TranscriptionTab
                  lessonId={id}
                  onPassed={() => {
                    if (!transcriptionDone) { setTabJustCompleted('transcription'); completedThisSession.current = true; }
                    setRefreshKey(k => k + 1);
                  }}
                  result={transcriptionResult}
                  onResultChange={setTranscriptionResult}
                  theoryDone={theoryDone}
                  testDone={testDone}
                  nextLesson={nextLesson}
                  onNavigate={navigateOut}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Tab complete toast */}
      {tabJustCompleted && (
        <div className="pointer-events-none fixed top-20 left-1/2 z-50 animate-slide-down">
          <div className="flex items-center gap-2.5 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-primary/25">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {{ theory: 'Theory complete', test: 'Test passed', transcription: 'Transcription complete' }[tabJustCompleted]}!
          </div>
        </div>
      )}

      {/* Lesson complete modal — portal to body to avoid transform stacking context */}
      {lessonComplete && createPortal(
        <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-dark/40 px-4">
          <div className="animate-modal-in w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="px-8 pt-10 pb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#408A71]/12">
                <svg className="h-8 w-8 text-[#408A71]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.11" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-dark">Lesson Complete!</h2>
              <p className="mt-1.5 text-sm text-dark/45">{lessonTitle}</p>
              <div className="mt-5 flex flex-col gap-2.5">
                {nextLesson && !nextLesson.locked && (
                  <button
                    onClick={() => { setLessonComplete(false); navigateOut(`/lesson/${nextLesson.id}?tab=theory`); }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#408A71] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#285A48]"
                  >
                    Next: {nextLesson.title}
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setLessonComplete(false)}
                  className="rounded-xl px-5 py-3 text-sm font-medium text-dark/40 transition-colors hover:text-dark/60"
                >
                  Stay here
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
