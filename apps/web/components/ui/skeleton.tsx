"use client";

type SkeletonVariant = "text" | "card" | "avatar" | "table-row";

export function Skeleton({
  variant = "text",
  count = 1,
  width,
  height,
}: {
  variant?: SkeletonVariant;
  count?: number;
  width?: string;
  height?: string;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`skeleton skeleton-${variant}`}
          style={{ width, height }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
