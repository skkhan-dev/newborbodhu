import type { LoginFormCopy } from "@/components/login-form";
import type { MemberSignupCopy } from "@/components/member-signup-form";
import type { VendorSignupCopy } from "@/components/vendor-signup-form";
import type { PublicLocale } from "@/lib/locale";

type LocaleLandingContent = {
  kicker: string;
  title: string;
  body: string;
  primaryCta: string;
  secondaryCta: string;
  vendorCta: string;
  proofTitle: string;
  proofBody: string;
  proofPoints: string[];
  diasporaTitle: string;
  diasporaBody: string;
};

type LocalePageHero = {
  kicker: string;
  title: string;
  body: string;
};

type LocaleNavCopy = {
  subtitle: string;
  labels: {
    overview: string;
    search: string;
    searchProfiles: string;
    profiles: string;
    ghotok: string;
    vendors: string;
    wedding: string;
    howItWorks: string;
    pricing: string;
    login: string;
    signup: string;
    dashboard: string;
    joinNow: string;
    signOut: string;
    messages: string;
    editProfile: string;
    membership: string;
  };
};

type LocalePageContent = {
  nav: LocaleNavCopy;
  landing: LocaleLandingContent;
  loginHero: LocalePageHero;
  memberSignupHero: LocalePageHero;
  vendorSignupHero: LocalePageHero;
  loginForm: Partial<LoginFormCopy>;
  memberSignupForm: Partial<MemberSignupCopy>;
  vendorSignupForm: Partial<VendorSignupCopy>;
};

const content: Record<PublicLocale, LocalePageContent> = {
  en: {
    nav: {
      subtitle:
        "Modern Bangladeshi matrimony, wedding planning, and trusted family journeys",
      labels: {
        overview: "Home",
        search: "Search",
        searchProfiles: "Search Profiles",
        profiles: "Profiles",
        ghotok: "Ghotok",
        vendors: "Vendors",
        wedding: "Wedding",
        howItWorks: "How It Works",
        pricing: "Pricing",
        login: "Log In",
        signup: "Sign Up",
        dashboard: "Dashboard",
        joinNow: "Join Free",
        signOut: "Sign Out",
        messages: "Messages",
        editProfile: "Edit Profile",
        membership: "Membership",
      },
    },
    landing: {
      kicker: "English Version",
      title:
        "Borbodhu for Bangladesh and the diaspora, with a modern trust-first journey.",
      body:
        "This English route is the first step toward fully separate English and Bangla acquisition funnels. It keeps the product clear for users in Bangladesh, the US, UK, Canada, the Middle East, and beyond.",
      primaryCta: "Log in",
      secondaryCta: "Member signup",
      vendorCta: "Vendor signup",
      proofTitle: "What is already live",
      proofBody:
        "The test stack already supports real signup, login, dashboards, wedding planning, vendor flows, admin review, and migration validation on GCP.",
      proofPoints: [
        "Member signup and profile review path",
        "Vendor signup, packages, and lead capture",
        "Public profiles, ghotok pages, and vendor discovery",
      ],
      diasporaTitle: "Built for local and overseas families",
      diasporaBody:
        "The English version is especially important for Bangladeshis outside Bangladesh who still want culturally aware matchmaking, family-safe communication, and wedding planning in one place.",
    },
    loginHero: {
      kicker: "English Login",
      title: "Log in through the English Borbodhu route.",
      body:
        "This keeps the acquisition path language-specific while still connecting to the same live GCP backend and role-aware dashboard.",
    },
    memberSignupHero: {
      kicker: "English Member Signup",
      title: "Create a member account through the English route.",
      body:
        "The account is created in the same live environment, but this path is tailored for English-first users and diaspora traffic.",
    },
    vendorSignupHero: {
      kicker: "English Vendor Signup",
      title: "Create a vendor account through the English route.",
      body:
        "Wedding businesses can use this English-first entry point while the backend, dashboard, and lead flows stay shared.",
    },
    loginForm: {},
    memberSignupForm: {},
    vendorSignupForm: {},
  },
  bn: {
    nav: {
      subtitle:
        "আধুনিক বাংলাদেশি বিয়ে, ওয়েডিং প্ল্যানিং, এবং পরিবারভিত্তিক বিশ্বাসের যাত্রা",
      labels: {
        overview: "হোম",
        search: "সার্চ",
        searchProfiles: "প্রোফাইল সার্চ",
        profiles: "প্রোফাইল",
        ghotok: "ঘটক",
        vendors: "ভেন্ডর",
        wedding: "বিয়ে",
        pricing: "মূল্য",
        login: "লগ ইন",
        signup: "সাইন আপ",
        howItWorks: "কিভাবে কাজ করে",
        dashboard: "ড্যাশবোর্ড",
        joinNow: "ফ্রি যোগ দিন",
        signOut: "সাইন আউট",
        messages: "মেসেজ",
        editProfile: "প্রোফাইল সম্পাদনা",
        membership: "মেম্বারশিপ",
      },
    },
    landing: {
      kicker: "বাংলা সংস্করণ",
      title:
        "বাংলাদেশ ও প্রবাসী পরিবারের জন্য বরবধূর আলাদা বাংলা অভিজ্ঞতার শুরু।",
      body:
        "এই বাংলা রুটটি পূর্ণাঙ্গ আলাদা বাংলা ও ইংরেজি অভিজ্ঞতার ভিত্তি। এখানে পরিবার, গোপনীয়তা, ম্যাচমেকিং, এবং বিয়ের পরিকল্পনা একই প্ল্যাটফর্মে রাখা হয়েছে।",
      primaryCta: "লগ ইন",
      secondaryCta: "মেম্বার সাইন আপ",
      vendorCta: "ভেন্ডর সাইন আপ",
      proofTitle: "এখন কী কী চালু আছে",
      proofBody:
        "জিসিপি টেস্ট সিস্টেমে এখনই বাস্তব সাইন আপ, লগ ইন, ড্যাশবোর্ড, ওয়েডিং প্ল্যানিং, ভেন্ডর ফ্লো, এবং মাইগ্রেশন ভ্যালিডেশন চলছে।",
      proofPoints: [
        "মেম্বার সাইন আপ ও প্রোফাইল রিভিউ",
        "ভেন্ডর সাইন আপ, প্যাকেজ, এবং লিড গ্রহণ",
        "পাবলিক প্রোফাইল, ঘটক পেজ, এবং ভেন্ডর ডিরেক্টরি",
      ],
      diasporaTitle: "দেশে ও দেশের বাইরে সবার জন্য",
      diasporaBody:
        "বাংলা সংস্করণটি বিশেষভাবে দরকার যেসব পরিবার বাংলা ভাষায় স্বাচ্ছন্দ্যবোধ করে, কিন্তু আধুনিক ও নিরাপদ ডিজিটাল অভিজ্ঞতা চায়।",
    },
    loginHero: {
      kicker: "বাংলা লগ ইন",
      title: "বাংলা রুট দিয়ে বরবধূতে লগ ইন করুন।",
      body:
        "এই পথটি বাংলা ভাষাভিত্তিক হলেও একই লাইভ জিসিপি ব্যাকএন্ড এবং রোল-ভিত্তিক ড্যাশবোর্ডে যায়।",
    },
    memberSignupHero: {
      kicker: "বাংলা মেম্বার সাইন আপ",
      title: "বাংলা রুট দিয়ে নতুন মেম্বার অ্যাকাউন্ট তৈরি করুন।",
      body:
        "একই লাইভ সিস্টেমে অ্যাকাউন্ট তৈরি হবে, তবে এই প্রবেশপথটি বাংলা-প্রথম ব্যবহারকারীদের জন্য সাজানো।",
    },
    vendorSignupHero: {
      kicker: "বাংলা ভেন্ডর সাইন আপ",
      title: "বাংলা রুট দিয়ে নতুন ভেন্ডর অ্যাকাউন্ট তৈরি করুন।",
      body:
        "বিয়ের ব্যবসাগুলো বাংলা-প্রথম অভিজ্ঞতা থেকে অ্যাকাউন্ট খুলে ড্যাশবোর্ড, প্যাকেজ, এবং লিড ফ্লো ব্যবহার করতে পারবে।",
    },
    loginForm: {
      kicker: "বাংলা লগ ইন",
      title: "লাইভ বরবধূ টেস্ট সিস্টেমে প্রবেশ করুন।",
      body:
        "এই লগ ইন ফর্ম সরাসরি ক্লাউড রান ব্যাকএন্ডে কথা বলে, তাই মেম্বার, অ্যাডমিন, ঘটক, এবং ভেন্ডর সবাই নিজ নিজ ড্যাশবোর্ডে যাবে।",
      emailLabel: "ইমেইল",
      emailPlaceholder: "আপনার@email.com",
      passwordLabel: "পাসওয়ার্ড",
      submitLabel: "লগ ইন করুন",
      submittingLabel: "লগ ইন হচ্ছে...",
      memberSignupLabel: "মেম্বার সাইন আপ",
      vendorSignupLabel: "ভেন্ডর সাইন আপ",
      quickAccountsKicker: "টেস্ট অ্যাকাউন্ট",
      quickAccountsTitle: "দ্রুত যেকোনো পারসোনা দিয়ে প্রবেশ করুন।",
      quickAccountsBody:
        "এই অ্যাকাউন্টগুলো ক্লাউড এসকিউএল টেস্ট সিস্টেমে আগে থেকেই আছে, তাই আলাদা সেটআপ ছাড়াই বিভিন্ন রোল দেখা যাবে।",
      note:
        "ডেমো অ্যাকাউন্টের বদলে নতুন মেম্বার ফ্লো দেখতে চাইলে মেম্বার সাইন আপ রুট ব্যবহার করুন।",
      vendorNote:
        "ওয়েডিং ব্যবসার জন্য আলাদা ভেন্ডর সাইন আপ রুটও এখন লাইভ আছে।",
    },
    memberSignupForm: {
      kicker: "বাংলা মেম্বার সাইন আপ",
      title: "লাইভ সিস্টেমে নতুন মেম্বার অ্যাকাউন্ট তৈরি করুন।",
      body:
        "এখানে তৈরি হওয়া অ্যাকাউন্টটি সঙ্গে সঙ্গে লাইভ ড্যাশবোর্ডে যাবে এবং পরে প্রোফাইল, পছন্দ, এবং রিভিউ ফ্লো চালিয়ে যেতে পারবে।",
      firstName: "নামের প্রথম অংশ",
      lastName: "নামের শেষ অংশ",
      email: "ইমেইল",
      password: "পাসওয়ার্ড",
      confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
      locale: "ভাষার সংস্করণ",
      gender: "আমি",
      lookingFor: "খুঁজছি",
      birthDate: "জন্মতারিখ",
      currentCountry: "বর্তমান দেশ",
      homeCountry: "নিজের দেশ",
      submitLabel: "মেম্বার অ্যাকাউন্ট তৈরি করুন",
      submittingLabel: "অ্যাকাউন্ট তৈরি হচ্ছে...",
    },
    vendorSignupForm: {
      kicker: "বাংলা ভেন্ডর সাইন আপ",
      title: "লাইভ সিস্টেমে নতুন ভেন্ডর অ্যাকাউন্ট তৈরি করুন।",
      body:
        "এই ফর্ম দিয়ে বিয়ের ব্যবসা সাইন আপ করে ড্যাশবোর্ডে প্যাকেজ যোগ করতে এবং লিড পেতে পারবে।",
      businessName: "ব্যবসার নাম",
      category: "ক্যাটাগরি",
      contactPerson: "যোগাযোগের ব্যক্তি",
      phone: "ফোন",
      email: "ইমেইল",
      locale: "ভাষার সংস্করণ",
      password: "পাসওয়ার্ড",
      confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
      division: "বিভাগ",
      district: "জেলা",
      area: "এলাকা",
      website: "ওয়েবসাইট",
      address: "ঠিকানা",
      descriptionEn: "বর্ণনা (ইংরেজি)",
      descriptionBn: "বর্ণনা (বাংলা)",
      submitLabel: "ভেন্ডর অ্যাকাউন্ট তৈরি করুন",
      submittingLabel: "ভেন্ডর তৈরি হচ্ছে...",
      memberButton: "মেম্বার সাইন আপ",
      sideKicker: "ভেন্ডর কেন গুরুত্বপূর্ণ",
      sideTitle: "ভেন্ডর সেলফ-সার্ভিস থাকলে ওয়েডিং প্ল্যানিং ব্যবসা আরও শক্তিশালী হয়।",
      sidePoints: [
        "ইংরেজি ও বাংলায় প্যাকেজ প্রকাশ করা যায়।",
        "পাবলিক ভেন্ডর পেজ থেকে সরাসরি লিড পাওয়া যায়।",
        "দেশে ও দেশের বাইরে থাকা মেম্বারদের কাছে দৃশ্যমান থাকা যায়।",
      ],
    },
  },
};

export function getPublicLocaleContent(locale: PublicLocale) {
  return content[locale];
}
