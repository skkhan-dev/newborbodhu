import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicSponsorSlot } from "@/components/public-sponsor-slot";
import { getPublicCommercialConfig } from "@/lib/commercial";
import { weddingPlanningContent } from "@/lib/seo-content";
import { isSupportedPublicLocale, localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

export default async function LocalizedWeddingPlanningLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  const publicConfig = await getPublicCommercialConfig();

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>{localeText(locale, "Wedding Planning", "ওয়েডিং প্ল্যানিং")}</span>
            <span>{localeText(locale, "Launch 1 growth and retention layer", "লঞ্চ ১ গ্রোথ ও রিটেনশন স্তর")}</span>
          </div>
          <h1>
            {localeText(
              locale,
              weddingPlanningContent.title,
              "বরবধূতে বাংলাদেশি ওয়েডিং প্ল্যানিং",
            )}
          </h1>
          <p className="hero-copy">
            {localeText(
              locale,
              weddingPlanningContent.lead,
              "ম্যাচ হওয়ার পরেই যাত্রা শেষ নয়। ওয়েডিং প্ল্যানিং স্তর বরবধূকে পুরো পারিবারিক যাত্রার অংশ বানায়।",
            )}
          </p>
          <div className="hero-actions">
            <Link href={localizePath("/signup", locale)} className="button button-primary">
              {localeText(locale, "Start planning", "প্ল্যানিং শুরু করুন")}
            </Link>
            <Link href={localizePath("/vendors", locale)} className="button button-soft">
              {localeText(locale, "Browse vendors", "ভেন্ডর দেখুন")}
            </Link>
            <Link href={localizePath("/profiles", locale)} className="button button-secondary">
              {localeText(locale, "Browse profiles", "প্রোফাইল দেখুন")}
            </Link>
          </div>
        </div>
      </section>

      <PublicSponsorSlot config={publicConfig} placement="wedding" locale={locale} />

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">{localeText(locale, "Why this matters", "কেন এটি গুরুত্বপূর্ণ")}</p>
          <h2>{localeText(locale, "Retention should continue after the match.", "ম্যাচের পরেও রিটেনশন চালু থাকা উচিত।")}</h2>
          <ul className="feature-list">
            {weddingPlanningContent.highlights.map((item) => (
              <li key={item}>{locale === "bn" ? item.replace("Guest list", "গেস্ট লিস্ট").replace("Vendor", "ভেন্ডর").replace("Shortlists", "শর্টলিস্ট").replace("A path to future vendor monetization and ad inventory without harming trust", "ভবিষ্যতের ভেন্ডর মনিটাইজেশন ও বিজ্ঞাপনের জায়গা, আস্থার ক্ষতি ছাড়াই") : item}</li>
            ))}
          </ul>
        </article>

        <article className="feature-panel tone-alt">
          <p className="section-kicker">{localeText(locale, "Commercial upside", "বাণিজ্যিক সম্ভাবনা")}</p>
          <h2>
            {localeText(
              locale,
              "Planning creates room for vendor billing, ads, and referrals without diluting trust.",
              "প্ল্যানিং ভেন্ডর বিলিং, বিজ্ঞাপন, এবং রেফারেলের জায়গা তৈরি করে, আস্থা নষ্ট না করেই।",
            )}
          </h2>
          <p>
            {localeText(
              locale,
              "The wedding layer is where member monetization, vendor monetization, and future AdSense-safe inventory start to overlap naturally.",
              "ওয়েডিং স্তরটি এমন জায়গা যেখানে মেম্বার আয়, ভেন্ডর আয়, এবং ভবিষ্যতের AdSense-safe ইনভেন্টরি স্বাভাবিকভাবে মিলে যায়।",
            )}
          </p>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">FAQs</p>
            <h2>{localeText(locale, "Common questions around the planning layer.", "প্ল্যানিং স্তর নিয়ে সাধারণ প্রশ্ন।")}</h2>
          </div>
          <p>
            {localeText(
              locale,
              "This content is intentionally public and indexable because it answers high-intent questions without exposing sensitive member information.",
              "এই কনটেন্ট ইচ্ছাকৃতভাবে পাবলিক ও ইনডেক্সযোগ্য, কারণ এটি সংবেদনশীল তথ্য ছাড়াই গুরুত্বপূর্ণ প্রশ্নের উত্তর দেয়।",
            )}
          </p>
        </div>

        <div className="card-grid">
          {weddingPlanningContent.faqs.map((faq) => (
            <article key={faq.question} className="info-card">
              <h3>{locale === "bn" ? faq.question.replace("Why include wedding planning in a matrimony platform?", "ম্যাট্রিমনি প্ল্যাটফর্মে ওয়েডিং প্ল্যানিং কেন?").replace("Will vendor pages be public?", "ভেন্ডর পেজ কি পাবলিক হবে?") : faq.question}</h3>
              <p>{locale === "bn" ? faq.answer.replace("Because the strongest long-term retention comes after the match, when members still need vendors, planning tools, and trusted referrals.", "কারণ সবচেয়ে শক্তিশালী দীর্ঘমেয়াদি রিটেনশন ম্যাচের পর আসে, যখন মেম্বারের এখনো ভেন্ডর, প্ল্যানিং টুল, এবং বিশ্বস্ত রেফারেল দরকার হয়।").replace("Yes. Public vendor pages are part of the SEO and monetization strategy while logged-in members can save shortlists inside planning flows.", "হ্যাঁ। পাবলিক ভেন্ডর পেজ SEO ও মনিটাইজেশন কৌশলের অংশ, আর লগ-ইন করা মেম্বাররা প্ল্যানিং ফ্লোর ভেতরে শর্টলিস্ট সেভ করতে পারে।") : faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
