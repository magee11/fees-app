import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AddStudentDialog } from './AddStudentDialog';
import { AddStudentProvider } from '../context/AddStudentContext';

export function Layout() {
  return (
    <AddStudentProvider>
      <div className="app-shell">
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
      <AddStudentDialog />
    </AddStudentProvider>
  );
}
