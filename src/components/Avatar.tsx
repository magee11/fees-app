function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

interface AvatarProps {
  name: string;
  gradient: string;
  size?: number;
}

export function Avatar({ name, gradient, size = 38 }: AvatarProps) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: gradient,
        fontSize: size * 0.38,
      }}
    >
      {initials(name)}
    </span>
  );
}
