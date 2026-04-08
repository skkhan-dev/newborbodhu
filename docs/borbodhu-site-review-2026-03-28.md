# Borbodhu.com GCP Test Site — Full Review & Fix Plan

**Date**: 2026-03-28
**Reviewed by**: Claude (automated validation)
**Test URL**: https://borbodhu-web-test-508740568768.asia-south1.run.app
**Test account**: skkhan@gmail.com (member, m-55807)

---

## BUGS (Must Fix)

### 1. Dashboard "Search Profiles" doesn't render results
- **Severity**: HIGH
- **Location**: Dashboard sidebar > Search Profiles panel
- **Symptom**: Shows "7350 result(s)" counter but no profile cards render below the search form — just empty space then footer. "Search members" button doesn't trigger an API call.
- **Impact**: Primary in-dashboard discovery path is broken.
- **Fix**: The dashboard search panel needs to call the discovery API and render results in a card grid.

### 2. Messages/Mailbox is broken
- **Severity**: HIGH
- **Location**: Dashboard sidebar > Messages
- **Symptoms**:
  - Clicking a thread does NOT load its messages — always shows "No messages in this thread yet"
  - API returns HTTP 500 for `GET /v1/mailbox/conversations/legacy-conversation-XXXXX/messages`
  - Thread list shows raw member IDs (m-435304) instead of display names
  - Reply form shown even when no messages loaded
- **Impact**: Core communication feature is non-functional.
- **Fix**: Fix the mailbox API for legacy conversation IDs. Show display names in thread list. Hide reply form when no messages are available or thread fails to load.

### 3. Member search defaults produce 0 results on GCP
- **Severity**: HIGH (already fixed locally, needs deploy)
- **Location**: `/search` page
- **Root cause**: Default filters send `motherTongue=Bengali` (DB stores "Bangla") and `maritalStatus=Never Married` (most profiles NULL).
- **Status**: Code fix applied locally. Needs GCP deployment.
- **Files changed**:
  - `apps/web/components/member/member-search-page.tsx`
  - `apps/web/components/public-search-form.tsx`
  - `apps/web/components/public-home-shell.tsx`
  - `apps/web/components/multi-step-signup.tsx`
  - `apps/web/components/dashboard-page-client.tsx`

### 4. NextAuth session 500 errors
- **Severity**: MEDIUM
- **Location**: `/api/auth/session` — every page load
- **Root cause**: `NEXTAUTH_SECRET` env var missing on GCP Cloud Run.
- **Impact**: OAuth login (Google/Facebook) won't work. Console shows 2 errors per page load.
- **Fix**: Set `NEXTAUTH_SECRET` environment variable on GCP Cloud Run web service.

---

## UX ISSUES (Should Fix)

### 5. Two inconsistent search experiences
- **Location**: `/search` page vs Dashboard sidebar "Search Profiles"
- **Problem**: `/search` has full filters (mother tongue, country, keyword, height, education). Dashboard search is simpler (only Seeking, Age, Religion, Marital status). Different age defaults (18-28 vs 20-35).
- **Fix**: Dashboard sidebar "Search Profiles" should navigate to `/search` instead of rendering a separate in-dashboard search panel.

### 6. Search form should collapse after results load
- **Location**: `/search` page, `/profiles` page
- **Problem**: After search executes, the full search form still takes up the top half of the screen, pushing results below the fold.
- **Fix**: Auto-collapse the search form after results load. Show a "Modify search" button to re-expand.

### 7. No pagination on search results
- **Location**: `/search` page, `/profiles` page, dashboard search
- **Problem**: Shows "Showing 1-12 of 7,350" but no visible pagination controls beyond page 1.
- **Fix**: Add page numbers / prev-next buttons below results.

### 8. No profile navigation (prev/next) when viewing a profile
- **Location**: `/profiles/[displayId]` page
- **Problem**: When viewing a profile from search results, there's no way to go to next/previous result — only "Back to profiles" button.
- **Fix**: Add "Previous profile" / "Next profile" navigation within the search context.

### 9. Profile cards show raw data issues
- **Location**: Homepage recently active section, `/profiles` page, search results
- **Problems**:
  - Some profiles show "Borbodhu Member" as name (placeholder when displayName is empty)
  - Some profiles show raw database IDs like `cmn9x0gdh000llb1vex3o40cu`
  - District names are UPPERCASE (ESSORDI, KUSTIA, PABNA) — should be title case
- **Fix**: Display displayId when no name available. Sanitize/title-case district names. Never show raw DB IDs.

### 10. Sponsored Visibility section is placeholder
- **Location**: Homepage, below trust signals
- **Problem**: Shows "A configurable growth slot for trusted wedding brands" with "TEST MODE: DRAFT" label.
- **Fix**: Hide this section in production, or show real sponsored content.

---

## IMPROVEMENTS (Nice to Have)

### 11. Homepage hero — add imagery
- **Location**: Homepage hero section
- **Current**: Text-only with dark gradient background.
- **Recommendation**: Add warm Bangladeshi wedding imagery or illustration to build emotional trust.

### 12. Dashboard profile avatar shows placeholder
- **Location**: Dashboard overview, profile card
- **Problem**: Shows a cartoon panda avatar instead of the user's uploaded primary profile photo (2 photos are uploaded).
- **Fix**: Fetch and display the primary approved profile photo in the dashboard avatar.

### 13. Welcome banner shows username not real name
- **Location**: Dashboard welcome bar
- **Problem**: Shows "Welcome back, skkhan0829" instead of "Welcome back, Sumon".
- **Fix**: Use firstName or displayName from the profile API response.

### 14. Contact page — add phone numbers
- **Location**: `/contact` page
- **Problem**: Only shows email addresses. Production site prominently shows phone numbers.
- **Fix**: Add phone numbers (01912131377, 01716208791, 01748409910) to build trust for Bangladesh market.

### 15. Footer ACCOUNT column inconsistent
- **Location**: Site footer
- **Problem**: Footer shows "ACCOUNT" column (Register/Login/Dashboard/Reset password) only when logged out but not when logged in.
- **Fix**: When logged in, show relevant account links (Dashboard, Settings, Logout).

### 16. Mobile responsiveness
- **Status**: Not tested yet.
- **Recommendation**: Verify the full flow on mobile viewport (375px). Large portion of Bangladesh users will access via mobile.

### 17. Bangla locale coverage
- **Location**: Site-wide
- **Problem**: Language switcher exists in nav but most content stays in English.
- **Recommendation**: Before launch, key pages (homepage, search, signup, login, how-it-works) should have Bangla translations.

---

## PRIORITY ORDER

| Priority | Issue | Severity | Type |
|----------|-------|----------|------|
| P1 | #1 Dashboard Search Profiles broken | HIGH | Bug |
| P1 | #2 Messages/Mailbox broken | HIGH | Bug |
| P1 | #3 Search defaults 0 results (deploy) | HIGH | Bug |
| P2 | #5 Unify search experience | HIGH | UX |
| P2 | #7 Add pagination | HIGH | UX |
| P2 | #8 Profile prev/next navigation | MEDIUM | UX |
| P2 | #6 Collapse search form after results | MEDIUM | UX |
| P2 | #9 Profile card data issues | MEDIUM | UX |
| P3 | #4 NEXTAUTH_SECRET on GCP | MEDIUM | Bug |
| P3 | #12 Dashboard avatar placeholder | LOW | UX |
| P3 | #13 Welcome banner name | LOW | UX |
| P3 | #10 Sponsored section placeholder | LOW | UX |
| P3 | #14 Contact page phone numbers | LOW | Content |
| P3 | #15 Footer account column | LOW | UX |
| P4 | #11 Homepage hero imagery | LOW | Design |
| P4 | #16 Mobile responsiveness | MEDIUM | QA |
| P4 | #17 Bangla locale | MEDIUM | i18n |
