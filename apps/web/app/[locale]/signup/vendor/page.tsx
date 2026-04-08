import { notFound } from "next/navigation";

import { VendorSignupForm } from "@/components/vendor-signup-form";
import { localizePath, SUPPORTED_PUBLIC_LOCALES, isSupportedPublicLocale } from "@/lib/locale";
import { getPublicLocaleContent } from "@/lib/public-locale-content";

export function generateStaticParams() {
  return SUPPORTED_PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export default async function LocalizedVendorSignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  const content = getPublicLocaleContent(locale);

  return (
    <main className="page-shell">
      <section className="persona-hero auth-hero">
        <div>
          <p className="section-kicker">{content.vendorSignupHero.kicker}</p>
          <h1>{content.vendorSignupHero.title}</h1>
          <p className="hero-copy">{content.vendorSignupHero.body}</p>
        </div>
      </section>

      <VendorSignupForm
        copy={content.vendorSignupForm}
        memberSignupHref={localizePath("/signup", locale)}
        redirectTo={localizePath("/dashboard", locale)}
      />
    </main>
  );
}
