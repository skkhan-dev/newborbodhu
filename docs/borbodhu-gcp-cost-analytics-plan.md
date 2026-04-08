# Borbodhu GCP Cost and Analytics Plan

## Goal

Keep Borbodhu reliable and future-proof on GCP while minimizing cost for:

- year 1 projected traffic of roughly `100 to 500` daily users
- post-year-1 growth of `1000+` daily users
- a globally distributed audience with many users outside Bangladesh

At the same time, preserve:

- strong analytics
- good performance
- clear monetization support
- operational simplicity

## Recommended year 1 deployment shape

Use a small serverless-first architecture, not a multi-region heavy deployment.

### Recommended year 1 stack on GCP

- `Cloud Run` for web
- `Cloud Run` for API
- `Cloud Run Jobs` or worker service for cron and background tasks
- `Cloud SQL for PostgreSQL` as a single primary database
- `Cloud Storage` for photos, documents, and vendor media
- `Cloud CDN` for public assets and optimized image delivery
- `Cloud Armor` basic protection
- `Secret Manager`
- `Cloud Logging` and `Cloud Monitoring`
- `BigQuery` for analytics and billing exports
- `Looker Studio` for dashboards

## Why this is the lowest-risk low-cost approach

### Cloud Run

Google says Cloud Run is pay-per-use, has an always free tier, and charges only when you use compute resources. That fits low and variable traffic especially well.

### Cloud SQL

Cloud SQL is not the cheapest possible database path, but it is the best balance for:

- lower ops burden
- reliable backups
- easier migration
- safer production operations

For Borbodhu, database reliability matters more than shaving a small amount of infrastructure cost by self-managing Postgres on a VM.

### Cloud CDN

Because a large member base is outside Bangladesh, Cloud CDN matters early. Google documents that Cloud CDN uses Google’s global edge network to bring content closer to users and reduce backend load and latency. This is especially valuable for:

- homepage and marketing content
- public vendor pages
- public Ghotok pages
- SEO pages
- public profile summary pages
- images

## Region strategy

### Year 1 recommendation

Run the core app and database in one primary region only.

Recommended starting region:

- `asia-south1` as primary

Reasoning:

- close to Bangladesh
- good balance for South Asia
- simpler and cheaper than multi-region active-active

For diaspora users in UK, USA, Canada, Middle East, and elsewhere:

- use `Cloud CDN`
- optimize images aggressively
- cache public pages
- keep API payloads lean

### When to expand

Do not add a second active region in year 1 unless:

- real latency becomes a business problem
- traffic grows far beyond the current projection
- uptime requirements justify extra cost

## Recommended infrastructure posture by phase

### Year 1

- single region
- Cloud Run min instances set to `0` for most services
- one small Cloud SQL primary instance
- no read replica
- no HA failover instance initially if budget is the priority
- daily backups and PITR enabled
- Cloud CDN enabled for public pages and media

### Growth phase

When traffic and revenue justify it:

- add Cloud SQL HA
- add read replica if reporting/search pressure grows
- add separate worker service autoscaling profile
- add regional failover plan

## Cost controls to build in from day 1

### Compute

- keep Cloud Run services separate but small
- use min instances `0` where cold starts are acceptable
- reserve always-on instances only for the most latency-sensitive path if proven necessary
- keep workers event-driven instead of always-on

### Database

- avoid premature read replicas
- archive old events and analytics data outside the transactional DB
- use projection tables for search instead of expensive live joins everywhere

### Storage

- store originals and derived thumbnails separately
- compress images on upload
- move old exports and archives to colder storage if needed later

### Network

- serve static and public media via CDN
- use image sizing parameters to avoid large downloads

### BigQuery

- use daily export first
- avoid streaming export unless you truly need near-real-time warehouse analytics
- partition event tables by date
- control dashboard query frequency

## Analytics architecture

You asked for strong analytics aligned to customer needs and improvement opportunities.

The lowest-cost strong setup is:

- `GA4` for website analytics
- `Firebase Analytics` for the member and ghotok apps
- export analytics to `BigQuery`
- use `Looker Studio` dashboards on top of BigQuery
- export `Cloud Billing` to BigQuery too

## Why this analytics stack is the right fit

### GA4 and app analytics

Google’s GA4 stack supports raw event export to BigQuery, and standard properties support daily export. The documented standard-property export limit is `1 million events per day`, which is comfortably above Borbodhu’s expected year 1 traffic if event design is kept sane.

### BigQuery

BigQuery gives:

- funnel analysis
- cohort analysis
- multi-touch journey analysis
- payment and conversion analysis
- country and diaspora segmentation
- cost and revenue analysis

### Billing analytics

Google Cloud billing export can write cost data into BigQuery, and Google also documents using Looker Studio on top of that data. This means Borbodhu can monitor:

- spend by service
- cost spikes
- cost per registered user
- cost per paying user
- cost per region

## Event design

Track events by product funnel, not just page views.

### Core funnel events

- landing_page_view
- signup_started
- signup_completed
- profile_submitted_for_review
- profile_approved
- profile_rejected
- search_performed
- saved_search_created
- profile_viewed
- interest_sent
- photo_request_sent
- photo_request_approved
- message_attempted
- message_sent
- upgrade_started
- payment_success
- payment_failed
- coupon_applied

### Ghotok events

- ghotok_signup_started
- ghotok_signup_completed
- ghotok_member_created
- ghotok_impersonation_started
- ghotok_credit_used
- ghotok_credit_request_created

### Vendor and wedding events

- vendor_signup_started
- vendor_signup_completed
- vendor_lead_received
- wedding_project_created
- guest_added
- vendor_shortlisted
- vendor_inquiry_sent

### Diaspora segmentation

Track:

- user country
- home country
- current country
- language version
- payment currency
- device platform

This is critical because product needs for Bangladesh, UK, USA, Canada, and Middle East users may differ.

## Analytics dashboards to build

### Executive dashboard

- DAU and WAU
- new registrations
- approved profiles
- paying users
- revenue by source
- vendor leads
- ghotok credit revenue

### Funnel dashboard

- visitor to signup
- signup to profile completion
- profile completion to approval
- approval to first search
- first search to first interest
- first interest to first payment

### Match quality dashboard

- search success rate
- interest send rate
- mutual interest rate
- message unlock rate
- message reply rate

### Geography dashboard

- Bangladesh vs diaspora user mix
- top countries
- top districts
- conversion by country
- revenue by country and currency

### Operations dashboard

- pending review queue size
- average approval time
- rejection reasons
- support ticket themes
- suspicious profile flags

### FinOps dashboard

- GCP cost by service
- cost per active user
- cost per registration
- cost per paying user
- cost per country if helpful

## AdSense strategy

AdSense should be treated as a secondary monetization layer, not the core revenue model.

### Safe placement recommendation

Use AdSense only on lower-risk public inventory:

- blog and advice pages
- FAQ
- city and country landing pages
- wedding planning guides
- vendor category pages
- selected public success story pages

### Avoid AdSense on

- logged-in dashboards
- inbox or messages
- checkout and payment flows
- profile edit pages
- sensitive public profile detail pages
- moderation-heavy dynamic pages

### Why

Google’s AdSense policies and restrictions are important here:

- Google documents that restricted content may receive fewer ads or no ads at all.
- Google also notes dynamic content can be flagged as potentially policy-violating and ad serving can be restricted pending review.
- Matrimonial content can drift into sensitive territory if profile images or descriptions become suggestive, so ad placement should stay away from user-generated profile-heavy pages.

### Practical monetization recommendation

Primary revenue:

- memberships
- ghotok credits and plans
- vendor billing

Secondary revenue:

- AdSense on editorial and listing pages
- future premium placements for vendors

## Performance strategy for diaspora users

### Public experience

- cache public pages aggressively
- serve images via CDN
- pre-render SEO pages
- compress modern images

### Logged-in experience

- keep API responses small
- load dashboard modules progressively
- use pagination and background refresh
- avoid giant profile payloads

### Messaging and notifications

- queue email and push asynchronously
- avoid synchronous heavy work in request lifecycle

## Strong analytics without excess spend

### Recommended year 1 analytics stack

- GA4 standard property
- Firebase app analytics
- BigQuery daily export
- Looker Studio dashboards
- Cloud Billing export to BigQuery

### Avoid in year 1 unless proven necessary

- dedicated expensive analytics vendor
- always-on streaming analytics stack
- multi-tool analytics duplication

## Suggested year 1 ops guardrails

- monthly cost review
- monthly funnel review
- weekly moderation metrics review
- weekly payment failure review
- quarterly region and performance review

## Product decisions influenced by cost and geography

### Keep in launch 1

- one shared backend
- one shared design system
- one analytics warehouse
- one primary region
- public CDN

### Delay until usage proves the need

- multi-region active-active
- read replicas
- dedicated search cluster
- separate AI infra stack
- separate BI platform beyond Looker Studio and BigQuery

## Recommendation summary

For Borbodhu’s projected year 1 traffic, the best balance is:

- serverless-first GCP
- one primary region
- CDN for global performance
- Cloud SQL kept intentionally small
- BigQuery-backed analytics
- billing export for FinOps
- AdSense only on editorial and lower-risk public inventory

This keeps the platform lean now while leaving a clean path for growth after year 1.
