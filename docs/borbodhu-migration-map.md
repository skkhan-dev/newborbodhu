# Borbodhu Migration Map

## Goal

Map the legacy Borbodhu production data into the new canonical platform with minimal loss and clear validation rules.

## Migration strategy

Use a repeatable ETL pipeline with four phases:

1. extract
2. transform
3. load
4. verify

Do not perform one-off manual migration scripts directly against production as the primary path.

## Source systems confirmed

- legacy CodeIgniter database
- legacy uploads directory
- legacy protected uploads
- legacy mobile API side effects
- legacy admin-created records

## Migration scope

### Must migrate

- users
- member profiles
- partner preferences
- photos
- picture privacy requests
- favorites
- blocks
- interests
- profile visits if useful
- active memberships
- historical payments
- ghotok profiles
- ghotok-managed members
- ghotok wallet balances
- coupons and redemptions
- vendor records
- guest lists
- last 6 months of messages

### Can be deferred or summarized

- old unsupported analytics snapshots
- outdated search caches
- obsolete backup tables
- older than 6 months mailbox content unless archived separately

## Table mapping

### Identity and member profile

| Legacy table | New target | Notes |
| --- | --- | --- |
| `tbl_user` | `users`, `member_profiles`, `memberships` | Split auth from profile and active plan state |
| `tbl_partnerprofile` | `partner_preferences` | Mostly one-to-one by legacy `id` |
| `tbl_usersnaps` | `profile_media` | Convert active/default/privacy and file paths |
| `tbl_document` | `profile_media` or `verification_documents` | Separate verification document type |
| `tbl_signup_guard` | `profile_revisions` or `audit_logs` | Preserve moderation and anti-spam traces if needed |

### Interaction and messaging

| Legacy table | New target | Notes |
| --- | --- | --- |
| `tbl_mailbox` | `conversations`, `conversation_participants`, `messages` | Only migrate rows from last 6 months into live mailbox |
| `tbl_picture_request` | `photo_access_requests` | Convert numeric status into explicit states |
| `tbl_favourite_ignore` | `interactions` | Split favorite and block semantics |
| `tbl_views_winks` | `profile_visits` and interaction analytics | Normalize visit vs wink behavior |
| `tbl_user_watched_profiles` | `interactions` or watchlist projection | Keep as separate watch signal if product wants it |

### Commerce

| Legacy table | New target | Notes |
| --- | --- | --- |
| `tbl_membership` | `membership_plans` | Small static set, easy seed import |
| `tbl_payment` | `payments`, `payment_items`, `memberships` | Preserve approvals and payment methods |
| `tbl_card_payment` | `payments` metadata | Map as gateway-specific detail |
| `tbl_other_transaction` | `payments` metadata | Office or manual payments |
| `coupons` | `coupons` | Close match |
| `coupon_redemptions` | `coupon_redemptions` | Close match |

### Ghotok

| Legacy table | New target | Notes |
| --- | --- | --- |
| `tbl_ghotok` | `users`, `user_roles`, `ghotok_profiles` | Create identity plus role plus profile |
| `tbl_ghotok_user` | `ghotok_member_links` | Link ghotok to managed members |
| `tbl_ghotok_credit_wallet` | `ghotok_credit_wallets` | Migrate current balance |
| `tbl_ghotok_credit_txn` | `ghotok_credit_ledger` | Preserve history |
| `tbl_ghotok_transaction` | `payments` or credit ledger metadata | Depends on transaction meaning |
| `tbl_ghotok_view_profile` | `audit_logs` or interaction analytics | Preserve only if useful |

### Vendor and wedding

| Legacy table | New target | Notes |
| --- | --- | --- |
| `tbl_dir_business` | `vendor_profiles` | Core vendor record |
| `tbl_dir_business_member` | `users`, `user_roles`, `vendor_profiles` | For self-service vendor identities |
| `tbl_dir_categories` | `vendor_categories` | Seed category tree |
| `tbl_dir_business_cateogries` | `vendor_profile_categories` | Normalize category assignments |
| `tbl_dir_cmp_images` | `vendor_media` | Vendor gallery |
| `tbl_user_guestlist` | `wedding_guest_entries` | Map into wedding project scope |

### Admin and operations

| Legacy table | New target | Notes |
| --- | --- | --- |
| `tbl_admin` | `users`, `user_roles`, `admin_users` | Import admin identities |
| `tbl_admin_permissions` | `admin_permissions` | Convert wide table to key-value permissions |
| `tbl_admin_actions` | `audit_logs` | Preserve action history |
| `tbl_audit_log` | `audit_logs` | Merge with consistent actor model |
| `tbl_auto_match_notify_config` | `match_mail_rules` | One config record |
| `tbl_auto_match_notify_log` | `match_mail_logs` | Preserve relevant send history |

## Legacy field transformation rules

### Passwords

- detect legacy hash type
- preserve hash only when safe and understood
- attach `legacy_hash_type`
- rehash on next successful login
- otherwise mark for forced reset

### Profile status

Legacy values observed:

- `active`
- `Incomplete`
- `Cancel`
- `approval`
- `Delete`
- `Pending`

Normalize to:

- `active`
- `draft`
- `cancelled`
- `pending_review`
- `deleted`

### Picture privacy

Legacy data suggests current privacy is inconsistent.

Rules:

- keep media approval state
- infer missing privacy conservatively
- default sensitive or uncertain media to private during migration
- rebuild access grants from request records where possible

### Dates and timestamps

- unix timestamps become `timestamptz`
- invalid zero timestamps convert to null and emit migration warnings

### Enums and free text

- standardize religion, profession, body type, complexion, and family values
- preserve original raw text in migration metadata for reconciliation if needed

## Message migration rules

### Live product requirement

Only migrate the last 6 months of mailbox content into the new live mailbox.

### Steps

1. select rows where `sendtime >= cutoff`
2. group into conversations by participant pair
3. preserve sender, recipient, subject, body, timestamps, read state, and folder semantics where relevant
4. archive older content outside the live mailbox import

### Validation checks

- migrated message count equals filtered source count
- random conversation samples match body and timestamps
- unread counts reconcile

## Media migration rules

### Profile photos

- copy originals to Cloud Storage
- generate normalized thumbnails
- map primary photo
- preserve upload ordering

### Private assets

- move protected or private-like assets into restricted storage paths
- do not expose direct public URLs

### Missing files

- log missing media
- mark profile for admin review if core media references are broken

## Migration pipeline

### Step 1: snapshot

- export production DB
- snapshot uploads
- record checksums

### Step 2: staging dry run

- load into staging database
- run ETL
- generate validation reports

### Step 3: reconciliation

- compare counts
- check random samples
- review failures

### Step 4: pre-cutover delta

- rerun import for changed records
- freeze high-risk write paths if needed

### Step 5: cutover

- final sync
- switch traffic
- execute smoke tests

## Validation checklist

### Identity

- user count matches expected active import scope
- legacy hash and reset flags assigned correctly

### Profiles

- profile count matches import policy
- status mapping matches expected totals
- key fields like religion, location, and gender remain intact

### Media

- primary photo exists for expected profiles
- private assets are not publicly exposed

### Commerce

- current memberships are active for the right users
- payment totals reconcile for sampled records
- coupons import correctly

### Ghotok

- each managed member links to the correct ghotok
- wallet balances reconcile with source data

### Wedding and vendors

- vendor profile count matches source
- guest list records are linked to wedding projects

## Risks to handle explicitly

- inconsistent status values
- inconsistent media privacy behavior
- duplicate users across member, ghotok, vendor, and admin identities
- corrupted or missing photo paths
- old mailbox rows with incomplete participant data
- weak or unknown password hashing

## Recommended migration outputs

Each ETL run should produce:

- imported counts by table
- skipped counts by reason
- media missing report
- enum normalization report
- password reset candidate list
- profile moderation follow-up list
