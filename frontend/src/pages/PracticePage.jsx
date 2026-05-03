import { API_BASE } from '../config.js';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PracticeTaskTab } from '../components/PracticeTaskTab';

function initials(user) {
  const name = user?.display_name || user?.username || user?.email || '?';
  return name.slice(0, 2).toUpperCase();
}

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

function CoinIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2M9 9.5h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H15" />
    </svg>
  );
}

function BackIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 5l-5 5 5 5" />
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function LessonList({ topics, loading, error, selectedLesson, onSelect }) {
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
  if (error) return <p className="text-xs text-red-400 text-center py-8 px-3">{error}</p>;
  if (!topics?.length) return <p className="text-xs text-primary/40 text-center py-8 px-3">No tasks available yet.</p>;

  return (
    <div className="py-2">
      {topics.map(topic => (
        <div key={topic.id} className="mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/35 px-3 py-2">{topic.title}</p>
          {topic.lessons.map(lesson => {
            const active = selectedLesson?.id === lesson.id;
            return (
              <button key={lesson.id} onClick={() => onSelect(lesson)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors rounded-lg
                  ${active ? 'bg-primary/10 text-primary' : 'text-primary/70 hover:bg-primary/5 hover:text-primary'}`}>
                <MicIcon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-primary' : 'text-primary/35'}`} />
                <span className={`text-sm truncate flex-1 ${active ? 'font-semibold' : 'font-medium'}`}>{lesson.title}</span>
                <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 flex-shrink-0 ${active ? 'bg-primary/20 text-primary' : 'bg-primary/8 text-primary/50'}`}>
                  {lesson.taskCount}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Task list ─────────────────────────────────────────────────────────────────
function TaskList({ tasks, loading, selectedTask, onSelect }) {
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="flex items-end gap-[4px] h-8">
        {[0,1,2,3,4,5,6].map(i => (
          <div key={i} className="w-[4px] rounded-full bg-primary animate-wave origin-bottom"
            style={{ animationDelay: `${i * 0.1}s`, height: '32px' }} />
        ))}
      </div>
      <p className="text-xs text-primary/40">Loading tasks…</p>
    </div>
  );
  if (!tasks.length) return (
    <p className="text-xs text-primary/40 text-center py-8 px-3">No tasks in this lesson yet.</p>
  );

  return (
    <div className="space-y-2">
      {tasks.map((task, i) => {
        const active = selectedTask?.id === task.id;
        return (
          <button key={task.id} onClick={() => onSelect(task)}
            className={`w-full text-left rounded-xl px-4 py-3.5 transition-colors border
              ${active
                ? 'bg-primary/8 border-primary/20 text-primary'
                : 'bg-white border-primary/8 text-primary/80 hover:bg-primary/4 hover:border-primary/15'
              }`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold w-5 text-right flex-shrink-0 ${active ? 'text-primary' : 'text-primary/30'}`}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold truncate ${active ? 'text-primary' : 'text-primary/80'}`}>
                  {task.title || `Task ${i + 1}`}
                </p>
                {task.instruction_text && (
                  <p className="text-xs text-primary/45 truncate mt-0.5">{task.instruction_text}</p>
                )}
              </div>
              {task.expected_json?.notes?.length > 0 && (
                <div className="flex gap-1 flex-shrink-0">
                  {task.expected_json.notes.slice(0, 4).map((n, j) => (
                    <span key={j} className="text-[10px] font-semibold rounded bg-primary/8 px-1.5 py-0.5 text-primary/60">{n}</span>
                  ))}
                  {task.expected_json.notes.length > 4 && (
                    <span className="text-[10px] font-semibold rounded bg-primary/8 px-1.5 py-0.5 text-primary/40">+{task.expected_json.notes.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────
function EmptyLesson() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-8">
      <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center text-primary/30">
        <MicIcon className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-primary/60 mb-1">Select a lesson</p>
        <p className="text-sm text-primary/35">Choose a lesson from the list to see its tasks</p>
      </div>
    </div>
  );
}

function EmptyTask() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-8">
      <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center text-primary/30">
        <MicIcon className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-primary/60 mb-1">Select a task</p>
        <p className="text-sm text-primary/35">Pick a task from the list to start practicing</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PracticePage() {
  const navigate = useNavigate();

  const [user, setUser]           = useState(null);
  const [profileOpen, setProfile] = useState(false);

  const [topics, setTopics]             = useState(null);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError]   = useState('');

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  const [coins, setCoins]               = useState(null);

  // mobile: 'lessons' | 'tasks' | 'practice'
  const [mobileView, setMobileView]     = useState('lessons');

  // ── load user ──
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user) { setUser(d.user); localStorage.setItem('user', JSON.stringify(d.user)); } })
      .catch(() => {});
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  // ── load topics + lessons ──
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/practice/transcription`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setTopics(d); })
      .catch(e => setTopicsError(e.message))
      .finally(() => setTopicsLoading(false));
  }, []);

  // ── load coins ──
  function loadCoins() {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/practice/coins`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCoins(d.coins ?? 0))
      .catch(() => {});
  }
  useEffect(() => { loadCoins(); }, []);

  // ── load tasks when lesson changes ──
  useEffect(() => {
    if (!selectedLesson) return;
    setTasks([]);
    setSelectedTask(null);
    setTasksLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/practice/tasks?lessonId=${selectedLesson.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setTasks(d.tasks ?? []))
      .catch(() => {})
      .finally(() => setTasksLoading(false));
  }, [selectedLesson]);

  function selectLesson(lesson) {
    setSelectedLesson(lesson);
    setSelectedTask(null);
    setMobileView('tasks');
  }

  function selectTask(task) {
    setSelectedTask(task);
    setMobileView('practice');
  }

  function handleBack() {
    if (mobileView === 'practice') { setMobileView('tasks'); setSelectedTask(null); }
    else if (mobileView === 'tasks') { setMobileView('lessons'); }
    else navigate('/home');
  }

  // header title for mobile
  const mobileTitle = mobileView === 'practice' && selectedTask
    ? (selectedTask.title || 'Task')
    : mobileView === 'tasks' && selectedLesson
    ? selectedLesson.title
    : 'Transcription Practice';

  return (
    <div className="h-screen flex flex-col bg-[#F4F4F4] overflow-hidden">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-primary/10 bg-[#f7f7f7]/95 backdrop-blur-sm flex-shrink-0">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 sm:px-6 py-3.5">

          {/* Logo + title */}
          <button onClick={() => navigate('/home')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <span className="text-base font-bold text-dark hidden sm:block">Music Theory</span>
          </button>

          {/* Mobile back */}
          <button onClick={handleBack} className="text-primary/40 hover:text-primary transition-colors md:hidden ml-1">
            <BackIcon />
          </button>

          {/* Breadcrumb (desktop) */}
          <div className="min-w-0 hidden md:flex items-center gap-2 flex-1 ml-2">
            <span className="text-primary/30">/</span>
            <span className="text-sm font-semibold text-primary/70 flex-shrink-0">Practice</span>
            {selectedLesson && <><span className="text-primary/30 flex-shrink-0">/</span><span className="text-sm text-primary/50 truncate">{selectedLesson.title}</span></>}
            {selectedTask   && <><span className="text-primary/30 flex-shrink-0">/</span><span className="text-sm text-primary/50 truncate">{selectedTask.title || 'Task'}</span></>}
          </div>

          {/* Mobile title */}
          <span className="md:hidden text-sm font-semibold text-primary truncate flex-1">{mobileTitle}</span>

          {/* Coins badge */}
          {coins !== null && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 flex-shrink-0">
              <CoinIcon className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-600">{coins}</span>
            </div>
          )}

          {/* User dropdown */}
          {user && (
            <div className="relative flex-shrink-0">
              <button onClick={() => setProfile(o => !o)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-primary/8">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  {initials(user)}
                </div>
                <span className="hidden text-sm font-medium text-dark sm:block">
                  {user.display_name || user.username || user.email?.split('@')[0]}
                </span>
                <svg className={`h-3.5 w-3.5 text-primary/40 transition-transform ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-primary/12 bg-white shadow-lg shadow-primary/8 z-50">
                  <Link to="/profile" className="block px-4 py-2.5 text-sm text-primary/70 transition-colors hover:bg-[#f7f7f7] hover:text-primary">
                    Profile
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2.5 text-sm text-[#408A71] font-medium transition-colors hover:bg-[#f7f7f7]">
                      Admin panel
                    </Link>
                  )}
                  <div className="mx-3 h-px bg-primary/8" />
                  <button onClick={logout} className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-50 hover:text-red-500">
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Lesson sidebar (desktop always / mobile lessons view) ── */}
        <aside className={`
          bg-white border-r border-primary/8 overflow-y-auto flex-shrink-0
          md:w-56 md:block
          ${mobileView === 'lessons' ? 'block w-full' : 'hidden'}
        `}>
          <LessonList
            topics={topics}
            loading={topicsLoading}
            error={topicsError}
            selectedLesson={selectedLesson}
            onSelect={selectLesson}
          />
        </aside>

        {/* ── Task list panel (desktop always / mobile tasks view) ── */}
        <aside className={`
          bg-[#F4F4F4] border-r border-primary/8 overflow-y-auto flex-shrink-0
          md:w-72 md:block
          ${mobileView === 'tasks' ? 'block w-full' : 'hidden'}
        `}>
          {selectedLesson ? (
            <div className="p-4">
              <TaskList
                tasks={tasks}
                loading={tasksLoading}
                selectedTask={selectedTask}
                onSelect={selectTask}
              />
            </div>
          ) : (
            <EmptyLesson />
          )}
        </aside>

        {/* ── Practice area (desktop always / mobile practice view) ── */}
        <main className={`
          flex-1 overflow-y-auto
          md:block
          ${mobileView === 'practice' ? 'block' : 'hidden'}
        `}>
          {selectedTask ? (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-primary">{selectedTask.title || `Task`}</h2>
              </div>
              <PracticeTaskTab
                key={selectedTask.id}
                task={selectedTask}
                onCoinsChange={loadCoins}
              />
            </div>
          ) : (
            <EmptyTask />
          )}
        </main>

      </div>
    </div>
  );
}
