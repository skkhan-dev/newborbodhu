#!/usr/bin/env bash
set -euo pipefail

LEGACY_BASE_URL="${LEGACY_BASE_URL:-https://borbodhu.com}"
NEW_WEB_URL="${NEW_WEB_URL:-https://borbodhu-web-test-508740568768.asia-south1.run.app}"
NEW_API_URL="${NEW_API_URL:-https://borbodhu-api-test-508740568768.asia-south1.run.app/v1}"
SMOKE_EMAIL="${SMOKE_EMAIL:-legacy.qa.member@example.com}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-demo1234}"
RUN_VENDOR_SMOKE="${RUN_VENDOR_SMOKE:-0}"

TMP_DIR="$(mktemp -d)"
RESULTS_FILE="${TMP_DIR}/results.jsonl"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

emit_json() {
  jq -cn "$@"
}

check_page() {
  local name="$1"
  local url="$2"
  local keyword="${3:-}"
  local body_file="${TMP_DIR}/${name}.body"
  local status
  status="$(curl -sS -L -o "${body_file}" -w '%{http_code}' "${url}" || true)"

  local keyword_found="null"
  if [[ -n "${keyword}" ]]; then
    if rg -qi --fixed-strings "${keyword}" "${body_file}"; then
      keyword_found="true"
    else
      keyword_found="false"
    fi
  fi

  emit_json \
    --arg kind "page" \
    --arg name "${name}" \
    --arg url "${url}" \
    --arg status "${status}" \
    --arg keyword "${keyword}" \
    --argjson keywordFound "${keyword_found}" \
    '{
      kind: $kind,
      name: $name,
      url: $url,
      status: ($status | tonumber? // 0),
      ok: (($status | tonumber? // 0) >= 200 and ($status | tonumber? // 0) < 400),
      keyword: (if $keyword == "" then null else $keyword end),
      keywordFound: $keywordFound
    }' >> "${RESULTS_FILE}"
}

check_api_health() {
  local url="${NEW_API_URL}/health"
  local response
  response="$(curl -sS "${url}")"

  emit_json \
    --arg kind "api" \
    --arg name "new_api_health" \
    --arg url "${url}" \
    --argjson payload "${response}" \
    '{
      kind: $kind,
      name: $name,
      url: $url,
      ok: ($payload.status == "ok" and $payload.database == "ok"),
      payload: $payload
    }' >> "${RESULTS_FILE}"
}

check_public_counts() {
  local profiles_url="${NEW_API_URL}/public/profiles?page=1&pageSize=20"
  local ghotoks_url="${NEW_API_URL}/public/ghotoks"
  local profiles
  local ghotoks

  profiles="$(curl -sS "${profiles_url}")"
  ghotoks="$(curl -sS "${ghotoks_url}")"

  emit_json \
    --arg kind "api" \
    --arg name "new_public_profiles" \
    --arg url "${profiles_url}" \
    --argjson payload "${profiles}" \
    '{
      kind: $kind,
      name: $name,
      url: $url,
      ok: (($payload.total // 0) >= 1),
      total: ($payload.total // 0),
      imported: (($payload.results // []) | map(select(.publicName == "Ayesha" or .publicName == "Imran")) | map({displayId, publicName, currentCountryCode}))
    }' >> "${RESULTS_FILE}"

  emit_json \
    --arg kind "api" \
    --arg name "new_public_ghotoks" \
    --arg url "${ghotoks_url}" \
    --argjson payload "${ghotoks}" \
    '{
      kind: $kind,
      name: $name,
      url: $url,
      ok: (($payload | map(select(.displayName == "Rashida Ghotok" and .managedCount >= 1)) | length) >= 1),
      rashida: (($payload | map(select(.displayName == "Rashida Ghotok")) | .[0]) // null)
    }' >> "${RESULTS_FILE}"
}

check_legacy_login_upgrade() {
  local url="${NEW_API_URL}/auth/login"
  local payload

  payload="$(jq -cn --arg email "${SMOKE_EMAIL}" --arg password "${SMOKE_PASSWORD}" '{email: $email, password: $password}')"
  local response
  response="$(curl -sS -H 'content-type: application/json' -d "${payload}" "${url}")"

  emit_json \
    --arg kind "api" \
    --arg name "new_legacy_login_upgrade" \
    --arg url "${url}" \
    --arg email "${SMOKE_EMAIL}" \
    --argjson payload "${response}" \
    '{
      kind: $kind,
      name: $name,
      url: $url,
      email: $email,
      ok: (($payload.accessToken // "") != ""),
      user: {
        email: ($payload.user.email // null),
        roles: ($payload.user.roles // []),
        memberProfile: ($payload.user.memberProfile.displayId // null)
      }
    }' >> "${RESULTS_FILE}"
}

check_vendor_flow() {
  local timestamp
  timestamp="$(date +%s)"
  local vendor_email="vendor.qa.${timestamp}@borbodhu.local"
  local vendor_payload
  vendor_payload="$(
    jq -cn \
      --arg email "${vendor_email}" \
      --arg password "Password123!" \
      --arg businessName "Parity Vendor ${timestamp}" \
      --arg categoryName "Photography" \
      --arg contactPerson "Parity QA" \
      --arg phone "+8801700001111" \
      --arg preferredLocale "EN" \
      --arg division "Dhaka" \
      --arg district "Dhaka" \
      --arg area "Banani" \
      --arg descriptionEn "Parity smoke vendor account." \
      '{
        email: $email,
        password: $password,
        businessName: $businessName,
        categoryName: $categoryName,
        contactPerson: $contactPerson,
        phone: $phone,
        preferredLocale: $preferredLocale,
        division: $division,
        district: $district,
        area: $area,
        descriptionEn: $descriptionEn
      }'
  )"

  local vendor_response
  vendor_response="$(curl -sS -H 'content-type: application/json' -d "${vendor_payload}" "${NEW_API_URL}/auth/register/vendor")"
  local vendor_token
  local vendor_slug
  vendor_token="$(printf '%s' "${vendor_response}" | jq -r '.accessToken')"
  vendor_slug="$(printf '%s' "${vendor_response}" | jq -r '.user.vendorProfile.slug')"

  local package_payload
  package_payload="$(
    jq -cn \
      --arg nameEn "Parity Photo Story" \
      --arg descriptionEn "Smoke-test package." \
      '{nameEn: $nameEn, descriptionEn: $descriptionEn, priceBdt: 99000, isActive: true}'
  )"
  curl -sS -X POST \
    -H 'content-type: application/json' \
    -H "authorization: Bearer ${vendor_token}" \
    -d "${package_payload}" \
    "${NEW_API_URL}/vendors/me/packages" >/dev/null

  local public_lead_payload
  public_lead_payload="$(
    jq -cn \
      --arg requesterName "Parity Guest" \
      --arg requesterEmail "parity.guest.${timestamp}@example.com" \
      --arg requesterPhone "+8801800001111" \
      --arg message "Guest inquiry from parity smoke." \
      '{
        requesterName: $requesterName,
        requesterEmail: $requesterEmail,
        requesterPhone: $requesterPhone,
        message: $message
      }'
  )"
  local public_lead_response
  public_lead_response="$(curl -sS -H 'content-type: application/json' -d "${public_lead_payload}" "${NEW_API_URL}/vendors/${vendor_slug}/leads/public")"

  local dashboard
  dashboard="$(curl -sS -H "authorization: Bearer ${vendor_token}" "${NEW_API_URL}/vendors/me/dashboard")"

  emit_json \
    --arg kind "api" \
    --arg name "vendor_self_service_flow" \
    --arg url "${NEW_API_URL}/auth/register/vendor" \
    --arg email "${vendor_email}" \
    --arg slug "${vendor_slug}" \
    --argjson vendorResponse "${vendor_response}" \
    --argjson publicLeadResponse "${public_lead_response}" \
    --argjson dashboard "${dashboard}" \
    '{
      kind: $kind,
      name: $name,
      url: $url,
      ok: (
        ($vendorResponse.accessToken // "") != "" and
        (($dashboard.packages | length) >= 1) and
        (($dashboard.recentLeads | length) >= 1) and
        $publicLeadResponse.success == true
      ),
      vendor: {
        email: $email,
        slug: $slug,
        roles: ($vendorResponse.user.roles // [])
      },
      dashboardSummary: {
        packageCount: ($dashboard.packages | length),
        leadCount: ($dashboard.recentLeads | length)
      }
    }' >> "${RESULTS_FILE}"
}

check_page "legacy_home" "${LEGACY_BASE_URL}" "Borbodhu"
check_page "legacy_admin_login" "${LEGACY_BASE_URL}/index.php/admin" "Admin"
check_page "legacy_ghotok_login" "${LEGACY_BASE_URL}/index.php/ghotok" "Ghotok"
check_page "new_home" "${NEW_WEB_URL}" "Borbodhu"
check_page "new_home_en" "${NEW_WEB_URL}/en" "Bangladeshi"
check_page "new_home_bn" "${NEW_WEB_URL}/bn" "বাংলা"
check_page "new_login_bn" "${NEW_WEB_URL}/bn/login" "লগ ইন"
check_page "new_dashboard_bn" "${NEW_WEB_URL}/bn/dashboard" "লগ ইন"
check_page "new_vendor_signup" "${NEW_WEB_URL}/signup/vendor" "Vendor"
check_page "new_vendor_signup_bn" "${NEW_WEB_URL}/bn/signup/vendor" "ভেন্ডর"
check_page "new_profiles" "${NEW_WEB_URL}/profiles" "profiles"
check_page "new_profiles_bn" "${NEW_WEB_URL}/bn/profiles" "পাবলিক"
check_page "new_vendors" "${NEW_WEB_URL}/vendors" "vendors"
check_page "new_vendors_bn" "${NEW_WEB_URL}/bn/vendors" "ভেন্ডর"
check_page "new_ghotok" "${NEW_WEB_URL}/ghotok" "ghotok"
check_page "new_ghotok_bn" "${NEW_WEB_URL}/bn/ghotok" "ঘটক"
check_page "new_matrimony" "${NEW_WEB_URL}/matrimony" "matrimony"
check_page "new_matrimony_bn" "${NEW_WEB_URL}/bn/matrimony" "ম্যাট্রিমনি"
check_page "new_wedding_planning" "${NEW_WEB_URL}/wedding-planning" "wedding"
check_page "new_wedding_planning_bn" "${NEW_WEB_URL}/bn/wedding-planning" "ওয়েডিং"
check_page "new_sitemap" "${NEW_WEB_URL}/sitemap.xml"
check_page "new_robots" "${NEW_WEB_URL}/robots.txt" "Sitemap:"
check_api_health
check_public_counts
check_legacy_login_upgrade

if [[ "${RUN_VENDOR_SMOKE}" == "1" ]]; then
  check_vendor_flow
fi

jq -s '{
  generatedAt: (now | todate),
  legacyBaseUrl: "'"${LEGACY_BASE_URL}"'",
  newWebUrl: "'"${NEW_WEB_URL}"'",
  newApiUrl: "'"${NEW_API_URL}"'",
  checks: .,
  summary: {
    total: length,
    passed: (map(select(.ok == true)) | length),
    failed: (map(select(.ok != true)) | length)
  }
}' "${RESULTS_FILE}"
