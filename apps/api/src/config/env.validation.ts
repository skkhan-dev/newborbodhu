function parseRequiredString(
  value: unknown,
  name: string,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Environment variable ${name} is required.`);
  }

  return value.trim();
}

function parseNumber(
  value: unknown,
  name: string,
  fallback?: number,
): number {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error(`Environment variable ${name} is required.`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }

  return parsed;
}

export function validateEnv(config: Record<string, unknown>) {
  return {
    ...config,
    DATABASE_URL: parseRequiredString(config.DATABASE_URL, "DATABASE_URL"),
    JWT_SECRET: parseRequiredString(config.JWT_SECRET, "JWT_SECRET"),
    JWT_EXPIRES_IN:
      typeof config.JWT_EXPIRES_IN === "string" && config.JWT_EXPIRES_IN.trim().length > 0
        ? config.JWT_EXPIRES_IN.trim()
        : "7d",
    NODE_ENV:
      typeof config.NODE_ENV === "string" && config.NODE_ENV.trim().length > 0
        ? config.NODE_ENV.trim()
        : "development",
    PORT: parseNumber(config.PORT, "PORT", 4000),
    PASSWORD_RESET_TTL_MINUTES: parseNumber(
      config.PASSWORD_RESET_TTL_MINUTES,
      "PASSWORD_RESET_TTL_MINUTES",
      30,
    ),
    PAYMENT_WEBHOOK_SECRET:
      typeof config.PAYMENT_WEBHOOK_SECRET === "string" &&
      config.PAYMENT_WEBHOOK_SECRET.trim().length > 0
        ? config.PAYMENT_WEBHOOK_SECRET.trim()
        : undefined,
    CHECKOUT_SESSION_TTL_MINUTES: parseNumber(
      config.CHECKOUT_SESSION_TTL_MINUTES,
      "CHECKOUT_SESSION_TTL_MINUTES",
      30,
    ),
    MEDIA_BUCKET_NAME:
      typeof config.MEDIA_BUCKET_NAME === "string" &&
      config.MEDIA_BUCKET_NAME.trim().length > 0
        ? config.MEDIA_BUCKET_NAME.trim()
        : undefined,
    MEDIA_PUBLIC_BASE_URL:
      typeof config.MEDIA_PUBLIC_BASE_URL === "string" &&
      config.MEDIA_PUBLIC_BASE_URL.trim().length > 0
        ? config.MEDIA_PUBLIC_BASE_URL.trim()
        : undefined,
    MEDIA_UPLOAD_URL_TTL_MINUTES: parseNumber(
      config.MEDIA_UPLOAD_URL_TTL_MINUTES,
      "MEDIA_UPLOAD_URL_TTL_MINUTES",
      15,
    ),
    MEDIA_DOWNLOAD_URL_TTL_MINUTES: parseNumber(
      config.MEDIA_DOWNLOAD_URL_TTL_MINUTES,
      "MEDIA_DOWNLOAD_URL_TTL_MINUTES",
      30,
    ),
    WEB_APP_URL:
      typeof config.WEB_APP_URL === "string" && config.WEB_APP_URL.trim().length > 0
        ? config.WEB_APP_URL.trim()
        : "http://localhost:3000",
    WEB_APP_URLS:
      typeof config.WEB_APP_URLS === "string" && config.WEB_APP_URLS.trim().length > 0
        ? config.WEB_APP_URLS.trim()
        : undefined,
  };
}
