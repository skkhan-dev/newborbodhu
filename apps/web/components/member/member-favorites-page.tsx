"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { apiRequest, getErrorMessage } from "@/lib/api";
import type { PublicLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

type FavoriteItem = {
  id: string;
  createdAt: string;
  profile: {
    id: string;
    displayId: string;
    displayName: string;
    age: number | null;
    gender: string;
    religion: string | null;
    profession: string | null;
    currentCity: string | null;
    currentCountryCode: string | null;
    primaryPhotoUrl: string | null;
  };
};

export function MemberFavoritesPage({ locale = null }: { locale?: PublicLocale | null }) {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await apiRequest<FavoriteItem[]>(
        "/member-profiles/me/favorites",
        { token: accessToken },
      );
      setFavorites(response);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeFavorite(favoriteId: string) {
    if (!accessToken) return;
    try {
      await apiRequest(`/member-profiles/me/favorites/${favoriteId}`, {
        method: "DELETE",
        token: accessToken,
      });
      toast(localeText(locale, "Removed from favorites.", "ফেভারিট থেকে সরানো হয়েছে।"), "info");
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch (e) {
      toast(getErrorMessage(e), "error");
    }
  }

  return (
    <main className="page-shell">
      <div className="panel-header" style={{ marginBottom: 16 }}>
        <div>
          <p className="section-kicker">{localeText(locale, "Favorites", "ফেভারিট")}</p>
          <h2>{localeText(locale, "Your saved profiles", "আপনার সংরক্ষিত প্রোফাইল")}</h2>
        </div>
        {!loading && <Badge tone="gold">{favorites.length}</Badge>}
      </div>

      {loading ? (
        <div className="stack-list">
          <Skeleton variant="card" count={4} height="80px" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          {localeText(locale, "You haven't saved any profiles yet. Browse and favorite profiles you like.", "আপনি এখনও কোনো প্রোফাইল সংরক্ষণ করেননি।")}
        </div>
      ) : (
        <div className="stack-list">
          {favorites.map((fav) => (
            <article key={fav.id} className="mini-card mini-card-horizontal">
              <div className="mini-card-body" style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
                <Avatar
                  src={fav.profile.primaryPhotoUrl}
                  name={fav.profile.displayName}
                  size="lg"
                  seed={fav.profile.displayId}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    href={localizePath(`/profiles/${fav.profile.displayId}`, locale)}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <strong>{fav.profile.displayName}</strong>
                  </Link>
                  <p className="mini-text" style={{ margin: "2px 0" }}>
                    {fav.profile.displayId}
                    {fav.profile.age ? ` • ${fav.profile.age} yrs` : ""}
                    {fav.profile.currentCity ? ` • ${fav.profile.currentCity}` : ""}
                  </p>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {fav.profile.religion && <Badge tone="gold">{fav.profile.religion}</Badge>}
                    {fav.profile.profession && <Badge tone="teal">{fav.profile.profession}</Badge>}
                  </div>
                </div>
                <button
                  type="button"
                  className="button button-soft"
                  onClick={() => void removeFavorite(fav.id)}
                  style={{ fontSize: 13, padding: "8px 14px", flexShrink: 0 }}
                >
                  {localeText(locale, "Remove", "সরান")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
