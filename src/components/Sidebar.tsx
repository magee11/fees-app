import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  CreditCard,
  CalendarRange,
  BarChart3,
  UserCog,
  Settings,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/queries/useSettings';
import { Avatar } from './Avatar';
import { gradientForId } from '../utils/gradient';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/activities', label: 'Activities', icon: Target },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/tracker', label: 'Monthly Tracker', icon: CalendarRange },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: UserCog, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, logout } = useAuth();
  const { data: settings } = useSettings();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">FF</div>
        <div>
          <div className="sidebar-logo-text">FeeFlow</div>
          <div className="sidebar-logo-sub">{settings?.schoolName || 'Activity Fee Manager'}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={17} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <Avatar name={user.name} gradient={gradientForId(user._id)} size={32} />
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{user.role}</span>
            </div>
            <button className="icon-btn" onClick={() => logout()} aria-label="Log out">
              <LogOut size={15} />
            </button>
          </div>
        )}
        <button className="theme-toggle" onClick={toggleTheme}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </span>
          <span>Toggle</span>
        </button>
      </div>
    </aside>
  );
}
