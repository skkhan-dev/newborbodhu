# Borbodhu Legacy Load Jobs

## Purpose

Run repeatable legacy import validation inside GCP so Borbodhu migration tests are not blocked by local database networking.

## Current loader

- load CLI: [legacy-load.ts](/Users/skkhan/workarea/new.borbodhu.com/apps/api/src/migration/legacy-load.ts)
- root script: `npm run migration:legacy:load -- <sourceDir> [outputPath]`
- API workspace script: `npm run migration:legacy:load --workspace @borbodhu/api -- <sourceDir> [outputPath]`
- GCP sample job helper: [run-legacy-sample-load-test.sh](/Users/skkhan/workarea/new.borbodhu.com/scripts/gcp/run-legacy-sample-load-test.sh)

## Current GCP validation path

- Cloud Run job: `borbodhu-legacy-sample-load-test`
- region: `asia-south1`
- target database: Cloud SQL test instance behind the Borbodhu test stack
- image source: the same API image used by the test service

The sample job creates a small legacy-shaped TSV fixture set in `/tmp`, runs the loader, and imports:

- membership plan
- members
- partner preferences
- profile media
- vendor
- Ghotok
- Ghotok credit wallet and ledger
- admin
- payment
- recent mailbox rows

## Verified outcomes

- imported sample profiles appear in [public profiles](https://borbodhu-web-test-508740568768.asia-south1.run.app/profiles)
- imported sample Ghotok appears in [public ghotok directory](https://borbodhu-web-test-508740568768.asia-south1.run.app/ghotok)
- imported Ghotok managed-member count now resolves correctly after the `managedByGhotokId` mapping fix
- imported MD5-hash member credentials can log in through the new auth API and are rehashed into the new password format on success

## Recommended migration rehearsal sequence

1. Export a fresh legacy snapshot with [export-legacy-snapshot.sh](/Users/skkhan/workarea/new.borbodhu.com/scripts/legacy/export-legacy-snapshot.sh).
2. Run the dry-run analyzer with [legacy-dry-run.ts](/Users/skkhan/workarea/new.borbodhu.com/apps/api/src/migration/legacy-dry-run.ts).
3. Load the snapshot into a non-production database with [legacy-load.ts](/Users/skkhan/workarea/new.borbodhu.com/apps/api/src/migration/legacy-load.ts).
4. Compare counts and sampled records against the parity matrix and parity test plan.
5. Re-run public profile, vendor, Ghotok, mailbox, and login smoke tests.

## Notes

- The sample Cloud Run job is for ETL validation, not final cutover.
- Final cutover should load a real snapshot, reconcile counts, and keep an operator-readable JSON report for each run.
