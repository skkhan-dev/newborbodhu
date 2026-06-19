import type { Metadata, Viewport } from "next";
import { Inter, Hind_Siliguri, Playfair_Display } from "next/font/google";
import "./globals.css";

import { AnalyticsPageTracker } from "@/components/analytics-page-tracker";
import { AuthProvider } from "@/components/auth-provider";
import { NextAuthProvider } from "@/components/next-auth-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { MobileStickyCtaBar } from "@/components/mobile-sticky-cta";
import { CookieConsentBanner } from "@/components/cookie-consent";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Borbodhu.com – বরবধূ | Trusted Bangladeshi Matrimony",
    template: "%s | borbodhu.com",
  },
  description:
    "Bangladesh's trusted matrimony platform for Bangladeshi and diaspora families. Verified profiles, ghotok matchmakers, wedding planning and vendor directory.",
  keywords: ["bangladeshi matrimony", "বিয়ে", "বরবধূ", "ghotok", "bangladeshi bride groom", "NRB matrimony"],
  metadataBase: new URL("https://borbodhu.com"),
  openGraph: {
    siteName: "Borbodhu.com",
    locale: "en_US",
    alternateLocale: "bn_BD",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${hindSiliguri.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Borbodhu.com",
              alternateName: "বরবধূ",
              url: "https://borbodhu.com",
              description:
                "Bangladesh's trusted matrimony platform for Bangladeshi and diaspora families.",
              inLanguage: ["en", "bn"],
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://borbodhu.com/profiles?keyword={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Borbodhu.com",
              alternateName: "বরবধূ ডটকম",
              url: "https://borbodhu.com",
              logo: "https://borbodhu.com/icon.png",
              description: "Bangladesh's trusted matrimony platform for Bangladeshi and diaspora families.",
              sameAs: ["https://www.facebook.com/borbodhu"],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: ["English", "Bengali"],
              },
              areaServed: { "@type": "Country", name: "Bangladesh" },
            }),
          }}
        />
      </head>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <NextAuthProvider>
          <AuthProvider>
            <ToastProvider>
              <AnalyticsPageTracker />
              <SiteNav />
              <div style={{ flex: 1 }}>
                {children}
              </div>
              <SiteFooter />
              <MobileStickyCtaBar />
              <CookieConsentBanner />
            </ToastProvider>
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
