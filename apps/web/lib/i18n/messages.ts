import type { PublicLocale } from "@/lib/locale";

/**
 * Centralized translation dictionary for the Borbodhu platform.
 * Access via `t(locale, "key")` for consistent bilingual text.
 */
const messages = {
  // ── Common ──
  "common.loading": { en: "Loading…", bn: "লোড হচ্ছে…" },
  "common.save": { en: "Save", bn: "সেভ করুন" },
  "common.cancel": { en: "Cancel", bn: "বাতিল" },
  "common.delete": { en: "Delete", bn: "মুছুন" },
  "common.edit": { en: "Edit", bn: "সম্পাদনা" },
  "common.submit": { en: "Submit", bn: "জমা দিন" },
  "common.search": { en: "Search", bn: "সার্চ" },
  "common.reset": { en: "Reset", bn: "রিসেট" },
  "common.confirm": { en: "Confirm", bn: "নিশ্চিত করুন" },
  "common.close": { en: "Close", bn: "বন্ধ করুন" },
  "common.back": { en: "Back", bn: "পিছনে" },
  "common.next": { en: "Next", bn: "পরবর্তী" },
  "common.previous": { en: "Previous", bn: "পূর্ববর্তী" },
  "common.viewAll": { en: "View all", bn: "সব দেখুন" },
  "common.viewProfile": { en: "View profile", bn: "প্রোফাইল দেখুন" },
  "common.notAvailable": { en: "Not available", bn: "উপলব্ধ নয়" },
  "common.yes": { en: "Yes", bn: "হ্যাঁ" },
  "common.no": { en: "No", bn: "না" },
  "common.or": { en: "or", bn: "অথবা" },
  "common.and": { en: "and", bn: "এবং" },

  // ── Navigation ──
  "nav.search": { en: "Search", bn: "সার্চ" },
  "nav.ghotok": { en: "Ghotok", bn: "ঘটক" },
  "nav.vendors": { en: "Vendors", bn: "ভেন্ডর" },
  "nav.wedding": { en: "Wedding", bn: "বিয়ে" },
  "nav.pricing": { en: "Pricing", bn: "মূল্য" },
  "nav.dashboard": { en: "Dashboard", bn: "ড্যাশবোর্ড" },
  "nav.logIn": { en: "Log In", bn: "লগ ইন" },
  "nav.signOut": { en: "Sign Out", bn: "সাইন আউট" },
  "nav.joinNow": { en: "Join Now", bn: "যোগ দিন" },

  // ── Homepage ──
  "home.heroKicker": { en: "Trusted Bangladeshi matrimony", bn: "বিশ্বস্ত বাংলাদেশি ম্যাট্রিমনি" },
  "home.heroTitle": {
    en: "Find your life partner — trusted Bangladeshi matrimony for home and diaspora.",
    bn: "আরও আধুনিক ও পরিবার-উপযোগী অভিজ্ঞতায় যাচাইকৃত বাংলাদেশি বিয়ের প্রোফাইল খুঁজুন।",
  },
  "home.memberLogin": { en: "Member login", bn: "মেম্বার লগ ইন" },
  "home.registerFree": { en: "Register free", bn: "ফ্রি রেজিস্ট্রেশন" },
  "home.weddingVendors": { en: "Wedding vendors", bn: "ওয়েডিং ভেন্ডর" },
  "home.quickSearch": { en: "Quick Search", bn: "দ্রুত সার্চ" },
  "home.publicProfiles": { en: "publicly searchable profiles", bn: "পাবলিক সার্চযোগ্য প্রোফাইল" },

  // ── Auth ──
  "auth.email": { en: "Email address", bn: "ইমেইল" },
  "auth.password": { en: "Password", bn: "পাসওয়ার্ড" },
  "auth.logIn": { en: "Log In", bn: "লগ ইন" },
  "auth.signingIn": { en: "Signing in…", bn: "লগ ইন হচ্ছে…" },
  "auth.createAccount": { en: "Create free account", bn: "ফ্রি অ্যাকাউন্ট তৈরি করুন" },
  "auth.forgotPassword": { en: "Forgot your password?", bn: "পাসওয়ার্ড ভুলে গেছেন?" },
  "auth.resetPassword": { en: "Reset password", bn: "পাসওয়ার্ড রিসেট" },
  "auth.welcomeBack": { en: "Welcome back to Borbodhu.", bn: "বরবধূতে আবার স্বাগতম।" },
  "auth.signInRequired": { en: "Sign in required", bn: "লগ ইন প্রয়োজন" },

  // ── Dashboard ──
  "dashboard.title": { en: "Your Borbodhu Dashboard", bn: "আপনার বরবধূ ড্যাশবোর্ড" },
  "dashboard.subtitle": { en: "Secure · Private · Family-safe", bn: "নিরাপদ · ব্যক্তিগত · পরিবার-উপযোগী" },
  "dashboard.profileComplete": { en: "Profile complete", bn: "প্রোফাইল সম্পূর্ণ" },
  "dashboard.receivedInterests": { en: "Received interests", bn: "প্রাপ্ত আগ্রহ" },
  "dashboard.profileVisits": { en: "Profile visits", bn: "প্রোফাইল ভিজিট" },
  "dashboard.photoRequests": { en: "Photo requests", bn: "ছবির অনুরোধ" },

  // ── Search ──
  "search.title": { en: "Search profiles", bn: "প্রোফাইল সার্চ" },
  "search.findMatch": { en: "Find your match", bn: "আপনার পাত্র/পাত্রী খুঁজুন" },
  "search.quickSearch": { en: "Quick Search", bn: "দ্রুত সার্চ" },
  "search.advanced": { en: "Advanced", bn: "বিস্তারিত" },
  "search.photoSearch": { en: "Photo Search", bn: "ফটো সার্চ" },
  "search.lookingFor": { en: "I am looking for", bn: "আমি খুঁজছি" },
  "search.anyGender": { en: "Any gender", bn: "যেকোনো" },
  "search.groom": { en: "Groom", bn: "বর" },
  "search.bride": { en: "Bride", bn: "কনে" },
  "search.religion": { en: "Religion", bn: "ধর্ম" },
  "search.anyReligion": { en: "Any religion", bn: "যেকোনো ধর্ম" },
  "search.ageFrom": { en: "Age from", bn: "বয়স থেকে" },
  "search.ageTo": { en: "Age to", bn: "বয়স পর্যন্ত" },
  "search.country": { en: "Country", bn: "দেশ" },
  "search.anyCountry": { en: "Any country", bn: "যেকোনো দেশ" },
  "search.maritalStatus": { en: "Marital status", bn: "বৈবাহিক অবস্থা" },
  "search.neverMarried": { en: "Never married", bn: "অবিবাহিত" },
  "search.divorced": { en: "Divorced", bn: "তালাকপ্রাপ্ত" },
  "search.widowed": { en: "Widowed", bn: "বিধবা/বিপত্নীক" },
  "search.motherTongue": { en: "Mother tongue", bn: "মাতৃভাষা" },
  "search.keyword": { en: "Keyword", bn: "কীওয়ার্ড" },
  "search.sortBy": { en: "Sort by", bn: "সাজান" },
  "search.recentlyActive": { en: "Recently active", bn: "সম্প্রতি সক্রিয়" },
  "search.newMembers": { en: "New members", bn: "নতুন সদস্য" },
  "search.mostActive": { en: "Most active", bn: "সবচেয়ে সক্রিয়" },
  "search.searching": { en: "Searching…", bn: "খোঁজা হচ্ছে…" },
  "search.profilesFound": { en: "profiles found", bn: "প্রোফাইল পাওয়া গেছে" },
  "search.noResults": {
    en: "No profiles match your criteria. Try adjusting your filters.",
    bn: "আপনার ফিল্টারের সাথে মিলে এমন কোনো প্রোফাইল পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।",
  },
  "search.useFilters": {
    en: "Use the filters above and click Search to find profiles.",
    bn: "উপরের ফিল্টার ব্যবহার করুন এবং প্রোফাইল খুঁজতে সার্চ ক্লিক করুন।",
  },

  // ── Interests ──
  "interests.title": { en: "Manage your interests", bn: "আগ্রহ পরিচালনা" },
  "interests.received": { en: "Received", bn: "প্রাপ্ত" },
  "interests.sent": { en: "Sent", bn: "পাঠানো" },
  "interests.accept": { en: "Accept", bn: "গ্রহণ" },
  "interests.decline": { en: "Decline", bn: "প্রত্যাখ্যান" },
  "interests.accepted": { en: "Interest accepted!", bn: "আগ্রহ গ্রহণ করা হয়েছে!" },
  "interests.declined": { en: "Interest declined.", bn: "আগ্রহ প্রত্যাখ্যান করা হয়েছে।" },
  "interests.noReceived": { en: "No interests received yet.", bn: "এখনও কোনো আগ্রহ পাওয়া যায়নি।" },
  "interests.noSent": { en: "You haven't sent any interests yet.", bn: "আপনি এখনও কোনো আগ্রহ পাঠাননি।" },

  // ── Favorites ──
  "favorites.title": { en: "Your saved profiles", bn: "আপনার সংরক্ষিত প্রোফাইল" },
  "favorites.remove": { en: "Remove", bn: "সরান" },
  "favorites.removed": { en: "Removed from favorites.", bn: "ফেভারিট থেকে সরানো হয়েছে।" },
  "favorites.empty": { en: "You haven't saved any profiles yet.", bn: "আপনি এখনও কোনো প্রোফাইল সংরক্ষণ করেননি।" },

  // ── Visitors ──
  "visitors.title": { en: "Who viewed your profile", bn: "কে আপনার প্রোফাইল দেখেছে" },
  "visitors.empty": { en: "No one has visited your profile yet.", bn: "এখনও কেউ আপনার প্রোফাইল দেখেনি।" },

  // ── Photo Requests ──
  "photoRequests.title": { en: "Private photo access requests", bn: "প্রাইভেট ছবির অ্যাক্সেস অনুরোধ" },
  "photoRequests.pending": { en: "pending", bn: "অপেক্ষমাণ" },
  "photoRequests.grant": { en: "Grant", bn: "দিন" },
  "photoRequests.deny": { en: "Deny", bn: "প্রত্যাখ্যান" },
  "photoRequests.granted": { en: "Photo access granted.", bn: "ছবির অ্যাক্সেস দেওয়া হয়েছে।" },
  "photoRequests.denied": { en: "Photo access denied.", bn: "ছবির অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে।" },
  "photoRequests.empty": { en: "No photo access requests.", bn: "কোনো ছবি দেখার অনুরোধ নেই।" },
  "photoRequests.pendingRequests": { en: "Pending requests", bn: "অপেক্ষমাণ অনুরোধ" },
  "photoRequests.previousRequests": { en: "Previous requests", bn: "পূর্ববর্তী অনুরোধ" },

  // ── Profile ──
  "profile.status.active": { en: "Active", bn: "সক্রিয়" },
  "profile.status.pending": { en: "Pending", bn: "অপেক্ষমাণ" },
  "profile.status.rejected": { en: "Rejected", bn: "বাতিল" },
  "profile.status.cancelled": { en: "Cancelled", bn: "বাতিল" },
  "profile.approval.approved": { en: "Approved", bn: "অনুমোদিত" },
  "profile.approval.pending": { en: "Pending", bn: "অপেক্ষমাণ" },
  "profile.approval.rejected": { en: "Rejected", bn: "বাতিল" },
  "profile.connect": { en: "Connect", bn: "যোগাযোগ" },
  "profile.sendInterest": { en: "Send interest", bn: "আগ্রহ পাঠান" },
  "profile.noPhoto": { en: "No photo yet", bn: "এখনও ছবি নেই" },

  // ── Membership ──
  "membership.upgrade": { en: "Upgrade plan", bn: "প্ল্যান আপগ্রেড" },
  "membership.silver": { en: "Silver", bn: "সিলভার" },
  "membership.gold": { en: "Gold", bn: "গোল্ড" },
  "membership.platinum": { en: "Platinum", bn: "প্লাটিনাম" },
  "membership.free": { en: "Free", bn: "ফ্রি" },

  // ── Admin ──
  "admin.title": { en: "Admin Dashboard", bn: "অ্যাডমিন ড্যাশবোর্ড" },
  "admin.profileReviews": { en: "Profile Review Queue", bn: "প্রোফাইল রিভিউ কিউ" },
  "admin.manualPayments": { en: "Manual Payments", bn: "ম্যানুয়াল পেমেন্ট" },
  "admin.approve": { en: "Approve", bn: "অনুমোদন" },
  "admin.reject": { en: "Reject", bn: "বাতিল" },
  "admin.reviewNotes": { en: "Review notes", bn: "রিভিউ নোট" },
  "admin.activeProfiles": { en: "Active profiles", bn: "সক্রিয় প্রোফাইল" },
  "admin.pendingProfiles": { en: "Pending profiles", bn: "অপেক্ষমাণ প্রোফাইল" },

  // ── Ghotok ──
  "ghotok.title": { en: "Ghotok Dashboard", bn: "ঘটক ড্যাশবোর্ড" },
  "ghotok.creditBalance": { en: "Credit balance", bn: "ক্রেডিট ব্যালেন্স" },
  "ghotok.managedMembers": { en: "Managed members", bn: "ম্যানেজড মেম্বার" },
  "ghotok.creditHistory": { en: "Credit History", bn: "ক্রেডিট ইতিহাস" },

  // ── Wedding ──
  "wedding.title": { en: "Wedding Planning", bn: "বিয়ের পরিকল্পনা" },
  "wedding.guestList": { en: "Guest List", bn: "অতিথি তালিকা" },
  "wedding.vendorDirectory": { en: "Vendor Directory", bn: "ভেন্ডর ডিরেক্টরি" },

  // ── Footer ──
  "footer.findMatch": { en: "Find a Match", bn: "পাত্র/পাত্রী খুঁজুন" },
  "footer.platform": { en: "Platform", bn: "প্ল্যাটফর্ম" },
  "footer.company": { en: "Company", bn: "কোম্পানি" },
  "footer.account": { en: "Account", bn: "অ্যাকাউন্ট" },
  "footer.aboutBorbodhu": { en: "About Borbodhu", bn: "বরবধূ সম্পর্কে" },
  "footer.contactUs": { en: "Contact us", bn: "যোগাযোগ" },
  "footer.privacyPolicy": { en: "Privacy policy", bn: "গোপনীয়তা নীতি" },
  "footer.termsOfService": { en: "Terms of service", bn: "সেবার শর্তাবলী" },
  "footer.copyright": { en: "All rights reserved", bn: "সর্বস্বত্ব সংরক্ষিত" },

  // ── Journey Steps ──
  "journey.step1.title": { en: "Create your free profile", bn: "ফ্রি প্রোফাইল তৈরি করুন" },
  "journey.step1.body": {
    en: "Register in minutes. Our team reviews and activates within 24 hours.",
    bn: "কয়েক মিনিটে রেজিস্ট্রেশন। আমাদের টিম ২৪ ঘণ্টার মধ্যে রিভিউ করে একটিভ করে।",
  },
  "journey.step2.title": { en: "Search and discover matches", bn: "সার্চ করুন ও ম্যাচ খুঁজুন" },
  "journey.step2.body": {
    en: "Filter by age, religion, location, education and more.",
    bn: "বয়স, ধর্ম, লোকেশন, শিক্ষা ও আরও অনেক ফিল্টার দিয়ে সার্চ করুন।",
  },
  "journey.step3.title": { en: "Express interest and connect", bn: "আগ্রহ প্রকাশ করুন ও যোগাযোগ করুন" },
  "journey.step3.body": {
    en: "Send interest for free. Upgrade to message and view contact details.",
    bn: "ফ্রিতে আগ্রহ পাঠান। আপগ্রেড করে মেসেজ ও কনট্যাক্ট দেখুন।",
  },
  "journey.step4.title": { en: "Plan your wedding", bn: "বিয়ের পরিকল্পনা করুন" },
  "journey.step4.body": {
    en: "Wedding planner, guest list, and curated vendor directory built in.",
    bn: "বিল্ট-ইন ওয়েডিং প্ল্যানার, গেস্ট লিস্ট ও ভেন্ডর ডিরেক্টরি।",
  },

  // ── Trust Points ──
  "trust.adminReviewed": {
    en: "Admin-reviewed profiles before they go live",
    bn: "লাইভ হওয়ার আগে অ্যাডমিন-রিভিউ প্রোফাইল",
  },
  "trust.privatePhotos": {
    en: "Private photo access with request and approval",
    bn: "অনুরোধ ও অনুমোদনের মাধ্যমে প্রাইভেট ছবি দেখা",
  },
  "trust.bdDiaspora": {
    en: "Bangladesh-first and diaspora-friendly search",
    bn: "বাংলাদেশ ও প্রবাস উভয়ের জন্য উপযোগী সার্চ",
  },
} as const;

type MessageKey = keyof typeof messages;

/**
 * Translate a key to the given locale.
 * Falls back to English if the key doesn't exist.
 */
export function t(locale: PublicLocale | null, key: MessageKey): string {
  const entry = messages[key];
  if (!entry) return key;
  return locale === "bn" ? entry.bn : entry.en;
}

/**
 * Get all message keys for a given prefix (e.g., "search." returns all search keys).
 */
export function getMessagesByPrefix(prefix: string): MessageKey[] {
  return (Object.keys(messages) as MessageKey[]).filter((key) =>
    key.startsWith(prefix),
  );
}
