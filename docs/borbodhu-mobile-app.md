# Borbodhu Mobile App

The new mobile workspace lives in `apps/mobile` and is built with Expo so it can target both Android and iPhone from one codebase.

## Current scope

- bilingual app shell for English and Bangla
- real login against the Borbodhu test API
- real member signup against the Borbodhu test API
- persisted mobile session using local storage
- role-aware dashboard loading for member, admin, super admin, vendor, and ghotok
- member mailbox with real conversation loading and message sending
- member wedding planning with project creation and guest add flow
- member vendor discovery with shortlist-to-project flow
- member profile editing and partner preference updates
- member photo-request decisions, media privacy toggles, and primary photo controls
- member phone-gallery photo upload using signed GCS upload URLs
- member camera capture flow for direct photo upload
- member membership order creation and order history
- member payment handoff state messaging for gateway vs manual approval flows
- member simulated gateway redirect handoff through the shared checkout session flow
- first-party mobile analytics for login, signup, and membership checkout funnel events
- admin review queue with approve/reject actions
- admin manual payment review with approve/reject actions
- vendor lead filtering and lead pipeline updates from mobile
- vendor profile editing from mobile
- vendor package creation plus pause/resume controls from mobile
- vendor package edit prefill from mobile
- ghotok managed-member creation plus start/end impersonation actions
- ghotok public-profile browsing with credit-backed contact unlock from mobile
- live mobile data from the same GCP test API used by the web app

## Run locally

From the repo root:

```bash
npm run dev:mobile
```

Open the Expo QR code with:

- Expo Go on Android
- Expo Go on iPhone

Or run directly:

```bash
npm run android:mobile
npm run ios:mobile
```

## Validate

Typecheck:

```bash
npm run typecheck:mobile
```

Export the web preview bundle:

```bash
npm run build:mobile:web
```

## Test accounts

- `member@borbodhu.local` / `Password123!`
- `admin@borbodhu.local` / `Password123!`
- `ghotok@borbodhu.local` / `Password123!`
- `vendor@borbodhu.local` / `Password123!`

## Mobile files

- `apps/mobile/App.tsx`
- `apps/mobile/src/lib/api.ts`
- `apps/mobile/src/lib/copy.ts`
- `apps/mobile/src/lib/session.ts`
- `apps/mobile/src/lib/types.ts`

## Next mobile slices

- deeper vendor package editing
- mobile profile/detail discovery for impersonated ghotok workflows
- app-level deep-link return handling for payment completion
