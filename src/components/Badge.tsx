import type { ReactNode } from 'react';

type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  dot?: boolean;
}

export function Badge({ tone, children, dot = false }: BadgeProps) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" style={{ background: 'currentColor' }} />}
      {children}
    </span>
  );
}
