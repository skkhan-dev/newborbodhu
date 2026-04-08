# Borbodhu Engineering Backlog

## Goal

Break the Borbodhu rebuild into executable workstreams that engineering, design, and QA can track.

## Workstream 0: Foundation and discovery

### Epic 0.1 Architecture baseline

- finalize monorepo layout
- define environments
- define CI pipeline
- define coding standards
- define feature flag strategy

### Epic 0.2 Data migration design

- export legacy schema inventory
- create field mapping spreadsheet
- define enum normalization rules
- define password migration strategy
- define media migration rules

### Epic 0.3 Design system

- finalize color system
- finalize typography
- finalize spacing and component tokens
- define Bangla and English visual rules

## Workstream 1: Core platform and auth

### Epic 1.1 Identity

- user model
- role model
- login
- registration
- password reset
- social auth
- session handling

### Epic 1.2 Permissions

- RBAC middleware
- admin permission checks
- impersonation session model
- audit logging base layer

## Workstream 2: Member profile system

### Epic 2.1 Profile authoring

- member profile create
- member profile edit
- completion scoring
- guardian fields
- religion and cultural fields
- diaspora fields

### Epic 2.2 Moderation

- submit for review
- admin review queue
- approve
- reject with reason
- revision history

### Epic 2.3 Media

- photo upload
- primary photo
- private photo
- blurred photo support
- biodata upload
- verification document upload

## Workstream 3: Search and matching

### Epic 3.1 Search

- quick search
- advanced search
- photo search
- saved searches
- sort tabs

### Epic 3.2 Match feed

- recommendation engine
- compatibility calculation
- explanation generation
- activity ranking

## Workstream 4: Interactions and mailbox

### Epic 4.1 Member interactions

- interest send and receive
- favorite
- block
- profile visits
- private photo request flow

### Epic 4.2 Messaging

- conversation list
- message thread
- email notification on message
- plan-based message restrictions
- contact unlock logic

## Workstream 5: Payments and plans

### Epic 5.1 Membership system

- plans CRUD
- active membership resolution
- feature gating
- expiration handling

### Epic 5.2 Checkout

- AmarPay integration
- PayPal integration
- office payment flow
- manual approval flow
- payment audit logs

### Epic 5.3 Promotions

- coupon create
- coupon validate
- coupon redemption
- coupon reporting

## Workstream 6: Ghotok platform

### Epic 6.1 Ghotok identity

- ghotok signup and approval
- ghotok profile
- ghotok dashboard

### Epic 6.2 Managed members

- create managed member
- edit managed member
- approval tracking
- managed member search

### Epic 6.3 Credits and impersonation

- wallet
- credit ledger
- request more credit
- admin credit adjustment
- impersonation session flow
- credit consumption rules

## Workstream 7: Vendor and wedding platform

### Epic 7.1 Vendor self-service

- vendor registration
- vendor login
- vendor profile management
- vendor gallery
- vendor packages
- vendor billing base model

### Epic 7.2 Wedding planning

- wedding project
- guest list
- vendor shortlist
- inquiry flow
- vendor recommendation assistant

## Workstream 8: Admin and super admin

### Epic 8.1 Admin portal

- moderation dashboard
- sales dashboard
- activity dashboard
- membership actions
- vendor moderation
- ghotok visibility

### Epic 8.2 Super admin

- admin management
- permission management
- payment gateway settings
- plan settings
- mailing settings
- match mail settings
- global config

## Workstream 9: Public site and SEO

### Epic 9.1 Public pages

- homepage
- pricing
- success stories
- FAQ
- public ghotok pages
- wedding landing pages
- vendors landing pages

### Epic 9.2 SEO

- locale route trees
- metadata model
- sitemap generation
- schema markup
- privacy-limited public profile pages
- city and country pages

## Workstream 10: Mobile apps

### Epic 10.1 Member app

- auth
- profile
- search
- interactions
- mailbox
- payments
- wedding planning

### Epic 10.2 Ghotok app

- auth
- managed members
- search
- interests
- mailbox
- credits
- impersonation
- vendor assistance

## Workstream 11: AI services

### Epic 11.1 Launch AI

- match explanation
- onboarding assistant
- first-message helper
- moderation risk flags
- vendor recommendation

### Epic 11.2 Phase 2 AI

- fraud detection
- duplicate profile detection
- support drafting
- wedding planning assistant

## Workstream 12: Analytics, FinOps, and monetization

### Epic 12.1 Product analytics

- GA4 event design
- Firebase event design
- event taxonomy implementation
- funnel definitions
- geography segmentation

### Epic 12.2 Warehouse and dashboards

- BigQuery export setup
- billing export setup
- Looker Studio dashboards
- executive KPI dashboard
- funnel dashboard
- moderation dashboard
- revenue dashboard

### Epic 12.3 Ad monetization

- AdSense-safe inventory mapping
- editorial ad slot implementation
- policy review workflow
- revenue reporting
## Workstream 13: Migration and QA

### Epic 13.1 ETL

- user import
- profile import
- preference import
- media import
- payment import
- ghotok import
- vendor import
- 6-month mailbox import

### Epic 13.2 Validation

- count reconciliation
- spot-check samples
- permission QA
- media QA
- payment QA
- app QA

### Epic 13.3 Launch prep

- cutover runbook
- rollback plan
- smoke tests
- production monitoring

## Suggested execution order

1. Workstreams 0 and 1
2. Workstreams 2 and 8
3. Workstreams 3 and 5
4. Workstreams 4 and 13
5. Workstreams 6 and 7
6. Workstreams 9, 10, and 12
7. Workstream 11

## Suggested milestone structure

### Milestone A

- architecture finalized
- schema approved
- auth working
- admin permissions working

### Milestone B

- member profile system working
- moderation working
- search working
- basic payments working

### Milestone C

- messaging working
- ghotok platform working
- vendor and wedding flows working

### Milestone D

- mobile apps working
- SEO pages working
- AI launch features working
- migration dry run successful

### Milestone E

- launch cutover ready
