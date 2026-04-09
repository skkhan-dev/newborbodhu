"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { DashboardAssistant } from "@/components/dashboard-assistant";
import { SidebarNav, type SidebarSection } from "@/components/ui/sidebar-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  translateApprovalStatus,
  translateGateway,
  translatePaymentStatus,
  translateProfileStatus,
  translateMediaType,
} from "@/lib/translate";
import { localeText, translateGender, translateLookingFor } from "@/lib/public-page-locale";
import type { PublicLocale } from "@/lib/locale";
import type {
  AdminOverviewResponse,
  AdminProfileReviewItem,
  AdminProfileReviewResponse,
  AdminMemberSearchItem,
  AdminMemberSearchResponse,
  AuditLogItem,
  ManualPayment,
} from "@/lib/types/admin";

type AdminSection = "overview" | "reviews" | "photos" | "payments" | "members" | "audit";

type PendingPhoto = {
  id: string;
  mediaType: string;
  approvalStatus: string;
  privacyMode: string | null;
  storageUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  aiModerationResult: { flagged: boolean; adult: string; violence: string; racy: string } | null;
  memberProfile: {
    id: string;
    displayId: string;
    displayName: string;
    firstName: string;
  };
};

const sidebarSections: SidebarSection[] = [
  {
    label: "Admin",
    items: [
      { key: "overview", label: "Overview", icon: "◉" },
      { key: "assistant", label: "AI Chat", icon: "🎙️" },
      { key: "reviews", label: "Profile Reviews", icon: "⎘" },
      { key: "photos", label: "Photo Queue", icon: "⬡" },
      { key: "payments", label: "Manual Payments", icon: "₹" },
      { key: "members", label: "Member Search", icon: "☷" },
      { key: "audit", label: "Audit Log", icon: "⏱" },
    ],
  },
];

export function AdminDashboardPage({ locale = null }: { locale?: PublicLocale | null }) {
  const { accessToken, user, isReady } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState<AdminSection>("overview");
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Core data
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [reviews, setReviews] = useState<AdminProfileReviewItem[]>([]);
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Review actions
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [selectedProfile, setSelectedProfile] = useState<AdminProfileReviewItem | null>(null);
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);

  // Member search
  const [memberQuery, setMemberQuery] = useState("");
  const [memberStatus, setMemberStatus] = useState("");
  const [memberGender, setMemberGender] = useState("");
  const [memberResults, setMemberResults] = useState<AdminMemberSearchItem[]>([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberPage, setMemberPage] = useState(1);
  const [memberLoading, setMemberLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AdminMemberSearchItem | null>(null);
  const memberSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Photo queue
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Audit log
  const [auditItems, setAuditItems] = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditAction, setAuditAction] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [ov, rv, pm] = await Promise.all([
        apiRequest<AdminOverviewResponse>("/admin/overview", { token: accessToken }),
        apiRequest<AdminProfileReviewResponse>("/admin/profile-reviews?status=PENDING", { token: accessToken }),
        apiRequest<ManualPayment[]>("/admin/manual-payments", { token: accessToken }),
      ]);
      setOverview(ov);
      setReviews(rv.items);
      setPayments(pm);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    if (isReady && accessToken) void load();
  }, [isReady, accessToken, load]);

  // ── Member search ──────────────────────────────────────────────────────────

  const searchMembers = useCallback(async (q: string, status: string, gender: string, page: number) => {
    if (!accessToken) return;
    setMemberLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (gender) params.set("gender", gender);
      params.set("page", String(page));
      const res = await apiRequest<AdminMemberSearchResponse>(`/admin/members?${params}`, { token: accessToken });
      setMemberResults(res.items);
      setMemberTotal(res.total);
      setMemberPage(page);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setMemberLoading(false);
    }
  }, [accessToken, toast]);

  // Debounced search on query/filter change
  useEffect(() => {
    if (section !== "members") return;
    if (memberSearchTimer.current) clearTimeout(memberSearchTimer.current);
    memberSearchTimer.current = setTimeout(() => {
      void searchMembers(memberQuery, memberStatus, memberGender, 1);
    }, 350);
    return () => { if (memberSearchTimer.current) clearTimeout(memberSearchTimer.current); };
  }, [memberQuery, memberStatus, memberGender, section, searchMembers]);

  // Load members when tab opens
  useEffect(() => {
    if (section === "members" && memberResults.length === 0 && !memberLoading) {
      void searchMembers("", "", "", 1);
    }
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audit log ──────────────────────────────────────────────────────────────

  const loadAudit = useCallback(async (action: string, page: number) => {
    if (!accessToken) return;
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (action) params.set("action", action);
      params.set("page", String(page));
      const res = await apiRequest<{ total: number; page: number; pageSize: number; items: AuditLogItem[] }>(
        `/admin/audit-log?${params}`,
        { token: accessToken },
      );
      setAuditItems(res.items);
      setAuditTotal(res.total);
      setAuditPage(page);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setAuditLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    if (section === "audit") void loadAudit(auditAction, 1);
  }, [section, auditAction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Photo queue ────────────────────────────────────────────────────────────

  const loadPendingPhotos = useCallback(async () => {
    if (!accessToken) return;
    setPhotosLoading(true);
    try {
      const res = await apiRequest<PendingPhoto[]>("/admin/photos/pending", { token: accessToken });
      setPendingPhotos(res);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setPhotosLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    if (section === "photos") void loadPendingPhotos();
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  async function moderateQueuedPhoto(mediaId: string, action: "approve" | "reject") {
    if (!accessToken) return;
    setBusyId(mediaId);
    try {
      await apiRequest(`/admin/photos/${mediaId}/${action}`, {
        method: "POST",
        token: accessToken,
      });
      toast(action === "approve" ? "Photo approved." : "Photo rejected.", "success");
      setPendingPhotos((prev) => prev.filter((p) => p.id !== mediaId));
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  // ── Profile review actions ─────────────────────────────────────────────────

  async function reviewProfile(profileId: string, action: "approve" | "reject") {
    if (!accessToken) return;
    setBusyId(profileId);
    try {
      await apiRequest(`/admin/profile-reviews/${profileId}/${action}`, {
        method: "POST",
        token: accessToken,
        body: { notes: reviewNotes[profileId] || undefined },
      });
      toast(action === "approve" ? "Profile approved." : "Profile rejected.", "success");
      setReviewNotes((c) => ({ ...c, [profileId]: "" }));
      setSelectedProfile(null);
      void load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function moderatePhoto(mediaId: string, action: "approve" | "reject") {
    if (!accessToken || !selectedProfile) return;
    setBusyId(mediaId);
    try {
      await apiRequest(`/admin/photos/${mediaId}/${action}`, {
        method: "POST",
        token: accessToken,
      });
      toast(action === "approve" ? "Photo approved." : "Photo rejected.", "success");
      // Refresh review list to get updated photo status
      const rv = await apiRequest<AdminProfileReviewResponse>("/admin/profile-reviews?status=PENDING", { token: accessToken });
      setReviews(rv.items);
      // Update the selected profile's media in-place
      const updated = rv.items.find((r) => r.id === selectedProfile.id);
      if (updated) setSelectedProfile(updated);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function suggestRejectionReason(profileId: string) {
    if (!accessToken) return;
    setSuggestingFor(profileId);
    try {
      const res = await apiRequest<{ suggestion: string }>(
        `/admin/profile-reviews/${profileId}/suggest-rejection`,
        { method: "POST", token: accessToken },
      );
      setReviewNotes((c) => ({ ...c, [profileId]: res.suggestion }));
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setSuggestingFor(null);
    }
  }

  async function reviewPayment(paymentId: string, action: "approve" | "reject") {
    if (!accessToken) return;
    setBusyId(paymentId);
    try {
      await apiRequest(`/admin/manual-payments/${paymentId}/${action}`, {
        method: "POST",
        token: accessToken,
        body: { notes: `Reviewed from admin panel: ${action}.` },
      });
      toast(action === "approve" ? "Payment approved." : "Payment rejected.", "success");
      void load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function setMemberUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
    if (!accessToken) return;
    setBusyId(userId);
    try {
      await apiRequest(`/admin/members/${userId}/status`, {
        method: "PATCH",
        token: accessToken,
        body: { status },
      });
      toast(status === "SUSPENDED" ? "User suspended." : "User unsuspended.", "success");
      setSelectedMember(null);
      void searchMembers(memberQuery, memberStatus, memberGender, memberPage);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  if (!isReady || !user) {
    return (
      <main className="page-shell">
        <div className="empty-state">Loading admin panel...</div>
      </main>
    );
  }

  const isAdmin = user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN");
  if (!isAdmin) {
    return (
      <main className="page-shell">
        <div className="error-banner">You do not have admin access.</div>
      </main>
    );
  }

  // ── Column definitions ─────────────────────────────────────────────────────

  const reviewColumns: DataTableColumn<AdminProfileReviewItem>[] = [
    { key: "displayId", label: "ID", width: "100px" },
    { key: "displayName", label: "Name", sortable: true },
    { key: "gender", label: "Gender", render: (row) => translateGender(row.gender, locale ?? "en") },
    {
      key: "approvalStatus",
      label: "Status",
      render: (row) => <Badge tone="gold">{translateApprovalStatus(row.approvalStatus, locale)}</Badge>,
    },
    {
      key: "qualityScore",
      label: "Quality",
      sortable: true,
      render: (row) => (
        <Badge tone={row.qualityScore >= 70 ? "leaf" : row.qualityScore >= 40 ? "gold" : "rose"}>
          {row.qualityScore}
        </Badge>
      ),
    },
    {
      key: "possibleDuplicateOf",
      label: "Flags",
      render: (row) => (
        <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {row.possibleDuplicateOf && <Badge tone="rose">⚠ Dupe</Badge>}
          {row.media.some((m) => m.aiModerationResult?.flagged) && <Badge tone="rose">⚠ AI</Badge>}
        </span>
      ),
    },
    { key: "createdAt", label: "Submitted", sortable: true, render: (row) => formatDate(row.createdAt, locale) },
  ];

  const paymentColumns: DataTableColumn<ManualPayment>[] = [
    { key: "user", label: "User", render: (row) => (row as ManualPayment).user.email },
    { key: "gateway", label: "Gateway", render: (row) => translateGateway((row as ManualPayment).gateway, locale) },
    { key: "finalAmount", label: "Amount", render: (row) => `${(row as ManualPayment).finalAmount} ${(row as ManualPayment).currency}` },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge tone="gold">{translatePaymentStatus((row as ManualPayment).status, locale)}</Badge>,
    },
    { key: "createdAt", label: "Created", render: (row) => formatDate((row as ManualPayment).createdAt, locale) },
    {
      key: "actions",
      label: "",
      width: "180px",
      render: (row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="button button-primary" style={{ fontSize: 12, padding: "6px 12px" }}
            disabled={busyId === (row as ManualPayment).id}
            onClick={(e) => { e.stopPropagation(); void reviewPayment((row as ManualPayment).id, "approve"); }}>
            Approve
          </button>
          <button type="button" className="button button-soft" style={{ fontSize: 12, padding: "6px 12px" }}
            disabled={busyId === (row as ManualPayment).id}
            onClick={(e) => { e.stopPropagation(); void reviewPayment((row as ManualPayment).id, "reject"); }}>
            Reject
          </button>
        </div>
      ),
    },
  ];

  const memberColumns: DataTableColumn<AdminMemberSearchItem>[] = [
    {
      key: "primaryPhotoUrl",
      label: "",
      width: "48px",
      render: (row) => (
        row.primaryPhotoUrl
          ? <img src={row.primaryPhotoUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
          : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--line)", display: "grid", placeItems: "center", fontSize: 13, color: "var(--muted)" }}>
              {(row.firstName?.[0] ?? "?").toUpperCase()}
            </div>
      ),
    },
    { key: "displayId", label: "ID", width: "100px" },
    { key: "displayName", label: "Name", sortable: true },
    { key: "gender", label: "Gender", render: (row) => translateGender(row.gender, locale ?? "en") },
    {
      key: "status",
      label: "Profile",
      render: (row) => <Badge tone={row.status === "ACTIVE" ? "leaf" : "rose"}>{row.status}</Badge>,
    },
    {
      key: "user",
      label: "Account",
      render: (row) => (
        <Badge tone={row.user.status === "SUSPENDED" ? "rose" : "muted"}>{row.user.status}</Badge>
      ),
    },
    { key: "profileCompletionPct", label: "Complete", render: (row) => `${row.profileCompletionPct}%` },
    {
      key: "phone",
      label: "Phone",
      render: (row) => row.phone
        ? <a href={`tel:${row.phone}`} style={{ color: "var(--rose)", fontSize: "0.82rem" }}>{row.phone}</a>
        : <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>—</span>,
    },
    { key: "createdAt", label: "Joined", sortable: true, render: (row) => formatDate(row.createdAt, locale) },
  ];

  const auditColumns: DataTableColumn<AuditLogItem>[] = [
    {
      key: "createdAt",
      label: "Time",
      width: "160px",
      render: (row) => formatDateTime(row.createdAt, locale),
    },
    {
      key: "actorUser",
      label: "Admin",
      render: (row) => row.actorUser?.email ?? row.actorUserId ?? "—",
    },
    { key: "action", label: "Action" },
    { key: "targetType", label: "Target type" },
    { key: "targetId", label: "Target ID", render: (row) => row.targetId ?? "—" },
    { key: "description", label: "Notes", render: (row) => row.description ?? "—" },
  ];

  return (
    <main className="page-shell" style={{ padding: 0 }}>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div style={{ marginBottom: 16 }}>
            <p className="section-kicker" style={{ padding: "0 12px" }}>Admin Panel</p>
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
              setSection(key as AdminSection);
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
          {loading && section !== "members" && section !== "audit" ? (
            <Skeleton variant="card" count={3} />
          ) : (
            <>
              {/* ── Overview ─────────────────────────────────────────── */}
              {section === "overview" && overview && (
                <div>
                  <h2 style={{ fontFamily: "var(--font-playfair, serif)", marginBottom: 16 }}>Admin Overview</h2>
                  <div className="dashboard-stats" style={{ marginBottom: 24 }}>
                    <StatCard value={overview.profiles.active} label="Active profiles" tone="leaf" />
                    <StatCard value={overview.profiles.pending} label="Pending review" tone="gold" />
                    <StatCard value={overview.profiles.rejected} label="Rejected" tone="rose" />
                    <StatCard value={overview.payments.pendingManualReview} label="Payment reviews" tone="indigo" />
                  </div>
                  <div className="dashboard-stats">
                    <StatCard value={overview.profiles.cancelled} label="Cancelled" tone="default" />
                    <StatCard value={overview.payments.collectedAmount} label="Collected (BDT)" tone="gold" />
                    {overview.ghotoks && (
                      <>
                        <StatCard value={overview.ghotoks.active} label="Active ghotoks" tone="teal" />
                        <StatCard value={overview.ghotoks.pending} label="Ghotoks pending" tone="gold" />
                      </>
                    )}
                    {overview.vendors && (
                      <>
                        <StatCard value={overview.vendors.active} label="Active vendors" tone="teal" />
                        <StatCard value={overview.vendors.pending} label="Vendors pending" tone="gold" />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Profile Reviews ───────────────────────────────────── */}
              {section === "reviews" && (
                <div>
                  <div className="panel-header" style={{ marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontFamily: "var(--font-playfair, serif)" }}>Profile Review Queue</h2>
                      <p className="hint">{reviews.length} profiles pending review</p>
                    </div>
                    <Badge tone="gold">{reviews.length} pending</Badge>
                  </div>

                  <DataTable
                    columns={reviewColumns}
                    rows={reviews}
                    onRowClick={(row) => setSelectedProfile(row)}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No pending profile reviews."
                  />

                  {selectedProfile && (
                    <Modal
                      open={!!selectedProfile}
                      onClose={() => setSelectedProfile(null)}
                      title={`Review: ${selectedProfile.displayName}`}
                      size="lg"
                      footer={
                        <div className="modal-actions">
                          <button type="button" className="button button-soft"
                            onClick={() => void reviewProfile(selectedProfile.id, "reject")}
                            disabled={busyId === selectedProfile.id}>
                            {busyId === selectedProfile.id ? "Processing..." : "Reject Profile"}
                          </button>
                          <button type="button" className="button button-primary"
                            onClick={() => void reviewProfile(selectedProfile.id, "approve")}
                            disabled={busyId === selectedProfile.id}>
                            {busyId === selectedProfile.id ? "Processing..." : "Approve Profile"}
                          </button>
                        </div>
                      }
                    >
                      <div style={{ display: "grid", gap: 16 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Badge tone="teal">{translateProfileStatus(selectedProfile.status, locale)}</Badge>
                          <Badge tone="gold">{translateApprovalStatus(selectedProfile.approvalStatus, locale)}</Badge>
                          <Badge tone="muted">{selectedProfile.displayId}</Badge>
                          <Badge tone="muted">{selectedProfile.profileCompletionPct}% complete</Badge>
                          <Badge tone={selectedProfile.qualityScore >= 70 ? "leaf" : selectedProfile.qualityScore >= 40 ? "gold" : "rose"}>
                            Quality: {selectedProfile.qualityScore}
                          </Badge>
                        </div>

                        {/* Duplicate warning */}
                        {selectedProfile.possibleDuplicateOf && (
                          <div style={{ background: "var(--rose-soft)", border: "1px solid var(--rose, #e8c5c5)", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
                            ⚠️ Possible duplicate profile detected:{" "}
                            <a href={`/profiles/${selectedProfile.possibleDuplicateOf}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--rose-ink, #8b1a30)", fontWeight: 600 }}>
                              {selectedProfile.possibleDuplicateOf}
                            </a>
                            {" "}— same name and date of birth.
                          </div>
                        )}

                        <div className="input-grid">
                          <div>
                            <p className="hint">Gender</p>
                            <strong>{translateGender(selectedProfile.gender, locale ?? "en")}</strong>
                          </div>
                          <div>
                            <p className="hint">Looking for</p>
                            <strong>{translateLookingFor(selectedProfile.lookingFor, locale ?? "en")}</strong>
                          </div>
                          <div>
                            <p className="hint">Religion</p>
                            <strong>{selectedProfile.religion ?? "—"}</strong>
                          </div>
                          <div>
                            <p className="hint">Location</p>
                            <strong>
                              {[selectedProfile.currentCity, selectedProfile.currentCountryCode].filter(Boolean).join(", ") || "—"}
                            </strong>
                          </div>
                          <div>
                            <p className="hint">Education</p>
                            <strong>{selectedProfile.educationLevel ?? "—"}</strong>
                          </div>
                          <div>
                            <p className="hint">Profession</p>
                            <strong>{selectedProfile.profession ?? "—"}</strong>
                          </div>
                        </div>

                        <div>
                          <p className="hint">About</p>
                          <p style={{ lineHeight: 1.6 }}>{selectedProfile.aboutMe ?? "No about section provided."}</p>
                        </div>

                        <div>
                          <p className="hint">Email</p>
                          <strong>{selectedProfile.user.email}</strong>
                        </div>

                        {selectedProfile.phone && (
                          <div>
                            <p className="hint">Phone <span style={{ color: "var(--rose)", fontSize: "0.75rem" }}>(for verification calls)</span></p>
                            <strong><a href={`tel:${selectedProfile.phone}`} style={{ color: "var(--rose)" }}>{selectedProfile.phone}</a></strong>
                          </div>
                        )}

                        {selectedProfile.media.length > 0 && (
                          <div>
                            <p className="hint" style={{ marginBottom: 8 }}>
                              Photos ({selectedProfile.media.length}) — click to approve or reject individually
                            </p>
                            <div className="card-grid">
                              {selectedProfile.media.map((m) => (
                                <div key={m.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
                                  {m.thumbnailUrl || m.storageUrl ? (
                                    <img
                                      src={m.thumbnailUrl ?? m.storageUrl ?? undefined}
                                      alt={translateMediaType(m.mediaType, locale)}
                                      style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                                    />
                                  ) : (
                                    <div style={{ height: 120, display: "grid", placeItems: "center", background: "var(--rose-soft)", color: "var(--muted)", fontSize: 13 }}>
                                      {translateMediaType(m.mediaType, locale)}
                                    </div>
                                  )}
                                  <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                      <Badge tone={m.approvalStatus === "APPROVED" ? "leaf" : m.approvalStatus === "REJECTED" ? "rose" : "gold"} >
                                        {translateApprovalStatus(m.approvalStatus, locale)}
                                      </Badge>
                                      {m.aiModerationResult?.flagged && (
                                        <Badge tone="rose">⚠ AI flagged</Badge>
                                      )}
                                    </div>
                                    <div style={{ display: "flex", gap: 4 }}>
                                      {m.approvalStatus !== "APPROVED" && (
                                        <button type="button" className="button button-primary"
                                          style={{ fontSize: 11, padding: "3px 8px" }}
                                          disabled={busyId === m.id}
                                          onClick={() => void moderatePhoto(m.id, "approve")}>
                                          ✓
                                        </button>
                                      )}
                                      {m.approvalStatus !== "REJECTED" && (
                                        <button type="button" className="button button-soft"
                                          style={{ fontSize: 11, padding: "3px 8px" }}
                                          disabled={busyId === m.id}
                                          onClick={() => void moderatePhoto(m.id, "reject")}>
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="field">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>Review notes</span>
                            <button
                              type="button"
                              className="button button-soft"
                              style={{ fontSize: 12, padding: "4px 10px" }}
                              disabled={suggestingFor === selectedProfile.id}
                              onClick={() => void suggestRejectionReason(selectedProfile.id)}
                            >
                              {suggestingFor === selectedProfile.id ? "Thinking…" : "✨ Suggest reason"}
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            value={reviewNotes[selectedProfile.id] ?? ""}
                            onChange={(e) => setReviewNotes((c) => ({ ...c, [selectedProfile.id]: e.target.value }))}
                            placeholder="Optional notes for approval or rejection reason."
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>
                    </Modal>
                  )}
                </div>
              )}

              {/* ── Photo Queue ───────────────────────────────────────── */}
              {section === "photos" && (
                <div>
                  <div className="panel-header" style={{ marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontFamily: "var(--font-playfair, serif)" }}>Photo Queue</h2>
                      <p className="hint">{pendingPhotos.length} photos pending review</p>
                    </div>
                    <Badge tone="gold">{pendingPhotos.length} pending</Badge>
                  </div>

                  {photosLoading ? (
                    <Skeleton variant="card" count={3} />
                  ) : pendingPhotos.length === 0 ? (
                    <div className="empty-state">No photos pending review.</div>
                  ) : (
                    <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                      {pendingPhotos.map((photo) => (
                        <div key={photo.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface)" }}>
                          {photo.thumbnailUrl || photo.storageUrl ? (
                            <img
                              src={photo.thumbnailUrl ?? photo.storageUrl ?? undefined}
                              alt=""
                              style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                            />
                          ) : (
                            <div style={{ height: 160, display: "grid", placeItems: "center", background: "var(--line)", color: "var(--muted)", fontSize: 13 }}>
                              No preview
                            </div>
                          )}
                          <div style={{ padding: "10px 12px", display: "grid", gap: 8 }}>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              <Badge tone="muted">{photo.mediaType}</Badge>
                              {photo.aiModerationResult?.flagged && (
                                <Badge tone="rose">⚠ AI flagged</Badge>
                              )}
                            </div>
                            <div>
                              <p className="hint" style={{ margin: 0, fontSize: 11 }}>Member</p>
                              <strong style={{ fontSize: 13 }}>{photo.memberProfile.displayName || photo.memberProfile.firstName}</strong>
                              <p className="hint" style={{ margin: 0, fontSize: 11 }}>{photo.memberProfile.displayId}</p>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="button button-primary"
                                style={{ flex: 1, fontSize: 12, padding: "6px 8px" }}
                                disabled={busyId === photo.id}
                                onClick={() => void moderateQueuedPhoto(photo.id, "approve")}
                              >
                                ✓ Approve
                              </button>
                              <button
                                type="button"
                                className="button button-soft"
                                style={{ flex: 1, fontSize: 12, padding: "6px 8px" }}
                                disabled={busyId === photo.id}
                                onClick={() => void moderateQueuedPhoto(photo.id, "reject")}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Manual Payments ───────────────────────────────────── */}
              {section === "payments" && (
                <div>
                  <div className="panel-header" style={{ marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "var(--font-playfair, serif)" }}>Manual Payment Reviews</h2>
                    <Badge tone="gold">{payments.length} pending</Badge>
                  </div>
                  <DataTable
                    columns={paymentColumns}
                    rows={payments}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No manual payments waiting for review."
                  />
                </div>
              )}

              {/* ── Member Search ─────────────────────────────────────── */}
              {section === "members" && (
                <div>
                  <div className="panel-header" style={{ marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "var(--font-playfair, serif)" }}>Member Search</h2>
                    {memberTotal > 0 && <Badge tone="muted">{memberTotal} results</Badge>}
                  </div>

                  {/* Filters */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    <SearchInput
                      value={memberQuery}
                      onChange={setMemberQuery}
                      placeholder="Search by name, email, display ID…"
                    />
                    <select
                      value={memberStatus}
                      onChange={(e) => setMemberStatus(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 14, background: "var(--surface)", color: "var(--ink)" }}
                    >
                      <option value="">All statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING_REVIEW">Pending review</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                    <select
                      value={memberGender}
                      onChange={(e) => setMemberGender(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 14, background: "var(--surface)", color: "var(--ink)" }}
                    >
                      <option value="">All genders</option>
                      <option value="MAN">Man</option>
                      <option value="WOMAN">Woman</option>
                    </select>
                  </div>

                  {memberLoading ? (
                    <Skeleton variant="card" count={3} />
                  ) : (
                    <>
                      <DataTable
                        columns={memberColumns}
                        rows={memberResults}
                        onRowClick={(row) => setSelectedMember(row)}
                        keyExtractor={(row) => row.id}
                        emptyMessage="No members found."
                      />
                      {memberTotal > 20 && (
                        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", justifyContent: "flex-end" }}>
                          <button type="button" className="button button-soft" style={{ fontSize: 13, padding: "6px 12px" }}
                            disabled={memberPage <= 1}
                            onClick={() => void searchMembers(memberQuery, memberStatus, memberGender, memberPage - 1)}>
                            ← Prev
                          </button>
                          <span className="hint">Page {memberPage} of {Math.ceil(memberTotal / 20)}</span>
                          <button type="button" className="button button-soft" style={{ fontSize: 13, padding: "6px 12px" }}
                            disabled={memberPage * 20 >= memberTotal}
                            onClick={() => void searchMembers(memberQuery, memberStatus, memberGender, memberPage + 1)}>
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Member detail modal */}
                  {selectedMember && (
                    <Modal
                      open={!!selectedMember}
                      onClose={() => setSelectedMember(null)}
                      title={`Member: ${selectedMember.displayName || selectedMember.displayId}`}
                      size="lg"
                      footer={
                        <div className="modal-actions">
                          {selectedMember.user.status === "SUSPENDED" ? (
                            <button type="button" className="button button-primary"
                              disabled={busyId === selectedMember.user.id}
                              onClick={() => void setMemberUserStatus(selectedMember.user.id, "ACTIVE")}>
                              {busyId === selectedMember.user.id ? "Processing..." : "Unsuspend Account"}
                            </button>
                          ) : (
                            <button type="button" className="button button-soft"
                              disabled={busyId === selectedMember.user.id}
                              onClick={() => void setMemberUserStatus(selectedMember.user.id, "SUSPENDED")}>
                              {busyId === selectedMember.user.id ? "Processing..." : "Suspend Account"}
                            </button>
                          )}
                          <a
                            href={`/profiles/${selectedMember.displayId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button button-primary"
                          >
                            View Profile ↗
                          </a>
                        </div>
                      }
                    >
                      <div style={{ display: "grid", gap: 16 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          {selectedMember.primaryPhotoUrl ? (
                            <img src={selectedMember.primaryPhotoUrl} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--line)", display: "grid", placeItems: "center", fontSize: 22, color: "var(--muted)" }}>
                              {(selectedMember.firstName?.[0] ?? "?").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <strong style={{ fontSize: "1.1rem" }}>{selectedMember.displayName || `${selectedMember.firstName} ${selectedMember.lastName ?? ""}`.trim()}</strong>
                            <p className="hint" style={{ margin: 0 }}>{selectedMember.displayId}</p>
                          </div>
                        </div>

                        <div className="input-grid">
                          <div>
                            <p className="hint">Email</p>
                            <strong>{selectedMember.user.email}</strong>
                          </div>
                          <div>
                            <p className="hint">Account status</p>
                            <Badge tone={selectedMember.user.status === "SUSPENDED" ? "rose" : "leaf"}>
                              {selectedMember.user.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="hint">Profile status</p>
                            <Badge tone={selectedMember.status === "ACTIVE" ? "leaf" : "rose"}>
                              {selectedMember.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="hint">Approval status</p>
                            <Badge tone="gold">{selectedMember.approvalStatus}</Badge>
                          </div>
                          <div>
                            <p className="hint">Gender</p>
                            <strong>{translateGender(selectedMember.gender, locale ?? "en")}</strong>
                          </div>
                          <div>
                            <p className="hint">Location</p>
                            <strong>
                              {[selectedMember.currentCity, selectedMember.currentCountryCode].filter(Boolean).join(", ") || "—"}
                            </strong>
                          </div>
                          <div>
                            <p className="hint">Profile completion</p>
                            <strong>{selectedMember.profileCompletionPct}%</strong>
                          </div>
                          <div>
                            <p className="hint">Joined</p>
                            <strong>{formatDate(selectedMember.createdAt, locale)}</strong>
                          </div>
                        </div>
                      </div>
                    </Modal>
                  )}
                </div>
              )}

              {/* ── Audit Log ─────────────────────────────────────────── */}
              {section === "audit" && (
                <div>
                  <div className="panel-header" style={{ marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontFamily: "var(--font-playfair, serif)" }}>Audit Log</h2>
                      <p className="hint">{auditTotal} total entries</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <SearchInput
                      value={auditAction}
                      onChange={(v) => { setAuditAction(v); setAuditPage(1); }}
                      placeholder="Filter by action (e.g. PROFILE_APPROVED)"
                    />
                  </div>

                  {auditLoading ? (
                    <Skeleton variant="card" count={3} />
                  ) : (
                    <>
                      <DataTable
                        columns={auditColumns}
                        rows={auditItems}
                        keyExtractor={(row) => row.id}
                        emptyMessage="No audit log entries found."
                      />
                      {auditTotal > 30 && (
                        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", justifyContent: "flex-end" }}>
                          <button type="button" className="button button-soft" style={{ fontSize: 13, padding: "6px 12px" }}
                            disabled={auditPage <= 1}
                            onClick={() => void loadAudit(auditAction, auditPage - 1)}>
                            ← Prev
                          </button>
                          <span className="hint">Page {auditPage} of {Math.ceil(auditTotal / 30)}</span>
                          <button type="button" className="button button-soft" style={{ fontSize: 13, padding: "6px 12px" }}
                            disabled={auditPage * 30 >= auditTotal}
                            onClick={() => void loadAudit(auditAction, auditPage + 1)}>
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
