"use client";

import { useState } from "react";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function getAvatarGradient(displayId: string) {
  const gradients = [
    "linear-gradient(135deg, #8a3947, #c79b59)",
    "linear-gradient(135deg, #2f6f72, #5b9fa3)",
    "linear-gradient(135deg, #356757, #6bb08a)",
    "linear-gradient(135deg, #40567f, #7892c0)",
    "linear-gradient(135deg, #7a3550, #c96d90)",
    "linear-gradient(135deg, #5a4520, #c79b59)",
  ];
  const idx = displayId.charCodeAt(displayId.length - 1) % gradients.length;
  return gradients[idx];
}

export function ProfileCardPhoto({
  photoUrl,
  name,
  displayId,
}: {
  photoUrl: string | null;
  name: string;
  displayId: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!photoUrl || broken) {
    return (
      <div
        className="mini-card-media mini-card-media-placeholder"
        style={{ background: getAvatarGradient(displayId), color: "#fff", fontSize: "2rem", fontWeight: 700 }}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl}
      alt={`${name} profile photo`}
      className="mini-card-media"
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
