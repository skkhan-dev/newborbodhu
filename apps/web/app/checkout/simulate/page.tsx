import { Suspense } from "react";

import { CheckoutSimulatePage } from "@/components/checkout-simulate-page";

export default function CheckoutSimulateRootPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSimulatePage />
    </Suspense>
  );
}
