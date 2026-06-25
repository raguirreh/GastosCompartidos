interface AvatarProps {
  emoji?: string;
  label?: string;
  color: string;
  size?: number;
}

/** Avatar circular simple: muestra un emoji o, si no hay, las iniciales del nombre. */
export function Avatar({ emoji, label, color, size = 40 }: AvatarProps) {
  const content = emoji ?? label ?? '?';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
      }}
    >
      {content}
    </div>
  );
}
