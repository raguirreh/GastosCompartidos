import { Avatar } from './Avatar';

interface StackedAvatarsProps {
  members: Array<{ emoji: string; color: string }>;
  size?: number;
  max?: number;
}

/** Avatares apilados (overlap) para mostrar miembros de un grupo de forma compacta. */
export function StackedAvatars({ members, size = 28, max = 4 }: StackedAvatarsProps) {
  const visible = members.slice(0, max);
  const remaining = members.length - visible.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((member, index) => (
        <div
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : -size * 0.3,
            border: '2px solid #fff',
            borderRadius: '100%',
          }}
        >
          <Avatar emoji={member.emoji} color={member.color} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div style={{ marginLeft: -size * 0.3, border: '2px solid #fff', borderRadius: '100%' }}>
          <Avatar label={`+${remaining}`} color="#D9E2EC" size={size} />
        </div>
      )}
    </div>
  );
}
