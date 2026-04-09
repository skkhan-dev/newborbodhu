"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { DashboardAssistant } from "@/components/dashboard-assistant";
import { SidebarNav, type SidebarSection } from "@/components/ui/sidebar-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { translateProfileStatus } from "@/lib/translate";
import type { PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";
import type { GhotokDashboardResponse } from "@/lib/types/ghotok";

type GhotokSection = "dashboard" | "members" | "credits" | "profile";

type GhotokMember = {
  id: string;
  displayId: string;
  displayName: string;
  firstName: string;
  gender: string;
  status: string;
  approvalStatus: string;
  phone?: string | null;
  managedByGhotokId?: string | null;
  createdAt: string;
};

type CreditLedgerEntry = {
  id: string;
  amount: number;
  entryType: string;
  balanceAfter: number;
  notes: string | null;
  createdAt: string;
};

type ActiveSession = {
  id: string;
  memberProfileId: string;
  creditsSpent: number;
  startedAt: string;
  memberProfile: {
    id: string;
    displayId: string;
    displayName: string;
    firstName: string;
    status: string;
    approvalStatus: string;
  };
} | null;

type CreateMemberForm = {
  firstName: string;
  lastName: string;
  gender: string;
  lookingFor: string;
  memberPhone: string;
  currentCountryCode: string;
};

type ProfileForm = {
  displayName: string;
  bioEn: string;
  bioBn: string;
  phone: string;
  address: string;
  feeAmount: string;
  feeCurrency: string;
};

const sidebarSections: SidebarSection[] = [
  {
    label: "Ghotok",
    items: [
      { key: "dashboard", label: "Dashboard", icon: "◉" },
      { key: "assistant", label: "AI Chat", icon: "🎙️" },
      { key: "members", label: "Managed Members", icon: "☷" },
      { key: "credits", label: "Credit History", icon: "◈" },
      { key: "profile", label: "My Profile", icon: "✎" },
    ],
  },
];

const emptyCreateForm: CreateMemberForm = {
  firstName: "",
  lastName: "",
  gender: "MALE",
  lookingFor: "FEMALE",
  memberPhone: "",
  currentCountryCode: "BD",
};

export function GhotokDashboardPage({ locale = null }: { locale?: PublicLocale | null }) {
  const { accessToken, user, isReady } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState<GhotokSection>("dashboard");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [data, setData] = useState<GhotokDashboardResponse | null>(null);
  const [members, setMembers] = useState<GhotokMember[]>([]);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Member detail modal
  const [selectedMember, setSelectedMember] = useState<GhotokMember | null>(null);

  // Photo upload
  const [photoUploading, setPhotoUploading] = useState(false);

  // Create member form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMemberForm>(emptyCreateForm);

  // Link existing member search
  const [memberMode, setMemberMode] = useState<"list" | "create" | "link">("list");
  const [linkQuery, setLinkQuery] = useState("");
  const [linkResults, setLinkResults] = useState<GhotokMember[]>([]);

  // Profile edit form
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    displayName: "",
    bioEn: "",
    bioBn: "",
    phone: "",
    address: "",
    feeAmount: "",
    feeCurrency: "BDT",
  });

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [dashboard, memberList, session] = await Promise.allSettled([
        apiRequest<GhotokDashboardResponse>("/ghotok/me/dashboard", { token: accessToken }),
        apiRequest<GhotokMember[]>("/ghotok/me/members", { token: accessToken }),
        apiRequest<ActiveSession>("/ghotok/me/impersonation", { token: accessToken }),
      ]);
      if (dashboard.status === "fulfilled") {
        setData(dashboard.value);
        setLedger(dashboard.value.recentLedger);
        setProfileForm({
          displayName: dashboard.value.profile.displayName ?? "",
          bioEn: dashboard.value.profile.bioEn ?? "",
          bioBn: dashboard.value.profile.bioBn ?? "",
          phone: dashboard.value.profile.phone ?? "",
          address: dashboard.value.profile.address ?? "",
          feeAmount: dashboard.value.profile.feeAmount ? String(dashboard.value.profile.feeAmount) : "",
          feeCurrency: dashboard.value.profile.feeCurrency ?? "BDT",
        });
      }
      if (memberList.status === "fulfilled") setMembers(memberList.value);
      if (session.status === "fulfilled") setActiveSession(session.value);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    if (isReady && accessToken) void load();
  }, [isReady, accessToken, load]);

  async function createMember() {
    if (!accessToken || !createForm.firstName.trim()) return;
    setBusyKey("create-member");
    try {
      await apiRequest("/ghotok/me/members", {
        method: "POST",
        token: accessToken,
        body: {
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim() || undefined,
          gender: createForm.gender,
          lookingFor: createForm.lookingFor,
          memberPhone: createForm.memberPhone.trim() || undefined,
          currentCountryCode: createForm.currentCountryCode.trim() || undefined,
        },
      });
      toast(localeText(locale, "Member created.", "মেম্বার তৈরি হয়েছে।"), "success");
      setCreateForm(emptyCreateForm);
      setShowCreateForm(false);
      await load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyKey(null);
    }
  }

  async function searchForLink(q: string) {
    if (!accessToken || !q.trim()) return;
    setBusyKey("link-search");
    try {
      const results = await apiRequest<GhotokMember[]>(`/ghotok/me/member-search?q=${encodeURIComponent(q.trim())}`, { token: accessToken });
      setLinkResults(results);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyKey(null);
    }
  }

  async function linkMember(memberProfileId: string) {
    if (!accessToken) return;
    setBusyKey(`link:${memberProfileId}`);
    try {
      await apiRequest(`/ghotok/me/link-member/${memberProfileId}`, { method: "POST", token: accessToken });
      toast(localeText(locale, "Member linked successfully.", "মেম্বার লিঙ্ক করা হয়েছে।"), "success");
      setMemberMode("list");
      setLinkQuery("");
      setLinkResults([]);
      await load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyKey(null);
    }
  }

  async function unlinkMember(memberProfileId: string) {
    if (!accessToken) return;
    setBusyKey(`unlink:${memberProfileId}`);
    try {
      await apiRequest(`/ghotok/me/link-member/${memberProfileId}`, { method: "DELETE", token: accessToken });
      toast(localeText(locale, "Member unlinked.", "মেম্বার আনলিঙ্ক করা হয়েছে।"), "success");
      await load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyKey(null);
    }
  }

  async function startImpersonation(memberProfileId: string) {
    if (!accessToken) return;
    setBusyKey(`impersonate:${memberProfileId}`);
    try {
      const session = await apiRequest<ActiveSession>(`/ghotok/me/impersonation/${memberProfileId}/start`, {
        method: "POST",
        token: accessToken,
        body: {},
      });
      setActiveSession(session);
      toast(localeText(locale, "Impersonation started.", "ইম্পার্সোনেশন শুরু হয়েছে।"), "success");
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyKey(null);
    }
  }

  async function endImpersonation() {
    if (!accessToken || !activeSession) return;
    setBusyKey("end-impersonation");
    try {
      await apiRequest(`/ghotok/me/impersonation/${activeSession.id}/end`, {
        method: "POST",
        token: accessToken,
        body: {},
      });
      setActiveSession(null);
      toast(localeText(locale, "Session ended.", "সেশন শেষ হয়েছে।"), "success");
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyKey(null);
    }
  }

  async function uploadPhoto(file: File) {
    if (!accessToken) return;
    setPhotoUploading(true);
    try {
      // Step 1: get presigned URL
      const req = await apiRequest<{ uploadUrl: string; storagePath: string; method: string }>(
        "/ghotok/me/photo/upload-request",
        { method: "POST", token: accessToken, body: { fileName: file.name, mimeType: file.type } },
      );
      // Step 2: upload to GCS
      const uploadRes = await fetch(req.uploadUrl, {
        method: req.method,
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) {
        throw new Error(`Photo upload failed (${uploadRes.status}). Please try again.`);
      }
      // Step 3: commit
      await apiRequest("/ghotok/me/photo", {
        method: "PATCH",
        token: accessToken,
        body: { storagePath: req.storagePath },
      });
      toast(localeText(locale, "Photo uploaded.", "ছবি আপলোড হয়েছে।"), "success");
      await load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function saveProfile() {
    if (!accessToken) return;
    setBusyKey("save-profile");
    try {
      await apiRequest("/ghotok/me/profile", {
        method: "PATCH",
        token: accessToken,
        body: {
          displayName: profileForm.displayName.trim() || undefined,
          bioEn: profileForm.bioEn.trim() || undefined,
          bioBn: profileForm.bioBn.trim() || undefined,
          phone: profileForm.phone.trim() || undefined,
          address: profileForm.address.trim() || undefined,
          feeAmount: profileForm.feeAmount ? (isNaN(parseInt(profileForm.feeAmount, 10)) ? undefined : parseInt(profileForm.feeAmount, 10)) : undefined,
          feeCurrency: profileForm.feeCurrency.trim() || undefined,
        },
      });
      toast(localeText(locale, "Profile saved.", "প্রোফাইল সেভ হয়েছে।"), "success");
      await load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyKey(null);
    }
  }

  if (!isReady || !user) {
    return (
      <main className="page-shell">
        <div className="empty-state">{localeText(locale, "Loading...", "লোড হচ্ছে...")}</div>
      </main>
    );
  }

  if (!user.roles.includes("GHOTOK")) {
    return (
      <main className="page-shell">
        <div className="error-banner">{localeText(locale, "You do not have ghotok access.", "আপনার ঘটক অ্যাক্সেস নেই।")}</div>
      </main>
    );
  }

  const memberColumns: DataTableColumn<GhotokMember>[] = [
    { key: "displayId", label: localeText(locale, "ID", "আইডি"), width: "100px" },
    { key: "displayName", label: localeText(locale, "Name", "নাম"), sortable: true },
    { key: "gender", label: localeText(locale, "Gender", "লিঙ্গ") },
    {
      key: "status",
      label: localeText(locale, "Status", "স্ট্যাটাস"),
      render: (row) => (
        <Badge tone={row.status === "ACTIVE" ? "leaf" : "gold"}>
          {translateProfileStatus(row.status, locale)}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: localeText(locale, "Created", "তৈরি"),
      sortable: true,
      render: (row) => formatDate(row.createdAt, locale),
    },
    {
      key: "id",
      label: localeText(locale, "Action", "অ্যাকশন"),
      render: (row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="button button-soft"
            style={{ padding: "2px 10px", fontSize: "0.78rem" }}
            disabled={busyKey === `impersonate:${row.id}` || activeSession?.memberProfileId === row.id}
            onClick={() => void startImpersonation(row.id)}
          >
            {activeSession?.memberProfileId === row.id
              ? localeText(locale, "Active", "সক্রিয়")
              : busyKey === `impersonate:${row.id}`
                ? localeText(locale, "Starting…", "শুরু হচ্ছে…")
                : localeText(locale, "Act as", "হিসেবে কাজ করুন")}
          </button>
          <button
            type="button"
            className="button button-soft"
            style={{ padding: "2px 8px", fontSize: "0.75rem", color: "var(--rose)" }}
            disabled={busyKey === `unlink:${row.id}`}
            onClick={() => void unlinkMember(row.id)}
          >
            {busyKey === `unlink:${row.id}` ? "…" : localeText(locale, "Unlink", "আনলিঙ্ক")}
          </button>
        </div>
      ),
    },
  ];

  const totalMembers = data?.managedCounts.reduce((t, i) => t + i._count.status, 0) ?? 0;

  return (
    <main className="page-shell" style={{ padding: 0 }}>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div style={{ marginBottom: 16 }}>
            <p className="section-kicker" style={{ padding: "0 12px" }}>
              {localeText(locale, "Ghotok Portal", "ঘটক পোর্টাল")}
            </p>
          </div>
          <SidebarNav
            sections={sidebarSections}
            activeKey={assistantOpen ? "assistant" : section}
            onNavigate={(key) => {
              if (key === "assistant") {
                setAssistantOpen(true);
                return;
              }
              setAssistantOpen(false);
              setSection(key as GhotokSection);
            }}
          />
        </aside>

        <div className="dashboard-content">
          <DashboardAssistant
            accessToken={accessToken ?? ""}
            user={user}
            locale={locale}
            open={assistantOpen}
            onClose={() => setAssistantOpen(false)}
          />
          {/* Active impersonation banner */}
          {activeSession && (
            <div className="error-banner" style={{ background: "var(--gold-bg, #fef9c3)", color: "#92400e", border: "1px solid #fde68a", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>
                {localeText(locale, "Acting as", "হিসেবে কাজ করছেন")}:{" "}
                <strong>{activeSession.memberProfile.displayName || activeSession.memberProfile.firstName}</strong>
                {" "}({activeSession.memberProfile.displayId}) — {activeSession.creditsSpent} {localeText(locale, "credits spent", "ক্রেডিট ব্যবহার")}
              </span>
              <button
                type="button"
                className="button button-soft"
                disabled={busyKey === "end-impersonation"}
                onClick={() => void endImpersonation()}
                style={{ marginLeft: 12, padding: "2px 12px", fontSize: "0.8rem" }}
              >
                {busyKey === "end-impersonation"
                  ? localeText(locale, "Ending…", "শেষ হচ্ছে…")
                  : localeText(locale, "End Session", "সেশন শেষ করুন")}
              </button>
            </div>
          )}

          {loading ? (
            <Skeleton variant="card" count={3} />
          ) : (
            <>
              {/* Dashboard Overview */}
              {section === "dashboard" && data && (
                <div>
                  <div className="panel-header" style={{ marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontFamily: "var(--font-playfair, serif)" }}>
                        {data.profile.displayName}
                      </h2>
                      <p className="hint">{data.profile.email}</p>
                    </div>
                    <Badge tone="leaf">{translateProfileStatus(data.profile.status, locale)}</Badge>
                  </div>

                  <div className="dashboard-stats" style={{ marginBottom: 24 }}>
                    <StatCard value={data.wallet.balance} label={localeText(locale, "Credit balance", "ক্রেডিট ব্যালেন্স")} tone="gold" />
                    <StatCard value={totalMembers} label={localeText(locale, "Managed members", "ম্যানেজড মেম্বার")} tone="teal" />
                    <StatCard value={data.recentLedger.length} label={localeText(locale, "Recent transactions", "সাম্প্রতিক লেনদেন")} />
                  </div>

                  {data.managedCounts.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p className="hint" style={{ marginBottom: 8 }}>{localeText(locale, "Members by status", "স্ট্যাটাস অনুযায়ী মেম্বার")}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {data.managedCounts.map((item) => (
                          <Badge key={item.status} tone={item.status === "ACTIVE" ? "leaf" : "gold"}>
                            {translateProfileStatus(item.status, locale)}: {item._count.status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button button-soft"
                      onClick={() => { setSection("members"); setShowCreateForm(true); }}
                    >
                      + {localeText(locale, "Add Member", "মেম্বার যোগ করুন")}
                    </button>
                    <button
                      type="button"
                      className="button button-soft"
                      onClick={() => setSection("profile")}
                    >
                      {localeText(locale, "Edit Profile", "প্রোফাইল সম্পাদনা করুন")}
                    </button>
                  </div>
                </div>
              )}

              {/* Managed Members */}
              {section === "members" && (
                <div>
                  <div className="panel-header" style={{ marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "var(--font-playfair, serif)" }}>
                      {localeText(locale, "Managed Members", "ম্যানেজড মেম্বার")}
                    </h2>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Badge tone="teal">{members.length}</Badge>
                      <button
                        type="button"
                        className="button button-soft"
                        style={{ padding: "4px 14px", fontSize: "0.85rem" }}
                        onClick={() => {
                          const next = memberMode === "link" ? "list" : "link";
                          setMemberMode(next);
                          if (next !== "link") { setLinkQuery(""); setLinkResults([]); }
                        }}
                      >
                        {memberMode === "link" ? localeText(locale, "Cancel", "বাতিল") : localeText(locale, "Link Existing Member", "বিদ্যমান মেম্বার লিঙ্ক করুন")}
                      </button>
                      <button
                        type="button"
                        className="button button-primary"
                        style={{ padding: "4px 14px", fontSize: "0.85rem" }}
                        onClick={() => {
                          setMemberMode(memberMode === "create" ? "list" : "create");
                          setLinkQuery("");
                          setLinkResults([]);
                        }}
                      >
                        {memberMode === "create" ? localeText(locale, "Cancel", "বাতিল") : `+ ${localeText(locale, "Create New", "নতুন তৈরি করুন")}`}
                      </button>
                    </div>
                  </div>

                  {/* Link existing member search */}
                  {memberMode === "link" && (
                    <div className="dashboard-panel" style={{ marginBottom: 20, padding: 16 }}>
                      <p className="section-kicker" style={{ marginBottom: 12 }}>{localeText(locale, "Search members who signed up themselves", "যে মেম্বাররা নিজে সাইন আপ করেছেন")}</p>
                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <input
                          type="text"
                          className="input"
                          placeholder={localeText(locale, "Search by name, ID, or phone…", "নাম, আইডি বা ফোন দিয়ে সার্চ করুন…")}
                          value={linkQuery}
                          onChange={(e) => setLinkQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") void searchForLink(linkQuery); }}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => void searchForLink(linkQuery)}
                          disabled={!linkQuery.trim() || busyKey === "link-search"}
                          style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                        >
                          {busyKey === "link-search" ? localeText(locale, "Searching…", "সার্চ হচ্ছে…") : localeText(locale, "Search", "সার্চ")}
                        </button>
                      </div>
                      {linkResults.length > 0 && (
                        <div style={{ display: "grid", gap: 8 }}>
                          {linkResults.map((r) => (
                            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface)" }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{r.displayName || r.firstName}</span>
                                <span style={{ color: "var(--muted)", fontSize: "0.8rem", marginLeft: 8 }}>{r.displayId}</span>
                                {r.phone && <span style={{ color: "var(--muted)", fontSize: "0.8rem", marginLeft: 8 }}>· {r.phone}</span>}
                                <span style={{ marginLeft: 8 }}>
                                  <Badge tone={r.managedByGhotokId ? "gold" : "muted"}>{r.managedByGhotokId ? localeText(locale, "Already linked", "ইতোমধ্যে লিঙ্কড") : r.status}</Badge>
                                </span>
                              </div>
                              {!r.managedByGhotokId && (
                                <button
                                  type="button"
                                  className="button button-primary"
                                  style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                                  disabled={busyKey === `link:${r.id}`}
                                  onClick={() => void linkMember(r.id)}
                                >
                                  {busyKey === `link:${r.id}` ? localeText(locale, "Linking…", "লিঙ্ক হচ্ছে…") : localeText(locale, "Link", "লিঙ্ক করুন")}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {linkResults.length === 0 && linkQuery && (
                        <p className="hint">{localeText(locale, "No members found. Try a different search.", "কোনো মেম্বার পাওয়া যায়নি।")}</p>
                      )}
                    </div>
                  )}

                  {memberMode === "create" && (
                    <div className="dashboard-panel" style={{ marginBottom: 20, padding: 16 }}>
                      <p className="section-kicker" style={{ marginBottom: 12 }}>{localeText(locale, "New Member", "নতুন মেম্বার")}</p>
                      <div className="input-grid">
                        <label className="field">
                          <span>{localeText(locale, "First name", "প্রথম নাম")} *</span>
                          <input
                            type="text"
                            value={createForm.firstName}
                            onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))}
                          />
                        </label>
                        <label className="field">
                          <span>{localeText(locale, "Last name", "শেষ নাম")}</span>
                          <input
                            type="text"
                            value={createForm.lastName}
                            onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))}
                          />
                        </label>
                        <label className="field">
                          <span>{localeText(locale, "Gender", "লিঙ্গ")} *</span>
                          <select value={createForm.gender} onChange={(e) => setCreateForm((p) => ({ ...p, gender: e.target.value }))}>
                            <option value="MALE">{localeText(locale, "Male", "পুরুষ")}</option>
                            <option value="FEMALE">{localeText(locale, "Female", "মহিলা")}</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>{localeText(locale, "Looking for", "খুঁজছেন")} *</span>
                          <select value={createForm.lookingFor} onChange={(e) => setCreateForm((p) => ({ ...p, lookingFor: e.target.value }))}>
                            <option value="FEMALE">{localeText(locale, "Female", "মহিলা")}</option>
                            <option value="MALE">{localeText(locale, "Male", "পুরুষ")}</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>{localeText(locale, "Phone", "ফোন")}</span>
                          <input
                            type="text"
                            value={createForm.memberPhone}
                            onChange={(e) => setCreateForm((p) => ({ ...p, memberPhone: e.target.value }))}
                          />
                        </label>
                        <label className="field">
                          <span>{localeText(locale, "Country code", "দেশ কোড")}</span>
                          <input
                            type="text"
                            value={createForm.currentCountryCode}
                            onChange={(e) => setCreateForm((p) => ({ ...p, currentCountryCode: e.target.value }))}
                          />
                        </label>
                      </div>
                      <div className="inline-actions" style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="button button-primary"
                          disabled={busyKey === "create-member" || !createForm.firstName.trim()}
                          onClick={() => void createMember()}
                        >
                          {busyKey === "create-member"
                            ? localeText(locale, "Creating…", "তৈরি হচ্ছে…")
                            : localeText(locale, "Create Member", "মেম্বার তৈরি করুন")}
                        </button>
                      </div>
                    </div>
                  )}

                  <DataTable
                    columns={memberColumns}
                    rows={members}
                    onRowClick={(row) => setSelectedMember(row)}
                    keyExtractor={(row) => row.id}
                    emptyMessage={localeText(locale, "No managed members yet.", "এখনও কোনো ম্যানেজড মেম্বার নেই।")}
                  />

                  {selectedMember && (
                    <Modal
                      open={!!selectedMember}
                      onClose={() => setSelectedMember(null)}
                      title={selectedMember.displayName || selectedMember.displayId}
                      footer={
                        <div className="modal-actions">
                          <button
                            type="button"
                            className="button button-soft"
                            style={{ fontSize: 13 }}
                            disabled={busyKey === `impersonate:${selectedMember.id}` || activeSession?.memberProfileId === selectedMember.id}
                            onClick={() => { setSelectedMember(null); void startImpersonation(selectedMember.id); }}
                          >
                            {activeSession?.memberProfileId === selectedMember.id
                              ? localeText(locale, "Session active", "সেশন সক্রিয়")
                              : localeText(locale, "Act as this member", "এই মেম্বার হিসেবে কাজ করুন")}
                          </button>
                        </div>
                      }
                    >
                      <div className="input-grid">
                        <div>
                          <p className="hint">{localeText(locale, "Display ID", "ডিসপ্লে আইডি")}</p>
                          <strong>{selectedMember.displayId}</strong>
                        </div>
                        <div>
                          <p className="hint">{localeText(locale, "Gender", "লিঙ্গ")}</p>
                          <strong>{selectedMember.gender}</strong>
                        </div>
                        <div>
                          <p className="hint">{localeText(locale, "Profile status", "প্রোফাইল স্ট্যাটাস")}</p>
                          <Badge tone={selectedMember.status === "ACTIVE" ? "leaf" : "gold"}>
                            {translateProfileStatus(selectedMember.status, locale)}
                          </Badge>
                        </div>
                        <div>
                          <p className="hint">{localeText(locale, "Approval status", "অনুমোদন স্ট্যাটাস")}</p>
                          <Badge tone={selectedMember.approvalStatus === "APPROVED" ? "leaf" : selectedMember.approvalStatus === "REJECTED" ? "rose" : "gold"}>
                            {selectedMember.approvalStatus}
                          </Badge>
                        </div>
                        <div>
                          <p className="hint">{localeText(locale, "Created", "তৈরি")}</p>
                          <strong>{formatDate(selectedMember.createdAt, locale)}</strong>
                        </div>
                      </div>
                    </Modal>
                  )}
                </div>
              )}

              {/* Credit History */}
              {section === "credits" && (
                <div>
                  <div className="panel-header" style={{ marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontFamily: "var(--font-playfair, serif)" }}>
                        {localeText(locale, "Credit History", "ক্রেডিট ইতিহাস")}
                      </h2>
                      <p className="hint">
                        {localeText(locale, "Current balance", "বর্তমান ব্যালেন্স")}: {data?.wallet.balance ?? 0}
                      </p>
                    </div>
                  </div>

                  {ledger.length === 0 ? (
                    <div className="empty-state">
                      {localeText(locale, "No credit transactions yet.", "এখনও কোনো ক্রেডিট লেনদেন নেই।")}
                    </div>
                  ) : (
                    <div className="stack-list">
                      {ledger.map((entry) => (
                        <article key={entry.id} className="mini-card mini-card-horizontal">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
                            <div>
                              <Badge tone={entry.amount > 0 ? "leaf" : "rose"}>
                                {entry.entryType ?? (entry.amount > 0 ? "CREDIT" : "DEBIT")}
                              </Badge>
                              {entry.notes && (
                                <span className="hint" style={{ marginLeft: 8, fontSize: "0.8rem" }}>{entry.notes}</span>
                              )}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <strong style={{ color: entry.amount > 0 ? "var(--leaf)" : "var(--rose)" }}>
                                {entry.amount > 0 ? "+" : ""}{entry.amount}
                              </strong>
                              {entry.balanceAfter !== undefined && (
                                <div className="hint" style={{ fontSize: "0.75rem" }}>bal: {entry.balanceAfter}</div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Profile */}
              {section === "profile" && (
                <div>
                  <div className="panel-header" style={{ marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "var(--font-playfair, serif)" }}>
                      {localeText(locale, "My Profile", "আমার প্রোফাইল")}
                    </h2>
                  </div>

                  {/* Photo upload */}
                  <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                    {data?.profile.photoUrl ? (
                      <img
                        src={data.profile.photoUrl}
                        alt=""
                        style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--line)" }}
                      />
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--line)", display: "grid", placeItems: "center", fontSize: 24, color: "var(--muted)" }}>
                        {(data?.profile.displayName?.[0] ?? "G").toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                        {localeText(locale, "Profile photo", "প্রোফাইল ছবি")}
                      </p>
                      <label style={{ cursor: "pointer" }}>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: "none" }}
                          disabled={photoUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadPhoto(file);
                            e.target.value = "";
                          }}
                        />
                        <span className="button button-soft" style={{ fontSize: 13 }}>
                          {photoUploading
                            ? localeText(locale, "Uploading…", "আপলোড হচ্ছে…")
                            : localeText(locale, "Change photo", "ছবি পরিবর্তন করুন")}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="input-grid">
                    <label className="field">
                      <span>{localeText(locale, "Display name", "প্রদর্শন নাম")}</span>
                      <input
                        type="text"
                        value={profileForm.displayName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                      />
                    </label>
                    <label className="field">
                      <span>{localeText(locale, "Phone", "ফোন")}</span>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </label>
                    <label className="field">
                      <span>{localeText(locale, "Address", "ঠিকানা")}</span>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                      />
                    </label>
                    <label className="field">
                      <span>{localeText(locale, "Fee amount", "ফি পরিমাণ")}</span>
                      <input
                        type="number"
                        value={profileForm.feeAmount}
                        onChange={(e) => setProfileForm((p) => ({ ...p, feeAmount: e.target.value }))}
                      />
                    </label>
                    <label className="field">
                      <span>{localeText(locale, "Fee currency", "ফি মুদ্রা")}</span>
                      <select value={profileForm.feeCurrency} onChange={(e) => setProfileForm((p) => ({ ...p, feeCurrency: e.target.value }))}>
                        <option value="BDT">BDT</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </label>
                  </div>

                  <label className="field" style={{ marginTop: 12 }}>
                    <span>{localeText(locale, "Bio (English)", "পরিচয় (ইংরেজি)")}</span>
                    <textarea
                      rows={4}
                      value={profileForm.bioEn}
                      onChange={(e) => setProfileForm((p) => ({ ...p, bioEn: e.target.value }))}
                      style={{ resize: "vertical" }}
                    />
                  </label>

                  <label className="field" style={{ marginTop: 12 }}>
                    <span>{localeText(locale, "Bio (Bengali)", "পরিচয় (বাংলা)")}</span>
                    <textarea
                      rows={4}
                      value={profileForm.bioBn}
                      onChange={(e) => setProfileForm((p) => ({ ...p, bioBn: e.target.value }))}
                      style={{ resize: "vertical" }}
                    />
                  </label>

                  <div className="inline-actions" style={{ marginTop: 16 }}>
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={busyKey === "save-profile"}
                      onClick={() => void saveProfile()}
                    >
                      {busyKey === "save-profile"
                        ? localeText(locale, "Saving…", "সেভ হচ্ছে…")
                        : localeText(locale, "Save Profile", "প্রোফাইল সেভ করুন")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
