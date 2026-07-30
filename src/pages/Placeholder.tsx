interface PlaceholderProps {
  name: string;
  copy: string;
}

export function Placeholder({ name, copy }: PlaceholderProps) {
  return (
    <div
      className="fade-up"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <div className="card" style={{ textAlign: 'center', maxWidth: 360, padding: 40 }}>
        <div className="card-kicker">{name}</div>
        <div style={{ fontSize: 22, fontWeight: 700, margin: '10px 0 8px' }}>Coming soon</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{copy}</p>
      </div>
    </div>
  );
}
