import { API_BASE } from '../config.js';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CircularProgress({ done, total }) {
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
  const r      = 20;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width="50" height="50" viewBox="0 0 48 48" className="flex-shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#9ca3af" strokeWidth="4"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 24 24)" />
      <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="800" fill="#6b7280">{pct}%</text>
    </svg>
  );
}

export function LessonSidebar({ currentId, refreshKey, onLinkClick, onCollapse }) {
  const [topics, setTopics]         = useState([]);
  const [openTopics, setOpenTopics] = useState(new Set());

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/topics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setTopics(data);
        const current = data.find(t => t.lessons.some(l => String(l.id) === String(currentId)));
        if (current) setOpenTopics(new Set([current.id]));
      })
      .catch(() => {});
  }, [currentId, refreshKey]);

  function toggleTopic(id) {
    setOpenTopics(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalLessons     = topics.reduce((s, t) => s + t.lessons.length, 0);
  const completedLessons = topics.reduce((s, t) =>
    s + t.lessons.filter(l => l.theory && l.test && l.transcription).length, 0);

  return (
    <>
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-5 py-6">
        <Link to="/home" onClick={onLinkClick} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <span className="text-base font-bold text-dark">Music Theory</span>
        </Link>
        <button onClick={onCollapse} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#408A71]/50 transition-colors hover:bg-[#408A71]/10 hover:text-[#408A71]">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Progress card */}
      <div className="mx-4 mt-2 mb-3 rounded-xl border border-primary/10 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <CircularProgress done={completedLessons} total={totalLessons} />
          <div>
            <p className="text-sm font-medium text-[#285A48]">Your progress</p>
            <p className="text-xs text-dark/40">{completedLessons} / {totalLessons} lessons completed</p>
          </div>
        </div>
      </div>

      {/* Topics label */}
      <div className="px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-dark/30">Topics</p>
      </div>

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {topics.map((topic, ti) => {
          const isOpen = openTopics.has(topic.id);
          return (
            <div key={topic.id} className="border-b border-primary/6 last:border-0">
              <button
                onClick={() => toggleTopic(topic.id)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-primary/4"
              >
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[12px] font-bold transition-colors ${
                  isOpen ? 'bg-[#408A71] text-white' : 'bg-primary/8 text-primary/50'
                }`}>{ti + 1}</span>
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
                  {topic.lessons.map((lesson) => {
                    const isCurrent = String(lesson.id) === String(currentId);
                    return (
                      <Link
                        key={lesson.id}
                        to={`/lesson/${lesson.id}`}
                        onClick={onLinkClick}
                        className={`flex items-center py-2.5 pl-[60px] transition-colors ${
                          isCurrent
                            ? 'border-r-2 border-[#408A71] bg-[#408A71]/8 pr-4'
                            : 'border-r-2 border-transparent pr-4 hover:bg-primary/5'
                        }`}
                      >
                        <p className={`min-w-0 flex-1 text-[14px] leading-snug ${isCurrent ? 'font-semibold text-[#408A71]' : 'text-dark/60'}`}>
                          {lesson.title}
                        </p>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {[lesson.theory, lesson.test, lesson.transcription].map((done, k) => (
                            <span key={k} className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-primary' : 'bg-primary/15'}`} />
                          ))}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Back to Dashboard */}
      <div className="flex-shrink-0 px-4 py-4">
        <Link
          to="/home"
          onClick={onLinkClick}
          className="flex items-center gap-2.5 rounded-xl border border-[#408A71] px-4 py-3 text-sm font-semibold text-[#408A71] transition-colors hover:bg-[#408A71] hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </>
  );
}
