export type MatrimonyMarketContent = {
  slug: string;
  title: string;
  description: string;
  heroLabel: string;
  lead: string;
  audience: string[];
  strengths: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const matrimonyMarkets: MatrimonyMarketContent[] = [
  {
    slug: "bangladesh",
    title: "Bangladeshi Matrimony In Bangladesh",
    description:
      "Privacy-aware Borbodhu matching for families in Dhaka, Chattogram, Sylhet, Rajshahi, and beyond.",
    heroLabel: "Local trust",
    lead:
      "For members inside Bangladesh, Borbodhu should feel verified, family-safe, and culturally literate without looking old-fashioned.",
    audience: [
      "Families who want admin-approved profiles before serious conversations start",
      "Members who value religion, education, district, and family background filters",
      "People who want private-photo control before contact sharing",
    ],
    strengths: [
      "Admin review before profiles go fully live",
      "Ghotok-assisted and self-serve matching in one platform",
      "Wedding planning and vendor shortlist after the match journey starts",
    ],
    faqs: [
      {
        question: "Will public pages expose contact details?",
        answer:
          "No. Public SEO pages stay privacy-limited and keep phone, email, and private photos behind sign-in and plan rules.",
      },
      {
        question: "Can families stay involved in the process?",
        answer:
          "Yes. Borbodhu supports guardian details, family preferences, admin review, and ghotok-assisted introductions.",
      },
    ],
  },
  {
    slug: "usa",
    title: "Bangladeshi Matrimony In The United States",
    description:
      "Diaspora-ready Borbodhu matching for Bangladeshi members in New York, Texas, California, and across the US.",
    heroLabel: "Diaspora focus",
    lead:
      "For Bangladeshis living in the United States, matching needs to balance family expectations, immigration realities, and modern communication habits.",
    audience: [
      "US-based Bangladeshis looking for Bangladesh or diaspora matches",
      "Families managing long-distance introductions across time zones",
      "Members who want English-first flows with Bangla still available where needed",
    ],
    strengths: [
      "Country-aware discovery and partner-preference matching",
      "Privacy-safe public profiles that help diaspora search intent",
      "Vendor and wedding planning paths for destination or hybrid ceremonies",
    ],
    faqs: [
      {
        question: "Does Borbodhu support NRI and diaspora filtering?",
        answer:
          "Yes. The new platform models both current country and home roots so diaspora journeys can be filtered more clearly.",
      },
      {
        question: "Can a US-based member still use a ghotok?",
        answer:
          "Yes. Ghotok support remains part of the platform for families who want a guided introduction process.",
      },
    ],
  },
  {
    slug: "uk",
    title: "Bangladeshi Matrimony In The United Kingdom",
    description:
      "Bengali and Bangladeshi matchmaking journeys for London, Birmingham, Manchester, and UK diaspora families.",
    heroLabel: "UK diaspora",
    lead:
      "UK-based Bangladeshi families often need a platform that respects both British daily life and strong family-guided marriage expectations.",
    audience: [
      "Families who want a culturally familiar platform instead of a generic dating product",
      "Members balancing district roots, religion, education, and diaspora lifestyle",
      "Users comparing local UK matches with Bangladesh-based introductions",
    ],
    strengths: [
      "Strong profile review and moderation posture",
      "Separate English and Bangla product direction",
      "Public content designed for SEO without exposing private data",
    ],
    faqs: [
      {
        question: "Is this a dating site or a matrimony platform?",
        answer:
          "Borbodhu is being built as a matrimony and family-introduction platform, not a casual dating experience.",
      },
      {
        question: "Can UK-based members plan vendors after matching?",
        answer:
          "Yes. Wedding planning and vendor discovery are part of Launch 1 in the new product direction.",
      },
    ],
  },
  {
    slug: "canada",
    title: "Bangladeshi Matrimony In Canada",
    description:
      "Family-aware Borbodhu matching for Bangladeshi members in Toronto, Vancouver, Calgary, Ottawa, and other Canadian communities.",
    heroLabel: "Canada diaspora",
    lead:
      "Canadian diaspora members often need a calmer, more trusted journey that respects privacy, long-distance introductions, and family participation.",
    audience: [
      "Members who prefer a serious marriage-focused platform",
      "Parents and relatives who want visibility into a trusted process",
      "Users who care about both immigration reality and cultural alignment",
    ],
    strengths: [
      "Role-aware flows for members, admins, ghotoks, and vendors",
      "Plan-gated contact visibility and messaging rules",
      "SEO-safe discovery for organic growth among diaspora searchers",
    ],
    faqs: [
      {
        question: "Can someone in Canada match with Bangladesh-based members?",
        answer:
          "Yes. The new model supports current and home locations separately so cross-border matching remains natural.",
      },
      {
        question: "Will the apps support Bangla too?",
        answer:
          "Yes. The launch direction is separate English and Bangla versions across the product, not a mixed bilingual interface.",
      },
    ],
  },
];

export const weddingPlanningContent = {
  title: "Bangladeshi Wedding Planning On Borbodhu",
  description:
    "Guest lists, vendor shortlists, and culturally aligned planning for weddings in Bangladesh and abroad.",
  lead:
    "Borbodhu should not stop at the match. The wedding-planning layer is how the platform becomes part of the full family journey.",
  highlights: [
    "Guest list planning for families managing many invitation groups",
    "Vendor discovery by location, category, and package fit",
    "Shortlists that stay connected to the member or managed-member journey",
    "A path to future vendor monetization and ad inventory without harming trust",
  ],
  faqs: [
    {
      question: "Why include wedding planning in a matrimony platform?",
      answer:
        "Because the strongest long-term retention comes after the match, when members still need vendors, planning tools, and trusted referrals.",
    },
    {
      question: "Will vendor pages be public?",
      answer:
        "Yes. Public vendor pages are part of the SEO and monetization strategy while logged-in members can save shortlists inside planning flows.",
    },
  ],
};
