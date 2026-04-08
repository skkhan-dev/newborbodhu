#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-punorupa}"
REGION="${REGION:-asia-south1}"
JOB_NAME="${JOB_NAME:-borbodhu-legacy-full-load-test}"
API_IMAGE="${API_IMAGE:-asia-south1-docker.pkg.dev/punorupa/borbodhu-test/borbodhu-api-test:latest}"
INSTANCE_CONNECTION_NAME="${INSTANCE_CONNECTION_NAME:-punorupa:asia-south1:borbodhu-test-pg}"
COMPUTE_SA="${COMPUTE_SA:-508740568768-compute@developer.gserviceaccount.com}"
DATABASE_SECRET="${DATABASE_SECRET:-borbodhu-test-database-url}"
LEGACY_SNAPSHOT_URI="${LEGACY_SNAPSHOT_URI:-gs://punorupa-borbodhu-media-test/imports/legacy_snapshot_20260322_160735}"

LOAD_SCRIPT=$(cat <<'EOF'
set -eu
F=/tmp/legacy-full
mkdir -p "$F"
node apps/api/dist/migration/download-gcs-prefix.js "$LEGACY_SNAPSHOT_URI" "$F"
node apps/api/dist/migration/legacy-bulk-load.js "$F" "$F/legacy-load-report.json"
node apps/api/dist/migration/legacy-reconcile.js "$F" "$F/legacy-reconcile-report.json"
echo "LEGACY_LOAD_REPORT"
cat "$F/legacy-load-report.json"
echo "LEGACY_RECONCILE_REPORT"
cat "$F/legacy-reconcile-report.json"
EOF
)

JOB_ARGS=(
  "--project=${PROJECT_ID}"
  "--region=${REGION}"
  "--image=${API_IMAGE}"
  "--command=/bin/sh"
  "--args=-c,${LOAD_SCRIPT}"
  "--set-env-vars=LEGACY_SNAPSHOT_URI=${LEGACY_SNAPSHOT_URI}"
  "--set-secrets=DATABASE_URL=${DATABASE_SECRET}:latest"
  "--set-cloudsql-instances=${INSTANCE_CONNECTION_NAME}"
  "--service-account=${COMPUTE_SA}"
  "--tasks=1"
  "--max-retries=0"
  "--parallelism=1"
  "--cpu=2"
  "--memory=2Gi"
  "--task-timeout=3600s"
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
