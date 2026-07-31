import { Spinner } from './Spinner';

interface PageLoaderProps {
  label?: string;
  hint?: string;
  compact?: boolean;
}

export function PageLoader({ label = 'Loading…', hint, compact = false }: PageLoaderProps) {
  return (
    <div className={`page-loader${compact ? ' compact' : ''}`}>
      <Spinner size={compact ? 16 : 22} />
      <span className="page-loader-label">{label}</span>
      {hint && <span className="page-loader-hint">{hint}</span>}
    </div>
  );
}
