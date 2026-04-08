# Borbodhu Legacy Migration Tooling

## Goal

Make legacy-to-new migration repeatable with a lightweight export and dry-run report flow before full ETL load jobs begin.

## What is included

- legacy export helper: [export-legacy-snapshot.sh](/Users/skkhan/workarea/new.borbodhu.com/scripts/legacy/export-legacy-snapshot.sh)
- dry-run report CLI: [legacy-dry-run.ts](/Users/skkhan/workarea/new.borbodhu.com/apps/api/src/migration/legacy-dry-run.ts)
- load CLI: [legacy-load.ts](/Users/skkhan/workarea/new.borbodhu.com/apps/api/src/migration/legacy-load.ts)
- GCP job notes: [borbodhu-legacy-load-jobs.md](/Users/skkhan/workarea/new.borbodhu.com/docs/borbodhu-legacy-load-jobs.md)

## Export step

Run the export helper on the legacy environment, or on any host that has:

- `mysql`
- network access to the legacy MySQL server
- credentials from the live CodeIgniter `application/config/database.php`

Example:

```bash
export LEGACY_DB_HOST=localhost
export LEGACY_DB_USER=...
export LEGACY_DB_PASSWORD=...
export LEGACY_DB_NAME=...
export EXPORT_DIR=./legacy_snapshot_20260319
bash scripts/legacy/export-legacy-snapshot.sh
```

This produces TSV snapshots for the key migration tables plus:

- `tbl_mailbox_recent.tsv` filtered to the last 6 months
- `table_inventory.tsv` for schema-level reconciliation

## Dry-run step

Run from this repo:

```bash
npm run migration:legacy:dry-run -- ./legacy_snapshot_20260319 ./legacy_snapshot_20260319/report.json
```

If `DATABASE_URL` is also set, the report includes a current target-db snapshot for comparison.

## Dry-run output

The JSON report includes:

- exported table counts and column headers
- legacy user status, gender, and country summaries
- missing-email candidates
- media privacy and missing-path warnings
- recent mailbox participant anomalies
- payment gateway and status summaries
- sample records for users, ghotoks, vendors, and admins
- target database counts when available
- migration recommendations based on detected anomalies

## Current purpose

This is the first migration execution layer, not the final cutover importer yet.

It is designed to answer:

- do the legacy exports contain the rows we expect
- are the major source fields stable enough to transform
- which anomalies need explicit handling before final ETL load jobs

It now also supports a repeatable in-GCP sample load path so we can validate:

- imported public profile visibility
- imported Ghotok ownership mapping
- imported recent mailbox creation
- legacy MD5-password login fallback and transparent rehash
