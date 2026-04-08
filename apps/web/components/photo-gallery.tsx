"use client";

import { useState, useCallback } from "react";

type GalleryItem = { id: string; isPrimary: boolean; storageUrl: string | null };

function getInitials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

/** Avatar fallback when no photo is available */
export function ProfileAvatar({ name, displayId, size = 120, rectangular }: { name: string; displayId: string; size?: number; rectangular?: boolean }) {
  const idx = hashCode(displayId) % GRADIENTS.length;
  return (
    <div
      style={{
        width: rectangular ? size : size,
        height: rectangular ? size * 1.2 : size,
        borderRadius: rectangular ? 12 : "50%",
        background: GRADIENTS[idx],
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: size * 0.3,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

/** Hero photo with fallback to avatar — large rectangular format */
export function ProfileHeroPhoto({ photoUrl, name, displayId, galleryCount }: { photoUrl: string | null; name: string; displayId: string; galleryCount?: number }) {
  const [broken, setBroken] = useState(false);

  if (!photoUrl || broken) {
    return <ProfileAvatar name={name} displayId={displayId} size={180} rectangular />;
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt={`${name} profile photo`}
        onError={() => setBroken(true)}
        style={{
          width: 200, height: 240, borderRadius: 12,
          objectFit: "cover", border: "3px solid rgba(255,255,255,0.25)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      />
      {galleryCount != null && galleryCount > 1 && (
        <span style={{
          position: "absolute", bottom: 8, right: 8,
          background: "rgba(0,0,0,0.65)", color: "#fff",
          fontSize: 11, fontWeight: 600, padding: "3px 8px",
          borderRadius: 6, backdropFilter: "blur(4px)",
        }}>
          📷 {galleryCount} photos
        </span>
      )}
    </div>
  );
}

/** Gallery grid with lightbox */
export function PhotoGallery({ items, memberName }: { items: GalleryItem[]; memberName: string }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const handleError = useCallback((id: string) => {
    setFailedIds((prev) => new Set(prev).add(id));
  }, []);

  const validItems = items.filter((it) => it.storageUrl && !failedIds.has(it.id));

  if (validItems.length === 0) {
    return (
      <div className="dashboard-empty">
        <p className="section-kicker">No public gallery</p>
        <h2>This member has not shared public photos.</h2>
      </div>
    );
  }

  return (
    <>
      <div className="photo-gallery-grid">
        {validItems.map((item, i) => (
          <button
            key={item.id}
            className="photo-gallery-thumb"
            onClick={() => setLightboxIdx(i)}
            type="button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.storageUrl!}
              alt={`${memberName} photo ${i + 1}`}
              onError={() => handleError(item.id)}
              loading="lazy"
            />
            {item.isPrimary && <span className="photo-gallery-primary-badge">Primary</span>}
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div className="photo-lightbox-overlay" onClick={() => setLightboxIdx(null)}>
          <div className="photo-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-lightbox-close" onClick={() => setLightboxIdx(null)} type="button">&times;</button>

            {validItems.length > 1 && (
              <>
                <button
                  className="photo-lightbox-nav photo-lightbox-prev"
                  onClick={() => setLightboxIdx((lightboxIdx - 1 + validItems.length) % validItems.length)}
                  type="button"
                >&#8249;</button>
                <button
                  className="photo-lightbox-nav photo-lightbox-next"
                  onClick={() => setLightboxIdx((lightboxIdx + 1) % validItems.length)}
                  type="button"
                >&#8250;</button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={validItems[lightboxIdx]?.storageUrl!}
              alt={`${memberName} photo ${lightboxIdx + 1}`}
              className="photo-lightbox-img"
              onError={() => {
                handleError(validItems[lightboxIdx].id);
                setLightboxIdx(null);
              }}
            />

            <div className="photo-lightbox-counter">
              {lightboxIdx + 1} / {validItems.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
