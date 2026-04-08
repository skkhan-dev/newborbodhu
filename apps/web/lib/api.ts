const DEFAULT_API_BASE_URL =
  "https://borbodhu-api-test-508740568768.asia-south1.run.app/v1";

function normalizeApiBaseUrl(value: string) {
  const trimmed = value.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiRequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  signal?: AbortSignal;
};

export function getApiBaseUrl() {
  return normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
}

function getMessageFromPayload(payload: unknown) {
  if (!payload) {
    return "The request could not be completed.";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.message === "string") {
      return record.message;
    }

    if (Array.isArray(record.message)) {
      return record.message.join(" ");
    }

    if (typeof record.error === "string") {
      return record.error;
    }
  }

  return "The request could not be completed.";
}

async function readPayload(response: Response) {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.token
        ? {
            authorization: `Bearer ${options.token}`,
          }
        : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: options.signal,
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(getMessageFromPayload(payload), response.status, payload);
  }

  return payload as T;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
