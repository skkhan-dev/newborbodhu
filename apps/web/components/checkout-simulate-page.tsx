"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { trackProductEvent } from "@/lib/analytics";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { localizePath, type PublicLocale } from "@/lib/locale";

type CheckoutSimulatePageProps = {
  locale?: PublicLocale | null;
};

type SimulationResponse = {
  success: boolean;
  paymentId: string;
  status: string;
  simulated: boolean;
  idempotent?: boolean;
};

function text(locale: PublicLocale | null, en: string, bn: string) {
  return locale === "bn" ? bn : en;
}

export function CheckoutSimulatePage({
  locale = null,
}: CheckoutSimulatePageProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const gateway = searchParams.get("gateway") ?? "Gateway";
  const amount = searchParams.get("amount") ?? "";
  const currency = searchParams.get("currency") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const [busyStatus, setBusyStatus] = useState<"SUCCESS" | "FAILED" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResponse | null>(null);

  const dashboardHref = useMemo(() => localizePath("/dashboard", locale), [locale]);

  async function submit(status: "SUCCESS" | "FAILED") {
    if (!token) {
      setError(
        text(locale, "Checkout token is missing.", "চেকআউট টোকেন পাওয়া যায়নি।"),
      );
      return;
    }

    setBusyStatus(status);
    setError(null);

    try {
      const response = await apiRequest<SimulationResponse>(
        "/billing/checkout-sessions/simulate",
        {
          method: "POST",
          body: {
            token,
            status,
          },
        },
      );

      setResult(response);
      void trackProductEvent({
        eventName: response.status === "PAID" ? "PAYMENT_COMPLETED" : "PAYMENT_FAILED",
        locale,
        pagePath: localizePath("/checkout/simulate", locale),
        entityType: "PAYMENT",
        entityId: response.paymentId,
        metadataJson: {
          gateway,
          status: response.status,
          simulated: true,
        },
      });
    } catch (simulateError) {
      setError(getErrorMessage(simulateError));
    } finally {
      setBusyStatus(null);
    }
  }

  return (
    <main className="public-page-shell">
      <section className="public-hero-card">
        <p className="public-kicker">
          {text(locale, "Test Checkout", "টেস্ট চেকআউট")}
        </p>
        <h1 className="public-page-title">
          {text(locale, "Simulated gateway handoff", "সিমুলেটেড গেটওয়ে হ্যান্ডঅফ")}
        </h1>
        <p className="public-page-body">
          {text(
            locale,
            "This test page completes the membership payment flow inside the Borbodhu test stack.",
            "এই টেস্ট পেজটি বরবধূ টেস্ট স্ট্যাকের ভেতরেই মেম্বারশিপ পেমেন্ট ফ্লো সম্পূর্ণ করে।",
          )}
        </p>
      </section>

      <section className="public-section-card">
        <div className="checkout-sim-grid">
          <div className="checkout-sim-card">
            <p className="checkout-sim-label">{text(locale, "Gateway", "গেটওয়ে")}</p>
            <h2>{gateway}</h2>
            <p>
              {amount && currency ? `${amount} ${currency}` : text(locale, "Amount pending", "অ্যামাউন্ট অপেক্ষমাণ")}
            </p>
            {plan ? (
              <p className="checkout-sim-muted">
                {text(locale, "Plan", "প্ল্যান")}: {plan}
              </p>
            ) : null}
          </div>

          <div className="checkout-sim-card">
            <p className="checkout-sim-label">
              {text(locale, "What to test", "কী টেস্ট করবেন")}
            </p>
            <p className="checkout-sim-muted">
              {text(
                locale,
                "Use Complete payment to simulate a successful gateway callback, or Mark failed to exercise the failed-payment path.",
                "সফল গেটওয়ে কলব্যাক সিমুলেট করতে Complete payment ব্যবহার করুন, অথবা ব্যর্থ পেমেন্ট ফ্লো দেখতে Mark failed চাপুন।",
              )}
            </p>
            <div className="checkout-sim-actions">
              <button
                type="button"
                className="checkout-sim-primary"
                disabled={busyStatus !== null}
                onClick={() => void submit("SUCCESS")}
              >
                {busyStatus === "SUCCESS"
                  ? text(locale, "Processing...", "প্রসেস হচ্ছে...")
                  : text(locale, "Complete payment", "পেমেন্ট সম্পূর্ণ করুন")}
              </button>
              <button
                type="button"
                className="checkout-sim-secondary"
                disabled={busyStatus !== null}
                onClick={() => void submit("FAILED")}
              >
                {busyStatus === "FAILED"
                  ? text(locale, "Processing...", "প্রসেস হচ্ছে...")
                  : text(locale, "Mark failed", "ব্যর্থ দেখান")}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="checkout-sim-alert checkout-sim-alert-error">{error}</div>
        ) : null}

        {result ? (
          <div className="checkout-sim-alert checkout-sim-alert-success">
            <strong>{text(locale, "Payment updated.", "পেমেন্ট আপডেট হয়েছে।")}</strong>
            <div>
              {text(locale, "Payment ID", "পেমেন্ট আইডি")}: {result.paymentId}
            </div>
            <div>
              {text(locale, "Status", "স্ট্যাটাস")}: {result.status}
              {result.idempotent
                ? ` • ${text(locale, "Already processed", "আগেই প্রসেস হয়েছে")}`
                : ""}
            </div>
            <div className="checkout-sim-links">
              <Link href={dashboardHref}>
                {text(locale, "Return to dashboard", "ড্যাশবোর্ডে ফিরুন")}
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
