import type { PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

export function translateMediaType(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "PROFILE_PHOTO":
      return localeText(locale, "Profile photo", "প্রোফাইল ছবি");
    case "BIODATA":
      return localeText(locale, "Biodata", "বায়োডাটা");
    case "DOCUMENT":
      return localeText(locale, "Document", "ডকুমেন্ট");
    case "VERIFICATION":
      return localeText(locale, "Verification", "ভেরিফিকেশন");
    default:
      return value;
  }
}

export function translatePrivacyMode(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "PUBLIC":
      return localeText(locale, "Public", "পাবলিক");
    case "PRIVATE":
      return localeText(locale, "Private", "প্রাইভেট");
    case "BLURRED_PUBLIC":
      return localeText(locale, "Blurred public", "ব্লার করা পাবলিক");
    default:
      return value;
  }
}

export function translateGateway(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "OFFICE":
      return localeText(locale, "Office payment", "অফিস পেমেন্ট");
    case "MANUAL":
      return localeText(locale, "Manual review", "ম্যানুয়াল রিভিউ");
    case "AMARPAY":
      return "aamarPay";
    case "PAYPAL":
      return "PayPal";
    default:
      return value;
  }
}

export function translateProfileStatus(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "ACTIVE":
      return localeText(locale, "Active", "সক্রিয়");
    case "INACTIVE":
      return localeText(locale, "Inactive", "নিষ্ক্রিয়");
    case "PENDING":
      return localeText(locale, "Pending", "অপেক্ষমাণ");
    case "CANCELLED":
      return localeText(locale, "Cancelled", "বাতিল");
    case "SUSPENDED":
      return localeText(locale, "Suspended", "সাসপেন্ডেড");
    default:
      return value.replaceAll("_", " ");
  }
}

export function translateApprovalStatus(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "PENDING":
      return localeText(locale, "Pending", "অপেক্ষমাণ");
    case "APPROVED":
      return localeText(locale, "Approved", "অনুমোদিত");
    case "REJECTED":
      return localeText(locale, "Rejected", "বাতিল");
    default:
      return value.replaceAll("_", " ");
  }
}

export function translatePaymentStatus(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "PENDING_REVIEW":
      return localeText(locale, "Pending review", "রিভিউ অপেক্ষমাণ");
    case "APPROVED":
      return localeText(locale, "Approved", "অনুমোদিত");
    case "REJECTED":
      return localeText(locale, "Rejected", "বাতিল");
    case "PAID":
      return localeText(locale, "Paid", "পরিশোধিত");
    default:
      return value.replaceAll("_", " ");
  }
}

export function translateWorkflowStatus(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "PLANNING":
      return localeText(locale, "Planning", "পরিকল্পনায়");
    case "ACTIVE":
      return localeText(locale, "Active", "সক্রিয়");
    case "COMPLETED":
      return localeText(locale, "Completed", "সম্পন্ন");
    default:
      return value.replaceAll("_", " ");
  }
}
