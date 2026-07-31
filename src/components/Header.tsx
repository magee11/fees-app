import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, Menu } from 'lucide-react';
import { useAddStudentDialog } from '../context/AddStudentContext';
import { useDashboard } from '../hooks/queries/useDashboard';
import { useSettings } from '../hooks/queries/useSettings';
import { useStudents } from '../hooks/queries/useStudents';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatCurrency } from '../utils/currency';
import { timeAgo } from '../utils/date';
import { gradientForId } from '../utils/gradient';
import { Avatar } from './Avatar';
import { Button } from './Button';

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  studentName?: string;
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { openDialog } = useAddStudentDialog();
  const { data: settings } = useSettings();
  const { data: dashboard } = useDashboard();
  const navigate = useNavigate();

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!dashboard) return [];
    const items: NotificationItem[] = [];
    for (const s of dashboard.pendingStudents.slice(0, 4)) {
      items.push({
        id: `due-${s.studentId}`,
        title: `${s.name} has ${formatCurrency(s.outstanding)} pending`,
        time: 'Pending',
        studentName: s.name,
      });
    }
    for (const r of dashboard.recentRegistrations.slice(0, 3)) {
      items.push({
        id: `reg-${r._id}`,
        title: `New student registered: ${r.name}`,
        time: timeAgo(r.createdAt),
        studentName: r.name,
      });
    }
    return items;
  }, [dashboard]);

  const search = useDebouncedValue(searchInput, 300);
  const { data: searchResp } = useStudents({ search, limit: 6 }, search.trim().length > 0);
  const results = searchResp?.data ?? [];
  const showDropdown = searchFocused && search.trim().length > 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function goToStudents(query: string) {
    setSearchFocused(false);
    navigate(`/students?q=${encodeURIComponent(query)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && searchInput.trim()) {
      goToStudents(searchInput.trim());
    } else if (e.key === 'Escape') {
      setSearchFocused(false);
    }
  }

  return (
    <header className="header">
      <button className="menu-toggle" onClick={onMenuClick} aria-label="Toggle menu">
        <Menu size={19} strokeWidth={1.8} />
      </button>

      <div className="header-search" ref={searchRef}>
        <Search size={16} className="search-icon" />
        <input
          className="input"
          placeholder="Search students…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onKeyDown={handleKeyDown}
        />
        {!searchInput && <span className="kbd-hint">⌘K</span>}

        {showDropdown && (
          <div className="notif-dropdown search-dropdown">
            {results.length === 0 ? (
              <div className="notif-item" style={{ color: 'var(--text-muted)' }}>
                No students found
              </div>
            ) : (
              <>
                {results.map((s) => (
                  <button key={s._id} className="typeahead-row" onClick={() => goToStudents(s.name)}>
                    <Avatar name={s.name} gradient={gradientForId(s._id)} size={30} />
                    <span className="typeahead-info">
                      <span className="student-name">{s.name}</span>
                      <span className="student-admission">
                        {s.admissionNo} · {s.standard}-{s.section}
                      </span>
                    </span>
                  </button>
                ))}
                <button className="typeahead-row search-view-all" onClick={() => goToStudents(searchInput.trim())}>
                  View all results for &ldquo;{searchInput.trim()}&rdquo;
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="header-right">
        <span className="year-badge">{settings?.academicYear ? `AY ${settings.academicYear}` : 'AY —'}</span>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications">
            <Bell size={16} strokeWidth={1.8} />
            {notifications.length > 0 && <span className="notif-dot" />}
          </button>
          {notifOpen && (
            <div className="notif-dropdown">
              {notifications.length === 0 ? (
                <div className="notif-item" style={{ color: 'var(--text-muted)' }}>
                  No notifications right now
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    className="notif-item"
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: n.studentName ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (!n.studentName) return;
                      setNotifOpen(false);
                      navigate(`/students?q=${encodeURIComponent(n.studentName)}`);
                    }}
                  >
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-time">{n.time}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <Button size="sm" onClick={() => openDialog()}>
          <Plus size={15} />
          Quick Add
        </Button>
      </div>
    </header>
  );
}
