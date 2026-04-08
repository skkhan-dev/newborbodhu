export type TrustPillar = {
  title: string;
  body: string;
};

export type PersonaScreen = {
  id: string;
  title: string;
  details: string[];
};

export type PersonaFlow = {
  id: string;
  name: string;
  accent: "gold" | "rose" | "leaf" | "indigo" | "teal" | "sand";
  summary: string;
  screens: PersonaScreen[];
};

export const trustPillars: TrustPillar[] = [
  {
    title: "Bangladeshi-first trust",
    body: "Profile review, family-aware onboarding, photo privacy, and moderation designed for the cultural realities of Bangladesh and the diaspora.",
  },
  {
    title: "One platform, four businesses",
    body: "Members, Ghotok, vendors, and wedding planning all live inside one coherent product instead of disconnected tools.",
  },
  {
    title: "Future-proof and measurable",
    body: "Built for low-cost GCP in year 1, with analytics, payments, and migration discipline from the start.",
  },
];

export const actorCards = [
  {
    title: "Member",
    body: "Join quickly, build a trusted profile, search safely, request private photos, send interest, and move into wedding planning.",
    href: "/persona-flows#member",
  },
  {
    title: "Ghotok",
    body: "Manage multiple members, use credits, impersonate safely, and become a true matchmaking differentiator for Borbodhu.",
    href: "/persona-flows#ghotok",
  },
  {
    title: "Vendor",
    body: "Self-serve onboarding, bilingual listings, lead handling, and future billing for wedding businesses.",
    href: "/persona-flows#vendor",
  },
  {
    title: "Admin",
    body: "Fast review queues, manual payment approval, reporting, and platform health monitoring without legacy complexity.",
    href: "/persona-flows#admin",
  },
];

export const memberHighlights = [
  "Locale-first English and Bangla experiences",
  "Man / Woman member language instead of Bride / Groom",
  "Guardian and family fields where culturally relevant",
  "Private photos with request, grant, and deny flow",
  "Upgrade gates that respect free-member behavior",
  "Wedding planning continuation after match discovery",
];

export const parityModules = [
  "Public site and SEO-safe profile browsing",
  "Member signup, login, reset, and profile editing",
  "Admin moderation and manual approval flows",
  "Ghotok managed-member workflows and credits",
  "Plans, coupons, payments, and manual office approvals",
  "Messaging, photo requests, favorites, blocks, and visitors",
  "Wedding planning and vendor directory continuity",
];

export const personaFlows: PersonaFlow[] = [
  {
    id: "guest",
    name: "Guest",
    accent: "gold",
    summary: "The guest flow should explain trust fast, preview the value clearly, and move visitors into the right registration path without confusion.",
    screens: [
      {
        id: "G1",
        title: "Locale Select",
        details: ["Choose English or Bangla", "Remember version preference", "Position Bangladesh + diaspora immediately"],
      },
      {
        id: "G2",
        title: "Trust-Led Home",
        details: ["Show verification", "Show member and match counts", "Highlight wedding planning and Ghotok value"],
      },
      {
        id: "G3",
        title: "Search Preview",
        details: ["Privacy-safe match cards", "Blurred or limited profile preview", "Prompt sign-up for deeper access"],
      },
      {
        id: "G4",
        title: "Join Path",
        details: ["Man or Woman", "Parent or Guardian", "Ghotok", "Wedding Vendor"],
      },
    ],
  },
  {
    id: "member",
    name: "Member",
    accent: "rose",
    summary: "The member journey should minimize friction at signup, deepen profile quality after onboarding, and connect matching with trust and wedding readiness.",
    screens: [
      {
        id: "M1",
        title: "Quick Signup",
        details: ["Name, email, password", "I am Man / Woman", "Looking for Man / Woman"],
      },
      {
        id: "M2",
        title: "Family and Faith",
        details: ["Religion and subgroup", "Mother tongue", "Guardian or wali support", "Family values"],
      },
      {
        id: "M3",
        title: "Partner Preferences",
        details: ["Age range", "Diaspora preferences", "Education and profession preferences", "Family involvement alignment"],
      },
      {
        id: "M4",
        title: "Photos and Privacy",
        details: ["Public and private images", "Biodata upload", "Photo request explanation", "Moderation-ready media flow"],
      },
      {
        id: "M5",
        title: "Dashboard and Match Detail",
        details: ["Daily matches", "Compatibility explanation", "Interest, favorite, block, photo request"],
      },
      {
        id: "M6",
        title: "Inbox and Upgrade Gate",
        details: ["Free-member messaging limit", "Plan comparison", "AmarPay, PayPal, and office approval options"],
      },
    ],
  },
  {
    id: "ghotok",
    name: "Ghotok",
    accent: "leaf",
    summary: "The Ghotok experience should feel like a professional member-management and matchmaking tool, not a thin wrapper around the member portal.",
    screens: [
      {
        id: "GH1",
        title: "Dashboard",
        details: ["Managed member counts", "Pending approvals", "Wallet balance", "Quick add member"],
      },
      {
        id: "GH2",
        title: "Add Managed Member",
        details: ["Progressive profile wizard", "Family and guardian details", "Partner preference capture", "Media and biodata"],
      },
      {
        id: "GH3",
        title: "Managed Member List",
        details: ["Pending", "Active", "Needs edit", "Recently matched"],
      },
      {
        id: "GH4",
        title: "Impersonation and Credits",
        details: ["Clear acting-as banner", "Credit deduction visibility", "Audited contact views", "Message support where allowed"],
      },
    ],
  },
  {
    id: "vendor",
    name: "Vendor",
    accent: "teal",
    summary: "The vendor flow should feel premium and commercially credible so wedding businesses want to onboard and stay active on Borbodhu.",
    screens: [
      {
        id: "V1",
        title: "Vendor Signup",
        details: ["Business basics", "Category", "Location", "Owner contact details"],
      },
      {
        id: "V2",
        title: "Vendor Dashboard",
        details: ["Lead counts", "Profile views", "Shortlist counts", "Listing health"],
      },
      {
        id: "V3",
        title: "Lead Inbox",
        details: ["Wedding date", "Location", "Budget band", "Lead follow-up state"],
      },
      {
        id: "V4",
        title: "Packages and Billing",
        details: ["Bilingual package editor", "Gallery", "Starter vs featured billing path", "Revenue visibility"],
      },
    ],
  },
  {
    id: "admin",
    name: "Admin",
    accent: "indigo",
    summary: "Admin should be fast, readable, and safe for moderation, payment review, and daily operations without carrying legacy clutter.",
    screens: [
      {
        id: "A1",
        title: "Review Queue",
        details: ["Pending profiles", "Photo approvals", "Manual payments", "Cancellation requests"],
      },
      {
        id: "A2",
        title: "Member Review Detail",
        details: ["Submitted profile summary", "Risk flags", "Edit before approve", "Reject with reason"],
      },
      {
        id: "A3",
        title: "Manual Payment Review",
        details: ["Office payment proof", "Plan assignment", "Approve or reject", "No activation before approval"],
      },
      {
        id: "A4",
        title: "Operational Snapshot",
        details: ["Active vs pending", "Today sales", "Review reasons", "Queue health"],
      },
    ],
  },
  {
    id: "super-admin",
    name: "Super Admin",
    accent: "sand",
    summary: "Super admin needs clarity over growth, revenue, permissions, and configuration, especially payment gateways, match mail, and cost analytics.",
    screens: [
      {
        id: "S1",
        title: "Executive Dashboard",
        details: ["Registrations", "Revenue", "Approval rate", "Diaspora trends", "Cost pulse"],
      },
      {
        id: "S2",
        title: "Admin Management",
        details: ["Add admin", "Permission scope", "Reset credentials", "Audit visibility"],
      },
      {
        id: "S3",
        title: "Plans and Gateways",
        details: ["Membership tiers", "AmarPay config", "PayPal config", "Manual payment rules"],
      },
      {
        id: "S4",
        title: "Growth and Analytics",
        details: ["Match mail controls", "Campaigns", "Funnel dashboards", "AdSense-safe inventory"],
      },
    ],
  },
];

export const reviewQuestions = [
  "Does the member language feel correct and culturally natural?",
  "Should wedding planning appear even earlier in the member journey?",
  "Is the Ghotok flow strong enough to make Borbodhu feel unique?",
  "Does the vendor journey feel credible enough for monetization?",
  "Are there missing trust or family steps before we lock the backend contracts?",
];

export const parityScenarios = [
  {
    title: "Public and guest parity",
    items: [
      "Locale routing",
      "Trust-led homepage behavior",
      "Search preview and join-path routing",
      "Public vendor and Ghotok discovery surfaces",
    ],
  },
  {
    title: "Member parity",
    items: [
      "Signup, login, reset, and review flow",
      "Photo privacy, search, favorite, block, and visitor logic",
      "Messaging and plan gating",
      "AmarPay, PayPal, coupon, and office payment handling",
    ],
  },
  {
    title: "Ghotok, vendor, and ops parity",
    items: [
      "Managed member creation and impersonation",
      "Credit wallet and credit usage",
      "Vendor onboarding, packages, and lead flow",
      "Admin review queue, manual payment approval, and super admin controls",
    ],
  },
];
