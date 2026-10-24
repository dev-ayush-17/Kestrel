import { ApiError, ApiErrorResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// In-memory token management
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // assumed httpOnly refresh cookie
    });

    if (!response.ok) {
      setAccessToken(null);
      return null;
    }

    const data = await response.json();
    const newToken = data.access_token;
    setAccessToken(newToken);
    return newToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const token = getAccessToken();
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
    credentials: "include",
  });

  // Handle 401 Unauthorized with token refresh & retry once
  if (response.status === 401 && !endpoint.includes("/auth/refresh") && !endpoint.includes("/auth/login")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        requestHeaders["Authorization"] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, {
          ...restOptions,
          headers: requestHeaders,
          credentials: "include",
        });
        return handleResponse<T>(retryResponse);
      }
    } else {
      // Wait for existing refresh to complete
      const retryToken = await new Promise<string>((resolve) => {
        refreshSubscribers.push(resolve);
      });
      requestHeaders["Authorization"] = `Bearer ${retryToken}`;
      const retryResponse = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
        credentials: "include",
      });
      return handleResponse<T>(retryResponse);
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      response.statusText || "Malformed JSON response from server",
      "NETWORK_ERROR",
      response.status
    );
  }

  if (!response.ok) {
    const errorBody = data as ApiErrorResponse;
    const errorDetail = errorBody?.error;
    throw new ApiError(
      errorDetail?.message || response.statusText || "Request failed",
      errorDetail?.code || "HTTP_ERROR",
      response.status,
      errorDetail?.fields
    );
  }

  return data as T;
}
