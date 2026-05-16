"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "@/components/ui/multi-select";
import { fullCountryList, religionOptions, educationOptions, professionOptions } from "@/lib/form-options";

const ageOptions = Array.from({ length: 43 }, (_, i) => String(i + 18));
const maritalOptions = [
  { value: "Never Married", label: "Never Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
  { value: "Separated", label: "Separated" },
];
const motherTongueOptions = [
  { value: "Bangla", label: "Bangla / বাংলা" },
  { value: "English", label: "English" },
  { value: "Sylheti", label: "Sylheti / সিলেটি" },
  { value: "Chittagonian", label: "Chittagonian / চাটগাঁইয়া" },
];
const countryOptions = fullCountryList.map((c) => ({ value: c.code, label: c.label }));
const profOptions = professionOptions.map((p) => ({ value: p, label: p }));

type SearchFormProps = {
  defaults: {
    memberGender?: string;
    gender?: string;
    ageMin?: string;
    ageMax?: string;
    religion?: string;
    currentCountryCode?: string;
    maritalStatus?: string;
    motherTongue?: string;
    keyword?: string;
    sortBy?: string;
    hasPhoto?: boolean;
    educationLevel?: string;
    profession?: string;
  };
  basePath: string;
};

export function PublicSearchForm({ defaults, basePath }: SearchFormProps) {
  const router = useRouter();
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [memberGender, setMemberGender] = useState(defaults.memberGender || "MAN");
  const [gender, setGender] = useState(defaults.gender || "WOMAN");
  const [ageMin, setAgeMin] = useState(defaults.ageMin || "");
  const [ageMax, setAgeMax] = useState(defaults.ageMax || "");
  const [religions, setReligions] = useState<string[]>(defaults.religion ? defaults.religion.split(",") : []);
  const [countries, setCountries] = useState<string[]>(defaults.currentCountryCode ? defaults.currentCountryCode.split(",") : []);
  const [marital, setMarital] = useState<string[]>(defaults.maritalStatus ? defaults.maritalStatus.split(",") : []);
  const [tongues, setTongues] = useState<string[]>(defaults.motherTongue ? defaults.motherTongue.split(",") : []);
  const [keyword, setKeyword] = useState(defaults.keyword || "");
  const [sortBy, setSortBy] = useState(defaults.sortBy || "recent_login");
  const [hasPhoto, setHasPhoto] = useState(defaults.hasPhoto || false);
  const [education, setEducation] = useState<string[]>(defaults.educationLevel ? defaults.educationLevel.split(",") : []);
  const [profession, setProfession] = useState<string[]>(defaults.profession ? defaults.profession.split(",") : []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("page", "1");
    if (memberGender) params.set("memberGender", memberGender);
    if (gender) params.set("gender", gender);
    if (ageMin) params.set("ageMin", ageMin);
    if (ageMax) params.set("ageMax", ageMax);
    if (religions.length) params.set("religion", religions.join(","));
    if (countries.length) params.set("currentCountryCode", countries.join(","));
    if (marital.length) params.set("maritalStatus", marital.join(","));
    if (tongues.length) params.set("motherTongue", tongues.join(","));
    if (keyword) params.set("keyword", keyword);
    if (sortBy) params.set("sortBy", sortBy);
    if (hasPhoto) params.set("hasPhoto", "1");
    if (education.length) params.set("educationLevel", education.join(","));
    if (profession.length) params.set("profession", profession.join(","));
    router.push(`${basePath}?${params.toString()}`);
  }

  function handleReset() {
    setMemberGender("MAN");
    setGender("WOMAN");
    setAgeMin("");
    setAgeMax("");
    setReligions([]);
    setCountries([]);
    setMarital([]);
    setTongues([]);
    setKeyword("");
    setSortBy("recent_login");
    setHasPhoto(false);
    setEducation([]);
    setProfession([]);
    router.push(basePath);
  }

  return (
    <form onSubmit={handleSubmit} className="dashboard-stack">
      {/* Gender */}
      <div className="input-grid">
        <label className="field">
          <span>I am a</span>
          <select value={memberGender} onChange={(e) => setMemberGender(e.target.value)}>
            <option value="MAN">Man</option>
            <option value="WOMAN">Woman</option>
          </select>
        </label>
        <label className="field">
          <span>Seeking a</span>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="WOMAN">Woman</option>
            <option value="MAN">Man</option>
          </select>
        </label>
      </div>

      {/* Age */}
      <div className="input-grid">
        <label className="field">
          <span>Age from</span>
          <select value={ageMin} onChange={(e) => setAgeMin(e.target.value)}>
            <option value="">Any</option>
            {ageOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Age to</span>
          <select value={ageMax} onChange={(e) => setAgeMax(e.target.value)}>
            <option value="">Any</option>
            {ageOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      </div>

      {/* Religion + Country (multi-select) */}
      <div className="input-grid">
        <div className="field">
          <MultiSelect
            label="Religion"
            options={religionOptions.map((r) => ({ value: r.value, label: r.label }))}
            selected={religions}
            onChange={setReligions}
            placeholder="All religions"
          />
        </div>
        <div className="field">
          <MultiSelect
            label="Current country"
            options={countryOptions}
            selected={countries}
            onChange={setCountries}
            placeholder="All locations"
            searchable
          />
        </div>
      </div>

      {!showMoreFilters && (
        <button type="button" className="button button-soft" style={{ fontSize: "0.82rem", width: "100%" }} onClick={() => setShowMoreFilters(true)}>
          More filters
        </button>
      )}

      {/* Marital + Mother tongue (multi-select) */}
      <div className="input-grid" style={showMoreFilters ? undefined : { display: "none" }}>
        <div className="field">
          <MultiSelect
            label="Marital status"
            options={maritalOptions}
            selected={marital}
            onChange={setMarital}
            placeholder="Any"
          />
        </div>
        <div className="field">
          <MultiSelect
            label="Mother tongue"
            options={motherTongueOptions}
            selected={tongues}
            onChange={setTongues}
            placeholder="Any"
          />
        </div>
      </div>

      {/* Education + Profession (multi-select) */}
      <div className="input-grid" style={showMoreFilters ? undefined : { display: "none" }}>
        <div className="field">
          <MultiSelect
            label="Education"
            options={educationOptions}
            selected={education}
            onChange={setEducation}
            placeholder="Any"
          />
        </div>
        <div className="field">
          <MultiSelect
            label="Profession"
            options={profOptions}
            selected={profession}
            onChange={setProfession}
            placeholder="Any"
            searchable
          />
        </div>
      </div>

      {/* Keyword + Sort */}
      <div className="input-grid" style={showMoreFilters ? undefined : { display: "none" }}>
        <label className="field">
          <span>Keyword</span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="city, district, name"
          />
        </label>
        <label className="field">
          <span>Sort by</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent_login">Recent login</option>
            <option value="most_active">Most active</option>
            <option value="new_signups">New signups</option>
          </select>
        </label>
      </div>

      <label className="checkbox-row">
        <input type="checkbox" checked={hasPhoto} onChange={(e) => setHasPhoto(e.target.checked)} />
        <span>Only show profiles with public photo</span>
      </label>

      <div className="inline-actions">
        <button type="submit" className="button button-primary">Search</button>
      </div>
    </form>
  );
}
