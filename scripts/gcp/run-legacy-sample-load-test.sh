#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-punorupa}"
REGION="${REGION:-asia-south1}"
JOB_NAME="${JOB_NAME:-borbodhu-legacy-sample-load-test}"
API_IMAGE="${API_IMAGE:-asia-south1-docker.pkg.dev/punorupa/borbodhu-test/borbodhu-api-test:latest}"
INSTANCE_CONNECTION_NAME="${INSTANCE_CONNECTION_NAME:-punorupa:asia-south1:borbodhu-test-pg}"
COMPUTE_SA="${COMPUTE_SA:-508740568768-compute@developer.gserviceaccount.com}"
DATABASE_SECRET="${DATABASE_SECRET:-borbodhu-test-database-url}"

LOAD_SCRIPT=$(cat <<'EOF'
set -e
F=/tmp/legacy-fixture
mkdir -p "$F"
printf "%b" "id\temail\tpassword\tfirstname\tlastname\tdisplayname\tgender\tlooking_for\tstatus\treligion\tmother_tongue\teducation\tprofession\tcurrent_country\tcurrent_city\thome_country\thome_division\thome_district\tabout_me\tfamily_details\tguardian_phone\tpreferred_locale\tdob\n900001\tlegacy.qa.member@example.com\t6e9bece1914809fb8493146417e722f6\tAyesha\tNoor\tAyesha Noor\twoman\tman\tactive\tIslam\tBangla\tMasters\tProduct Manager\tUS\tNew York\tBD\tDhaka\tDhaka\tLegacy import QA diaspora member\tFamily values respect and education\t+17185550001\ten\t1995-07-14\n900002\tlegacy.qa.member2@example.com\t6e9bece1914809fb8493146417e722f6\tImran\tAhmed\tImran Ahmed\tman\twoman\tactive\tIslam\tBangla\tMBA\tOperations Lead\tBD\tDhaka\tBD\tChattogram\tChattogram\tLegacy import QA mailbox member\tClose knit family roots in Chattogram\t+8801712345002\ten\t1991-03-21\n" > "$F/tbl_user.tsv"
printf "%b" "id\tuser_id\tgender\tage_min\tage_max\treligion\tmother_tongue\teducation\tprofession\tliving_country\thome_country\tabout_partner\n900101\t900001\tman\t29\t38\tIslam\tBangla\tMasters|PhD\tEngineer|Consultant\tUS|CA\tBD\tLooking for a serious family aware match\n900102\t900002\twoman\t24\t34\tIslam\tBangla\tHonours|Masters\tTeacher|Designer\tBD\tBD\tLooking for a kind educated match\n" > "$F/tbl_partnerprofile.tsv"
printf "%b" "id\tuser_id\timage\tprivacy\tis_primary\tstatus\tmime_type\n910001\t900001\tlegacy/photos/ayesha-noor.jpg\tpublic\t1\tapproved\timage/jpeg\n910002\t900002\tlegacy/photos/imran-ahmed.jpg\tprivate\t1\tapproved\timage/jpeg\n" > "$F/tbl_usersnaps.tsv"
printf "%b" "id\tsender_id\treceiver_id\tsubject\tmessage\tsendtime\treadtime\n920001\t900001\t900002\tSalam\tAssalamu alaikum from legacy import test\t1773900000\t1773903600\n" > "$F/tbl_mailbox_recent.tsv"
printf "%b" "id\tuser_id\tgateway\tamount\tdiscount_amount\tfinal_amount\tcurrency\tstatus\ttxn_id\tpayment_date\tmembership_id\n930001\t900001\tpaypal\t49.00\t0.00\t49.00\tUSD\tpaid\tPAYPAL930001\t1773900000\t940001\n" > "$F/tbl_payment.tsv"
printf "%b" "id\tname\tdays\tprice\tusd_price\tcontact_limit\tactive\n940001\tGold\t60\t3999.00\t49.00\t50\t1\n" > "$F/tbl_membership.tsv"
printf "%b" "id\temail\tpassword\tdisplay_name\tphone\taddress\tstatus\tbio\tlanguage\n950001\tlegacy.qa.ghotok@example.com\t6e9bece1914809fb8493146417e722f6\tRashida Ghotok\t+8801811122233\tSylhet Bangladesh\tactive\tTrusted Sylhet ghotok for family guided introductions\tbn\n" > "$F/tbl_ghotok.tsv"
printf "%b" "ghotok_id\tuser_id\n950001\t900001\n" > "$F/tbl_ghotok_user.tsv"
printf "%b" "ghotok_id\tbalance\n950001\t12\n" > "$F/tbl_ghotok_credit_wallet.tsv"
printf "%b" "id\tghotok_id\tentry_type\tamount\tbalance_after\tnotes\tcreated_at\n960001\t950001\tCREDIT_PURCHASE\t12\t12\tInitial migrated balance\t1773900000\n" > "$F/tbl_ghotok_credit_txn.tsv"
printf "%b" "id\tbusiness_name\tcategory_name\tdivision\tdistrict\tarea\taddress\tcontact_person\tphone\temail\twebsite\tdescription\tstatus\n970001\tRupkatha Events\tWedding Planner\tDhaka\tDhaka\tBanani\tBanani Dhaka\tNusrat Jahan\t+8801711998877\tlegacy.qa.vendor@example.com\thttps://rupkatha.example.com\tBoutique wedding planning for Bangladeshi families\tactive\n" > "$F/tbl_dir_business.tsv"
printf "%b" "id\temail\tpassword\tdisplay_name\tis_super_admin\tstatus\n980001\tlegacy.qa.admin@example.com\t6e9bece1914809fb8493146417e722f6\tQA Super Admin\t1\tACTIVE\n" > "$F/tbl_admin.tsv"
node apps/api/dist/migration/legacy-load.js "$F" "$F/report.json"
cat "$F/report.json"
EOF
)

JOB_ARGS=(
  "--project=${PROJECT_ID}"
  "--region=${REGION}"
  "--image=${API_IMAGE}"
  "--command=/bin/sh"
  "--args=-c,${LOAD_SCRIPT}"
  "--set-secrets=DATABASE_URL=${DATABASE_SECRET}:latest"
  "--set-cloudsql-instances=${INSTANCE_CONNECTION_NAME}"
  "--service-account=${COMPUTE_SA}"
  "--tasks=1"
  "--max-retries=0"
  "--parallelism=1"
  "--cpu=1"
  "--memory=512Mi"
)

if gcloud run jobs describe "${JOB_NAME}" --project="${PROJECT_ID}" --region="${REGION}" >/dev/null 2>&1; then
  gcloud run jobs update "${JOB_NAME}" "${JOB_ARGS[@]}"
else
  gcloud run jobs create "${JOB_NAME}" "${JOB_ARGS[@]}"
fi

gcloud run jobs execute "${JOB_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --wait
