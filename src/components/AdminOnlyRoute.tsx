import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Placeholder } from '../pages/Placeholder';

export function AdminOnlyRoute() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Placeholder name="Restricted" copy="This section is only available to administrators." />;
  }

  return <Outlet />;
}
