"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { useRouter } from "next/navigation";

type GhotokDashboard = {
  walletBalance: number;
  managedMemberCount: number;
  activeImpersonation: {
    id: string;
    memberProfile: { displayId: string; publicName: string };
  } | null;
};

type GhotokMember = {
  id: string;
  displayId: string;
  publicName: string;
  approvalStatus: string;
  createdAt: string;
};

type AddMemberForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: string;
  lookingFor: string;
};

const emptyForm: AddMemberForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  gender: "MAN",
  lookingFor: "WOMAN",
};

export default function GhotokPortalPage() {
  const auth = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<GhotokDashboard | null>(null);
  const [members, setMembers] = useState<GhotokMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddMemberForm>(emptyForm);
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const [impersonateError, setImpersonateError] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isReady) return;
    if (!auth.user?.roles.includes("GHOTOK")) {
      router.push("/login");
      return;
    }
    void loadData();
  }, [auth.isReady, auth.user]);

  async function loadData() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [dashRes, membersRes] = await Promise.all([
        apiRequest<GhotokDashboard>("/ghotok/me/dashboard", {
          token: auth.accessToken ?? undefined,
        }),
        apiRequest<{ members: GhotokMember[] }>("/ghotok/me/members", {
          token: auth.accessToken ?? undefined,
        }),
      ]);
      setDashboard(dashRes);
      setMembers(membersRes.members ?? []);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);
    try {
      await apiRequest("/ghotok/me/members", {
        method: "POST",
        token: auth.accessToken ?? undefined,
        body: addForm,
      });
      setAddForm(emptyForm);
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setAddLoading(false);
    }
  }

  async function handleImpersonate(memberProfileId: string) {
    setImpersonateError(null);
    setImpersonatingId(memberProfileId);
    try {
      await apiRequest(`/ghotok/me/impersonation/${memberProfileId}/start`, {
        method: "POST",
        token: auth.accessToken ?? undefined,
      });
      await loadData();
    } catch (err) {
      setImpersonateError(getErrorMessage(err));
    } finally {
      setImpersonatingId(null);
    }
  }

  if (!auth.isReady || isLoading) {
    return (
      <div className="page-shell">
        <p>Loading Ghotok portal…</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="section-block">
        <p className="section-kicker">Ghotok Portal</p>
        <h1>Your Dashboard</h1>

        {loadError && <div className="error-banner">{loadError}</div>}

        {dashboard && (
          <div className="dashboard-panel">
            <div className="dashboard-stats">
              <div className="stat-card">
                <span className="stat-card__label">Credit Balance</span>
                <span className="stat-card__value">{dashboard.walletBalance}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Managed Members</span>
                <span className="stat-card__value">{dashboard.managedMemberCount}</span>
              </div>
              {dashboard.activeImpersonation && (
                <div className="stat-card">
                  <span className="stat-card__label">Active Impersonation</span>
                  <span className="stat-card__value">
                    {dashboard.activeImpersonation.memberProfile.publicName} (
                    {dashboard.activeImpersonation.memberProfile.displayId})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="section-block">
        <div className="inline-actions">
          <p className="section-kicker">Managed Members</p>
          <button
            className="button button-primary"
            onClick={() => setShowAddForm((v) => !v)}
            type="button"
          >
            {showAddForm ? "Cancel" : "Add Member"}
          </button>
        </div>

        {showAddForm && (
          <form className="auth-form" onSubmit={(e) => void handleAddMember(e)}>
            <p className="section-kicker">New Member Details</p>
            {addError && <div className="error-banner">{addError}</div>}

            <div className="field">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                required
                value={addForm.firstName}
                onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                required
                value={addForm.lastName}
                onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={addForm.gender}
                onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="MAN">Man</option>
                <option value="WOMAN">Woman</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="lookingFor">Looking For</label>
              <select
                id="lookingFor"
                value={addForm.lookingFor}
                onChange={(e) => setAddForm((f) => ({ ...f, lookingFor: e.target.value }))}
              >
                <option value="MAN">Man</option>
                <option value="WOMAN">Woman</option>
              </select>
            </div>

            <div className="inline-actions">
              <button className="button button-primary" type="submit" disabled={addLoading}>
                {addLoading ? "Creating…" : "Create Member"}
              </button>
              <button
                className="button button-soft"
                type="button"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {impersonateError && <div className="error-banner">{impersonateError}</div>}

        {members.length === 0 ? (
          <p>No managed members yet.</p>
        ) : (
          <ul className="dashboard-panel">
            {members.map((member) => (
              <li key={member.id} className="stat-card">
                <div>
                  <strong>{member.publicName}</strong>
                  <span> — {member.displayId}</span>
                  <span> · {member.approvalStatus}</span>
                </div>
                <div className="inline-actions">
                  <button
                    className="button button-soft"
                    type="button"
                    disabled={impersonatingId === member.id}
                    onClick={() => void handleImpersonate(member.id)}
                  >
                    {impersonatingId === member.id ? "Starting…" : "Impersonate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
