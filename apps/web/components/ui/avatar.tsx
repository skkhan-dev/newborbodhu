"use client";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_PX: Record<AvatarSize, number> = { sm: 36, md: 48, lg: 72 };

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getGradient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffff;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue}, 45%, 55%), hsl(${(hue + 40) % 360}, 50%, 42%))`;
}

export function Avatar({
  src,
  name,
  size = "md",
  seed,
}: {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  seed?: string;
}) {
  const px = SIZE_PX[size];

  if (src) {
    return (
      <img
        className={`avatar avatar-${size}`}
        src={src}
        alt={name}
        width={px}
        height={px}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <span
      className={`avatar avatar-${size} avatar-placeholder`}
      style={{
        width: px,
        height: px,
        background: getGradient(seed ?? name),
        fontSize: px * 0.38,
      }}
      aria-label={name}
    >
      {getInitials(name)}
    </span>
  );
}
