"use client";

import { useState } from "react";

export function ShareProfileButton({
  displayId,
  name,
  compact = false,
}: {
  displayId: string;
  name: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `https://borbodhu.com/profiles/${displayId}`;
  const whatsappText = encodeURIComponent(`Check this profile on Borbodhu: ${name} — ${profileUrl}`);
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = profileUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const btnStyle = compact
    ? { fontSize: "0.73rem", padding: "4px 10px" }
    : { fontSize: "0.82rem", padding: "8px 14px" };

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="button button-soft"
        style={btnStyle}
      >
        Share on WhatsApp
      </a>
      <button
        type="button"
        className="button button-soft"
        onClick={handleCopy}
        style={btnStyle}
      >
        {copied ? "Link copied!" : "Copy link"}
      </button>
    </div>
  );
}
