import type { Metadata } from "next";

import { MultiStepSignup } from "@/components/multi-step-signup";

export const metadata: Metadata = {
  title: "Free Registration | borbodhu.com – Bangladeshi Matrimony",
  description: "Create your free Borbodhu member profile. Find your life partner with verified Bangladeshi matrimony profiles for BD residents and the global diaspora.",
};

export default function SignupPage() {
  return <MultiStepSignup />;
}
