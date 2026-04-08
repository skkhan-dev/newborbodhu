import { notFound } from "next/navigation";

import { PublicSponsorSlot } from "@/components/public-sponsor-slot";
import {
  VendorsPageClient,
  type VendorDirectoryItem,
  type VendorDirectoryPageCopy,
} from "@/components/vendors-page-client";
import { getApiBaseUrl } from "@/lib/api";
import { getPublicCommercialConfig } from "@/lib/commercial";
import { isSupportedPublicLocale, type PublicLocale } from "@/lib/locale";

async function getInitialVendors() {
  const response = await fetch(`${getApiBaseUrl()}/vendors`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as VendorDirectoryItem[];
  }

  return (await response.json()) as VendorDirectoryItem[];
}

function getCopy(locale: PublicLocale): Partial<VendorDirectoryPageCopy> {
  if (locale === "bn") {
    return {
      heroEyebrowPrimary: "ওয়েডিং মার্কেটপ্লেস",
      heroEyebrowSecondary: "পাবলিক ভেন্ডর ডিরেক্টরি লাইভ",
      heroTitle: "দেশে ও প্রবাসে বাংলাদেশি বিয়ের জন্য উপযোগী ভেন্ডর খুঁজুন।",
      heroBody:
        "এই ডিরেক্টরিটি লাইভ বরবধূ টেস্ট এপিআইয়ের সাথে যুক্ত। মেম্বাররা ওয়েডিং প্ল্যানিং থেকে ভেন্ডর শর্টলিস্ট করতে পারে, আর অতিথিরা পাবলিক সাইট থেকেই প্যাকেজ, ক্যাটাগরি, এবং প্রাথমিক ইনভেন্টরি দেখতে পারে।",
      createMemberAccount: "মেম্বার অ্যাকাউন্ট তৈরি করুন",
      memberLogin: "মেম্বার লগ ইন",
      openDashboard: "ড্যাশবোর্ড খুলুন",
      vendorsMetricLabel: "বর্তমান ফিল্টার করা ফলে ভেন্ডর",
      categoriesMetricLabel: "পাবলিক ডিরেক্টরিতে দৃশ্যমান সার্ভিস ক্যাটাগরি",
      shortlistMetricLabel: "মেম্বার ওয়েডিং প্ল্যানিং থেকে এই তালিকা সেভ করতে পারে",
      directorySearchKicker: "ডিরেক্টরি সার্চ",
      directorySearchTitle: "ক্যাটাগরি, বিভাগ, জেলা, বা কীওয়ার্ড দিয়ে খুঁজুন।",
      directorySearchBody:
        "এই ধাপে পাবলিক ডিরেক্টরিকে ইচ্ছাকৃতভাবে সহজ রাখা হয়েছে, যাতে বাস্তব ভেন্ডর ব্রাউজিং আগে যাচাই করা যায়।",
      searchLabel: "সার্চ",
      searchPlaceholder: "প্ল্যানার, ডেকর, মেহেদী, ভেন্যু",
      categoryLabel: "ক্যাটাগরি",
      allCategories: "সব ক্যাটাগরি",
      divisionLabel: "বিভাগ",
      allDivisions: "সব বিভাগ",
      districtLabel: "জেলা",
      districtPlaceholder: "ঢাকা",
      searchButton: "ডিরেক্টরি খুঁজুন",
      loadingButton: "লোড হচ্ছে...",
      resetButton: "রিসেট",
      vendorResultsKicker: "ভেন্ডর ফলাফল",
      vendorResultsTitle: "পাবলিক ভেন্ডর কার্ড, প্যাকেজ, এবং পরের ধাপ।",
      vendorResultsBody:
        "মেম্বাররা এখান থেকে ওয়েডিং প্ল্যানিংয়ে যেতে পারে। অতিথিরা প্রাইভেট মেম্বার ডেটা ছাড়াই মার্কেটপ্লেস ঘুরে দেখতে পারে।",
      quoteLabel: "কোট",
      descriptionPending: "ভেন্ডর বর্ণনা এখনো যোগ হয়নি।",
      viewVendor: "ভেন্ডর দেখুন",
      shortlistInDashboard: "ড্যাশবোর্ডে শর্টলিস্ট করুন",
      joinToShortlist: "শর্টলিস্ট করতে যোগ দিন",
      noResultsKicker: "কোনো ফল নেই",
      noResultsTitle: "এই ফিল্টারে কোনো ভেন্ডর পাওয়া যায়নি।",
      noResultsBody:
        "আরও বিস্তৃত কীওয়ার্ড ব্যবহার করুন বা লোকেশন ফিল্টার কমিয়ে ফল বাড়ান।",
    };
  }

  return {};
}

export default async function LocalizedVendorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  const initialVendors = await getInitialVendors();
  const publicConfig = await getPublicCommercialConfig();

  return (
    <main className="page-shell">
      <VendorsPageClient
        initialVendors={initialVendors}
        locale={locale}
        copy={getCopy(locale)}
      />
      <PublicSponsorSlot config={publicConfig} placement="vendors" locale={locale} />
    </main>
  );
}
