"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, getErrorMessage } from "@/lib/api";
import type { PublicLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";
import {
  getLocalizedCuratedCountries,
  getLocalizedCuratedReligions,
  translateGender,
  translateReligion,
} from "@/lib/public-page-locale";
import type { DiscoveryResponse, DiscoverySearchFormState } from "@/lib/types/member";

const PAGE_SIZE = 12;

const defaultForm: DiscoverySearchFormState = {
  gender: "WOMAN",
  ageMin: "18",
  ageMax: "28",
  religion: "Muslim",
  motherTongue: "",
  maritalStatus: "",
  currentCountryCode: "",
  keyword: "",
  hasPhoto: false,
  sortBy: "most_active",
  heightMin: "",
  heightMax: "",
  educationLevel: "",
  profession: "",
  homeCountryCode: "",
  homeDistrict: "",
};

const educationOptions = [
  { value: "Phd/Doctorate", label: "PhD / Doctorate" },
  { value: "Masters", label: "Masters" },
  { value: "MBA", label: "MBA" },
  { value: "Bachelor", label: "Bachelor's" },
  { value: "BBA", label: "BBA" },
  { value: "Diploma", label: "Diploma" },
  { value: "HSC", label: "HSC" },
  { value: "SSC", label: "SSC" },
  { value: "Honours", label: "Honours" },
  { value: "Other", label: "Other" },
];

const heightOptions = Array.from({ length: 21 }, (_, i) => {
  const cm = 134 + i * 4; // 4'5" (134cm) to 7'0" (213cm)
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { value: String(cm), label: `${feet}'${inches}" (${cm}cm)` };
});

const extendedCountries = [
  { code: "BD", label: "Bangladesh" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AE", label: "UAE" },
  { code: "AU", label: "Australia" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "IN", label: "India" },
  { code: "IT", label: "Italy" },
  { code: "MY", label: "Malaysia" },
  { code: "SG", label: "Singapore" },
  { code: "QA", label: "Qatar" },
  { code: "KW", label: "Kuwait" },
  { code: "OM", label: "Oman" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
];

const bdDistricts = [
  "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra", "Brahmanbaria",
  "Chandpur", "Chapai Nawabganj", "Chittagong", "Chuadanga", "Comilla", "Cox's Bazar",
  "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj",
  "Habiganj", "Jamalpur", "Jessore", "Jhalokati", "Jhenaidah", "Joypurhat",
  "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
  "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar",
  "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi",
  "Natore", "Nawabganj", "Netrokona", "Nilphamari", "Noakhali", "Pabna",
  "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati",
  "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj",
  "Sylhet", "Tangail", "Thakurgaon",
];

function buildQueryString(form: DiscoverySearchFormState, page: number) {
  const params = new URLSearchParams();
  if (form.gender) params.set("gender", form.gender);
  if (form.ageMin) params.set("ageMin", form.ageMin);
  if (form.ageMax) params.set("ageMax", form.ageMax);
  if (form.religion) params.set("religion", form.religion);
  if (form.motherTongue) params.set("motherTongue", form.motherTongue);
  if (form.maritalStatus) params.set("maritalStatus", form.maritalStatus);
  if (form.currentCountryCode) params.set("currentCountryCode", form.currentCountryCode);
  if (form.keyword) params.set("keyword", form.keyword);
  if (form.hasPhoto) params.set("hasPhoto", "true");
  if (form.heightMin) params.set("heightMin", form.heightMin);
  if (form.heightMax) params.set("heightMax", form.heightMax);
  if (form.educationLevel) params.set("educationLevel", form.educationLevel);
  if (form.profession) params.set("profession", form.profession);
  if (form.homeCountryCode) params.set("homeCountryCode", form.homeCountryCode);
  if (form.homeDistrict) params.set("homeDistrict", form.homeDistrict);
  params.set("sortBy", form.sortBy);
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  return params.toString();
}

function getProfileName(profile: Record<string, unknown>): string {
  const raw = (profile.displayName ?? profile.publicName ?? "") as string;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toUpperCase() === "NULL" || trimmed === "—") {
    return (profile.displayId as string) ?? "Borbodhu Member";
  }
  // Don't show raw cuid/uuid-like IDs as names
  if (/^[a-z0-9]{20,}$/i.test(trimmed) || /^cmn[a-z0-9]/i.test(trimmed)) {
    return (profile.displayId as string) ?? "Borbodhu Member";
  }
  return trimmed;
}

function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export function MemberSearchPage({ locale = null }: { locale?: PublicLocale | null }) {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<DiscoverySearchFormState>(defaultForm);
  const [results, setResults] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("quick");
  const [showFilters, setShowFilters] = useState(true);

  const countries = getLocalizedCuratedCountries(locale ?? "en").filter((c) => c.code);
  const religions = getLocalizedCuratedReligions(locale ?? "en");
  const didAutoSearch = useRef(false);

  // Auto-search on mount with defaults
  useEffect(() => {
    if (!didAutoSearch.current) {
      didAutoSearch.current = true;
      void search(defaultForm, 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(criteria = form, searchPage = 1) {
    setLoading(true);
    setError(null);
    setPage(searchPage);
    try {
      // Use public endpoint for guests, authenticated endpoint for members
      const endpoint = accessToken
        ? `/member-profiles/discovery?${buildQueryString(criteria, searchPage)}`
        : `/public/profiles?${buildQueryString(criteria, searchPage)}`;
      const response = await apiRequest<DiscoveryResponse>(
        endpoint,
        accessToken ? { token: accessToken } : {},
      );
      setResults(response);
      if (response.results.length > 0) {
        setShowFilters(false);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key: keyof DiscoverySearchFormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handlePageChange(newPage: number) {
    void search(form, newPage);
  }

  const totalPages = results ? Math.ceil(results.total / PAGE_SIZE) : 0;

  return (
    <div>
      <div className="panel-header" style={{ marginBottom: 16 }}>
        <div>
          <p className="section-kicker">{localeText(locale, "Find your match", "আপনার পাত্র/পাত্রী খুঁজুন")}</p>
          <h2>{localeText(locale, "Search profiles", "প্রোফাইল সার্চ")}</h2>
        </div>
      </div>

      {!showFilters && results && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <button type="button" className="button button-soft" onClick={() => setShowFilters(true)}>
            {localeText(locale, "Modify search", "সার্চ পরিবর্তন")}
          </button>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            {results.total.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")} {localeText(locale, "profiles found", "প্রোফাইল পাওয়া গেছে")}
          </span>
        </div>
      )}

      <div style={showFilters ? undefined : { display: "none" }}>
      <Tabs
        tabs={[
          { key: "quick", label: localeText(locale, "Quick Search", "দ্রুত সার্চ") },
          { key: "advanced", label: localeText(locale, "Advanced", "বিস্তারিত") },
          { key: "photo", label: localeText(locale, "Photo Search", "ফটো সার্চ") },
        ]}
        activeTab={activeTab}
        onTabChange={(key) => {
          setActiveTab(key);
          if (key === "photo") {
            updateForm("hasPhoto", true);
          } else {
            updateForm("hasPhoto", false);
          }
        }}
      >
        <div style={{ marginTop: 16 }}>
          {/* Quick Search Fields */}
          <div className="input-grid" style={{ marginBottom: 16 }}>
            <label className="field">
              <span>{localeText(locale, "I am looking for", "আমি খুঁজছি")}</span>
              <select value={form.gender} onChange={(e) => updateForm("gender", e.target.value)}>
                <option value="">{localeText(locale, "Any gender", "যেকোনো")}</option>
                <option value="MAN">{localeText(locale, "Groom (Man)", "বর")}</option>
                <option value="WOMAN">{localeText(locale, "Bride (Woman)", "কনে")}</option>
              </select>
            </label>

            <label className="field">
              <span>{localeText(locale, "Religion", "ধর্ম")}</span>
              <select value={form.religion} onChange={(e) => updateForm("religion", e.target.value)}>
                <option value="">{localeText(locale, "Any religion", "যেকোনো ধর্ম")}</option>
                {religions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{localeText(locale, "Age from", "বয়স থেকে")}</span>
              <select value={form.ageMin} onChange={(e) => updateForm("ageMin", e.target.value)}>
                <option value="">{localeText(locale, "Min", "ন্যূনতম")}</option>
                {Array.from({ length: 53 }, (_, i) => i + 18).map((age) => (
                  <option key={age} value={String(age)}>{age}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{localeText(locale, "Age to", "বয়স পর্যন্ত")}</span>
              <select value={form.ageMax} onChange={(e) => updateForm("ageMax", e.target.value)}>
                <option value="">{localeText(locale, "Max", "সর্বোচ্চ")}</option>
                {Array.from({ length: 53 }, (_, i) => i + 18).map((age) => (
                  <option key={age} value={String(age)}>{age}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Advanced Search Fields */}
          {activeTab === "advanced" && (
            <>
            <div className="input-grid" style={{ marginBottom: 16 }}>
              <label className="field">
                <span>{localeText(locale, "Country", "দেশ")}</span>
                <select value={form.currentCountryCode} onChange={(e) => updateForm("currentCountryCode", e.target.value)}>
                  <option value="">{localeText(locale, "Any country", "যেকোনো দেশ")}</option>
                  {extendedCountries.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Marital status", "বৈবাহিক অবস্থা")}</span>
                <select value={form.maritalStatus} onChange={(e) => updateForm("maritalStatus", e.target.value)}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  <option value="Never Married">{localeText(locale, "Never married", "অবিবাহিত")}</option>
                  <option value="Divorced">{localeText(locale, "Divorced", "তালাকপ্রাপ্ত")}</option>
                  <option value="Widowed">{localeText(locale, "Widowed", "বিধবা/বিপত্নীক")}</option>
                  <option value="Separated">{localeText(locale, "Separated", "বিচ্ছিন্ন")}</option>
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Mother tongue", "মাতৃভাষা")}</span>
                <select value={form.motherTongue} onChange={(e) => updateForm("motherTongue", e.target.value)}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  <option value="Bangla">বাংলা / Bangla</option>
                  <option value="English">English</option>
                  <option value="Sylheti">সিলেটি / Sylheti</option>
                  <option value="Chittagonian">চাটগাঁইয়া / Chittagonian</option>
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Keyword", "কীওয়ার্ড")}</span>
                <input
                  type="text"
                  value={form.keyword}
                  onChange={(e) => updateForm("keyword", e.target.value)}
                  placeholder={localeText(locale, "e.g. doctor, engineer", "যেমন: ডাক্তার, ইঞ্জিনিয়ার")}
                />
              </label>
            </div>

            <div className="input-grid" style={{ marginBottom: 16 }}>
              <label className="field">
                <span>{localeText(locale, "Education level", "শিক্ষাগত যোগ্যতা")}</span>
                <select value={form.educationLevel} onChange={(e) => updateForm("educationLevel", e.target.value)}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  {educationOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Profession", "পেশা")}</span>
                <input
                  type="text"
                  value={form.profession}
                  onChange={(e) => updateForm("profession", e.target.value)}
                  placeholder={localeText(locale, "e.g. Doctor, Engineer, Teacher", "যেমন: ডাক্তার, ইঞ্জিনিয়ার")}
                />
              </label>

              <label className="field">
                <span>{localeText(locale, "Height from", "উচ্চতা থেকে")}</span>
                <select value={form.heightMin} onChange={(e) => updateForm("heightMin", e.target.value)}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  {heightOptions.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Height to", "উচ্চতা পর্যন্ত")}</span>
                <select value={form.heightMax} onChange={(e) => updateForm("heightMax", e.target.value)}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  {heightOptions.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="input-grid" style={{ marginBottom: 16 }}>
              <label className="field">
                <span>{localeText(locale, "Home country", "স্থায়ী দেশ")}</span>
                <select value={form.homeCountryCode} onChange={(e) => updateForm("homeCountryCode", e.target.value)}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  {extendedCountries.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Home district", "স্থায়ী জেলা")}</span>
                <select value={form.homeDistrict} onChange={(e) => updateForm("homeDistrict", e.target.value)}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  {bdDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
            </>
          )}

          {/* Sort + Search Button */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 20 }}>
            <label className="field" style={{ minWidth: 180 }}>
              <span>{localeText(locale, "Sort by", "সাজান")}</span>
              <select value={form.sortBy} onChange={(e) => updateForm("sortBy", e.target.value as DiscoverySearchFormState["sortBy"])}>
                <option value="recent_login">{localeText(locale, "Recently active", "সম্প্রতি সক্রিয়")}</option>
                <option value="new_signups">{localeText(locale, "New members", "নতুন সদস্য")}</option>
                <option value="most_active">{localeText(locale, "Most active", "সবচেয়ে সক্রিয়")}</option>
              </select>
            </label>

            <button
              type="button"
              className="button button-primary"
              onClick={() => void search()}
              disabled={loading}
              style={{ height: 48 }}
            >
              {loading
                ? localeText(locale, "Searching...", "খোঁজা হচ্ছে...")
                : localeText(locale, "Search", "সার্চ")}
            </button>

            <button
              type="button"
              className="button button-soft"
              onClick={() => {
                setForm(defaultForm);
                setResults(null);
              }}
              style={{ height: 48 }}
            >
              {localeText(locale, "Reset", "রিসেট")}
            </button>
          </div>
        </div>
      </Tabs>
      </div>

      {/* Error */}
      {error && <div className="error-banner">{error}</div>}

      {/* Loading */}
      {loading && (
        <div className="card-grid" style={{ marginTop: 16 }}>
          <Skeleton variant="card" count={6} />
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div>
          <p className="hint" style={{ marginBottom: 12 }}>
            {results.total.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}{" "}
            {localeText(locale, "profiles found", "প্রোফাইল পাওয়া গেছে")}
          </p>

          {results.results.length === 0 ? (
            <div className="empty-state">
              {localeText(locale, "No profiles match your criteria. Try adjusting your filters.", "আপনার ফিল্টারের সাথে মিলে এমন কোনো প্রোফাইল পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।")}
            </div>
          ) : (
            <>
              <div className="card-grid">
                {results.results.map((profile) => {
                  const profileName = getProfileName(profile as Record<string, unknown>);
                  return (
                    <Link
                      key={profile.id}
                      href={localizePath(`/profiles/${profile.displayId}`, locale)}
                      className="mini-card"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div className="mini-card-media-wrap">
                        {profile.primaryPhotoUrl ? (
                          <img src={profile.primaryPhotoUrl} alt={profileName} className="mini-card-media" />
                        ) : (
                          <div className="mini-card-media mini-card-media-placeholder">
                            <span style={{ fontSize: 32, opacity: 0.4 }}>👤</span>
                          </div>
                        )}
                        {profile.age ? (
                          <span className="status-pill status-pill-gold" style={{ position: "absolute", top: 8, right: 8, fontSize: "0.75rem" }}>
                            {profile.age} {localeText(locale, "yrs", "বছর")}
                          </span>
                        ) : null}
                      </div>
                      <div className="mini-card-body">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: "block", fontSize: "0.95rem", lineHeight: 1.3 }}>{profileName}</strong>
                            <p className="mini-text" style={{ margin: "2px 0 0", fontSize: "0.75rem", opacity: 0.6 }}>{profile.displayId}</p>
                          </div>
                        </div>
                        <p className="mini-text" style={{ margin: 0, fontSize: "0.82rem" }}>
                          {titleCase(profile.currentCity) || localeText(locale, "Location pending", "লোকেশন অপেক্ষমাণ")}
                          {profile.currentCountryCode ? `, ${profile.currentCountryCode}` : ""}
                        </p>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {profile.religion && <Badge tone="gold">{translateReligion(profile.religion, locale ?? "en")}</Badge>}
                          {profile.profession && <Badge tone="teal">{profile.profession}</Badge>}
                          {profile.maritalStatus && <Badge tone="sand">{profile.maritalStatus}</Badge>}
                          {profile.educationLevel && <Badge tone="indigo">{profile.educationLevel}</Badge>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Initial state */}
      {!results && !loading && !error && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          {localeText(locale, "Use the filters above and click Search to find profiles.", "উপরের ফিল্টার ব্যবহার করুন এবং প্রোফাইল খুঁজতে সার্চ ক্লিক করুন।")}
        </div>
      )}
    </div>
  );
}
