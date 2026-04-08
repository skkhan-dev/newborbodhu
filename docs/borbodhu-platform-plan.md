# Borbodhu Platform Discovery Plan

## 1. What I found so far

Based on the current repository and the live site on March 19, 2026:

- The local repository is only a prototype workspace right now, not the production codebase.
- The live site is a legacy server-rendered PHP application, very likely CodeIgniter-based.
- Evidence:
  - Routes use `/index.php/...`
  - Session cookie name is `ci_session`
  - Views are served from `/application/views/...`
- The live platform already has separate entry points for:
  - Member site
  - Admin panel
  - Ghotok / matchmaker portal
- The public site still uses older frontend patterns:
  - table-based layout
  - jQuery 1.7
  - separate legacy CSS files
  - mixed PHP session handling
- The public flows already expose a broad data model:
  - personal profile data
  - family details
  - religion and community details
  - education and occupation
  - location and diaspora location
  - partner preferences
  - photo upload
  - advanced search
  - district search
  - country search
  - photo search
- The live navigation and indexed routes suggest Borbodhu has already offered or referenced:
  - online matrimony
  - assisted matrimony
  - upgrade and payment
  - mobile alert
  - meeting room
  - video meeting
  - verify profile
  - wedding planner
- The public homepage links to an Android app, but I have not yet confirmed an iOS app listing.
- The current product has social login links for Google and Facebook.

## 1.1 Live server audit snapshot

I also inspected the production server directly over SSH on March 19, 2026.

### Confirmed legacy platform shape

- App root: `/home/borbodhu/public_html`
- Framework: legacy `CodeIgniter`
- Database: `MySQL/MariaDB`
- Web server: `nginx`
- Mobile/API code already exists inside the same server tree

### Important production folders

- `application/`
- `uploads/`
- `protected_uploads/`
- `mobile/`
- `api/`
- `directory/`

### Media/storage findings

- `uploads/` is about `2.3 GB`
- `protected_uploads/` is about `3.0 MB`
- legacy `mobile/` code is still present
- legacy `api/` PHP endpoints are still present

### Database findings

- Total tables in the live database: `92`
- There is already a recent dump on the server: `borbodhu_newborbodhu1.sql.gz`

### Key production row counts

- `tbl_user`: `179,259`
- `tbl_partnerprofile`: `129,762`
- `tbl_usersnaps`: `122,569`
- `tbl_mailbox`: `273,043`
- `tbl_payment`: `31,810`
- `tbl_picture_request`: `152,303`
- `tbl_favourite_ignore`: `113,755`
- `tbl_views_winks`: `3,346,853`
- `tbl_ghotok_user`: `662`
- `tbl_dir_business`: `288`
- `tbl_admin`: `4`

### Recent-history migration finding

- Mailbox rows in the last 6 months: about `1,909`

This is good news. Your requested 6-month mailbox migration is very feasible.

### Existing launch-relevant features already in production

- coupons
- coupon redemptions
- admin permissions
- admin action history
- audit logs
- support tickets
- auto match mail configuration
- device tokens
- mobile notification dismissal tracking
- ghotok wallets and credit transactions
- vendor directory
- wedding guest list

### Legacy constraints that strongly support a rebuild

- member and admin passwords are stored in `varchar(32)`, which strongly suggests legacy hashing
- many modules exist as overlapping old and new controllers
- the route file contains both legacy routes and newer compatibility APIs
- business logic is spread across monolith controllers, legacy API scripts, and newer API controllers

## 2. Product direction I recommend

Do not rebuild the old site screen-by-screen.

Instead, rebuild Borbodhu as one modern platform with shared business logic and four core actor experiences:

1. Member
2. Admin
3. Super Admin
4. Ghotok

Phase 2 can add a fifth structured actor if needed:

5. Wedding vendor

The product should feel:

- trustworthy for parents and guardians
- modern enough for younger users in Bangladesh and the diaspora
- culturally aware without looking dated
- safe, verified, and premium
- bilingual from the data model upward, not translated as an afterthought

## 3. Recommended platform architecture

### Frontend

- Web: `Next.js` with TypeScript
- Mobile apps: `React Native` with Expo for Android and iPhone
- Shared UI and domain packages in a monorepo

Why this is my recommendation:

- one TypeScript ecosystem across web, apps, and shared validation
- fast delivery for both member-facing app stores
- strong support for bilingual UI, push notifications, media upload, and auth
- easier long-term hiring and maintenance than a split stack

### Backend

- API: `NestJS` with TypeScript
- Database: `PostgreSQL`
- Cache and queues: `Redis`
- Object storage: `Google Cloud Storage`
- Search: start with optimized PostgreSQL search and denormalized search tables
- Background jobs: queue workers for mail, notifications, match mail, imports, and image processing

### Infrastructure on GCP

- Frontend hosting: `Cloud Run` or `App Hosting` for Next.js
- API: `Cloud Run`
- Database: `Cloud SQL for PostgreSQL`
- File storage: `Cloud Storage`
- CDN and protection: `Cloud CDN` + `Cloud Armor`
- Secrets: `Secret Manager`
- Monitoring: `Cloud Logging`, `Cloud Monitoring`, `Error Reporting`
- CI/CD: GitHub Actions or Cloud Build

This keeps the stack modern, scalable, and much easier to operate than a VM-centered rebuild.

## 4. Core product modules

### A. Public website

- homepage
- pricing
- assisted matrimony / ghotok service
- success stories
- FAQ
- blog and advice
- wedding planning landing pages
- country and city SEO pages
- Bengali and English content routing

### B. Member experience

- signup and login
- forgot password and password reset
- profile creation
- profile completion scoring
- photo upload and privacy
- interest sending
- favorites
- blocks
- profile visitors
- who liked or favorited you
- inbox and mailbox
- match recommendations
- quick search
- advanced search
- photo search
- saved searches
- upgrade and checkout
- payment history
- account settings

### C. Admin experience

- pending profile review queue
- profile approval and rejection with notes
- profile editing before approval
- image review
- cancellation requests
- permanent profile closure
- invalid profile deletion
- membership upgrade and adjustment
- manual payment assignment
- coupon creation
- reporting dashboard
- activity dashboard

### D. Super Admin experience

- admin management
- password reset and role control
- ghotok management
- membership type management
- credit management
- pricing and configuration
- site-wide settings
- reporting across date ranges
- scheduled mailing
- match mail automation
- audit logs

### E. Ghotok experience

- login portal
- create and manage member profiles
- edit owned profiles
- track approval state
- impersonate member with audit trail
- use prepaid credits
- request additional credits
- view credit ledger
- see saved and active members

### F. Wedding planning

I recommend making this a separate product area, but still under the same account system:

- guest list
- shortlist vendors
- filter by location and category
- planning checklist
- vendor inquiry tracking

If we force this into the first launch, it will stretch timeline and migration risk. It is better as Phase 3 or Phase 4 unless it already drives meaningful revenue today.

## 5. Target domain model

These are the main entities I would model first:

- `users`
- `roles`
- `member_profiles`
- `member_profile_revisions`
- `profile_status_history`
- `profile_images`
- `photo_access_requests`
- `photo_access_grants`
- `partner_preferences`
- `interests`
- `favorites`
- `blocks`
- `profile_visits`
- `messages`
- `message_threads`
- `notifications`
- `saved_searches`
- `search_runs`
- `memberships`
- `membership_plans`
- `membership_subscriptions`
- `payments`
- `payment_methods`
- `coupons`
- `coupon_redemptions`
- `admins`
- `ghotoks`
- `ghotok_profiles`
- `ghotok_credit_accounts`
- `ghotok_credit_ledger`
- `mail_campaigns`
- `match_mail_rules`
- `email_templates`
- `vendors`
- `vendor_categories`
- `wedding_projects`
- `wedding_guest_lists`
- `wedding_shortlists`
- `audit_logs`

### Important profile fields to preserve and normalize

From the current live signup and search structure, Borbodhu clearly needs support for:

- gender
- looking for
- date of birth and age
- marital status
- children
- height
- body type
- complexion
- blood group
- special cases
- religion
- religion subgroup
- religion practice or community type
- mother tongue
- family values
- father, mother, siblings
- education
- major
- university
- profession
- designation
- residence status
- current living country
- city and area
- home country
- home district
- about me
- about family
- partner age range
- partner marital status
- partner children preference
- partner height range
- partner religion and subgroup
- partner education
- partner profession
- partner country and district preferences
- diet, smoke, drink preferences

Bangladeshi and diaspora extensions I recommend adding in the new model:

- guardian or wali details
- ghotok ownership
- family involvement level
- relocation preference
- visa or immigration openness
- Islamic mahr preference
- Hindu community or gotra fields where needed
- whether photos are public, blurred, or private
- contact visibility rules
- language preference for UI and email

## 6. Migration strategy

This is the most important part of the project.

We are not just redesigning. We are replacing a live system with history.

### Migration objectives

- preserve members
- preserve profile content
- preserve partner preferences
- preserve image assets
- preserve membership state
- preserve interests and favorites
- preserve blocks and privacy
- preserve mailbox history if possible
- preserve ghotok ownership and credits
- preserve admin review status
- minimize downtime

### Migration workstreams

1. Source audit
- inventory current database schema
- inventory media storage and file naming
- inventory cron jobs
- inventory email sending logic
- inventory payment records and membership expiry logic
- inventory status codes

2. Mapping
- map old tables to new canonical entities
- define code mapping for all status values
- define transformations for text fields, dates, enums, and images

3. Import pipeline
- write repeatable ETL scripts
- run dry-run imports into staging
- validate record counts
- validate image references
- validate random sample of migrated profiles

4. Delta sync
- keep old and new in sync during transition window
- freeze write-heavy features for a short cutover period if needed

5. Cutover
- final import
- DNS switch
- smoke test all actor flows
- monitor errors and rollback plan

### Data I expect we must migrate

- accounts and credentials
- profile fields
- partner preference fields
- photos
- approval history
- plan purchases
- plan expiration dates
- interest history
- favorites
- blocks
- inbox messages
- ghotok credit balances
- admin-created adjustments
- coupon data if active

## 7. Search and matching strategy

The current site already has heavy search expectations. That means search is a product pillar, not just a filter page.

### Search surfaces

- quick search
- advanced search
- photo search
- district search
- country search
- saved search
- recommended matches
- new members
- most active
- recent login
- ghotok profiles

### Recommended implementation

- canonical searchable profile table
- precomputed search facets
- indexed sorting fields for:
  - join date
  - last login
  - activity score
  - paid priority
  - photo availability
  - verification score
- nightly and event-driven match scoring jobs
- saved search alerts

### Matching model

Start with rules-based compatibility first:

- gender and target gender
- age range
- religion and subgroup
- country and district preferences
- marital status
- education and profession bands
- family involvement alignment

Then add explainable scoring:

- "Matches because both prefer Bangladesh + UK, family-assisted flow, and similar education background."

This is much better than a black-box AI claim.

## 8. Membership and monetization

### Primary monetization

- Silver
- Gold
- Platinum
- Ghotok credits and plans

### Secondary monetization

- Google Ads
- vendor placements
- premium featured listings

### Membership capabilities

Keep these configurable from admin:

- price in BDT
- price in USD
- duration in days
- contact quota
- messaging permission
- visibility boost
- premium badge
- advisor support eligibility

### Payment system recommendation

Support at minimum:

- PayPal for USD
- one Bangladesh-friendly local gateway for BDT

Likely candidates:

- SSLCommerz
- AmarPay
- direct bKash / Nagad integration if your business setup allows it

This needs a business decision before implementation.

## 9. Security, privacy, and moderation

This platform handles extremely sensitive personal data. We should design for safety from day one.

### Required controls

- encrypted passwords with modern hashing
- signed media URLs for private photos
- audit logs for admin and ghotok impersonation
- rate limiting on login, search, and messages
- moderation queue for images
- profile fraud reporting
- blocked-user enforcement across profile, search, and messages
- admin action history
- explicit privacy levels for contact info and images
- secure password reset
- session revocation

### Especially important

Ghotok impersonation must be auditable:

- who impersonated
- when
- why
- what actions were taken
- what credits were consumed

## 10. SEO and AEO strategy

You asked for best-in-class SEO and AEO. That should be planned into content, routing, and data structure from the start.

### Core SEO

- server-rendered public pages
- clean URLs
- country and city landing pages
- matrimonial advice content
- success story detail pages
- FAQ hubs
- Bengali and English indexable pages
- schema markup for:
  - Organization
  - FAQPage
  - BreadcrumbList
  - Article
  - WebSite

### AEO

- concise answer-first FAQ blocks
- structured explainer pages
- region-specific query pages
- marriage process guidance pages for Bangladeshi families abroad
- trust and verification explanation pages

### Important note

User profiles should not be indexed blindly. We need a privacy-aware SEO strategy, likely with selective or abstracted indexing rules.

## 11. Mobile app strategy

The app should not be a thin wrapper around the website.

### Member app

- onboarding
- profile management
- search
- interests
- favorites
- photo requests
- messaging
- notifications
- upgrade

### Ghotok app

I recommend web-first for Ghotok initially, then evaluate if they truly need a dedicated app.

### Admin app

Not recommended for Phase 1.
Admin should be responsive web, not native mobile first.

## 12. Recommended delivery phases

### Phase 0: Discovery and migration audit

- access old codebase
- inspect live DB schema
- inspect media storage
- define canonical data model
- define IA, design system, and bilingual content approach

### Phase 1: Launch 1 foundation

- modern public site
- member auth
- quick signup
- profile creation and edit
- admin review queue
- profile approval workflow
- photo privacy
- quick and advanced search
- favorites, blocks, interests
- memberships and checkout
- email notifications
- wedding planning foundation
- vendor directory foundation

### Phase 1A: Launch 1 extensions that must ship because of your clarified scope

- vendor account model
- vendor login
- vendor listing management
- vendor inquiry capture
- guest list manager
- wedding planning workspace
- mobile app parity for members
- mobile app parity for ghotok
- office payment workflow
- local payment gateway workflow
- bKash and Nagad integration path

### Phase 2: Communication and ghotok

- mailbox
- visit tracking
- who liked you
- saved searches
- match recommendations
- ghotok portal
- ghotok credits
- impersonation with audit logs
- coupon engine

### Phase 3: Growth systems

- automated match mail
- scheduled campaigns
- richer analytics
- SEO landing page engine
- content publishing workflow
- app push notifications

### Phase 4: Growth layer on top of wedding planning and vendor ecosystem

- richer planning tools
- vendor ad products
- vendor billing automation
- deeper planning workflows
- marketplace growth loops

## 13. Biggest risks

- unknown shape of the existing production schema
- hidden business rules in old PHP code
- image and media migration quality
- password migration strategy
- mailbox import complexity
- payment history edge cases
- unclear super admin vs admin permission boundaries
- scope creep from trying to launch everything at once

## 14. Clarifications needed before development

These answers will materially affect architecture, timeline, and migration:

Answered so far:

1. Launch 1 must include wedding planning and vendor directory.
2. Payments must support PayPal, bKash, Nagad, local gateway, and in-person or office collection.
3. Mobile apps are required for both members and ghotok at launch.
4. Mailbox migration should include the last 6 months.
5. Password reset is acceptable when legacy hashes cannot be migrated safely.
6. Public profiles should be indexable.
7. Vendors will eventually have their own login and billing.
8. Live server SSH access is available for direct audit.

Still open:

9. Should vendor login and vendor self-managed billing be included in Launch 1, or only vendor directory plus admin-managed onboarding?
10. Should public profile indexing show full personally identifiable details, or should indexed profile pages be SEO-friendly but privacy-limited?
11. Do you want Bengali and English fully translated from day one across web, member app, ghotok app, admin, and vendor areas?
12. Which exact Bangladesh payment gateway should be the primary gateway for card and wallet orchestration?
13. Should ghotok mobile launch with full impersonation and credit usage, or can those stay web-only for Launch 1?
14. Do you want manual office payments to auto-activate after admin confirmation only, or also allow provisional pending access?

## 15. Recommended immediate next step

Before development starts, the next work item should be:

`Create a formal discovery package with database audit, route inventory, role matrix, canonical schema, and final MVP scope.`

Without that, we would risk rebuilding quickly but migrating badly.
