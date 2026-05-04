import { API_BASE } from '../config.js';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PracticeTaskTab } from '../components/PracticeTaskTab';

function initials(user) {
  const name = user?.display_name || user?.username || user?.email || '?';
  return name.slice(0, 2).toUpperCase();
}
const XP_LEVELS = [0, 200, 500, 1000, 2000];
function getLevel(xp = 0) {
  let lv = 1;
  for (let i = 0; i < XP_LEVELS.length; i++) { if (xp >= XP_LEVELS[i]) lv = i + 1; }
  return lv;
}

function CoinIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2M9 9.5h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H15" />
    </svg>
  );
}

// ── Practice Sidebar ──────────────────────────────────────────────────────────
function PracticeSidebar({ topics, loading, selectedLesson, onSelect, onCollapse }) {
  const [openTopics, setOpenTopics] = useState(new Set());

  useEffect(() => {
    if (!topics?.length) return;
    if (selectedLesson) {
      const topic = topics.find(t => t.lessons.some(l => l.id === selectedLesson.id));
      if (topic) setOpenTopics(prev => new Set([...prev, topic.id]));
    } else if (topics.length > 0) {
      setOpenTopics(new Set([topics[0].id]));
    }
  }, [selectedLesson, topics]);

  function toggleTopic(id) {
    setOpenTopics(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-5 py-6 flex-shrink-0">
        <Link to="/home" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <span className="text-base font-bold text-dark">Music Theory</span>
        </Link>
        <button onClick={onCollapse}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#408A71]/50 transition-colors hover:bg-[#408A71]/10 hover:text-[#408A71]">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Label */}
      <div className="px-5 pb-3 flex-shrink-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-dark/30">Practice tasks</p>
      </div>

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex items-end gap-[4px] h-8">
              {[0,1,2,3,4,5,6].map(i => (
                <div key={i} className="w-[4px] rounded-full bg-primary animate-wave origin-bottom"
                  style={{ animationDelay: `${i * 0.1}s`, height: '32px' }} />
              ))}
            </div>
          </div>
        )}
        {!loading && topics?.map((topic, ti) => {
          const isOpen = openTopics.has(topic.id);
          return (
            <div key={topic.id} className="border-b border-primary/6 last:border-0">
              <button onClick={() => toggleTopic(topic.id)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-primary/4">
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[12px] font-bold transition-colors ${
                  isOpen ? 'bg-[#408A71] text-white' : 'bg-primary/8 text-primary/50'
                }`}>
                  {ti + 1}
                </span>
                <span className={`flex-1 text-[15px] font-semibold leading-snug ${isOpen ? 'text-primary' : 'text-dark/70'}`}>
                  {topic.title}
                </span>
                <svg className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#408A71]' : 'text-primary/30'}`}
                  viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {isOpen && (
                <div className="pb-1 pt-0.5">
                  {topic.lessons.map(lesson => {
                    const isActive = selectedLesson?.id === lesson.id;
                    return (
                      <button key={lesson.id} onClick={() => onSelect(lesson)}
                        className={`flex w-full items-center py-2.5 pl-[60px] pr-4 text-left transition-all duration-200 ${
                          isActive
                            ? 'border-r-2 border-[#408A71] bg-[#408A71]/8'
                            : 'border-r-2 border-transparent hover:translate-x-1 hover:border-[#408A71]/30'
                        }`}>
                        <p className={`min-w-0 flex-1 text-[14px] leading-snug ${isActive ? 'font-semibold text-[#408A71]' : 'text-dark/60'}`}>
                          {lesson.title}
                        </p>
                        <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 flex-shrink-0 ml-2 ${
                          isActive ? 'bg-primary/20 text-primary' : 'bg-primary/8 text-primary/50'
                        }`}>
                          {lesson.taskCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
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
    <div className="py-2">
      {tasks.map((task, i) => {
        const active = selectedTask?.id === task.id;
        return (
          <button key={task.id} onClick={() => onSelect(task)}
            className={`flex w-full items-center py-2.5 pl-4 pr-4 text-left transition-all duration-200
              ${active
                ? 'border-r-2 border-[#408A71] bg-[#408A71]/8'
                : 'border-r-2 border-transparent hover:translate-x-1 hover:border-[#408A71]/30'
              }`}>
            <span className={`text-xs font-bold w-5 text-right flex-shrink-0 mr-3 ${active ? 'text-primary' : 'text-primary/30'}`}>
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[14px] leading-snug ${active ? 'font-semibold text-[#408A71]' : 'text-dark/60'}`}>
                {task.title || `Task ${i + 1}`}
              </p>
              {task.instruction_text && (
                <p className="text-xs text-primary/40 truncate mt-0.5">{task.instruction_text}</p>
              )}
            </div>
            {task.passed && (
              <svg className="h-4 w-4 flex-shrink-0 ml-2 text-[#408A71]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
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
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-primary/60 mb-1">Select a lesson</p>
        <p className="text-sm text-primary/35">Choose a lesson from the sidebar to see its tasks</p>
      </div>
    </div>
  );
}

function EmptyTask() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-8">
      <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center text-primary/30">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
        </svg>
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
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);

  const [topics, setTopics]             = useState(null);
  const [topicsLoading, setTopicsLoading] = useState(true);

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  const [coins, setCoins]               = useState(null);

  // mobile: 'tasks' | 'practice'
  const [mobileView, setMobileView]     = useState('tasks');

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
      .catch(() => {})
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
    setSidebarOpen(false);
  }

  function selectTask(task) {
    setSelectedTask(task);
    setMobileView('practice');
  }

  function handleBack() {
    if (mobileView === 'practice') { setMobileView('tasks'); setSelectedTask(null); }
    else navigate('/home');
  }

  const topicTitle = selectedLesson
    ? topics?.find(t => t.lessons.some(l => l.id === selectedLesson.id))?.title
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7f7]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-dark/20 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        flex-shrink-0 bg-white border-r border-primary/10
        fixed inset-y-0 left-0 z-40 w-[320px]
        transition-transform duration-500 ease-in-out
        lg:relative lg:inset-auto lg:z-auto lg:sticky lg:top-0 lg:h-screen
        lg:translate-x-0 lg:transition-[width] lg:duration-500 lg:overflow-hidden
        ${sidebarOpen ? 'translate-x-0 lg:w-[320px]' : '-translate-x-full lg:w-0 lg:border-0'}
      `}>
        <div className="flex h-full w-[320px] flex-col">
          <PracticeSidebar
            topics={topics}
            loading={topicsLoading}
            selectedLesson={selectedLesson}
            onSelect={selectLesson}
            onCollapse={() => setSidebarOpen(false)}
          />
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* ── Header ── */}
        <header className="sticky top-0 z-20 border-b border-primary/10 bg-[#f7f7f7] flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">

            {/* Left: sidebar toggle + breadcrumb */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#408A71] transition-colors hover:bg-[#408A71]/10">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <p className="flex-shrink-0 text-xs font-bold uppercase tracking-[0.15em] text-primary/50">
                  {topicTitle || 'Practice'}
                </p>
                {selectedLesson && (
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="flex-shrink-0 text-primary/20">·</span>
                    <p className="truncate text-sm font-semibold text-[#285A48]">{selectedLesson.title}</p>
                  </div>
                )}
              </div>
              {/* Mobile back */}
              {mobileView === 'practice' && (
                <button onClick={handleBack}
                  className="flex items-center justify-center text-primary/40 hover:text-primary transition-colors lg:hidden ml-1">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.5 5l-5 5 5 5" />
                  </svg>
                </button>
              )}
            </div>

            {/* Right: coins + home + user */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {coins !== null && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1">
                  <CoinIcon className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">{coins}</span>
                </div>
              )}

              {!sidebarOpen && (
                <Link to="/home"
                  className="flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary/60 transition-colors hover:border-primary/35 hover:text-primary hover:bg-primary/4">
                  Dashboard
                </Link>
              )}

              {user && (
                <div className="relative">
                  <button onClick={() => setProfile(o => !o)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-primary/8">
                    <div className="relative">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#285A48] text-[11px] font-bold text-white">
                        {initials(user)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#408A71] text-[9px] font-black text-white ring-1 ring-white">
                        {getLevel(user?.xp)}
                      </div>
                    </div>
                    <span className="hidden text-sm font-medium text-dark sm:block">
                      {user?.display_name || user?.username || user?.email}
                    </span>
                    <svg className={`h-3.5 w-3.5 text-primary/40 transition-transform ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-primary/12 bg-white shadow-lg shadow-primary/8 z-50">
                      <Link to="/profile" className="block px-4 py-2.5 text-sm text-primary/70 transition-colors hover:bg-surface hover:text-primary">
                        Profile
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="block px-4 py-2.5 text-sm text-[#408A71] font-medium transition-colors hover:bg-surface">
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
          </div>
        </header>

        {/* ── Content: task list + practice area ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Task list panel */}
          <aside className={`
            bg-white border-r border-primary/8 overflow-y-auto flex-shrink-0
            lg:w-72 lg:block
            ${mobileView === 'tasks' ? 'block w-full' : 'hidden'}
          `}>
            {selectedLesson ? (
              <TaskList
                tasks={tasks}
                loading={tasksLoading}
                selectedTask={selectedTask}
                onSelect={selectTask}
              />
            ) : (
              <EmptyLesson />
            )}
          </aside>

          {/* Practice area */}
          <main className={`
            flex-1 overflow-y-auto
            lg:block
            ${mobileView === 'practice' ? 'block' : 'hidden'}
          `}>
            {selectedTask ? (
              <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-primary">{selectedTask.title || 'Task'}</h2>
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
    </div>
  );
}
