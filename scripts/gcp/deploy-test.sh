#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-punorupa}"
REGION="${REGION:-asia-south1}"
AR_REPO="${AR_REPO:-borbodhu-test}"
SQL_INSTANCE="${SQL_INSTANCE:-borbodhu-test-pg}"
SQL_DATABASE="${SQL_DATABASE:-borbodhu}"
API_SERVICE="${API_SERVICE:-borbodhu-api-test}"
WEB_SERVICE="${WEB_SERVICE:-borbodhu-web-test}"
DB_JOB="${DB_JOB:-borbodhu-db-setup-test}"
BUCKET_NAME="${BUCKET_NAME:-${PROJECT_ID}-borbodhu-media-test}"

gcloud config set project "${PROJECT_ID}" >/dev/null

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
INSTANCE_CONNECTION_NAME="$(gcloud sql instances describe "${SQL_INSTANCE}" --format='value(connectionName)')"
WEB_FALLBACK_URL="https://${WEB_SERVICE}-${PROJECT_NUMBER}.${REGION}.run.app"
ENV_DELIM="^##^"

API_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/borbodhu-api-test:latest"
WEB_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/borbodhu-web-test:latest"

echo "Building API image..."
gcloud builds submit \
  --region="${REGION}" \
  --config=deploy/gcp/cloudbuild.api.yaml \
  --substitutions="_IMAGE=${API_IMAGE}"

echo "Building web image..."
gcloud builds submit \
  --region="${REGION}" \
  --config=deploy/gcp/cloudbuild.web.yaml \
  --substitutions="_IMAGE=${WEB_IMAGE}"

echo "Deploying API service..."
gcloud run deploy "${API_SERVICE}" \
  --image="${API_IMAGE}" \
  --region="${REGION}" \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="${ENV_DELIM}NODE_ENV=production##WEB_APP_URL=https://example.com##WEB_APP_URLS=http://localhost:3000,https://example.com,${WEB_FALLBACK_URL}" \
  --set-env-vars="PASSWORD_RESET_TTL_MINUTES=30" \
  --set-env-vars="MEDIA_BUCKET_NAME=${BUCKET_NAME}" \
  --set-secrets="DATABASE_URL=borbodhu-test-database-url:latest,JWT_SECRET=borbodhu-test-jwt-secret:latest,PAYMENT_WEBHOOK_SECRET=borbodhu-test-payment-webhook-secret:latest,RESEND_API_KEY=borbodhu-test-resend-api-key:latest,STRIPE_SECRET_KEY=borbodhu-test-stripe-secret-key:latest" \
  --add-cloudsql-instances="${INSTANCE_CONNECTION_NAME}" \
  --service-account="${COMPUTE_SA}"

API_URL="$(gcloud run services describe "${API_SERVICE}" --region="${REGION}" --format='value(status.url)')"

echo "Deploying web service..."
gcloud run deploy "${WEB_SERVICE}" \
  --image="${WEB_IMAGE}" \
  --region="${REGION}" \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_BASE_URL=${API_URL}" \
  --set-secrets="AUTH_SECRET=borbodhu-test-nextauth-secret:latest,GOOGLE_CLIENT_ID=borbodhu-test-google-client-id:latest,GOOGLE_CLIENT_SECRET=borbodhu-test-google-client-secret:latest,FACEBOOK_CLIENT_ID=borbodhu-test-facebook-client-id:latest,FACEBOOK_CLIENT_SECRET=borbodhu-test-facebook-client-secret:latest" \
  --service-account="${COMPUTE_SA}"

WEB_URL="$(gcloud run services describe "${WEB_SERVICE}" --region="${REGION}" --format='value(status.url)')"
WEB_ALLOWED_URLS="$(printf '%s,%s,%s' 'http://localhost:3000' "${WEB_URL}" "${WEB_FALLBACK_URL}")"

echo "Updating API service with final web URL..."
gcloud run services update "${API_SERVICE}" \
  --region="${REGION}" \
  --update-env-vars="${ENV_DELIM}WEB_APP_URL=${WEB_URL}##WEB_APP_URLS=${WEB_ALLOWED_URLS}"

echo "Refreshing media bucket CORS for browser upload origins..."
TMP_CORS_FILE="$(mktemp)"
cat > "${TMP_CORS_FILE}" <<EOF
[
  {
    "origin": [
      "http://localhost:3000",
      "${WEB_URL}",
      "${WEB_FALLBACK_URL}"
    ],
    "method": [
      "GET",
      "HEAD",
      "PUT"
    ],
    "responseHeader": [
      "Content-Type",
      "x-goog-resumable"
    ],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set "${TMP_CORS_FILE}" "gs://${BUCKET_NAME}"
rm -f "${TMP_CORS_FILE}"

echo "Ensuring database setup job exists..."
DB_JOB_ARGS=(
  "--project=${PROJECT_ID}"
  "--image=${API_IMAGE}"
  "--region=${REGION}"
  "--command=/bin/sh"
  "--args=-c,npm run db:push:api && npm run seed:api"
  "--set-env-vars=${ENV_DELIM}NODE_ENV=production##PASSWORD_RESET_TTL_MINUTES=30##MEDIA_BUCKET_NAME=${BUCKET_NAME}##WEB_APP_URL=${WEB_URL}##WEB_APP_URLS=${WEB_ALLOWED_URLS}"
  "--set-secrets=DATABASE_URL=borbodhu-test-database-url:latest,JWT_SECRET=borbodhu-test-jwt-secret:latest,PAYMENT_WEBHOOK_SECRET=borbodhu-test-payment-webhook-secret:latest"
  "--set-cloudsql-instances=${INSTANCE_CONNECTION_NAME}"
  "--service-account=${COMPUTE_SA}"
  "--tasks=1"
  "--max-retries=0"
  "--parallelism=1"
)

if gcloud run jobs describe "${DB_JOB}" --project="${PROJECT_ID}" --region="${REGION}" >/dev/null 2>&1; then
  gcloud run jobs update "${DB_JOB}" "${DB_JOB_ARGS[@]}"
else
  gcloud run jobs create "${DB_JOB}" "${DB_JOB_ARGS[@]}"
fi

echo "Running database setup job..."
gcloud run jobs execute "${DB_JOB}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --wait

cat <<EOF
Deployment complete.
API: ${API_URL}
Web: ${WEB_URL}
Database job: ${DB_JOB}
EOF
