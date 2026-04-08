# Borbodhu Mobile Persona Flows

## Goal

Design the Borbodhu UI and mobile-first journey before backend implementation.

This document defines the screen-by-screen flow for each persona so design feedback can be collected first.

## Product framing

Borbodhu should feel:

- modern and premium
- culturally aligned with Bangladeshi wedding and family expectations
- respectful, warm, and safe
- mobile-first for members, ghotoks, and vendors
- responsive for admin and super admin, with mobile triage support

## Language model

The product will not be one mixed bilingual UI.

It will have:

- a dedicated English experience
- a dedicated Bangla experience

This applies to:

- website
- member app
- ghotok app
- vendor portal
- admin and super admin content surfaces where needed

## Design direction

### Visual cues

- bridal maroon for trust and emotional warmth
- jamdani gold for premium accents
- ivory and shell backgrounds for softness
- leaf green and indigo as functional secondary colors
- real wedding and family imagery
- elegant serif headlines and clean modern UI typography

### UX principles

- short first-time onboarding
- full profile depth after account creation
- visible trust signals
- privacy controls at the moment they matter
- clear separation between free and paid actions
- wedding planning feels connected, not bolted on

## Persona 1: Guest

### Goal

Understand the platform, browse safely, and decide to register.

### Core mobile flow

1. Splash and locale selection
2. Home discovery
3. Trust and verification explainer
4. Match preview or search preview
5. Registration path selection
6. Sign up or login

### Key screens

#### `G1` Locale Select

- choose English or Bangla
- remember preference
- show Bangladesh and diaspora positioning

#### `G2` Home

- trust-led hero
- visible counts
- featured match lanes
- wedding planning teaser
- vendor teaser

#### `G3` Why Borbodhu

- profile verification
- family-safe privacy
- Ghotok support
- diaspora support

#### `G4` Search Preview

- quick search teaser
- blurred or privacy-safe profile cards
- prompt to register for deeper search

#### `G5` Join Path

- I am a man or woman
- I am a parent or guardian
- I am a ghotok
- I am a wedding vendor

## Persona 2: Member

### Goal

Create a profile, get approved, find suitable matches, communicate safely, upgrade when needed, and continue into wedding planning.

### Main bottom navigation

- Home
- Matches
- Search
- Inbox
- Profile

Wedding planning appears as a card on Home and as a secondary entry inside Profile or Home.

### Core mobile flow

1. Quick signup
2. Profile basics
3. Family and religion
4. Partner preferences
5. Photo and privacy
6. Review and submit
7. Approval state
8. Member home dashboard
9. Match detail
10. Interest or photo request
11. Inbox or upgrade gate
12. Wedding planning

### Key screens

#### `M1` Quick Signup

- name
- email
- password
- role context
- gender
- looking for

#### `M2` Profile Basics

- date of birth
- height
- marital status
- profession
- education
- country and city

#### `M3` Family and Faith

- religion
- subgroup or community
- mother tongue
- family values
- guardian or wali info
- gotra where relevant
- mahr preference where relevant

#### `M4` Partner Preferences

- age range
- country preference
- religion preference
- education and profession preference
- family involvement preference
- diaspora openness

#### `M5` Photos and Privacy

- upload photos
- set public or private
- choose main profile photo
- explain photo requests
- upload biodata and documents

#### `M6` Review and Submit

- completion meter
- edit shortcuts
- submit for review
- admin review ETA

#### `M7` Pending or Approved State

- pending review card
- rejection reason if rejected
- update and resubmit

#### `M8` Member Home

- approval badge
- daily matches
- visitors
- interests received
- favorites received
- wedding planning card

#### `M9` Match Detail

- photo state
- trust badges
- family summary
- compatibility explanation
- interest
- favorite
- block
- request private photo

#### `M10` Message or Upgrade Gate

- if free: clear upgrade notice
- if paid: inbox thread and send message

#### `M11` Wedding Planning

- create wedding project
- set city and guest count
- shortlist vendors
- manage guest list

## Persona 3: Ghotok

### Goal

Manage multiple member profiles, search on their behalf, use credits, impersonate safely, and help with wedding planning or vendor referrals.

### Main bottom navigation

- Home
- Members
- Match
- Wallet
- Profile

### Core mobile flow

1. Login
2. Dashboard
3. Add member
4. Managed member profile
5. Match search
6. Impersonation
7. Credit wallet

### Key screens

#### `GH1` Ghotok Login

- standard login
- support number
- forgot password

#### `GH2` Dashboard

- total managed members
- pending approvals
- recent interests
- credit balance
- quick add member

#### `GH3` Add Member Wizard

- basic details
- family details
- location
- partner preference
- photos and biodata

#### `GH4` Managed Members List

- pending
- active
- needs edit
- by recent activity

#### `GH5` Member Match Search

- switch acting member
- search results
- interest and view actions
- credit cost visibility

#### `GH6` Impersonation Session

- clear “acting as” banner
- audited session badge
- contact view or message actions
- credit deduction notice

#### `GH7` Wallet

- current credits
- usage history
- request more credits
- admin approval status

## Persona 4: Vendor

### Goal

Join Borbodhu, present services professionally, manage leads, and get booked through wedding planning workflows.

### Main bottom navigation

- Home
- Leads
- Packages
- Profile
- Billing

### Core mobile flow

1. Vendor signup
2. Business verification
3. Vendor dashboard
4. Leads
5. Package and gallery management
6. Billing

### Key screens

#### `V1` Vendor Signup

- business name
- owner name
- category
- city
- phone and email

#### `V2` Verification

- business documents
- service area
- profile photos
- moderation status

#### `V3` Vendor Dashboard

- profile views
- new leads
- shortlisted count
- package status
- billing state

#### `V4` Leads Inbox

- inquiry list
- lead details
- reply or status change
- wedding date and location context

#### `V5` Package Editor

- package title
- price
- inclusions
- Bangla and English descriptions
- gallery sort

#### `V6` Billing

- current plan
- invoice history
- featured listing opportunities

## Persona 5: Admin

### Goal

Moderate profiles and vendors, review payments, and keep the platform healthy.

### Product form

- responsive web first
- mobile triage-friendly where needed

### Core mobile-friendly flow

1. Login
2. Review queue
3. Profile review detail
4. Photo review
5. Manual payment approval
6. Reporting summary

### Key screens

#### `A1` Admin Login

- secure login
- role badge

#### `A2` Review Queue

- pending member profiles
- pending vendor profiles
- pending cancellation requests
- pending manual payments

#### `A3` Member Review Detail

- submitted profile summary
- document and photo preview
- edit before approve
- reject with reason

#### `A4` Photo Moderation

- image queue
- approve
- reject
- risk flag

#### `A5` Payment Review

- office payment proof
- plan selected
- activate membership

#### `A6` Dashboard Snapshot

- active
- pending
- cancelled
- today sales
- monthly sales

## Persona 6: Super Admin

### Goal

Control configuration, permissions, commerce rules, analytics, and platform-wide growth.

### Product form

- responsive web first
- mobile overview and emergency access

### Core mobile-friendly flow

1. Login
2. Operations dashboard
3. Admin management
4. Plan and gateway configuration
5. Match mail and campaign control
6. Analytics and cost dashboard

### Key screens

#### `S1` Super Admin Dashboard

- revenue snapshot
- registrations
- approval pipeline
- Ghotok credit status
- vendor billing snapshot

#### `S2` Admin Management

- add admin
- permissions
- reset password

#### `S3` Plans and Payments

- membership tiers
- AmarPay config
- PayPal config
- manual payment rules

#### `S4` Match Mail and Campaigns

- schedule
- frequency
- filters by location, membership, gender
- template preview

#### `S5` Analytics

- funnel
- conversion
- diaspora segment
- payment mix
- cost dashboard

## Cross-persona shared UI patterns

### Shared top-level patterns

- locale switch only at auth and public layer
- strong card-based dashboards
- soft section dividers
- clear verification badges
- bottom nav for mobile roles

### Shared components

- profile card
- match card
- privacy chip
- status badge
- timeline card
- action drawer
- sticky primary CTA

## Suggested first visual review areas

When reviewing the prototype, focus on:

1. Does the member journey feel culturally right and modern?
2. Is the Ghotok journey strong enough to be a real differentiator?
3. Does the vendor journey feel premium enough for monetization?
4. Are admin and super admin clear without feeling too technical?
5. Does wedding planning feel like a natural continuation?
6. Should any persona screens be merged, split, or reordered before backend work starts?
