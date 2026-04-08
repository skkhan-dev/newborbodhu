import { Suspense } from "react";

import { CheckoutSimulatePage } from "@/components/checkout-simulate-page";
import { isSupportedPublicLocale } from "@/lib/locale";

export default async function LocalizedCheckoutSimulatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <Suspense fallback={null}>
      <CheckoutSimulatePage
        locale={isSupportedPublicLocale(locale) ? locale : null}
      />
    </Suspense>
  );
}
