# Borbodhu.com — Production Readiness & Competitive Improvement Plan

**Date**: 2026-03-29
**Scope**: Make all public-facing pages production-ready, improve UX/content for competitive differentiation

---

## Executive Summary

The new borbodhu.com is 75% production-ready. Most pages (About, Pricing, Contact, Privacy, Terms, Login, Signup, Ghotok, Forgot Password) are polished and professional. Three pages contain internal/developer language that must be cleaned before launch. Beyond cleanup, there are strategic improvements that will help Borbodhu stand out in a crowded market of 300+ Bangladeshi matrimony sites.

---

## PART 1: CRITICAL FIXES (Must Do Before Launch)

### 1.1 Homepage Hero — Remove Internal Documentation Copy
**File**: `apps/web/components/public-home-shell.tsx`
**Issue**: The hero section eyebrow contains internal documentation in Bengali ("TRUSTED BANGLADESHI MATRIMONY MEMBER, GHOTOK, WEDDING, VENDOR") that reads like a feature list/spec rather than a tagline.
**Fix**: Replace with a warm, emotionally resonant eyebrow — e.g., "বিশ্বস্ত বাংলাদেশী বিবাহ · Trusted Since 2009" or "পরিবারের জন্য, পরিবারের দ্বারা · For Families, By Family"

### 1.2 Wedding Planning Page — Remove Business Strategy Language
**File**: `apps/web/app/wedding-planning/page.tsx` + `apps/web/lib/wedding-planning-content.ts`
**Issue**: Eyebrow says "Launch 1 growth and retention layer." The "Commercial upside" panel discusses "AdSense-safe inventory" and "vendor monetization." Visitors see internal business strategy.
**Fix**:
- Change eyebrow to "Plan Your Bangladeshi Wedding"
- Replace "Commercial upside" panel with user-facing benefits: "Everything in one place — from finding your match to planning your wedding day"

### 1.3 Matrimony Index — Remove SEO Jargon
**File**: `apps/web/app/matrimony/page.tsx`
**Issue**: Hero copy references "search-intent landing pages" and "4 search-intent landing pages" — marketing jargon not meaningful to users.
**Fix**: Replace with "Explore matrimony guides for Bangladesh and diaspora communities"

### 1.4 Sponsored Visibility Section — Hide in Production
**File**: `apps/web/components/public-home-shell.tsx` / `public-sponsor-slot.tsx`
**Issue**: Homepage shows "A configurable growth slot for trusted wedding brands" with "TEST MODE: DRAFT" — internal ad slot placeholder.
**Fix**: Hide this section entirely until real sponsor content is available. The `isPlacementEnabled()` check should return false when no real sponsor is configured.

### 1.5 Profile Card Data Cleanup
**Issue**: Some profile cards still show:
- Raw cuid IDs like `cmn9x0gdh000llb1vex3o40cu` as displayId (visible under profile names)
- Some district names still uppercase in certain views
**Fix**:
- In the public profile card, hide displayId when it looks like a raw cuid (already partially fixed — verify the public-profiles-shell applies the same cleanup)
- Apply `titleCase()` consistently across all profile rendering paths

### 1.6 "How It Works" — Verify AI Matching Claim
**File**: `apps/web/app/how-it-works/page.tsx`
**Issue**: Lists "AI-Powered Matching" as a feature. If this isn't implemented yet, it's a false claim.
**Fix**: Either verify the feature works or change to "Smart Matching" with a description that covers the existing preference-based discovery

---

## PART 2: UX & USABILITY IMPROVEMENTS

### 2.1 Homepage Quick Search — Simplify Defaults
**Current**: 10 filter fields visible immediately (I am a, Seeking, Age from/to, Religion, Country, Marital status, Mother tongue, Education, Profession, Keyword, Sort by)
**Problem**: Overwhelming for first-time visitors. The production site has a simpler search.
**Fix**: Show only 4 fields by default (Gender seeking, Age range, Religion, Country). Add "More filters" expandable link for the rest.

### 2.2 Homepage — Add Success Stories / Testimonials
**Current**: No social proof beyond profile count badge.
**Competitor advantage**: BibahaBD, Taslima, and others prominently feature success stories.
**Fix**: Add a "Happy couples" or "Success stories" section between the profile grid and the persona cards. Even 2-3 testimonials with first names and districts adds powerful trust.

### 2.3 Homepage — Add "How Borbodhu is Different" Section
**Current**: Trust signals exist but are scattered (admin-reviewed, private photos, diaspora-friendly).
**Fix**: Create a focused comparison section or "Why families choose Borbodhu" block highlighting:
- Every profile is admin-reviewed (competitors don't do this)
- Ghotok network built-in (unique differentiator)
- Private by default (photos, contact hidden until mutual consent)
- Bangladesh + global diaspora (UK, US, Canada, Middle East)
- Wedding planning continues the journey after the match

### 2.4 Homepage Profile Cards — Add "New" Badge for Recent Signups
**Current**: All cards show "Verified" badge only.
**Fix**: Add a "New" badge for profiles created in the last 7 days. This signals platform activity and freshness.

### 2.5 Navigation — Add "Success Stories" Link
**Current nav**: Profiles, How It Works, Pricing, Log In, Join Free
**Fix**: Add "Success Stories" between Profiles and How It Works (when available)

### 2.6 Mobile CTA — Sticky Bottom Bar
**Current**: No mobile-specific CTA
**Fix**: Add a sticky bottom bar on mobile with "Join Free" and "Log In" buttons that stay visible while scrolling

---

## PART 3: CONTENT & MESSAGING IMPROVEMENTS

### 3.1 Mission Statement — Sharpen the Positioning
**Current tagline**: "Find your life partner — trusted Bangladeshi matrimony for home and diaspora."
**Problem**: Generic — could be any matrimony site. Doesn't communicate the unique Borbodhu value.
**Recommended taglines** (pick one):
1. "Where Bangladeshi families find trusted matches — at home and across the world."
2. "Family-first matrimony. Admin-verified. Private by design."
3. "The matrimony platform Bangladeshi families actually trust."

**Recommended mission statement** (for About page hero):
"Borbodhu exists because finding a life partner should be safe, respectful, and rooted in family values — whether your family is in Dhaka, London, or New York. Every profile is verified by our team. Every photo is private until you choose to share. Every connection is guided by trust."

### 3.2 Value Proposition Chips — Rewrite for Clarity
**Current chips on homepage**: "7,350 publicly searchable profiles", "Man / Woman member language", "Bangladesh and diaspora"
**Problem**: "Man / Woman member language" is confusing — what does this mean to a visitor?
**Fix**: Replace with clearer, benefit-focused chips:
- "7,350+ verified profiles"
- "100% admin-reviewed"
- "Bangladesh + 40 countries"

### 3.3 Page Titles — Add Bengali Throughout
**Current**: Most page titles are English-only: "About Borbodhu | Trusted Bangladeshi Matrimony"
**Fix**: Add Bengali to key page titles for SEO and cultural resonance:
- "About Borbodhu | বরবধূ সম্পর্কে | Trusted Bangladeshi Matrimony"
- "How It Works | কিভাবে কাজ করে | Borbodhu"

### 3.4 Upgrade Page — Add Social Proof
**Current**: Plans listed with features but no social proof.
**Fix**: Add "X members upgraded this month" counter or "Most chosen" badge on the popular plan.

---

## PART 4: COMPETITIVE DIFFERENTIATION

### 4.1 Borbodhu's Unique Advantages (to emphasize in messaging)
Based on competitive analysis of BibahaBD, Taslima, SensibleMatch, 99MarriageGuru, Shaadi, and others:

| Advantage | Borbodhu | Competitors |
|-----------|----------|-------------|
| Admin-reviewed profiles | Every profile | Some/partial |
| Built-in Ghotok network | Native platform | None (offline only) |
| Private-by-default photos | Yes, with request system | Most show photos publicly |
| Wedding planning built-in | Yes (vendors, guest list) | None |
| Diaspora-first design | Bangladesh + global | Mostly Bangladesh-only |
| Modern tech (PWA, mobile) | Yes | Most are legacy PHP |
| Bilingual (English + Bangla) | Yes | Few |

### 4.2 Competitive Positioning Statement
Add this somewhere visible (About page or homepage):

"Most matrimony sites show everything publicly and hope for the best. Borbodhu is built differently — every profile is reviewed by our team before it goes live, photos stay private until both sides agree, and professional Ghotoks are part of the platform, not outside it. We serve Bangladeshi families in 40+ countries because finding a life partner shouldn't depend on where you live."

### 4.3 SEO Content Strategy
The matrimony market pages (`/matrimony/bangladesh`, `/matrimony/diaspora`) are a good start. Expand with:
- `/matrimony/uk` — Bangladeshi matrimony in UK
- `/matrimony/usa` — Bangladeshi matrimony in USA
- `/matrimony/muslim` — Muslim Bangladeshi matrimony
- Blog/guide content: "How to write a good matrimony profile", "What families should know about online matrimony"

---

## PART 5: VISUAL & DESIGN POLISH

### 5.1 Homepage Hero — Add Visual Warmth
**Current**: Dark maroon gradient with text only. No imagery.
**Fix**: Add a subtle background pattern (jamdani textile motif) or a blurred photo of a happy Bangladeshi couple. The design language doc mentions "warm ivory, jamdani gold, deep maroon" — lean into this.

### 5.2 Profile Cards — Consistent Photo Aspect Ratio
**Current**: Photo placeholders show letter initials with gradient backgrounds. Some photos are cropped differently.
**Fix**: Enforce consistent 4:5 aspect ratio on all profile card photos. Add subtle border/shadow to cards for depth.

### 5.3 Trust Indicators — Add Verification Badge Design
**Current**: Green "Verified" text badge on cards.
**Fix**: Design a distinctive Borbodhu verified badge (small shield or checkmark icon) that becomes a recognizable brand element.

### 5.4 Typography Polish
**Current**: Clean Inter font throughout.
**Fix**: Use Playfair Display (already loaded) more prominently for hero headings to add warmth and premium feel. The current headings are all sans-serif which feels tech-platform, not matrimony-warm.

---

## PART 6: ORGANIC GROWTH ENABLERS

### 6.1 Shareable Profile Cards
**Fix**: Add "Share this profile with family" button on public profiles that generates a clean shareable link (WhatsApp, Facebook, copy link). Families share profiles — make it frictionless.

### 6.2 Referral Program
**Fix**: Add "Invite a friend" flow — when a referred user signs up, both get a small benefit (extended free trial, profile highlight). Word-of-mouth is #1 growth channel for matrimony.

### 6.3 WhatsApp Integration
**Fix**: Add WhatsApp share buttons alongside profile sharing. Most Bangladeshi families coordinate via WhatsApp. A "Share on WhatsApp" button with pre-filled text like "Check this profile on Borbodhu: [link]" drives organic sharing.

### 6.4 SEO Metadata Enhancement
**Fix**: Add OpenGraph and Twitter card metadata to all pages so shared links show rich previews with the Borbodhu branding, profile photo thumbnails, etc.

### 6.5 Google Structured Data
**Current**: JSON-LD exists for Organization and WebSite on layout.
**Fix**: Add FAQ structured data to the pricing page (already has FAQ content), contact page, and how-it-works page for rich search results.

---

## EXECUTION PRIORITY

### Phase 1: Content Cleanup (1 day)
- 1.1 Fix homepage hero eyebrow copy
- 1.2 Fix wedding planning page internal language
- 1.3 Fix matrimony index jargon
- 1.4 Hide sponsored placeholder
- 1.5 Profile card data cleanup
- 1.6 Verify/fix AI matching claim
- 3.2 Fix value proposition chips
- 3.1 Sharpen tagline

### Phase 2: UX Quick Wins (1-2 days)
- 2.1 Simplify homepage quick search defaults
- 2.3 Add "Why families choose Borbodhu" section
- 5.4 Typography polish (Playfair Display for heroes)
- 3.3 Bilingual page titles

### Phase 3: Trust & Growth (3-5 days)
- 2.2 Success stories section
- 6.1 Shareable profile cards (WhatsApp/copy link)
- 6.4 OpenGraph metadata
- 6.5 FAQ structured data
- 4.2 Competitive positioning statement
- 3.4 Upgrade page social proof
- 2.4 "New" badge on recent profiles
- 5.1 Homepage hero visual warmth

### Phase 4: Growth Infrastructure (1-2 weeks)
- 6.2 Referral program
- 6.3 WhatsApp deep integration
- 4.3 SEO market pages expansion
- 2.6 Mobile sticky CTA bar
- 2.5 Success stories nav link
