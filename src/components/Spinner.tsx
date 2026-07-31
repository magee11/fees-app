interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 18, color = 'var(--accent)' }: SpinnerProps) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderColor: `${color}33`, borderTopColor: color }}
      role="status"
      aria-label="Loading"
    />
  );
}
