import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AddStudentDialog } from './AddStudentDialog';
import { AddStudentProvider } from '../context/AddStudentContext';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <AddStudentProvider>
      <div className="app-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Header onMenuClick={() => setSidebarOpen((v) => !v)} />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
      <AddStudentDialog />
    </AddStudentProvider>
  );
}
