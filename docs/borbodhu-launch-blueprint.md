# Borbodhu Launch Blueprint

## Vision

Borbodhu should not feel like an old matrimonial directory with extra features added on.

It should feel like:

- the most trusted Bangladeshi marriage platform
- modern, mobile-first, and premium
- deeply respectful of family, faith, privacy, and cultural norms
- useful for Bangladesh and the global Bangladeshi diaspora
- clearly differentiated from Shaadi, Jeevansathi, and Matrimony-style clones

The winning position is:

`Trusted Bangladeshi matchmaking + family-safe communication + wedding planning + vendor marketplace`

## Brand and UX direction

### Design language

The visual system should be modern but culturally grounded:

- warm ivory, jamdani gold, deep maroon, bridal green, soft clay, and off-black
- elegant serif for headlines, clean modern sans for UI
- subtle nakshi, alpana, jamdani, and wedding textile-inspired textures
- real Bangladeshi and diaspora wedding imagery
- refined Bengali typography, not decorative fake “ethnic” styling

### Tone

- respectful
- warm
- premium
- family-safe
- confident, never loud

### Key UX principles

- fewer fields up front, deeper completion later
- safety and trust visible before conversion asks
- clear privacy controls for photo, contact, and family data
- separate but equal `English` and `Bangla` product versions
- every important flow must feel excellent on mobile first

## The differentiation strategy

Competitors generally win on scale, but Borbodhu can win on fit.

### What competitors emphasize

- `BengaliMatrimony` strongly emphasizes profile creator roles and mobile-verified profiles.
- `Shaadi` emphasizes protected photos, contact privacy, report and block flows, ID-style verification, and personalized premium matchmaking.
- `Jeevansathi` emphasizes AI-powered matches, NRI filters, verified profiles, privacy, and expert consultants.

### What Borbodhu should uniquely own

- Bangladeshi-first matching and family expectations
- stronger support for guardian and family-involved matchmaking
- first-class Ghotok ecosystem, not a side feature
- diaspora-specific filters and journeys
- wedding planning continuing after the match
- vendor marketplace connected to planning
- privacy-sensitive indexed public discovery pages
- explainable AI for trust, matching, and support

## Launch 1 scope

Launch 1 now includes all of the following:

### Public site

- homepage
- pricing
- success stories
- FAQ
- blog and advice
- matrimony landing pages
- Bangla site
- English site
- wedding planning pages
- vendor marketplace pages
- public Ghotok pages

### Member platform

- registration
- login
- profile creation
- profile edit
- photo upload
- public/private photo permissions
- photo requests and grant/deny
- profile approval workflow
- favorites
- blocks
- interests
- profile visitors
- who favorited me
- who showed interest
- quick search
- advanced search
- photo search
- saved search
- recommendations
- messaging
- membership upgrade
- coupon redemption
- account settings
- change password
- forgot password
- wedding planning workspace
- guest list
- vendor shortlist
- vendor inquiries

### Ghotok platform

- web portal
- Android app
- iPhone app
- create and edit member profiles
- own members list
- impersonation
- credit balance and usage
- request more credit
- view matches
- send interests
- message management
- wedding/vendor assistance on behalf of managed members

### Vendor platform

- self-service vendor registration
- vendor login
- vendor profile management
- service categories
- location management
- image gallery
- package management
- lead and inquiry management
- vendor billing foundation

### Admin platform

- pending profile review
- image approval
- reject with reason
- cancel request management
- membership assignment
- manual payment approval
- coupon management
- reports
- activity dashboards
- vendor moderation
- Ghotok visibility

### Super Admin platform

- admin management
- permissions
- membership configuration
- AmarPay config
- PayPal config
- payment method config
- office/manual payment rules
- Ghotok management
- credit management
- mailing system
- match mail configuration
- SEO settings
- content management guardrails
- vendor billing config

## AI strategy

AI should improve trust and conversion, not replace judgment.

### AI features for Launch 1

1. Match explanation engine
- explain why two profiles match in simple language
- example: education, country preference, family values, religion, and age compatibility

2. Smart onboarding assistant
- helps users finish profile sections
- suggests better profile descriptions in English or Bangla
- warns when a profile is too incomplete for quality matching

3. Communication helper
- suggests polite first messages
- suggests family-appropriate introduction wording
- supports Bangla and English tone options

4. Admin review assistant
- flags suspicious or incomplete profiles
- highlights missing photos, duplicate contact numbers, low-trust signals, or likely spam

5. Vendor recommendation assistant
- suggests vendors by budget, city, category, guest size, and wedding style

### AI features for Phase 2

- duplicate or fraud profile detection
- photo moderation assistance
- match quality scoring with feedback loops
- AI-assisted support replies
- wedding planning assistant with checklist generation

### AI features we should avoid at launch

- black-box “soulmate score” claims
- fully automated moderation without admin review
- uncited or misleading generative advice in sensitive religious or family topics

## Product architecture

### Recommended stack

- Monorepo with `pnpm` or `npm workspaces`
- Web: `Next.js`
- Mobile: `React Native` with Expo
- Backend API: `NestJS`
- Database: `PostgreSQL`
- Cache and queues: `Redis`
- File storage: `Google Cloud Storage`
- Search and ranking: PostgreSQL + denormalized search tables + optional `pgvector`
- Email: transactional provider plus campaign provider
- Push: Firebase Cloud Messaging + Apple Push Notification service

### GCP deployment

- Web app on `Cloud Run`
- API on `Cloud Run`
- Worker services on `Cloud Run Jobs` or worker services
- `Cloud SQL for PostgreSQL`
- `Cloud Storage` for photos, documents, vendor media
- `Cloud CDN`
- `Cloud Armor`
- `Secret Manager`
- `Cloud Logging` and `Monitoring`

### Why this architecture

- future-proof
- mobile and web can share domain logic
- simpler to hire for
- better fit for migration and phased rollout
- easy to expand for AI and search later

## Information architecture

### Public routes

- `/en`
- `/bn`
- `/en/matrimony`
- `/bn/matrimony`
- `/en/wedding-planning`
- `/bn/wedding-planning`
- `/en/vendors`
- `/bn/vendors`
- `/en/ghotok`
- `/bn/ghotok`

Use separate English and Bangla routes, not one mixed bilingual interface.

### Member app structure

- Dashboard
- Matches
- Search
- Inbox
- Activity
- Wedding Plan
- Profile
- Settings

### Ghotok app structure

- Dashboard
- My Members
- Add Member
- Search Matches
- Inbox
- Credits
- Vendor Help
- Settings

### Vendor app/web structure

- Dashboard
- Leads
- Profile
- Packages
- Gallery
- Billing
- Settings

## Privacy and SEO model

Public profiles can be indexable, but privacy-limited.

### Public profile SEO rules

- show first name or display name only
- never show phone number or email
- never show precise address
- never expose hidden photos
- allow abstracted profile summaries
- allow location at broad level like city/country
- allow filtered structured attributes useful for search
- no private family contact fields

### Indexable page types

- public profile summary pages
- city and country matrimony pages
- religion/community pages where appropriate
- success stories
- wedding vendor pages
- wedding planning guides
- Ghotok public pages
- FAQ and advice content

## Payments

### Launch 1 payment methods

- AmarPay as primary configurable local gateway
- PayPal
- office/manual payment

### Gateway design

Super admin should be able to:

- enable or disable gateway
- set sandbox and live credentials
- choose default currency logic
- define plan availability by payment method
- define office payment approval workflow

### Payment rules

- BDT for local methods
- USD for PayPal
- office/manual payments stay pending until admin approval
- no premium access until confirmed

## Migration plan

### Migrate in Launch 1

- all users
- profile fields
- partner preferences
- photos and privacy metadata
- favorites
- blocks
- interests
- visitors if needed for analytics continuity
- payments
- membership status
- Ghotok relationships
- Ghotok credit balances
- coupons
- vendors
- guest lists
- last 6 months of mailbox history

### Legacy table mapping highlights

- `tbl_user` -> users + member_profiles + membership status
- `tbl_partnerprofile` -> partner_preferences
- `tbl_usersnaps` -> profile_media
- `tbl_mailbox` -> conversations + messages
- `tbl_payment` -> payment_transactions
- `tbl_membership` -> membership_plans
- `tbl_ghotok` -> ghotok_accounts
- `tbl_ghotok_user` -> ghotok_managed_members
- `tbl_ghotok_credit_wallet` and `tbl_ghotok_credit_txn` -> wallet + ledger
- `tbl_dir_business` -> vendors
- `tbl_user_guestlist` -> wedding_guest_entries
- `tbl_picture_request` -> photo_access_requests
- `tbl_favourite_ignore` -> favorites + blocks
- `tbl_views_winks` -> profile_visits + interactions

### Password migration strategy

- attempt compatibility migration for legacy hashes where technically safe
- force reset only for accounts that cannot be revalidated
- make reset localized in Bangla and English
- notify affected users cleanly

## Security and moderation

### Must-have controls

- audit logs for admin, super admin, vendor, and ghotok actions
- full impersonation logs
- signed private media URLs
- role-based access control
- rate limits
- fraud checks
- OTP and email verification
- content moderation queue
- profile report system
- privacy rules enforced at API level

### Especially important

Ghotok impersonation must always record:

- impersonator
- target member
- time
- reason
- actions performed
- credits consumed

## Recommended launch roadmap

### Stage 1: Product definition and data migration design

- canonical schema
- role matrix
- field mapping
- content model
- IA finalization
- design system

### Stage 2: Core platform build

- auth
- member profiles
- admin review
- search
- matching
- payments
- messaging
- multilingual site split

### Stage 3: Ghotok and vendor platforms

- Ghotok flows
- credit wallet
- impersonation
- vendor onboarding
- vendor listings
- billing foundation

### Stage 4: Wedding planning and AI

- guest list
- shortlist
- vendor recommendations
- match explanation
- onboarding assistant

### Stage 5: Migration, QA, and launch

- ETL dry runs
- mobile QA
- security review
- load testing
- production cutover

## Timeline recommendation

Because Launch 1 now includes web, two mobile roles, wedding planning, vendor self-service, payments, and migration, the realistic path is:

- aggressive: `6 to 7 months`
- safer quality-first: `8 to 10 months`

If you want something faster, the only responsible way is to define an internal Launch 1A and 1B while still calling it one overall launch.

## My strongest recommendation

To stand out, Borbodhu should lead with these four promises everywhere:

1. Trusted and verified Bangladeshi matchmaking
2. Family-safe privacy and communication
3. Ghotok and self-service together in one platform
4. Wedding planning that continues after the match

That combination is stronger than trying to out-copy larger competitors.
