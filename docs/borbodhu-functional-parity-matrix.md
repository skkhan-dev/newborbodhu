# Borbodhu Functional Parity Matrix

## Status legend

- `Baseline only` = confirmed on live system, not yet implemented in new build
- `In progress` = being implemented in new build
- `Ready for QA` = available in new build and should be tested against live behavior
- `Intentional change` = new flow intentionally differs from legacy

## Public and guest

| Module | Live baseline | New build status | Notes |
| --- | --- | --- | --- |
| Homepage trust messaging | Yes | In progress | UI foundation started |
| English version | Yes | In progress | Planned as separate route tree |
| Bangla version | Yes | In progress | Planned as separate route tree |
| Search preview | Yes | In progress | UX defined |
| SEO landing pages | Partial | Ready for QA | Matrimony market pages, wedding planning page, sitemap, and robots are live |
| Sponsored public placements | Future/partial | Ready for QA | Home, vendors, and wedding pages now read live public config and render review-safe sponsor inventory |
| Public profile summary | Partial | Ready for QA | Public API plus server-rendered privacy-safe pages implemented |
| Wedding pages | Partial | Ready for QA | Wedding project APIs implemented |
| Vendor pages | Yes | Ready for QA | Directory and detail APIs implemented |
| Public Ghotok pages | Partial | Ready for QA | Public directory and detail pages implemented with privacy-safe summaries |

## Member

| Module | Live baseline | New build status | Notes |
| --- | --- | --- | --- |
| Signup | Yes | Ready for QA | Auth register API implemented with Man / Woman language |
| Login and logout | Yes | Ready for QA | Login and actor session API implemented |
| Password reset | Yes | Ready for QA | Reset token flow implemented |
| Profile create and edit | Yes | Ready for QA | Profile and preference APIs implemented |
| Photo upload | Yes | Ready for QA | Signed GCS upload request, media registration, and review APIs implemented |
| Private photo request | Yes | Ready for QA | Request and decision APIs implemented |
| Favorites | Yes | Ready for QA | Interaction API implemented |
| Blocks | Yes | Ready for QA | Interaction API implemented |
| Visitors | Yes | Ready for QA | Profile detail endpoint records visits and visitors API is implemented |
| Search | Yes | Ready for QA | Discovery API implemented |
| Saved search | Yes | Ready for QA | Saved search CRUD APIs implemented |
| Messaging | Yes | Ready for QA | Conversation and send-message APIs implemented with upgrade gate |
| Membership upgrade | Yes | Ready for QA | Plan list, preview, and order APIs implemented |
| Coupon redemption | Yes | Ready for QA | Coupon validation wired into billing preview and order |
| Wedding planning | Partial | Ready for QA | Project, guest, and shortlist APIs implemented |

## Ghotok

| Module | Live baseline | New build status | Notes |
| --- | --- | --- | --- |
| Ghotok login | Yes | Ready for QA | Shared auth module implemented |
| Managed member create | Yes | Ready for QA | Managed member creation API implemented |
| Managed member edit | Yes | Baseline only | Planned next |
| Managed member approval tracking | Yes | Ready for QA | Dashboard and list show approval state |
| Credit wallet | Yes | Ready for QA | Dashboard returns wallet balance |
| Credit ledger | Yes | Ready for QA | Dashboard returns recent ledger |
| Impersonation | Yes | Ready for QA | Active session start/end APIs implemented |
| Contact credit use | Yes | Ready for QA | Credit-based contact view implemented with wallet deduction and unlock record |

## Vendor

| Module | Live baseline | New build status | Notes |
| --- | --- | --- | --- |
| Vendor directory listing | Yes | Ready for QA | Public directory API implemented |
| Vendor self-service | Partial | Ready for QA | Browser signup, profile edit, package publish/pause, and vendor dashboard lead management are live |
| Vendor login | Partial | Ready for QA | Shared auth module implemented |
| Vendor packages | Partial | Ready for QA | Vendors can now create packages and toggle active state from the dashboard |
| Vendor leads | Partial | Ready for QA | Public and member lead capture now feed the vendor dashboard and notification outbox |
| Vendor billing | Future/partial | In progress | Billing state exists and the self-service flow is ready for future paid vendor plans |

## Admin and super admin

| Module | Live baseline | New build status | Notes |
| --- | --- | --- | --- |
| Admin login | Yes | Ready for QA | Shared auth module implemented |
| Review queue | Yes | Ready for QA | Queue API implemented |
| Approve or reject profile | Yes | Ready for QA | Review actions implemented with audit log |
| Photo moderation | Yes | Ready for QA | Pending media queue and review actions implemented |
| Manual payment approval | Yes | Ready for QA | Approval-only activation implemented |
| Super admin console | Yes | Ready for QA | Overview, admin management, plans, coupons, and reporting APIs/UI implemented |
| Membership configuration | Yes | Ready for QA | Super admin plan config APIs and browser UI implemented |
| Coupon management | Yes | Ready for QA | Coupon create/list/toggle APIs and browser UI implemented |
| Admin permissions | Yes | In progress | Permission storage and super admin editing implemented, enforcement still to expand |
| Match mail config | Yes | Ready for QA | Persistent settings, audience preview, and queue-now flow implemented |
| Campaign mailing | Yes | Ready for QA | Super admin preview and queue flow implemented with notification outbox reuse |
| Analytics dashboard | Partial | Ready for QA | Super admin revenue and profile range summaries implemented; warehouse layer still planned |
| Commercial settings | Future/partial | Ready for QA | Super admin payment visibility, AdSense mode, and sponsored slot configuration are live in API and dashboard |
| Migration load execution | Partial | Ready for QA | Cloud Run sample load job now imports legacy-shaped TSV snapshots into the test stack |

## Current implementation note

The new build currently includes:

- workspace scaffold
- implemented web foundation
- persona flow review route
- implementation docs
- parity QA plan
- compiled NestJS API scaffold
- Prisma schema and initial SQL migration
- local seed script for admin, member, ghotok, vendor, plans, coupon, and wedding sample
- auth APIs
- member profile and discovery APIs
- billing and manual approval APIs
- payment confirmation webhooks
- admin review APIs
- mailbox APIs
- notifications outbox model
- member media and photo moderation APIs
- signed Google Cloud Storage upload flow for member media
- profile detail, visitors, saved search, and contact unlock APIs
- vendor directory APIs
- wedding planning APIs
- ghotok dashboard, managed-member, impersonation, and credit-use APIs
- super admin overview, admin management, membership plan config, coupon management, and reporting APIs
- match mail settings, audience preview, queue-now execution, and campaign mail APIs
- browser super admin workspace inside the live dashboard
- browser super admin mailing workspace inside the live dashboard
- browser super admin commercial settings workspace inside the live dashboard
- public Ghotok directory and detail pages
- public matrimony landing pages for Bangladesh and diaspora markets
- public wedding planning landing page
- public sponsored placement cards driven by live commercial config
- sitemap and robots generation
- legacy-password login fallback with transparent rehash on successful sign-in
- runnable legacy sample-load job inside GCP for ETL validation
- vendor browser signup flow
- vendor profile editing, package publishing, and lead-status updates
- public vendor lead capture and member-linked vendor inquiries

Backend parity status has moved into `Ready for QA` for the modules above. The GCP test stack has also been validated for dual-hostname browser access, including API CORS and GCS upload CORS from both Borbodhu test web URLs. Migration ETL now has a runnable in-GCP validation path, and the remaining major gaps are broader cutover reconciliation, fuller locale coverage, and deeper vendor commerce flows.
