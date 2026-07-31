import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './PageLoader';
import { useDelayedFlag } from '../hooks/useDelayedFlag';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  const isLoading = status === 'idle' || status === 'loading';
  const showColdStartHint = useDelayedFlag(isLoading, 5000);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <PageLoader
          label="Loading FeeFlow…"
          hint={showColdStartHint ? "The server is waking up — this can take up to a minute on the first request." : undefined}
        />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
