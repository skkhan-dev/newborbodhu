"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { apiRequest, getErrorMessage } from "@/lib/api";
import {
  educationOptions,
  fullCountryList,
  heightOptions,
  professionOptions,
} from "@/lib/form-options";

type Step = 1 | 2 | 3;

type AboutForm = {
  birthDate: string;
  religion: string;
  maritalStatus: string;
  heightCm: string;
  aboutMe: string;
};

type CareerForm = {
  educationLevel: string;
  profession: string;
  currentCountryCode: string;
  currentCity: string;
  homeCountryCode: string;
  homeDistrict: string;
};

type PreferenceForm = {
  ageMin: string;
  ageMax: string;
  aboutPartner: string;
};

const religions = [
  "Islam", "Hinduism", "Christianity", "Buddhism", "Other",
];

const maritalStatuses = [
  { value: "NEVER_MARRIED", label: "Never Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "SEPARATED", label: "Separated" },
];

const bdDistricts = [
  "Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogura","Brahmanbaria",
  "Chandpur","Chattogram","Chuadanga","Cox's Bazar","Cumilla","Dhaka",
  "Dinajpur","Faridpur","Feni","Gaibandha","Gazipur","Gopalganj","Habiganj",
  "Jamalpur","Jashore","Jhalokati","Jhenaidah","Joypurhat","Khagrachari",
  "Khulna","Kishoreganj","Kurigram","Kushtia","Lakshmipur","Lalmonirhat",
  "Madaripur","Magura","Manikganj","Meherpur","Moulvibazar","Munshiganj",
  "Mymensingh","Naogaon","Narail","Narayanganj","Narsingdi","Natore",
  "Netrokona","Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali",
  "Pirojpur","Rajbari","Rajshahi","Rangamati","Rangpur","Satkhira",
  "Shariatpur","Sherpur","Sirajganj","Sunamganj","Sylhet","Tangail",
  "Thakurgaon",
];

const STEP_LABELS: Record<Step, string> = {
  1: "About You",
  2: "Career & Location",
  3: "Partner Preferences",
};

export function DashboardSetupWizard() {
  const router = useRouter();
  const { isReady, user, accessToken } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const [aboutForm, setAboutForm] = useState<AboutForm>({
    birthDate: "", religion: "", maritalStatus: "", heightCm: "", aboutMe: "",
  });
  const [careerForm, setCareerForm] = useState<CareerForm>({
    educationLevel: "", profession: "", currentCountryCode: "BD",
    currentCity: "", homeCountryCode: "BD", homeDistrict: "",
  });
  const [prefForm, setPrefForm] = useState<PreferenceForm>({
    ageMin: "", ageMax: "", aboutPartner: "",
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  if (!isReady) return null;
  if (!user) return null;

  function ua(key: keyof AboutForm, value: string) {
    setAboutForm((f) => ({ ...f, [key]: value }));
  }
  function uc(key: keyof CareerForm, value: string) {
    setCareerForm((f) => ({ ...f, [key]: value }));
  }
  function up(key: keyof PreferenceForm, value: string) {
    setPrefForm((f) => ({ ...f, [key]: value }));
  }

  async function saveAbout() {
    setError(null);
    setIsBusy(true);
    try {
      await apiRequest("/member-profiles/me", {
        method: "PATCH",
        token: accessToken!,
        body: {
          ...(aboutForm.birthDate ? { birthDate: aboutForm.birthDate } : {}),
          ...(aboutForm.religion ? { religion: aboutForm.religion } : {}),
          ...(aboutForm.maritalStatus ? { maritalStatus: aboutForm.maritalStatus } : {}),
          ...(aboutForm.heightCm ? { heightCm: parseInt(aboutForm.heightCm, 10) } : {}),
          ...(aboutForm.aboutMe ? { aboutMe: aboutForm.aboutMe } : {}),
        },
      });
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function saveCareer() {
    setError(null);
    setIsBusy(true);
    try {
      await apiRequest("/member-profiles/me", {
        method: "PATCH",
        token: accessToken!,
        body: {
          ...(careerForm.educationLevel ? { educationLevel: careerForm.educationLevel } : {}),
          ...(careerForm.profession ? { profession: careerForm.profession } : {}),
          ...(careerForm.currentCountryCode ? { currentCountryCode: careerForm.currentCountryCode } : {}),
          ...(careerForm.currentCity ? { currentCity: careerForm.currentCity } : {}),
          ...(careerForm.homeCountryCode ? { homeCountryCode: careerForm.homeCountryCode } : {}),
          ...(careerForm.homeDistrict ? { homeDistrict: careerForm.homeDistrict } : {}),
        },
      });
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function savePreferences() {
    setError(null);
    setIsBusy(true);
    try {
      await apiRequest("/member-profiles/me/preferences", {
        method: "PATCH",
        token: accessToken!,
        body: {
          ...(prefForm.ageMin ? { ageMin: parseInt(prefForm.ageMin, 10) } : {}),
          ...(prefForm.ageMax ? { ageMax: parseInt(prefForm.ageMax, 10) } : {}),
          ...(prefForm.aboutPartner ? { aboutPartner: prefForm.aboutPartner } : {}),
        },
      });
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  function skip() {
    router.push("/dashboard");
  }

  const progressPct = ((step - 1) / 3) * 100;

  return (
    <div className="page-shell">
      <div className="hero-card" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p className="section-kicker">Complete your profile — Step {step} of 3</p>
          <h2 style={{ marginBottom: 4 }}>{STEP_LABELS[step]}</h2>
          <p className="hint">
            {step === 1 && "Add personal details so matches can find you."}
            {step === 2 && "Your career and location help narrow down compatible matches."}
            {step === 3 && "Tell us what you're looking for in a partner."}
          </p>
          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 4, background: "var(--line)", marginTop: 12, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, borderRadius: 4, background: "var(--rose)", transition: "width 0.4s ease" }} />
          </div>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

        {/* Step 1: About You */}
        {step === 1 && (
          <div style={{ display: "grid", gap: 14 }}>
            <label className="field">
              <span>Date of birth</span>
              <input
                type="date"
                value={aboutForm.birthDate}
                onChange={(e) => ua("birthDate", e.target.value)}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="field">
                <span>Religion</span>
                <select value={aboutForm.religion} onChange={(e) => ua("religion", e.target.value)}>
                  <option value="">— select —</option>
                  {religions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Marital status</span>
                <select value={aboutForm.maritalStatus} onChange={(e) => ua("maritalStatus", e.target.value)}>
                  <option value="">— select —</option>
                  {maritalStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Height</span>
              <select value={aboutForm.heightCm} onChange={(e) => ua("heightCm", e.target.value)}>
                <option value="">— select —</option>
                {heightOptions.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </label>

            <label className="field">
              <span>About me</span>
              <textarea
                value={aboutForm.aboutMe}
                onChange={(e) => ua("aboutMe", e.target.value)}
                rows={4}
                placeholder="Write 2–3 sentences about yourself, your personality, and what you're looking for…"
                style={{ resize: "vertical" }}
              />
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                {aboutForm.aboutMe.length}/500 chars — longer bios get 3× more interest
              </span>
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="button button-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={saveAbout}
                disabled={isBusy}
              >
                {isBusy ? "Saving…" : "Save & Continue"}
              </button>
              <button type="button" className="button button-soft" onClick={skip} disabled={isBusy}>
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Career & Location */}
        {step === 2 && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="field">
                <span>Education level</span>
                <select value={careerForm.educationLevel} onChange={(e) => uc("educationLevel", e.target.value)}>
                  <option value="">— select —</option>
                  {educationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Profession</span>
                <select value={careerForm.profession} onChange={(e) => uc("profession", e.target.value)}>
                  <option value="">— select —</option>
                  {professionOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="field">
                <span>Currently living in</span>
                <select value={careerForm.currentCountryCode} onChange={(e) => uc("currentCountryCode", e.target.value)}>
                  {fullCountryList.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>City / area</span>
                <input
                  type="text"
                  value={careerForm.currentCity}
                  onChange={(e) => uc("currentCity", e.target.value)}
                  placeholder="e.g. Dhaka"
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="field">
                <span>Home country</span>
                <select value={careerForm.homeCountryCode} onChange={(e) => uc("homeCountryCode", e.target.value)}>
                  {fullCountryList.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Home district (BD)</span>
                <select value={careerForm.homeDistrict} onChange={(e) => uc("homeDistrict", e.target.value)}>
                  <option value="">— select —</option>
                  {bdDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="button button-soft"
                onClick={() => setStep(1)}
                disabled={isBusy}
              >
                ← Back
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={saveCareer}
                disabled={isBusy}
              >
                {isBusy ? "Saving…" : "Save & Continue"}
              </button>
              <button type="button" className="button button-soft" onClick={skip} disabled={isBusy}>
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Partner Preferences */}
        {step === 3 && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="field">
                <span>Partner age — min</span>
                <input
                  type="number"
                  value={prefForm.ageMin}
                  onChange={(e) => up("ageMin", e.target.value)}
                  min={18}
                  max={80}
                  placeholder="e.g. 24"
                />
              </label>
              <label className="field">
                <span>Partner age — max</span>
                <input
                  type="number"
                  value={prefForm.ageMax}
                  onChange={(e) => up("ageMax", e.target.value)}
                  min={18}
                  max={80}
                  placeholder="e.g. 35"
                />
              </label>
            </div>

            <label className="field">
              <span>What I am looking for in a partner</span>
              <textarea
                value={prefForm.aboutPartner}
                onChange={(e) => up("aboutPartner", e.target.value)}
                rows={4}
                placeholder="Describe qualities, values, and lifestyle you hope to find in your future partner…"
                style={{ resize: "vertical" }}
              />
            </label>

            <p className="hint" style={{ marginTop: -4 }}>
              You can add more specific preferences (religion, education, location) from your dashboard later.
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="button button-soft"
                onClick={() => setStep(2)}
                disabled={isBusy}
              >
                ← Back
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={savePreferences}
                disabled={isBusy}
              >
                {isBusy ? "Saving…" : "Finish Setup"}
              </button>
              <button type="button" className="button button-soft" onClick={skip} disabled={isBusy}>
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
