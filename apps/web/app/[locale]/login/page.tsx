import Link from "next/link";
import { notFound } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { localizePath, SUPPORTED_PUBLIC_LOCALES, isSupportedPublicLocale } from "@/lib/locale";
import { getPublicLocaleContent } from "@/lib/public-locale-content";

export function generateStaticParams() {
  return SUPPORTED_PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export default async function LocalizedLoginPage({
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
          <p className="section-kicker">{content.loginHero.kicker}</p>
          <h1>{content.loginHero.title}</h1>
          <p className="hero-copy">{content.loginHero.body}</p>
          <div className="hero-actions">
            <Link href={localizePath("/signup", locale)} className="button button-soft">
              {content.nav.labels.signup}
            </Link>
            <Link href={localizePath("/signup/vendor", locale)} className="button button-soft">
              {content.landing.vendorCta}
            </Link>
          </div>
        </div>
      </section>

      <LoginForm
        copy={content.loginForm}
        memberSignupHref={localizePath("/signup", locale)}
        vendorSignupHref={localizePath("/signup/vendor", locale)}
        redirectTo={localizePath("/dashboard", locale)}
      />
    </main>
  );
}
