#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-punorupa}"
REGION="${REGION:-asia-south1}"
SQL_REGION="${SQL_REGION:-asia-south1}"
AR_REPO="${AR_REPO:-borbodhu-test}"
SQL_INSTANCE="${SQL_INSTANCE:-borbodhu-test-pg}"
SQL_DATABASE="${SQL_DATABASE:-borbodhu}"
SQL_USER="${SQL_USER:-borbodhu}"
BUCKET_NAME="${BUCKET_NAME:-${PROJECT_ID}-borbodhu-media-test}"

echo "Using project: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}" >/dev/null

echo "Enabling required services..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  storage.googleapis.com

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Ensuring Artifact Registry repository exists..."
if ! gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${AR_REPO}" \
    --location="${REGION}" \
    --repository-format=docker \
    --description="Borbodhu test containers"
fi

echo "Ensuring Cloud Storage bucket exists..."
if ! gsutil ls -b "gs://${BUCKET_NAME}" >/dev/null 2>&1; then
  gsutil mb -p "${PROJECT_ID}" -l "${REGION}" "gs://${BUCKET_NAME}"
fi

echo "Ensuring Cloud SQL instance exists..."
if ! gcloud sql instances describe "${SQL_INSTANCE}" >/dev/null 2>&1; then
  gcloud sql instances create "${SQL_INSTANCE}" \
    --database-version=POSTGRES_16 \
    --edition=ENTERPRISE \
    --region="${SQL_REGION}" \
    --cpu=1 \
    --memory=3840MB \
    --storage-size=10GB \
    --storage-type=SSD \
    --availability-type=zonal \
    --backup-start-time=03:00 \
    --deletion-protection
fi

echo "Ensuring database exists..."
if ! gcloud sql databases describe "${SQL_DATABASE}" --instance="${SQL_INSTANCE}" >/dev/null 2>&1; then
  gcloud sql databases create "${SQL_DATABASE}" --instance="${SQL_INSTANCE}"
fi

# Keep the generated password URL-safe so DATABASE_URL does not need escaping.
DB_PASSWORD="$(openssl rand -hex 24)"
echo "Resetting database user password..."
if gcloud sql users describe "${SQL_USER}" --instance="${SQL_INSTANCE}" >/dev/null 2>&1; then
  gcloud sql users set-password "${SQL_USER}" --instance="${SQL_INSTANCE}" --password="${DB_PASSWORD}"
else
  gcloud sql users create "${SQL_USER}" --instance="${SQL_INSTANCE}" --password="${DB_PASSWORD}"
fi

INSTANCE_CONNECTION_NAME="$(gcloud sql instances describe "${SQL_INSTANCE}" --format='value(connectionName)')"
DATABASE_URL="postgresql://${SQL_USER}:${DB_PASSWORD}@localhost:5432/${SQL_DATABASE}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"

JWT_SECRET="$(openssl rand -hex 32)"
PAYMENT_WEBHOOK_SECRET="$(openssl rand -hex 32)"

create_or_update_secret() {
  local name="$1"
  local value="$2"
  if gcloud secrets describe "${name}" >/dev/null 2>&1; then
    printf '%s' "${value}" | gcloud secrets versions add "${name}" --data-file=-
  else
    printf '%s' "${value}" | gcloud secrets create "${name}" --replication-policy=automatic --data-file=-
  fi
}

echo "Upserting secrets..."
create_or_update_secret "borbodhu-test-database-url" "${DATABASE_URL}"
create_or_update_secret "borbodhu-test-jwt-secret" "${JWT_SECRET}"
create_or_update_secret "borbodhu-test-payment-webhook-secret" "${PAYMENT_WEBHOOK_SECRET}"

echo "Granting runtime secret access..."
for secret in \
  borbodhu-test-database-url \
  borbodhu-test-jwt-secret \
  borbodhu-test-payment-webhook-secret; do
  gcloud secrets add-iam-policy-binding "${secret}" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/secretmanager.secretAccessor" >/dev/null
done

echo "Granting Cloud SQL access to runtime service account..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/cloudsql.client" >/dev/null

echo "Granting service-account signing permission for GCS signed URLs..."
gcloud iam service-accounts add-iam-policy-binding "${COMPUTE_SA}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/iam.serviceAccountTokenCreator" >/dev/null

echo "Granting media bucket object access to runtime service account..."
gsutil iam ch \
  "serviceAccount:${COMPUTE_SA}:roles/storage.objectAdmin" \
  "gs://${BUCKET_NAME}" >/dev/null

echo "Applying media bucket CORS for browser signed uploads..."
gsutil cors set \
  "/Users/skkhan/workarea/new.borbodhu.com/deploy/gcp/gcs-cors.json" \
  "gs://${BUCKET_NAME}" >/dev/null

cat <<EOF
Test environment base setup is ready.
Project: ${PROJECT_ID}
Region: ${REGION}
Cloud SQL instance: ${SQL_INSTANCE}
Database: ${SQL_DATABASE}
Artifact Registry repo: ${AR_REPO}
Bucket: gs://${BUCKET_NAME}
Instance connection: ${INSTANCE_CONNECTION_NAME}
EOF
