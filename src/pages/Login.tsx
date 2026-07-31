import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import { ApiError } from '../api/client';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: { from?: Location } };
  const showColdStartHint = useDelayedFlag(isSubmitting, 5000);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page fade-up">
      <div className="card login-card">
        <div className="login-logo">
          <div className="sidebar-logo-mark">FF</div>
          <div>
            <div className="sidebar-logo-text">FeeFlow</div>
            <div className="sidebar-logo-sub">Activity Fee Manager</div>
          </div>
        </div>

        <div className="login-title">Sign in to your account</div>

        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-field" style={{ marginBottom: 14 }}>
            <label className="form-label">Email</label>
            <div className="input-icon-wrap">
              <Mail size={15} />
              <input
                type="email"
                className="input"
                placeholder="you@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-field" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={15} />
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button type="submit" className="full-width-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size={14} color="#fff" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {showColdStartHint && (
            <div className="login-cold-start-hint">
              Still working — the server may be waking up from idle, this can take up to a minute.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
