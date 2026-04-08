# Borbodhu.com — Final QA Issues & Remaining Fixes

**Date**: 2026-03-29
**QA method**: Full manual browser walkthrough — every page, every link, every sidebar section, both public and logged-in views

---

## BUGS (Must Fix)

### B1. Messages/Mailbox — API 500 on legacy conversations
- **Location**: Dashboard > Messages
- **Symptom**: Clicking a thread shows "No messages in this thread yet" because API returns HTTP 500 for `GET /v1/mailbox/conversations/legacy-conversation-XXXXX/messages`
- **Root cause**: Legacy conversation IDs created during migration may have data integrity issues (missing participants, null references)
- **Impact**: Core messaging feature broken for migrated conversations
- **Fix**: Debug the specific 500 error by checking server logs for the failing conversation ID. Likely needs a data fix or null-safe query.

### B2. "AI-powered suggestions" text still in How It Works Step 02
- **Location**: `/how-it-works` — Step 02 description
- **Symptom**: Body text says "Our AI-powered suggestions help you find compatible matches faster" — the feature card title was changed to "Smart Suggestions" but the step 02 body text wasn't updated
- **Fix**: Change Step 02 description to "Our smart suggestions help you find compatible matches faster"

### B3. Language toggle doesn't navigate to Bangla route
- **Location**: Globe icon in nav > Bangla option
- **Symptom**: Clicking বাংলা doesn't change the page URL to `/bn/` route. Content stays in English.
- **Impact**: Language switcher appears non-functional to users
- **Fix**: The button needs to navigate to the `/bn/` prefixed version of the current page

### B4. Bangla routes show mostly English content
- **Location**: `/bn/how-it-works`, `/bn/about`, etc.
- **Symptom**: Nav translates but page body content is entirely English. Only the homepage and a few components have `localeText()` bilingual support.
- **Impact**: Bangla language is advertised but not delivered
- **Fix**: Either hide the language toggle until Bangla content is ready, or add Bengali translations to key pages

---

## DATA ISSUES

### D1. Profile names showing "Borbodhu Member" or raw displayId
- **Location**: Profile cards, profile detail pages, homepage profile grids
- **Symptom**: Many legacy profiles show "Borbodhu Member" (placeholder) or member IDs like "m-82643" instead of actual names. The profile detail page for m-435331 shows "Borbodhu Member" as the headline.
- **Fix**: Run the backfill migration script (`scripts/backfill-display-names-districts.ts`) on GCP Cloud SQL to populate displayName from firstName

### D2. Raw cuid IDs visible as displayId on some profiles
- **Location**: Profile cards — "Amina" shows `cmn9×0gdh000llb1vex3o40cu` as the sub-text
- **Fix**: The `cleanPublicName` function filters cuid-like strings from names but the `displayId` line itself shows whatever the API returns. Need to either hide displayId when it's a cuid, or fix the data to assign proper display IDs

### D3. District/city names still uppercase in dashboard views
- **Location**: Dashboard > AI Suggestions cards show "KUSTIA, BD"
- **Symptom**: The `titleCase()` fix was applied to member-search-page.tsx and public-profile-card.tsx but NOT to the dashboard-page-client.tsx discovery/AI results card rendering
- **Fix**: Apply `titleCase()` to location display in dashboard card rendering (lines ~2702-2703 in dashboard-page-client.tsx)

---

## UX ISSUES

### U1. Homepage quick search has too many filters visible
- **Location**: Homepage right sidebar search panel
- **Symptom**: 10 filter fields immediately visible (gender, seeking, age from/to, religion, country, marital status, mother tongue, education, profession, keyword, sort). Overwhelming for first-time visitors.
- **Fix**: Show only 4 fields by default (Gender, Age, Religion, Country). Add "More filters" expandable section.

### U2. Sponsored visibility section still visible on homepage
- **Location**: Homepage — between hero and "How it works"
- **Symptom**: Shows "A configurable growth slot for trusted wedding brands" with test-mode indicators. Not harmful but looks unfinished.
- **Fix**: Hide this section until real sponsor content is configured

### U3. Login/Signup pages accessible while logged in
- **Location**: `/login`, `/signup`, `/signup/vendor`, `/forgot-password`
- **Symptom**: These pages are accessible even when already logged in. `/signup/vendor` redirects to dashboard but the others show the forms. A logged-in user shouldn't see a login form.
- **Fix**: Add redirect to dashboard if user is already authenticated

### U4. "Express interest" button on profile page goes to /dashboard
- **Location**: Profile detail page action buttons
- **Symptom**: When logged in, "Express interest" links to `/dashboard` instead of triggering the interest API directly. User has to navigate away from the profile.
- **Fix**: Make this a client-side action that calls the interest API and shows a success toast

### U5. Profile page title shows "borbodhu.com" twice
- **Location**: Browser tab title for profile pages
- **Symptom**: Title shows "Borbodhu Member, 24 — Student | Bangladeshi Matrimony | borbodhu.com | borbodhu.com" — the suffix is duplicated
- **Fix**: Check the metadata template — likely the page sets a title that already includes "borbodhu.com" and the template adds it again

### U6. Cookie consent banner overlaps with mobile sticky CTA
- **Location**: Mobile viewport, bottom of page
- **Symptom**: Both the cookie consent banner and the mobile sticky CTA bar are positioned at the bottom. They may stack or overlap.
- **Fix**: Hide the mobile sticky CTA while the cookie consent is visible, or position one above the other

---

## CONTENT ISSUES

### C1. Homepage "How it works" Bengali kicker text is internal
- **Location**: Homepage > How it works section kicker
- **Symptom**: Bengali kicker says "এখন বরবধূ কীভাবে কাজ করছে" which translates to "How Borbodhu is working now" (internal documentation tone)
- **Fix**: Change to "কিভাবে কাজ করে" (standard "How it works")

### C2. Profiles page hero copy is developer-facing
- **Location**: `/profiles` page hero
- **Symptom**: "Search Bangladeshi matrimony profiles the way Borbodhu is actually used" — the phrase "actually used" is internal language. The body copy explains search mechanics rather than user benefits.
- **Fix**: Simplify to "Search verified Bangladeshi matrimony profiles" with benefit-focused body copy

### C3. Ghotok page hero copy is developer-facing
- **Location**: `/ghotok` page hero
- **Symptom**: "Family-guided introductions still matter, and Borbodhu now treats ghotoks as a real product pillar" — "real product pillar" is internal product thinking, not customer messaging
- **Fix**: Rewrite to focus on user value: "Find trusted matchmakers who understand Bangladeshi family values"

---

## PRIORITY ORDER

### Immediate (before launch)
1. B2 — Fix "AI-powered" text in How It Works step 02 (1 minute)
2. B3 — Fix language toggle navigation (30 minutes)
3. D1 — Run displayName backfill migration on GCP (run script)
4. D3 — Apply titleCase to dashboard card locations (5 minutes)
5. U5 — Fix duplicate "borbodhu.com" in profile page titles (5 minutes)
6. C1 — Fix Bengali kicker in "How it works" section (1 minute)
7. C2 — Rewrite profiles page hero copy (10 minutes)
8. C3 — Rewrite ghotok page hero copy (10 minutes)
9. U2 — Hide sponsored section when no real sponsor (10 minutes)

### Soon after launch
10. B1 — Debug and fix mailbox API 500 for legacy conversations
11. U1 — Simplify homepage quick search (collapse extra filters)
12. U3 — Redirect login/signup when already logged in
13. U4 — Make "Express interest" a real action on profile page
14. D2 — Fix raw cuid displayIds in profile data
15. B4 — Either add Bangla translations or hide language toggle

### Polish
16. U6 — Cookie consent vs mobile CTA overlap fix
