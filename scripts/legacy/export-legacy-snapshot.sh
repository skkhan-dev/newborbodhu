#!/usr/bin/env bash
set -euo pipefail

EXPORT_DIR="${EXPORT_DIR:-./legacy_snapshot_$(date +%Y%m%d_%H%M%S)}"
DB_HOST="${LEGACY_DB_HOST:-localhost}"
DB_USER="${LEGACY_DB_USER:-}"
DB_PASSWORD="${LEGACY_DB_PASSWORD:-}"
DB_NAME="${LEGACY_DB_NAME:-}"
RECENT_MONTHS="${RECENT_MONTHS:-6}"
FULL_MAILBOX="${FULL_MAILBOX:-0}"

if [[ -z "${DB_USER}" || -z "${DB_PASSWORD}" || -z "${DB_NAME}" ]]; then
  echo "LEGACY_DB_USER, LEGACY_DB_PASSWORD, and LEGACY_DB_NAME are required." >&2
  exit 1
fi

mkdir -p "${EXPORT_DIR}"

MYSQL_BASE=(
  mysql
  --batch
  --default-character-set=utf8mb4
  -h "${DB_HOST}"
  -u "${DB_USER}"
  "-p${DB_PASSWORD}"
  "${DB_NAME}"
)

table_exists() {
  "${MYSQL_BASE[@]}" -N -e "SHOW TABLES LIKE '$1'" | grep -q .
}

export_query() {
  local file_name="$1"
  local sql="$2"
  echo "Exporting ${file_name}..."
  "${MYSQL_BASE[@]}" -e "${sql}" > "${EXPORT_DIR}/${file_name}"
}

export_table() {
  local table_name="$1"
  local file_name="${table_name}.tsv"

  if table_exists "${table_name}"; then
    export_query "${file_name}" "SELECT * FROM \`${table_name}\`;"
  else
    echo "Skipping missing table ${table_name}."
  fi
}

for table_name in \
  tbl_user \
  tbl_partnerprofile \
  tbl_usersnaps \
  tbl_picture_request \
  tbl_favourite_ignore \
  tbl_views_winks \
  tbl_payment \
  tbl_membership \
  coupons \
  coupon_redemptions \
  tbl_ghotok \
  tbl_ghotok_user \
  tbl_ghotok_credit_wallet \
  tbl_ghotok_credit_txn \
  tbl_dir_business \
  tbl_user_guestlist \
  tbl_admin
do
  export_table "${table_name}"
done

if table_exists "tbl_mailbox"; then
  if [[ "${FULL_MAILBOX}" == "1" ]]; then
    export_query \
      "tbl_mailbox.tsv" \
      "SELECT * FROM \`tbl_mailbox\`;"

    export_query \
      "tbl_mailbox_canonical.tsv" \
      "SELECT \
         MIN(id) AS legacy_group_id, \
         senderid, \
         recipientid, \
         subject, \
         message, \
         sendtime, \
         MAX(CASE WHEN orig_filename1 IS NOT NULL AND orig_filename1 != '' THEN orig_filename1 ELSE NULL END) AS orig_filename1, \
         MAX(CASE WHEN virtual_filename1 IS NOT NULL AND virtual_filename1 != '' THEN virtual_filename1 ELSE NULL END) AS virtual_filename1, \
         MAX(CASE WHEN owner = recipientid AND folder = 'inbox' AND flagread = 1 THEN 1 ELSE 0 END) AS recipient_read, \
         MAX(CASE WHEN owner = senderid AND folder = 'sent' THEN 1 ELSE 0 END) AS has_sent_copy, \
         MAX(CASE WHEN owner = recipientid AND folder = 'inbox' THEN 1 ELSE 0 END) AS has_inbox_copy, \
         MAX(CASE WHEN folder = 'trashcan' THEN 1 ELSE 0 END) AS has_trash_copy, \
         COUNT(*) AS source_row_count \
       FROM \`tbl_mailbox\` \
       GROUP BY senderid, recipientid, subject, message, sendtime;"
  fi

  export_query \
    "tbl_mailbox_recent.tsv" \
    "SELECT * FROM \`tbl_mailbox\` WHERE FROM_UNIXTIME(sendtime) >= DATE_SUB(NOW(), INTERVAL ${RECENT_MONTHS} MONTH);"
fi

export_query \
  "table_inventory.tsv" \
  "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = '${DB_NAME}' ORDER BY table_name;"

cat <<EOF
Legacy snapshot export complete.
Export directory: ${EXPORT_DIR}
Recent mailbox window: ${RECENT_MONTHS} month(s)
Full mailbox export: ${FULL_MAILBOX}
EOF
