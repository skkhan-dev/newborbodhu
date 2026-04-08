"use client";

type BadgeTone =
  | "default"
  | "rose"
  | "gold"
  | "leaf"
  | "teal"
  | "indigo"
  | "saffron"
  | "sand"
  | "muted";

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {children}
    </span>
  );
}
