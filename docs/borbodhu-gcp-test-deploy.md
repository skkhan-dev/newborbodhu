# Borbodhu GCP Test Deploy

## Target

- project: `punorupa`
- region: `asia-south1`
- API service: `borbodhu-api-test`
- web service: `borbodhu-web-test`
- Cloud SQL: `borbodhu-test-pg`
- Artifact Registry: `borbodhu-test`
- media bucket: `punorupa-borbodhu-media-test`

## Scripts

- setup base infrastructure: [setup-test-env.sh](/Users/skkhan/workarea/new.borbodhu.com/scripts/gcp/setup-test-env.sh)
- deploy containers: [deploy-test.sh](/Users/skkhan/workarea/new.borbodhu.com/scripts/gcp/deploy-test.sh)

## Notes

- this is a low-cost test environment, not production hardening
- Cloud SQL is the main unavoidable cost in this stack
- `deploy-test.sh` now creates or updates a one-off Cloud Run job and executes `db push` + `seed` inside GCP
- Cloud SQL passwords are generated as URL-safe hex so the stored `DATABASE_URL` secret is valid for Prisma
- the runtime service account is granted Cloud SQL access, Secret Manager access, GCS object admin on the media bucket, and self `signBlob` permission for signed media URLs
- member media upload is live through signed Google Cloud Storage upload requests
- the API now accepts browser traffic from both Cloud Run web hostnames: the service URL and the `project-number.region.run.app` fallback URL
- the media bucket now has browser CORS enabled for `localhost:3000`, the Cloud Run web service URL, and the fallback `project-number.region.run.app` URL so direct signed uploads can work from the UI
- because the test media bucket is private, API responses currently return signed read URLs for both public and private media
- the current web app now supports browser login, member signup, role-aware dashboards, public profile browsing, member mailbox, media upload, membership checkout preview/order flows, a simulated gateway redirect checkout page, and super admin mailing controls
- the current platform now also records first-party product analytics events from web and mobile, and exposes a super admin analytics summary through the dashboard
- the current platform now also exposes super admin commercial controls for payment method visibility, sponsored placement toggles, slot IDs, and AdSense mode configuration
- the current web app now also supports vendor browser signup, vendor dashboard profile editing, package publishing, public vendor lead capture, and member-linked vendor inquiries
- the current API now supports match mail settings, audience preview, queue-now execution, and targeted campaign queueing
- public home, vendor, and wedding pages now render review-safe sponsored placement cards from the live `meta/public-config` payload, while profile pages stay configurable and default to off
- the repo now includes a legacy export helper plus a dry-run migration report CLI for repeatable ETL validation
- the test stack now also exposes public Ghotok pages, matrimony market landing pages, wedding planning SEO pages, `sitemap.xml`, and `robots.txt`
- a temporary Cloud Run job named `borbodhu-legacy-sample-load-test` can load legacy-shaped TSV fixtures into Cloud SQL for ETL validation inside GCP
- imported legacy users with 32-character MD5 hashes can sign in through the new auth service and are transparently upgraded to the new password hash on successful login

## Live Test URLs

- web: [borbodhu-web-test](https://borbodhu-web-test-508740568768.asia-south1.run.app)
- web service URL: [borbodhu-web-test service URL](https://borbodhu-web-test-fg36ixcqkq-el.a.run.app)
- public profiles: [profiles](https://borbodhu-web-test-508740568768.asia-south1.run.app/profiles)
- public vendors: [vendors](https://borbodhu-web-test-508740568768.asia-south1.run.app/vendors)
- vendor signup: [signup/vendor](https://borbodhu-web-test-508740568768.asia-south1.run.app/signup/vendor)
- public ghotoks: [ghotok](https://borbodhu-web-test-508740568768.asia-south1.run.app/ghotok)
- public matrimony pages: [matrimony](https://borbodhu-web-test-508740568768.asia-south1.run.app/matrimony)
- public wedding planning page: [wedding-planning](https://borbodhu-web-test-508740568768.asia-south1.run.app/wedding-planning)
- test checkout simulator: [checkout/simulate](https://borbodhu-web-test-508740568768.asia-south1.run.app/checkout/simulate)
- sitemap: [sitemap.xml](https://borbodhu-web-test-508740568768.asia-south1.run.app/sitemap.xml)
- robots: [robots.txt](https://borbodhu-web-test-508740568768.asia-south1.run.app/robots.txt)
- API: [borbodhu-api-test](https://borbodhu-api-test-508740568768.asia-south1.run.app)
- API service URL: [borbodhu-api-test service URL](https://borbodhu-api-test-fg36ixcqkq-el.a.run.app)
- health check: [api health](https://borbodhu-api-test-508740568768.asia-south1.run.app/v1/health)
- public config: [meta/public-config](https://borbodhu-api-test-508740568768.asia-south1.run.app/v1/meta/public-config)

## Seed Accounts

- admin and super admin: `admin@borbodhu.local` / `Password123!`
- member: `member@borbodhu.local` / `Password123!`
- second member: `member2@borbodhu.local` / `Password123!`
- ghotok: `ghotok@borbodhu.local` / `Password123!`
- vendor: `vendor@borbodhu.local` / `Password123!`

## Legacy Migration Validation

- sample import job: `borbodhu-legacy-sample-load-test`
- imported public sample profiles now increase the public profile count in the test API and web profile index
- imported sample Ghotok `Rashida Ghotok` now shows `managedCount = 1` through the public Ghotok API and detail page
- imported legacy member `legacy.qa.member@example.com` can sign in with the old MD5 password `demo1234`, proving the selective legacy-password fallback path works
- vendor smoke checks now verify browser vendor signup route, API vendor signup, package publishing, public lead capture, member lead capture, and vendor dashboard readback
- repeatable smoke command:
  - baseline: `npm run qa:parity:smoke`
  - with vendor self-service flow: `RUN_VENDOR_SMOKE=1 npm run qa:parity:smoke`
