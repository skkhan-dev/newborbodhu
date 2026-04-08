# Borbodhu Parity Test Plan

## Goal

Validate the new Borbodhu build against the live Borbodhu platform so the redesign and rebuild do not lose critical business functionality.

This plan should be used continuously during implementation, not only at launch.

## Test objectives

1. Confirm feature parity for live Borbodhu core flows.
2. Confirm that redesigned UI still preserves required business behavior.
3. Confirm that new features do not break legacy-critical workflows.
4. Confirm that permissions and monetization rules are preserved.
5. Confirm that mobile-first journeys remain functional across personas.

## Systems under comparison

### Legacy baseline

- Live site: `https://borbodhu.com`
- Legacy member login
- Legacy admin panel
- Legacy Ghotok panel
- Existing production database and behavior baseline from live audit

### New system

- New web app
- New mobile member experience
- New mobile Ghotok experience
- New admin and super admin web experience
- New vendor and wedding planning modules
- GCP test environment:
  - web: `https://borbodhu-web-test-508740568768.asia-south1.run.app`
  - API: `https://borbodhu-api-test-508740568768.asia-south1.run.app`

## Parity scope

### Public

- locale entry
- homepage trust messaging
- pricing visibility
- sponsored placement visibility
- search preview
- SEO landing pages
- public profile summary pages
- public vendor and Ghotok pages

### Member

- signup
- login
- password reset
- profile edit
- photo upload
- private photo request
- search and saved search
- interest send
- favorite and block
- inbox
- membership upgrade
- manual payment flow
- wedding planning

### Ghotok

- login
- create managed member
- edit managed member
- approval tracking
- search for managed member
- impersonation
- credit deduction
- credit request

### Vendor

- signup
- login
- profile management
- packages
- lead visibility
- public lead capture
- billing state

### Admin and super admin

- review queue
- approve or reject profile
- approve photos
- activate paid membership
- approve office payment
- coupon management
- admin permissions
- match mail settings
- campaign mail preview and queue
- commercial settings and public ad placement control

## Test levels

### 1. Baseline audit tests

Purpose:

- verify what the live system currently does
- record behavior before replacement

Method:

- manual walkthroughs
- route inventory
- screenshots
- sample data review

### 2. UI parity tests

Purpose:

- verify new screens preserve the required behavior and messaging

Method:

- visual review
- responsive testing
- locale review

### 3. Functional parity tests

Purpose:

- verify actions work the same or intentionally better

Method:

- manual QA scripts
- automated API tests
- automated end-to-end tests where possible

### 4. Data parity tests

Purpose:

- confirm migration preserved functional meaning

Method:

- count reconciliation
- field mapping validation
- sampled record comparison
- imported legacy-password login validation
- migrated public SEO surface validation

## Environments

### Staging

- masked production-like data
- staging mobile build
- staging web build
- staging payment sandbox
- staging Postgres loaded from Prisma migration `apps/api/prisma/migrations/0001_initial/migration.sql`
- seeded baseline accounts from `apps/api/prisma/seed.ts`

### Production validation

- smoke tests only
- no destructive test data on live production

## Test personas

- guest
- free member
- paid member
- private-photo member
- Ghotok
- vendor
- admin
- super admin

## Core parity scenarios

### Guest

1. open home page
2. choose English or Bangla path
3. preview search
4. reach correct join path
5. open `/profiles`, `/vendors`, `/ghotok`, `/matrimony`, and `/wedding-planning`
6. confirm `robots.txt` and `sitemap.xml` are published
7. confirm public sponsor cards follow live config and do not appear on disabled placements

### Member account

1. register as Man
2. register as Woman
3. reset password
4. login and logout
5. submit profile for review
6. edit after rejection

### Member discovery and trust

1. search by basic filters
2. search by advanced filters
3. upload profile photo or biodata through signed cloud upload
4. request private photo
5. grant photo request
6. deny photo request
7. favorite profile
8. block profile
9. view visitors

### Messaging and payment

1. free member tries to send message and sees upgrade gate
2. paid member sends message successfully
3. member upgrades through AmarPay
4. member upgrades through PayPal
5. member submits office payment and remains pending until admin approval
6. coupon applies correctly

### Ghotok

1. login
2. add managed member
3. edit managed member
4. submit managed member for review
5. impersonate managed member
6. consume credit on configured action
7. request more credits

### Vendor and wedding

1. vendor signs up
2. vendor creates package
3. member creates wedding project
4. member shortlists vendor
5. vendor receives lead
6. sponsored placement remains public-only and does not leak into signed-in trust-sensitive flows

### Admin

1. review pending member
2. reject with reason
3. approve profile
4. approve or reject image
5. approve office payment
6. update membership manually

### Super admin

1. create admin
2. change permission scope
3. update membership plan
4. create or pause coupon
5. review revenue summary by gateway and admin
6. review profile summary by date range
7. update AmarPay config
8. update match mail rules

### Migration validation

1. run dry-run export report against a legacy snapshot
2. load a sample legacy snapshot into test through the GCP loader job
3. verify imported profiles appear in public search and profile pages
4. verify imported Ghotok pages show managed member counts correctly
5. verify imported recent mailbox rows create usable conversations
6. verify an imported MD5-hash user can log in and is upgraded to the new password hash

## Automation strategy

### As implementation matures

- API tests for auth, plans, payments, permissions, and messaging rules
- smoke script: `npm run qa:parity:smoke`
- full vendor-inclusive smoke: `RUN_VENDOR_SMOKE=1 npm run qa:parity:smoke`
- end-to-end tests for:
  - signup
  - review queue
  - plan upgrade
  - Ghotok managed member flow
  - vendor inquiry flow

### Recommended tools later

- Playwright for E2E web
- API integration tests in NestJS
- mobile QA flows for React Native builds

## Current backend QA entry points

- API health: `GET /v1/health`
- Bootstrap metadata: `GET /v1/meta/bootstrap`
- Auth: register, login, password reset, current actor
- Member: profile, preferences, review submit, discovery, interest, favorite, block, photo request
- Member: profile detail, contact unlock, visitors, saved search CRUD
- Billing: plans, preview, membership order, my orders
- Billing: AmarPay and PayPal confirmation webhooks
- Admin: overview, profile review queue, approve or reject profile, manual payment review
- Media: member media list/register/update, admin pending media review
- Mailbox: conversation list, direct conversation create, message list, send message, mark read
- Ghotok: dashboard, managed members, create managed member, impersonation session, credit-based contact view
- Vendor: directory, vendor detail, vendor dashboard
- Wedding: projects, guest list entries, vendor shortlist

## Verification status on March 19, 2026

- `npm run prisma:generate` passed
- `npm run typecheck:api` passed
- `npm run build:api` passed
- live-to-new parity is still document-driven for media upload, mailbox, gateway callbacks, and migration ETL
- public profile summary pages are now executable on the GCP test web stack
- live-to-new parity for match mail and super-admin campaigns is now executable on the GCP test stack
- runtime API smoke tests are blocked until a local or staging Postgres instance is attached

## Seed accounts for local QA

- admin: `admin@borbodhu.local / Password123!`
- member: `member@borbodhu.local / Password123!`
- member 2: `member2@borbodhu.local / Password123!`
- managed member: `managed@borbodhu.local / Password123!`
- ghotok: `ghotok@borbodhu.local / Password123!`
- vendor: `vendor@borbodhu.local / Password123!`

## Data parity checks

Validate at minimum:

- active member count
- pending member count
- paid membership count
- vendor count
- Ghotok count
- wallet balance samples
- payment samples
- 6-month mailbox sample threads
- photo access request samples

## Regression gates before launch

Launch should not proceed if any of these fail:

- member cannot register and submit profile
- admin cannot approve profile
- paid gating is bypassed
- private photo access leaks
- Ghotok impersonation is not audited
- manual payments activate before approval
- vendor lead flow breaks
- wedding planning data cannot be saved

## Reporting format

Each parity cycle should produce:

- passed scenarios
- failed scenarios
- severity
- parity gap or intentional design change
- owner
- target fix milestone
