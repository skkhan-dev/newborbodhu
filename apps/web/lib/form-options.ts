/** Shared dropdown options for forms across the platform. */

// ── Education ──
export const educationOptions = [
  { value: "Phd/Doctorate", label: "PhD / Doctorate" },
  { value: "Masters", label: "Masters" },
  { value: "MBA", label: "MBA" },
  { value: "Bachelor", label: "Bachelor" },
  { value: "Honours", label: "Honours" },
  { value: "BBA", label: "BBA" },
  { value: "Diploma", label: "Diploma" },
  { value: "HSC", label: "HSC" },
  { value: "SSC", label: "SSC" },
  { value: "Dakhil", label: "Dakhil" },
  { value: "Alim", label: "Alim" },
  { value: "Fajil", label: "Fajil" },
  { value: "Kamil", label: "Kamil" },
  { value: "Other", label: "Other" },
];

// ── Profession (matching legacy borbodhu.com) ──
export const professionOptions = [
  "Accountant", "Advertising Professional", "Advocate", "Air Service",
  "Architect", "Auditor", "Banker", "Barrister", "BCS Cadre",
  "Beautician", "Business Person", "Chartered Accountant",
  "Computer Professional", "Consultant", "Contractor", "Cost Accountant",
  "Customer Support Professional", "Defense Employee", "Dentist",
  "Designer", "Diploma Engineer", "Doctor", "Engineer", "Executive",
  "Factory Worker", "Garment Employee", "Government Employee", "Hafez",
  "Health Care Professional", "Hotel/Restaurant Professional",
  "HR Administration", "IT/Telecom Profession", "Journalist", "Lecturer",
  "Legal Professional", "Manager", "Marine Engineer",
  "Marketing Professional", "Media Professional", "Medical Professional",
  "Merchandiser", "Multi National", "NGO Employee", "Nurse",
  "Pharmacist", "Private Service", "Production Professional", "Professor",
  "Psychologist", "Real Estate Professional", "Retail Professional",
  "Retired Person", "Sales Professional", "Scientist",
  "Self-employed Person", "Semi Government", "Social Worker", "Sportsman",
  "Student", "Teacher", "Technician", "Transportation Professional",
  "Volunteer", "Writer", "Not Employed", "Other",
];

// ── Full Country List (matching legacy borbodhu.com) ──
export const fullCountryList = [
  { code: "BD", label: "Bangladesh" },
  { code: "AU", label: "Australia" },
  { code: "AT", label: "Austria" },
  { code: "BH", label: "Bahrain" },
  { code: "BE", label: "Belgium" },
  { code: "BT", label: "Bhutan" },
  { code: "BR", label: "Brazil" },
  { code: "BN", label: "Brunei" },
  { code: "CA", label: "Canada" },
  { code: "CN", label: "China" },
  { code: "CY", label: "Cyprus" },
  { code: "CZ", label: "Czech Republic" },
  { code: "DK", label: "Denmark" },
  { code: "EG", label: "Egypt" },
  { code: "FI", label: "Finland" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "GR", label: "Greece" },
  { code: "HK", label: "Hong Kong" },
  { code: "IN", label: "India" },
  { code: "ID", label: "Indonesia" },
  { code: "IE", label: "Ireland" },
  { code: "IT", label: "Italy" },
  { code: "JP", label: "Japan" },
  { code: "JO", label: "Jordan" },
  { code: "KE", label: "Kenya" },
  { code: "KW", label: "Kuwait" },
  { code: "LB", label: "Lebanon" },
  { code: "MO", label: "Macau" },
  { code: "MY", label: "Malaysia" },
  { code: "MV", label: "Maldives" },
  { code: "MX", label: "Mexico" },
  { code: "MA", label: "Morocco" },
  { code: "NP", label: "Nepal" },
  { code: "NL", label: "Netherlands" },
  { code: "NZ", label: "New Zealand" },
  { code: "NG", label: "Nigeria" },
  { code: "NO", label: "Norway" },
  { code: "OM", label: "Oman" },
  { code: "PK", label: "Pakistan" },
  { code: "PL", label: "Poland" },
  { code: "PT", label: "Portugal" },
  { code: "QA", label: "Qatar" },
  { code: "KR", label: "South Korea" },
  { code: "RU", label: "Russia" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "SG", label: "Singapore" },
  { code: "ZA", label: "South Africa" },
  { code: "ES", label: "Spain" },
  { code: "LK", label: "Sri Lanka" },
  { code: "SE", label: "Sweden" },
  { code: "CH", label: "Switzerland" },
  { code: "SY", label: "Syria" },
  { code: "TW", label: "Taiwan" },
  { code: "TH", label: "Thailand" },
  { code: "TR", label: "Turkey" },
  { code: "UA", label: "Ukraine" },
  { code: "AE", label: "UAE" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "UZ", label: "Uzbekistan" },
  { code: "YE", label: "Yemen" },
];

// ── Shorter curated list for quick filters ──
export const extendedCountries = fullCountryList;

// ── Height Options (ft/in with cm) ──
export const heightOptions: { value: string; label: string; cm: number }[] = [];
for (let totalInches = 53; totalInches <= 84; totalInches++) {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  const cm = Math.round(totalInches * 2.54);
  heightOptions.push({
    value: String(cm),
    label: `${feet}'${inches}" (${cm} cm)`,
    cm,
  });
}

// ── Default heights ──
export const DEFAULT_HEIGHT_MALE = "168"; // 5'6"
export const DEFAULT_HEIGHT_FEMALE = "160"; // 5'3"

// ── Bangladesh Districts (all 64) ──
export const bdDistricts = [
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

// ── Bangladesh Divisions ──
export const bdDivisions = [
  "Barishal", "Chattogram", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet",
];

// ── Religion Options ──
export const religionOptions = [
  { value: "Muslim", label: "Islam / Muslim" },
  { value: "Hindu", label: "Hindu" },
  { value: "Christian", label: "Christian" },
  { value: "Buddhist", label: "Buddhist" },
  { value: "Other", label: "Other" },
];

// ── AI Bio Generator (client-side template — free, instant) ──
export function generateSmartBio(data: {
  firstName?: string;
  profession?: string;
  educationLevel?: string;
  universityName?: string;
  currentCity?: string;
  currentCountryCode?: string;
  religion?: string;
  lookingFor?: string;
}): string {
  const parts: string[] = [];

  if (data.firstName) {
    parts.push(`I am ${data.firstName}`);
  }

  if (data.profession) {
    parts.push(`a ${data.profession}`);
  }

  if (data.currentCity && data.currentCountryCode) {
    const country = fullCountryList.find((c) => c.code === data.currentCountryCode);
    parts.push(`based in ${data.currentCity}, ${country?.label ?? data.currentCountryCode}`);
  }

  if (data.educationLevel) {
    const edu = educationOptions.find((e) => e.value === data.educationLevel);
    const eduText = edu?.label ?? data.educationLevel;
    if (data.universityName) {
      parts.push(`I completed my ${eduText} from ${data.universityName}`);
    } else {
      parts.push(`I hold a ${eduText} degree`);
    }
  }

  if (data.religion) {
    parts.push(`I come from a ${data.religion} family`);
  }

  if (data.lookingFor) {
    const seeking = data.lookingFor === "MAN" ? "groom" : "bride";
    parts.push(`I am looking for a suitable ${seeking} who shares my values and aspirations`);
  }

  if (parts.length === 0) {
    return "I am looking for a life partner who shares my values, goals, and vision for the future. Family is important to me, and I believe in building a relationship based on mutual respect and understanding.";
  }

  return parts.join(". ") + ". I value family, honesty, and mutual respect in a relationship.";
}

export function generateSmartFamilyDetails(data: {
  religion?: string;
  familyValues?: string;
  currentCity?: string;
}): string {
  const values = data.familyValues ?? "moderate";
  const religion = data.religion ?? "Muslim";
  const city = data.currentCity ?? "Dhaka";

  return `We are a ${values.toLowerCase()} ${religion} family from ${city}. My parents are supportive of my marriage decision. We maintain good family values and traditions while embracing modern education and career opportunities.`;
}

export function generateSmartPartnerPreference(data: {
  gender?: string;
  ageMin?: string;
  ageMax?: string;
  religions?: string;
  educationLevels?: string;
  professions?: string;
  livingCountryCodes?: string;
}): string {
  const parts: string[] = [];

  const seeking = data.gender === "MALE" ? "groom" : data.gender === "FEMALE" ? "bride" : "life partner";
  parts.push(`I am looking for a ${seeking}`);

  if (data.ageMin && data.ageMax) {
    parts.push(`aged between ${data.ageMin} and ${data.ageMax}`);
  }

  if (data.religions && data.religions !== "NULL" && data.religions.trim()) {
    parts.push(`from a ${data.religions} background`);
  }

  if (data.educationLevels && data.educationLevels !== "NULL" && data.educationLevels.trim()) {
    const edu = educationOptions.find((e) => e.value === data.educationLevels);
    const label = edu?.label ?? data.educationLevels;
    if (label && label !== "NULL") {
      parts.push(`with at least a ${label} degree`);
    }
  }

  if (data.professions && data.professions !== "NULL" && data.professions.trim()) {
    parts.push(`preferably working as a ${data.professions}`);
  }

  if (data.livingCountryCodes) {
    const country = fullCountryList.find((c) => c.code === data.livingCountryCodes);
    if (country) {
      parts.push(`currently living in ${country.label}`);
    }
  }

  if (parts.length <= 1) {
    return "I am looking for a life partner who is kind, well-educated, and family-oriented. Mutual respect, shared values, and a commitment to building a loving home together are most important to me.";
  }

  return parts.join(", ") + ". I value sincerity, family orientation, and mutual respect above all.";
}
